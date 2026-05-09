import urllib3
from langchain.schema import Document as LangchainDoc

db_app_url = "http://127.0.0.1:8001"
def login(phone, password):
    resp = urllib3.request(
        "POST",
        db_app_url + "/auth/user/login",
        json={"phone": phone, "password": password}
    )
    if resp.status == 201:
        return resp.json()["access_token"]
    else:
        raise Exception("wrong credentials")
    
def create_chat(access_token : str, botName: str):
    resp = urllib3.request(
        "POST",
        db_app_url + "/chat",
        json={"botName" : botName},
        headers={"Authorization" : "Bearer " + access_token}
    )
    if resp.status == 201:
        return resp.json()["chat"]
    else:
        raise Exception()
def save_message(access_token, chatId, content, fromChatbot):
    resp = urllib3.request(
        "POST",
        db_app_url + "/message",
        json={"content": content, "fromChatbot" : fromChatbot, "chatId":chatId},
        headers={"Authorization": "Bearer " + access_token}
    )
    if resp.status == 201:
        return ' '
    else:
        raise Exception()
    

def update_message_content(messageId, access_token, content):
    resp = urllib3.request(
        "POST",
        db_app_url + "/message/update",
        json={"content": content},
        headers={"Authorization": "Bearer " + access_token}
    )
    if resp.status == 201:
        return ' '
    else:
        raise Exception()


def update_message_sources(messageId, access_token, sources: LangchainDoc):
    req_sources = []
    for s in sources:
        req_sources.append({"content" : s.page_content, "refference": s.metadata["source"]})
    resp = urllib3.request(
        "POST",
        db_app_url + f"/message/update",
        json={"id": messageId,"sources": req_sources},
        headers={"Authorization": "Bearer " + access_token}
    )
    if resp.status == 200:
        return ' '
    else:
        print(resp.status)
        raise Exception()
    
def get_messages(access_token, page, chatId):
    resp = urllib3.request(
        "GET",
        db_app_url + "/messages",
        fields={"chatId": chatId, "page": page},
        headers={"Authorization": "Bearer " + access_token}
    )
    if resp.status == 200:
        return resp.json()
    else:
        raise Exception()
    

def get_chats(access_token, page, userId):
    resp = urllib3.request(
        "GET",
        db_app_url + "/chat",
        fields={"userId": userId, "page": page},
        headers={"Authorization": "Bearer " + access_token}
    )
    if resp.status == 200:
        return resp.json()
    else:
        raise Exception()
    
    
# save_message("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7Im5hbWUiOiJvbWlkIGRhdmFyIiwicGhvbmUiOiIwOTEzMDQ2NTc0OCIsImlkIjoxLCJ2ZXJpZmllZCI6dHJ1ZX0sInN1YiI6MSwiaWF0IjoxNzM1MTIyNzIwfQ.CcwmvwVSB2EVb7zJMjhPCFa54Dlk8IQ8iO3_xCpLTQ8" , 3 , "سلام" , False, 'source')
