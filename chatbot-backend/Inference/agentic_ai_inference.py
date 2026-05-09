from dataclasses import dataclass
from threading import Thread
from typing import List, Dict, Tuple, Generator, Optional
import logging
import torch
import json
import re
from transformers import TextIteratorStreamer
from openai import OpenAI

from configurations import TYPE_OF_RETRIEVAL, REMOTE_API_KEY, REMOTE_LLM_NAME
from Database.db import update_message_sources
from PromptBuilders.prompts import (
    BRAIN_SYSTEM_PROMPT,
    CONTEXT_EVALUATOR_SYSTEM_PROMPT,
    only_context_prompt_template,
    no_rag_prompt_template,
    question_prompt_template,
)
from RetrievalEvaluators import crag_filter
from similarity_threshold import filter_based_on_similarity
from Inference.Modules.MemoryManager import MemoryManager
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

@dataclass
class GenerationConfig:
    temperature: float = 0.1
    top_p: float = 0.75
    top_k: int = 0
    max_new_tokens: int = 1024
    do_sample: bool = True


class Inference:

    MAX_CONTEXT_LENGTH = 5000

    def __init__(
        self,
        tokenizer,
        llm,
        question_tokenizer,
        question_llm,
        brain_tokenizer,     
        brain_llm,           
        retriever_pack,
        summary_llm,
        generation_config: GenerationConfig | None = None,
        session_id: Optional[str] = None,
    ):

        self.tokenizer = tokenizer
        self.llm = llm

        self.question_tokenizer = question_tokenizer
        self.question_llm = question_llm

        self.brain_tokenizer = brain_tokenizer
        self.brain_llm = brain_llm

        self.ret_pack = retriever_pack
        self.retriever = retriever_pack.get("retriever")

        self.access_token = REMOTE_API_KEY

        self.memory_manager = MemoryManager(
            summary_llm=summary_llm,
            session_id=session_id,
        )

        self.generation_config = (
            generation_config or GenerationConfig()
        )

    # CLEANING
    @staticmethod
    def clean_text(text: str) -> str:
        return (
            text.replace("<|END_OF_TURN_TOKEN|>", "")
                .replace("<end_of_turn>", "")
                .strip()
        )

    # TOKENIZATION
    def build_input_ids(
        self,
        tokenizer,
        messages: List[Dict],
    ):
        return tokenizer.apply_chat_template(
            messages,
            tokenize=True,
            add_generation_prompt=True,
            return_tensors="pt",
        ).to(DEVICE)

    def analyze_with_brain(self, question: str) -> Dict:
        logger.info("Running Brain Agent to analyze query...")

        # We inject the chat history context so the brain understands context
        messages = self.memory_manager.build_memory_context(query=question)
    
        # Prepend the strict system prompt to the messages
        messages.insert(0, {
            "role": "system",
            "content": [{"type": "text", "text": BRAIN_SYSTEM_PROMPT}]
        })

        input_ids = self.build_input_ids(self.brain_tokenizer, messages)

        gen_tokens = self.brain_llm.generate(
            input_ids,
            do_sample=False, # We want deterministic JSON output
            temperature=0.1,
            max_new_tokens=1500,
        )

        generated = self.brain_tokenizer.decode(gen_tokens[0][input_ids.shape[1]:])
        raw_response = self.clean_text(generated)
        try:
            # Strip out markdown json wrappers if the LLM adds them
            json_str = re.sub(r'```json\n|\n```', '', raw_response).strip()
            brain_output = json.loads(json_str)
            logger.info(f"Brain Extracted Keys: {list(brain_output.keys())}")
            return brain_output
        except json.JSONDecodeError:
            logger.error(f"Failed to parse Brain JSON. Raw Output: {raw_response}")
            # Fallback structure if parsing fails
            return {
                "user_intent": question,
                "query_refinement": question,
                "relay_catalog_info": None,
                "image_request": None,
                "table_request": None,
                "keywords": []
            }

    # RETRIEVAL
    def retrieve_documents(
        self,
        question: str,
    ) -> Tuple[List, str]:

        logger.info(f"Running retrieval for query: {question}")
        texts = self.retriever.invoke(question)
        logger.info("Retrieved %d documents before filtering", len(texts))

        texts = filter_based_on_similarity(
            question=question,
            texts=texts,
            embeddings=self.ret_pack["embeddings"],
            threshold=0.6,
            mode="lenient",
        )

        logger.info("%d documents remaining after filtering", len(texts))

        if TYPE_OF_RETRIEVAL == "CRAG":
            texts = crag_filter(texts=texts)
            logger.info("%d documents after CRAG", len(texts))

        for text in texts:
            text.page_content = text.page_content[:self.MAX_CONTEXT_LENGTH]

        context = "\n\n".join(doc.page_content for doc in texts)
        return texts, context

    # QUESTION REWRITING (Kept as fallback, but Brain mostly handles this now)
    def generate_search_question(
        self,
        question: str,
    ) -> str:
        logger.info("Generating retrieval question")
        prompt = question_prompt_template.format(question=question)
        messages = self.memory_manager.build_memory_context(query=question)
        messages.append({
            "role": "user",
            "content": [{"type": "text", "text": prompt}],
        })

        input_ids = self.build_input_ids(self.question_tokenizer, messages)
        gen_tokens = self.question_llm.generate(
            input_ids,
            do_sample=self.generation_config.do_sample,
            temperature=self.generation_config.temperature,
            top_p=self.generation_config.top_p,
            top_k=self.generation_config.top_k,
            max_new_tokens=self.generation_config.max_new_tokens,
        )

        generated = self.question_tokenizer.decode(gen_tokens[0][input_ids.shape[1]:])
        rewritten_question = self.clean_text(generated)
        logger.info("Rewritten question: %s", rewritten_question)
        return rewritten_question

    # PROMPT BUILDING
    def build_prompt(
        self,
        question: str,
        context: str = "",
        do_retrieval: bool = False,
        brain_data: Dict = None
    ) -> str:
        
        # TODO but Optional : Inject the Brain's understanding into the context for better final generation
        brain_context = ""
        if brain_data and brain_data.get("relay_catalog_info"):
            brain_context = f"\n[Extracted Relay Data: {json.dumps(brain_data['relay_catalog_info'], ensure_ascii=False)}]\n"

        if do_retrieval:
            return only_context_prompt_template.format(
                question=question,
                context=brain_context + context,
            )
            # TODO: Change it to the following template later
            # return only_context_prompt_template.format(
            #     question=question,
            #     context=brain_context + context,
            # )

        return no_rag_prompt_template.format(
            question=question
        )

    # STREAM GENERATION
    def stream_generate(
        self,
        messages: List[Dict],
        do_online: bool = False,
    ) -> Generator[Tuple[str, str], None, None]:

        if do_online:
            client = OpenAI(
                api_key=REMOTE_API_KEY,
                base_url="https://api.avalai.ir/v1",
            )
            openai_messages = []
            for msg in messages:
                content = msg.get("content", "")
                if isinstance(content, list):
                    extracted_text = []
                    for item in content:
                        if isinstance(item, dict) and item.get("type") == "text":
                            extracted_text.append(item.get("text", ""))
                    content = "\n".join(extracted_text)
                openai_messages.append({"role": msg["role"], "content": content})

            response = client.chat.completions.create(
                model=REMOTE_LLM_NAME,
                messages=openai_messages,
                temperature=self.generation_config.temperature,
                stream=True,
            )

            full_response = ""
            for chunk in response:
                if not chunk.choices: continue
                delta = chunk.choices[0].delta.content
                if not delta: continue
                cleaned = self.clean_text(delta)
                if not cleaned: continue
                full_response += cleaned
                yield cleaned, full_response
            return

        input_ids = self.build_input_ids(self.tokenizer, messages)
        streamer = TextIteratorStreamer(self.tokenizer, skip_prompt=True)
        generation_kwargs = dict(
            inputs=input_ids,
            do_sample=self.generation_config.do_sample,
            temperature=self.generation_config.temperature,
            top_p=self.generation_config.top_p,
            top_k=self.generation_config.top_k,
            max_new_tokens=self.generation_config.max_new_tokens,
            streamer=streamer,
        )

        thread = Thread(target=self.llm.generate, kwargs=generation_kwargs)
        thread.start()

        full_response = ""
        for token in streamer:
            cleaned = self.clean_text(token)
            if not cleaned: continue
            full_response += cleaned
            yield cleaned, full_response

        del input_ids
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

    def evaluate_context_with_brain(self, question: str, context: str) -> Dict:
        logger.info("Running Brain Agent to evaluate retrieved context...")

        # If context is empty, force a change_query action immediately
        if not context or not context.strip():
            return {
                "evaluation_status": "insufficient",
                "action": "change_query",
                "reasoning": "No context was retrieved.",
                "new_queries": {"text_query": question, "table_query": None, "image_query": None},
                "context_summary": None
            }

        # Build the evaluation prompt
        eval_prompt = (
            f"USER QUERY:\n{question}\n\n"
            f"RETRIEVED CONTEXT:\n{context}\n\n"
            f"Evaluate the context based on the rules provided."
        )

        messages = [
            {"role": "system", "content": [{"type": "text", "text": CONTEXT_EVALUATOR_SYSTEM_PROMPT}]},
            {"role": "user", "content": [{"type": "text", "text": eval_prompt}]}
        ]

        input_ids = self.build_input_ids(self.brain_tokenizer, messages)

        gen_tokens = self.brain_llm.generate(
            input_ids,
            do_sample=False, # Deterministic output for JSON
            temperature=0.1,
            max_new_tokens=1000,
        )

        generated = self.brain_tokenizer.decode(gen_tokens[0][input_ids.shape[1]:])
        raw_response = self.clean_text(generated)

        # Robust JSON Parsing
        try:
            json_str = re.sub(r'```json\n|\n```', '', raw_response).strip()
            evaluation_output = json.loads(json_str)
            logger.info(f"Brain Evaluation Action: {evaluation_output.get('action')}")
            return evaluation_output
        except json.JSONDecodeError:
            logger.error(f"Failed to parse Brain Context Evaluator JSON. Raw Output: {raw_response}")
            # Safe Fallback
            return {
                "evaluation_status": "insufficient",
                "action": "change_query",
                "reasoning": "Failed to parse evaluation, defaulting to retry.",
                "new_queries": {"text_query": question, "table_query": None, "image_query": None},
                "context_summary": None
            }
    # MAIN CHAT ENTRY
    def call_chatbot_stream(
        self,
        question: str,
        access_token: str,
        receive_message_id: str,
        options: Dict,
    ):
        logger.info("Starting inference")
        do_retrieval = options.get("do_retrieval", False)

        documents = []
        context = ""
        
        # ==========================================
        # 1. RUN THE BRAIN FIRST
        # ==========================================
        brain_data = self.analyze_with_brain(question)
        # Extract metadata from Brain
        retrieval_question = question
        if brain_data.get("query_refinement"):
            retrieval_question = brain_data["query_refinement"]
        elif brain_data.get("keywords"):
            # If no refinement, fall back to keywords combined with question
            retrieval_question = f"{question} {' '.join(brain_data['keywords'])}"
        
        # Omid Davar: Must Do The Structured Search Here if needed

        # ==========================================
        # 2. KNOWLEDGE RETRIEVAL
        # ==========================================
        if do_retrieval:
            documents, context = self.retrieve_documents(retrieval_question)
            # Evaluate Context
            evaluation = self.evaluate_context_with_brain(question, context)
            if evaluation["action"] == "change_query":
                logger.info(f"Context rejected by Brain. Reason: {evaluation['reasoning']}. Retrying...")
                # Extract new query (you can also handle table/image queries here)
                new_text_query = evaluation["new_queries"].get("text_query") or question
                # Perform Another Retrieval
                documents, context = self.retrieve_documents(new_text_query)
            
            elif evaluation["action"] == "verify_and_summarize":
                logger.info("Context verified by Brain. Using Brain's summary.")
                if evaluation.get("context_summary"):
                    context = f"Verified Summary:\n{evaluation['context_summary']}\n\nRaw Context:\n{context}"
            if documents:
                update_message_sources(receive_message_id, access_token, documents)
        
        # ==========================================
        # 3. BUILD PROMPT & GENERATE
        # ==========================================
        prompt = self.build_prompt(
            question=question,
            context=context,
            do_retrieval=do_retrieval,
            brain_data=brain_data
        )

        messages = self.memory_manager.build_memory_context(query=question)
        messages.append({
            "role": "user",
            "content": [{"type": "text", "text": prompt}],
        })

        final_response = ""
        for chunk, accumulated in self.stream_generate(messages):
            final_response = accumulated
            yield chunk

        self.memory_manager.add_interaction(
            user_message=question,
            ai_message=final_response,
        )

        logger.info("Inference complete")