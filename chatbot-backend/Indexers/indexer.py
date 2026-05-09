
from langchain.schema import Document as LangchainDoc
from langchain_core.embeddings.embeddings import Embeddings
from langchain_community.document_loaders import PyPDFLoader
from tqdm import tqdm
from langchain.schema import Document
import os
from langchain_community.vectorstores import Chroma
from sentence_transformers import SentenceTransformer, models
import asyncio
from spire.doc.common import *
from spire.doc import *
from langchain.text_splitter import RecursiveCharacterTextSplitter

docs_path = "./static/Docs/Words/"
txt_path = "./preprocessed_texts.txt"
read_preprocessed = False
read_word_files = True


class STEmbeddings(Embeddings):  # inherit the default embeddings
    def set_model(self, model):
        self.model = model

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


def extract_text_from_doc(doc, doc_source):
  document = doc
  docs = []
  temp_texts = []
  for s in range(document.Sections.Count):
    section = document.Sections.get_Item(s)
    for p in range(section.Paragraphs.Count):
      para = section.Paragraphs.get_Item(p)
      if (len(para.Text.strip()) > 30):
        temp_texts.append(para.Text.strip())
        len_counter = 0
        built_text = ""
        for t in temp_texts:
          len_counter += len(t)
          built_text += t + "\n\n"
        if len_counter > 500:
          docs.append(LangchainDoc(page_content=built_text,
                      metadata={"source": doc_source}))
          temp_texts = []
  text_splitter = RecursiveCharacterTextSplitter(
      chunk_size=1000,
      chunk_overlap=200,
      separators=["\n\n", "\n", " ", ""],
  )
  # Split the text into chunks
  chunks = text_splitter.split_text(' '.join([d.page_content.replace("ي", "ی").replace("ك","ک") for d in docs]))
  final_chunks=[]
  for chunk in chunks:
    final_chunks.append(LangchainDoc(page_content=chunk,
                                     metadata={"source": doc_source}))
  return final_chunks


def extract_tables_from_doc(doc, doc_source):
  tables_content = []
  for s in range(doc.Sections.Count):
    section = doc.Sections.get_Item(s)
    tables = section.Tables
    for i in range(0, tables.Count):
      table = tables.get_Item(i)
      tableData = ''
      for j in range(0, table.Rows.Count):
        for k in range(0, table.Rows.get_Item(j).Cells.Count):
          cell = table.Rows.get_Item(j).Cells.get_Item(k)
          cellText = ''
          for para in range(cell.Paragraphs.Count):
            paragraphText = cell.Paragraphs.get_Item(para).Text
            cellText += (paragraphText + ' ')
          tableData += cellText
          if k < table.Rows.get_Item(j).Cells.Count - 1:
              tableData += '\t'
        tableData += '\n'
      if tables.Count > 0:
        tables_content.append(LangchainDoc(
            page_content=tableData, metadata={"source": doc_source}))
  return tables_content


def read_word_files_in_directory(directory):
    docs = []
    tables = []
    # Use os.walk to iterate over all files in the directory and subdirectories
    for root, dirs, files in tqdm(os.walk(directory), desc="loading docs ..."):
        for filename in files:
          if filename.endswith('.doc') or filename.endswith('.docx'):
            print("processing: ", filename)
            word_path = os.path.join(root, filename)
            document = Document()
            document.LoadFromFile(word_path)
            doc = document
            docs += extract_text_from_doc(doc, word_path[1:])
            # docs += extract_tables_from_doc(doc, "Table")  # Uncomment if needed
    
    return docs



async def read_pdf_files_in_directory(directory):
    docs = []
    for filename in tqdm(os.listdir(directory), desc="loading docs ..."):
        if filename.endswith('.pdf'):
            pdf_path = os.path.join(directory, filename)
            loader = PyPDFLoader(pdf_path)
            async for page in loader.alazy_load():
              docs.append(page)
    return docs


def read_preprocessed_texts(txt_path):
    docs = []
    with open(txt_path) as file:
        lines = file.readlines()
        for i in range(0,len(lines),2):
            docs.append(Document(page_content=lines[i].rstrip(),metadata={"source" : lines[i+1]}))
    return docs
async def main():
    if read_preprocessed:
        docs = read_preprocessed_texts(txt_path)
    else:
        if read_word_files:
            docs = read_word_files_in_directory(docs_path)
        else:
            docs = await read_pdf_files_in_directory(docs_path)

    # indexing docs
    print("indexing all documents found...")
    print(len(docs))
    # db = Chroma.from_documents(docs[:5460], embeddings, persist_directory="embeddings_database")
    db = Chroma(
    embedding_function=embeddings,
    persist_directory="embeddings_database",  # Where to save data locally, remove if not necessary
    )
    for i in tqdm(range(0,len(docs),5000),desc="iterating batches of 5000..."):
      if i + 5000 < len(docs):
        db.add_documents(documents=docs[i:i+5000])
      else:
        db.add_documents(documents=docs[i:])
    # db.persist()
asyncio.run(main())