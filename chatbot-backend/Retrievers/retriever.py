from langchain_community.vectorstores import Chroma
from sentence_transformers import SentenceTransformer, models
from langchain_core.embeddings.embeddings import Embeddings

class STEmbeddings(Embeddings): #inherit the default embeddings
    def set_model(self,model):
        self.model=model
    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [self.model.encode(text) for text in texts]
    def embed_query(self, text: str) -> list[float]:
        return self.model.encode(text)
        
model_path = r'./Embedder'
word_embedding_model = models.Transformer(model_path)

pooling_model = models.Pooling(
    word_embedding_model.get_word_embedding_dimension())
model = SentenceTransformer(modules=[word_embedding_model, pooling_model],device='cpu')
embeddings = STEmbeddings()
embeddings.set_model(model)
db = Chroma(persist_directory='embeddings_database',
       embedding_function=embeddings)

retriever = db.as_retriever(search_kwargs={"k": 3})
retriever_pack = {"retriever" : retriever, "embeddings": embeddings}

