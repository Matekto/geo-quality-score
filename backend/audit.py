# Script d'Audit
import pandas as pd
from langchain_community.vectorstores import FAISS
from langchain_mistralai import MistralAIEmbeddings

# Chargement de l'index existant
embeddings = MistralAIEmbeddings(model="mistral-embed", mistral_api_key="M4dPBPdGgbq19rOpbN5ODayB8MsMKJpJ")
vectorstore = FAISS.load_local("faiss_index_geo_hackathon", embeddings, allow_dangerous_deserialization=True)
retriever = vectorstore.as_retriever(search_kwargs={"k": 10}) # Top 10 résultats

# Liste des questions stratégiques (User Queries)
queries = [
    "Qui sont les héritiers réservataires et que signifie la réserve héréditaire en droit français ?",
    "Quelle est la part successorale légale du conjoint survivant en présence uniquement de descendants communs ?",
    "Quelle est la différence entre une donation simple et une donation-partage ?",
    "Quelle est la différence de traitement, au décès du souscripteur, entre un contrat d’assurance-vie et un contrat de capitalisation ?",
    "Que se passe-t-il pour les comptes bancaires individuels d’un défunt dès que la banque est informée du décès ?",
]

results_data = []

for q in queries:
    retrieved_docs = retriever.invoke(q)
    
    bnp_score = 0
    pilot_score = 0
    
    for doc in retrieved_docs:
        if doc.metadata["source"] == "BNP_Paribas":
            bnp_score += 1
        elif doc.metadata["source"] == "Site_Pilote":
            pilot_score += 1
            
    results_data.append({
        "Question": q,
        "BNP_Chunks": bnp_score,
        "Pilot_Chunks": pilot_score,
        "Winner": "Pilot" if pilot_score > bnp_score else "BNP"
    })

df = pd.DataFrame(results_data)
print(df)
total_pilot = df["Pilot_Chunks"].sum()
total_bnp = df["BNP_Chunks"].sum()
print(f"Part de Visibilité Pilote : {total_pilot / (total_pilot + total_bnp) * 100:.2f}%")


