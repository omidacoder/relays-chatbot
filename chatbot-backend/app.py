# Importing all the required packages
from fastapi.middleware.cors import CORSMiddleware
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, JSONResponse
import torch
from dotenv import load_dotenv
from queue import Queue
#load from local python files
from configurations import USE_REMOTE_LLM
from Retrievers.retriever import retriever_pack
from fastapi.staticfiles import StaticFiles
from Database.redis_helper import get_query_retrievals
from Inference.inference import Inference,GenerationConfig
device = 'cuda' if torch.cuda.is_available() else 'cpu'
load_dotenv()
app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)
streamer_queue = Queue()

if not USE_REMOTE_LLM:
    # Prepare models
    # model_path = "./G9"
    # model_path = "./G12"
    model_path = "./LLM"
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True, bnb_4bit_compute_dtype=torch.float16)
    # bnb_config = BitsAndBytesConfig(
    #     load_in_8bit=True)
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForCausalLM.from_pretrained(
        model_path,quantization_config=bnb_config,torch_dtype=torch.float32)

    question_tokenizer = tokenizer
    question_model = model
    summary_tokenizer = tokenizer
    summary_model = model
    # model.load_adapter("./aya-expanse-sft-raft")
# chat_history=[]


@app.get('/query-stream/')
async def stream(chatId: int, query: str,recieve_message_id: int, request: Request, do_retrieval: str="true", do_metadata: str="false"):
    print(f'Query receieved: {query}')
    access_token = request.headers.get('authorization').split('Bearer ')[-1]
    options = {
        "do_retrieval": True if do_retrieval == "true" else False,
        "do_advanced": True if do_metadata == "true" else False,
        "do_online": True if do_metadata == "true" else False,
    }
    # Creating Inference instance
    inference_chatbot = Inference(
            tokenizer=tokenizer,
            llm=model,
            question_tokenizer=question_tokenizer,
            question_llm=question_model,
            retriever_pack=retriever_pack,
            summary_llm=summary_model,
            generation_config=GenerationConfig(),
            session_id=str(chatId)
        )
    return StreamingResponse(inference_chatbot.call_chatbot_stream(
        question=query,
        access_token=access_token,
        receive_message_id=recieve_message_id,
        options=options
    ), media_type='text/event-stream')
@app.get('/retrievals')
async def retrievals(id : str):
    return JSONResponse({'status' : 'success', 'results' : get_query_retrievals(id)})