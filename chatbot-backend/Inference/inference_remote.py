from openai import OpenAI
import torch
from configurations import TYPE_OF_RETRIEVAL, REMOTE_LLM_NAME,REMOTE_API_KEY
from langchain.schema import Document as LangchainDoc
from retrieval_evaluators import crag_filter
from db import update_message_sources
device = 'cuda' if torch.cuda.is_available() else 'cpu'
from prompts import prompt_template, only_context_prompt_template, only_metadata_prompt_template, no_rag_prompt_template, question_prompt_template
from similarity_threshold import filter_based_on_similarity
from read_metadata import read_metadata
import time
metadatas = read_metadata()
def get_metadata_from_retrievals(question, metadata_retriever,passed_metadatas):
  metadata = ""
  unique_indices = []
  meta_docs = metadata_retriever.invoke(question)
  final_metadatas = []
  meta_sources = []
  for d in meta_docs:
    if d.metadata['source'] not in unique_indices:
      i = d.metadata['source']
      unique_indices.append(i)
      final_metadatas.append(passed_metadatas[i])
  for m in final_metadatas:
    temp = ""
    metadata += "\n[metadata]"
    if 'title' in m and not (m['title'] is None):
      temp += "\nعنوان: " + m['title'] + "\n"
      metadata += "\nعنوان: " + m['title'] + "\n"
    if 'authors' in m and not (m['authors'] is None):
      temp += "\nنویسندگان: " + m["authors"] + "\n"
      metadata += "\nنویسندگان: " + m["authors"] + "\n"
    if 'university' in m and not (m['university'] is None):
      temp += "\nدانشگاه: " + m['university'] + "\n"
      metadata += "\nدانشگاه: " + m['university'] + "\n"
    if 'abstract' in m and not (m['abstract'] is None):
      temp += "\nچکیده: " + m['abstract'] + "\n"
      metadata += "\nچکیده: " + m['abstract'] + "\n"
    metadata += "\n[/metadata]\n"
    meta_sources.append(LangchainDoc(
            page_content=temp, metadata={"source": '/static/' + m['path']}))
  return metadata , meta_sources
def update_chat_history(history, user_message, ai_message):
  if len(history) >= 5:
    history.pop(0)
    history.pop(0)
  history.append(user_message)
  history.append(ai_message)


def get_messages_from_history(chat_history):
  role = 'user'
  messages = []
  if len(chat_history) == 0:
    return []
  for chat in chat_history:
    messages.append({'role': role, 'content': chat})
    role = 'assistant' if role == 'user' else 'user'
  return messages


def get_history_string(chat_history):
  speaker = 'USER'
  result = ""
  if len(chat_history) == 0:
    return ""
  for chat in chat_history:
    result += speaker + ": " + chat + "\n"
    speaker = 'YOU' if speaker == 'USER' else 'USER'
  return result


def call_chatbot_stream(question, chat_history, ret_pack, metadata_ret,basic_knowledge_ret, access_token, chatId, receive_message_id, options):
  # from redis_helper import save_query_retreivals
  # save_message(access_token=access_token, chatId=chatId, content=question, fromChatbot=False, sources="")
  client = OpenAI(
            api_key=REMOTE_API_KEY, 
            base_url="https://api.avalai.ir/v1",
        )
  ret = ret_pack.get("retriever")
  max_context_length = 5000
  metadata=""
  result_str=""
  full_docs = []
  # if len(chat_history) == 0:
  if True:
    # Adding Basic Knowledge First
    texts = basic_knowledge_ret.invoke(question)
    texts = filter_based_on_similarity(question,texts,ret_pack['embeddings'],0.5,"strict")
    basic_result_str = "\n\n".join(
          [texts[i].page_content for i in range(len(texts))])
    print("here is basic_result_str: ")
    print(basic_result_str)
    full_docs += texts
    if options['do_retrieval']:
      texts = ret.invoke(question)
      texts = filter_based_on_similarity(question,texts,ret_pack['embeddings'],0.6,"lenient")
      if TYPE_OF_RETRIEVAL=='CRAG':
        texts = crag_filter(texts=texts)
      # Truncate and limit
      for text in texts:
        text.page_content = text.page_content[:max_context_length]
      result_str = "\n\n".join(
          [texts[i].page_content for i in range(len(texts))])
      full_docs += texts
    if options['do_metadata']:
      metadata , meta_sources = get_metadata_from_retrievals(question,metadata_ret,metadatas)
      full_docs += meta_sources
      # print("here is the metadata: ")
      # print(metadata)
    if len(full_docs) > 0:
      update_message_sources(receive_message_id, access_token, full_docs)
    if options['do_retrieval'] and options['do_metadata']:
      input = prompt_template.format(
          # question=question, metadata=metadata if options['do_metadata'] else "", context=result_str if options['do_retrieval'] else "")
          knowledge=basic_result_str,question=question, metadata=metadata, context=result_str)
    elif options['do_retrieval']:
      input = only_context_prompt_template.format(
          # question=question, metadata=metadata if options['do_metadata'] else "", context=result_str if options['do_retrieval'] else "")
          knowledge=basic_result_str,question=question, context=result_str)
    elif options['do_metadata']:
      input = only_metadata_prompt_template.format(
          # question=question, metadata=metadata if options['do_metadata'] else "", context=result_str if options['do_retrieval'] else "")
          question=question, metadata=metadata)
    else:
      input = no_rag_prompt_template
    # messages = [{'role': 'user', 'content': [{'type': 'text', 'text': input}]}]
    # Prepare the prompt as a single string
    prompt = input  # your existing assembled input string
    # print("prompt is :", prompt);
    response = client.chat.completions.create(
        model=REMOTE_LLM_NAME,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1
    )

    # Extract full text
    full_text = response.choices[0].message.content

    # Fake streaming: yield chunk-by-chunk
    result = ""
    chunk_size = 20  # characters per streamed chunk

    for i in range(0, len(full_text), chunk_size):
        token = full_text[i:i+chunk_size]
        result += token
        time.sleep(0.3)
        yield token
    update_chat_history(chat_history, question, result)
    # save_message(access_token=access_token,chatId=chatId, content=result, fromChatbot=True, sources=result_str)
  else:
    if options['do_retrieval'] or options['do_metadata']:
        # --- Call question generator first (replace local question_llm) ---
        question_llm_input = question_prompt_template.format(question=question)
        messages_q = get_messages_from_history(chat_history)
        messages_q.append({'role': 'user', 'content': [{'type': 'text', 'text': question_llm_input}]})
        print(messages_q)
        
        # --- OpenAI streaming for question generation ---
        question_stream = client.chat.completions.create(
            model=REMOTE_LLM_NAME,
            messages=[{"role": "user", "content": question_llm_input}],
            temperature=0.1,
            top_p=0.75,
            stream=True,
        )

        gen_text = ""
        for event in question_stream:
            if "choices" in event and len(event["choices"]) > 0:
                delta = event["choices"][0]["delta"]
                if "content" in delta:
                    token = delta["content"]
                    gen_text += token
                    yield token  

        new_question = gen_text.split('<|END_OF_TURN_TOKEN|>')[0].split('<end_of_turn>')[0]
        print(new_question)

        texts = basic_knowledge_ret.invoke(new_question)
        texts = filter_based_on_similarity(new_question, texts, ret_pack['embeddings'], 0.5, "strict")
        basic_result_str = "\n\n".join([t.page_content for t in texts])
        full_docs += texts

        if options['do_retrieval']:
            texts = ret.invoke(new_question)
            texts = filter_based_on_similarity(new_question, texts, ret_pack['embeddings'], 0.6, "lenient")
            if TYPE_OF_RETRIEVAL == 'CRAG':
                texts = crag_filter(texts=texts)
            for text in texts:
                text.page_content = text.page_content[:max_context_length]
            result_str = "\n\n".join([t.page_content for t in texts])
            full_docs += texts

        if options['do_metadata']:
            metadata, meta_sources = get_metadata_from_retrievals(new_question, metadata_ret, metadatas)
            full_docs += meta_sources

        if len(full_docs) > 0:
            update_message_sources(receive_message_id, access_token, full_docs)

    # --- Prepare final prompt for main LLM call ---
    if options['do_retrieval'] and options['do_metadata']:
        input_text = prompt_template.format(knowledge=basic_result_str, question=question, metadata=metadata, context=result_str)
    elif options['do_retrieval']:
        input_text = only_context_prompt_template.format(knowledge=basic_result_str, question=question, context=result_str)
    elif options['do_metadata']:
        input_text = only_metadata_prompt_template.format(question=question, metadata=metadata)
    else:
        input_text = no_rag_prompt_template

    messages_final = get_messages_from_history(chat_history)
    messages_final.append({'role': 'user', 'content': [{'type': 'text', 'text': input_text}]})

    response_stream = client.chat.completions.create(
        model=REMOTE_LLM_NAME,
        messages=[{"role": "user", "content": input_text}],
        temperature=0.1,
        top_p=0.75,
        stream=True
    )

    result = ""
    for event in response_stream:
        if "choices" in event and len(event["choices"]) > 0:
            delta = event["choices"][0]["delta"]
            if "content" in delta:
                token = delta["content"]
                result += token
                yield token  # stream tokens

    update_chat_history(chat_history, question, result)

    
