from dataclasses import dataclass
from threading import Thread
from typing import List, Dict, Tuple, Generator, Optional
import logging
import torch
from transformers import TextIteratorStreamer
from openai import OpenAI



from configurations import TYPE_OF_RETRIEVAL, REMOTE_API_KEY, REMOTE_LLM_NAME
from Database.db import update_message_sources
from PromptBuilders.prompts import (
    only_context_prompt_template,
    no_rag_prompt_template,
    question_prompt_template,
)
from RetrievalEvaluators.crag import crag_filter
from Inference.similarity_threshold import filter_based_on_similarity
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
        retriever_pack,
        summary_llm,
        generation_config: GenerationConfig | None = None,
        session_id: Optional[str] = None,
    ):

        self.tokenizer = tokenizer
        self.llm = llm

        self.question_tokenizer = question_tokenizer
        self.question_llm = question_llm

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

    
    # RETRIEVAL
    

    def retrieve_documents(
        self,
        question: str,
    ) -> Tuple[List, str]:

        logger.info("Running retrieval")

        texts = self.retriever.invoke(question)

        logger.info(
            "Retrieved %d documents before filtering",
            len(texts),
        )

        texts = filter_based_on_similarity(
            question=question,
            texts=texts,
            embeddings=self.ret_pack["embeddings"],
            threshold=0.6,
            mode="lenient",
        )

        logger.info(
            "%d documents remaining after filtering",
            len(texts),
        )

        if TYPE_OF_RETRIEVAL == "CRAG":

            texts = crag_filter(texts=texts)

            logger.info(
                "%d documents after CRAG",
                len(texts),
            )

        for text in texts:

            text.page_content = (
                text.page_content[
                    :self.MAX_CONTEXT_LENGTH
                ]
            )

        context = "\n\n".join(
            doc.page_content for doc in texts
        )

        return texts, context

    
    # QUESTION REWRITING
    

    def generate_search_question(
        self,
        question: str,
    ) -> str:

        logger.info(
            "Generating retrieval question"
        )

        prompt = question_prompt_template.format(
            question=question
        )

        messages = (
            self.memory_manager.build_memory_context(
                query=question
            )
        )

        messages.append({
            "role": "user",
            "content": [{
                "type": "text",
                "text": prompt,
            }],
        })

        input_ids = self.build_input_ids(
            self.question_tokenizer,
            messages,
        )

        gen_tokens = self.question_llm.generate(
            input_ids,
            do_sample=self.generation_config.do_sample,
            temperature=self.generation_config.temperature,
            top_p=self.generation_config.top_p,
            top_k=self.generation_config.top_k,
            max_new_tokens=self.generation_config.max_new_tokens,
        )

        generated = self.question_tokenizer.decode(
            gen_tokens[0][input_ids.shape[1]:]
        )

        rewritten_question = self.clean_text(
            generated
        )

        logger.info(
            "Rewritten question: %s",
            rewritten_question,
        )

        return rewritten_question

    
    # PROMPT BUILDING
    

    def build_prompt(
        self,
        question: str,
        context: str = "",
        do_retrieval: bool = False,
    ) -> str:

        if do_retrieval:

            return only_context_prompt_template.format(
                question=question,
                context=context,
            )

        return no_rag_prompt_template.format(
            question=question
        )

    
    # STREAM GENERATION
    

    def stream_generate(
        self,
        messages: List[Dict],
        do_online: bool = False,
    ) -> Generator[Tuple[str, str], None, None]:

        
        # ONLINE GENERATION
        

        if do_online:

            client = OpenAI(
                api_key=REMOTE_API_KEY,
                base_url="https://api.avalai.ir/v1",
            )

            
            # CONVERT MESSAGES FORMAT
            

            openai_messages = []

            for msg in messages:

                content = msg.get("content", "")

                # Handle HF-style structured content
                if isinstance(content, list):

                    extracted_text = []

                    for item in content:

                        if (
                            isinstance(item, dict)
                            and item.get("type") == "text"
                        ):
                            extracted_text.append(
                                item.get("text", "")
                            )

                    content = "\n".join(extracted_text)

                openai_messages.append({
                    "role": msg["role"],
                    "content": content,
                })

            
            # STREAM RESPONSE
            

            response = client.chat.completions.create(
                model=REMOTE_LLM_NAME,
                messages=openai_messages,
                temperature=self.generation_config.temperature,
                stream=True,
            )

            full_response = ""

            for chunk in response:
                if not chunk.choices:
                    continue
                delta = (
                    chunk.choices[0]
                    .delta
                    .content
                )

                if not delta:
                    continue

                cleaned = self.clean_text(delta)

                if not cleaned:
                    continue

                full_response += cleaned

                yield cleaned, full_response

            return

        
        # LOCAL GENERATION
        

        input_ids = self.build_input_ids(
            self.tokenizer,
            messages,
        )

        streamer = TextIteratorStreamer(
            self.tokenizer,
            skip_prompt=True,
        )

        generation_kwargs = dict(
            inputs=input_ids,
            do_sample=self.generation_config.do_sample,
            temperature=self.generation_config.temperature,
            top_p=self.generation_config.top_p,
            top_k=self.generation_config.top_k,
            max_new_tokens=self.generation_config.max_new_tokens,
            streamer=streamer,
        )

        thread = Thread(
            target=self.llm.generate,
            kwargs=generation_kwargs,
        )

        thread.start()

        full_response = ""

        for token in streamer:

            cleaned = self.clean_text(token)

            if not cleaned:
                continue

            full_response += cleaned

            yield cleaned, full_response

        del input_ids

        if torch.cuda.is_available():
            torch.cuda.empty_cache()

    
    # MAIN CHAT ENTRY
    

    def call_chatbot_stream(
        self,
        question: str,
        access_token: str,
        receive_message_id: str,
        options: Dict,
    ):

        logger.info("Starting inference")

        do_retrieval = options.get(
            "do_retrieval",
            False,
        )

        documents = []
        context = ""

        retrieval_question = question

        if self.memory_manager.chat_history:

            retrieval_question = (
                self.generate_search_question(
                    question
                )
            )

        
        # KNOWLEDGE RETRIEVAL
        

        if do_retrieval:

            documents, context = (
                self.retrieve_documents(
                    retrieval_question
                )
            )

            if documents:

                update_message_sources(
                    receive_message_id,
                    access_token,
                    documents,
                )
        

        prompt = self.build_prompt(
            question=question,
            context=context,
            do_retrieval=do_retrieval,
        )

        messages = (
            self.memory_manager.build_memory_context(
                query=question
            )
        )

        messages.append({
            "role": "user",
            "content": [{
                "type": "text",
                "text": prompt,
            }],
        })

        
        final_response = ""

        for chunk, accumulated in self.stream_generate(
            messages
        ):

            final_response = accumulated

            yield chunk

        

        self.memory_manager.add_interaction(
            user_message=question,
            ai_message=final_response,
        )

        logger.info("Inference complete")