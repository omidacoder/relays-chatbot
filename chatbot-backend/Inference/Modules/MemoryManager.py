from typing import List, Dict, Optional
from datetime import datetime, timezone
import uuid
from langchain_classic.memory import ConversationSummaryBufferMemory
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
import logging
import torch

logger = logging.getLogger(__name__)
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

class MemoryManager:
    # Changed limits to represent "Turns" (1 Turn = 1 User msg + 1 AI msg)
    SHORT_TERM_TURNS = 5 
    LONG_TERM_TURNS = 10 

    def __init__(
        self,
        summary_llm,
        embedding_model_name: str = "BAAI/bge-base-en-v1.5",
        persist_directory: str = "./memory_db",
        session_id: Optional[str] = None,
    ):
        self.session_id = session_id or str(uuid.uuid4())
        self.chat_history: List[Dict] = []

        # PHASE 1 & 2
        # SUMMARY & BUFFER MEMORY
        # This LangChain object handles both raw recent messages AND summaries automatically.
        self.summary_memory = ConversationSummaryBufferMemory(
            llm=summary_llm,
            max_token_limit=1500,
            return_messages=True,
            memory_key="history",
        )

        # PHASE 3
        # VECTOR / SEMANTIC MEMORY
        self.embeddings = HuggingFaceEmbeddings(
            model_name=embedding_model_name,
            model_kwargs={"device": DEVICE},
        )

        self.vector_store = Chroma(
            collection_name="chat_memory",
            embedding_function=self.embeddings,
            persist_directory=persist_directory,
        )


    # MESSAGE MANAGEMENT
    def add_interaction(self, user_message: str, ai_message: str) -> None:
        # Use timezone-aware datetime (utcnow is deprecated)
        timestamp = datetime.now(timezone.utc).isoformat()

        # Save for pristine logging/raw history
        self.chat_history.extend([
            {"role": "user", "content": user_message, "timestamp": timestamp},
            {"role": "assistant", "content": ai_message, "timestamp": timestamp}
        ])

        # UPDATE SUMMARY MEMORY
        # We save ALL interactions here. LangChain automatically keeps them raw
        # until token limit is hit, then it starts summarizing older messages.
        self.summary_memory.save_context(
            {"input": user_message},
            {"output": ai_message},
        )

        # UPDATE SEMANTIC MEMORY
        # We save ALL interactions so nothing falls through the cracks.
        memory_text = f"USER: {user_message}\nASSISTANT: {ai_message}"
        importance_score = self.calculate_importance(user_message)

        self.vector_store.add_texts(
            texts=[memory_text],
            metadatas=[{
                "session_id": self.session_id,
                "timestamp": timestamp,
                "importance": importance_score,
            }]
        )


    # IMPORTANCE SCORING
    def calculate_importance(self, text: str) -> float:
        text = text.lower()
        score = 0.1

        important_keywords = [
            "remember", "important", "my name", "i prefer", 
            "always", "never", "project", "working on", 
            "favorite", "personal",
        ]

        for keyword in important_keywords:
            if keyword in text:
                score += 0.2

        return min(score, 1.0)


    # SUMMARY AND RECENT MEMORY FORMATTING
    def get_summary_and_recent_messages(self) -> List[Dict]:
        summary_data = self.summary_memory.load_memory_variables({})
        history = summary_data.get("history", [])

        formatted_messages = []
        for msg in history:
            if isinstance(msg, HumanMessage):
                formatted_messages.append({"role": "user", "content": msg.content})
            elif isinstance(msg, AIMessage):
                formatted_messages.append({"role": "assistant", "content": msg.content})
            elif isinstance(msg, SystemMessage):
                formatted_messages.append({"role": "system", "content": msg.content})

        return formatted_messages


    # SEMANTIC MEMORY
    def retrieve_semantic_memories(self, query: str, top_k: int = 5) -> str:
        results = self.vector_store.similarity_search(
            query=query,
            k=top_k,
            filter={"session_id": self.session_id}
        )

        if not results:
            return ""

        memories = []
        for doc in results:
            importance = doc.metadata.get("importance", 0.0)
            if importance >= 0.3:
                memories.append(doc.page_content)

        return "\n\n".join(memories)


    # MAIN MEMORY ROUTER
    def build_memory_context(self, query: str) -> List[Dict]:
        turns_count = len(self.chat_history) // 2
        
        # Get LangChain's memory (This handles both raw recent messages AND summaries)
        base_memory_messages = self.get_summary_and_recent_messages()
        
        final_messages = []

        # If conversation is long enough, pull from Vector DB
        if turns_count > self.LONG_TERM_TURNS:
            logger.info("Using advanced semantic memory + summary buffer")
            
            semantic_memories = self.retrieve_semantic_memories(query=query)
            
            if semantic_memories:
                final_messages.append({
                    "role": "system",
                    "content": f"Relevant past memories:\n{semantic_memories}"
                })
        else:
            logger.info("Using summary buffer (short-term/summary)")

        # Append the base memory (summary + recent) to the final prompt
        final_messages.extend(base_memory_messages)
        
        return final_messages