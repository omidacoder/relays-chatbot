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
model = SentenceTransformer(modules=[word_embedding_model, pooling_model])
embeddings = STEmbeddings()
embeddings.set_model(model)