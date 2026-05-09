import redis
import json

# Connect to Redis
r = redis.Redis(host='localhost', port=6379, db=0)

def save_query_retreivals(id, retrieved_results):
    results = []
    for ret in retrieved_results:
        results.append({'content' : ret.page_content , 'metadata' : ret.metadata})
    r.set('query-retrievals-' + str(id),json.dumps(results))
    
def get_query_retrievals(id):
    return json.loads(r.get('query-retrievals-' + str(id)))
    