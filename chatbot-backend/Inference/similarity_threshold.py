import numpy as np
from numpy.linalg import norm
def filter_based_on_similarity(q,docs,embeddings,threshold=0.6,mode="strict"):
    filtered_docs = []
    for d in docs:
        d_embed = embeddings.embed_query(d.page_content)
        q_embed = embeddings.embed_query(q)

        sim = np.dot(q_embed,d_embed) / (norm(q_embed) * norm(d_embed))
        print(sim)
        if sim > threshold:
            filtered_docs.append(d)
    if len(filtered_docs) == 0 and mode == "lenient":
        return docs
    return filtered_docs



