# Structure conceptuelle du script d'ingestion
from langchain_mistralai import MistralAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, TextLoader, UnstructuredMarkdownLoader

# 1. Chargement BNP (PDFs traités par Mistral OCR ou Text brut extrait)
# Supposons que nous ayons converti les PDF en texte brut pour simplifier l'exemple
loader_bnp = TextLoader("data/bnp_content.txt", encoding="utf-8")
docs_bnp = loader_bnp.load()
# Marquage indispensable de la source
for doc in docs_bnp:
    doc.metadata.update({"source": "BNP_Paribas", "type": "competitor"})

# 2. Chargement Pilote (Fichiers Markdown locaux)
loader_pilot = TextLoader("data/pilot_v2.md")
docs_pilot = loader_pilot.load()
for doc in docs_pilot:
    doc.metadata.update({"source": "Site_Pilote", "type": "hero"})

# 3. Fusion et Chunking
all_docs = docs_bnp + docs_pilot
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500, 
    chunk_overlap=50,
    separators=["\n\n", "\n", " ", ""] # Prioriser les sauts de paragraphe
)
splits = text_splitter.split_documents(all_docs)

# 4. Embedding et Indexation
embeddings = MistralAIEmbeddings(model="mistral-embed", mistral_api_key="MY_API_KEY")
vectorstore = FAISS.from_documents(splits, embeddings)

# Sauvegarde de l'index pour éviter de re-payer les embeddings à chaque test
vectorstore.save_local("faiss_index_geo_hackathon")
