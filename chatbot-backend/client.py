query = "How to print hello world in python"
import requests
query = 'سلام'
url = f'http://127.0.0.1:8000/query-stream/?query={query}'

with requests.get(url, stream=True) as r:
    for chunk in r.iter_content(1024):
        print(chunk.decode('utf-8'), end="")
