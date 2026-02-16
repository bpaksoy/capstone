
from django.core.management.base import BaseCommand
from collegetracker.models import College
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
import os
import time

class Command(BaseCommand):
    help = 'Builds a FAISS vector index from College data for RAG.'

    def handle(self, *args, **kwargs):
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            self.stdout.write(self.style.ERROR("GEMINI_API_KEY not found."))
            return

        self.stdout.write("Fetching colleges from database...")
        # Limiting to 200 for initial test run to respect rate limits
        colleges = College.objects.all()[:200]
        
        documents = []
        for college in colleges:
            # Synthesize a descriptive text for the embedding
            # This is what the AI will "search" against
            description = f"{college.name} is a college located in {college.city}, {college.state}. "
            
            if college.description:
                description += f"{college.description} "
            
            if college.admission_rate:
                rate = college.admission_rate * 100
                selectivity = "very competitive" if rate < 20 else "competitive" if rate < 50 else "accessible"
                description += f"It has an acceptance rate of {rate:.1f}%, making it {selectivity}. "
            
            if college.sat_score:
                description += f"The average SAT score is {college.sat_score}. "
            
            if college.cost_of_attendance:
                description += f"The average annual cost is ${college.cost_of_attendance:,}. "
            
            if college.website:
                 description += f"Website: {college.website}"

            # Create a Document object
            # Metadata is crucial: this is what we get back when a search matches!
            doc = Document(
                page_content=description,
                metadata={
                    "id": college.id,
                    "name": college.name,
                    "city": college.city,
                    "state": college.state,
                    "admission_rate": college.admission_rate,
                    "sat_score": college.sat_score,
                    "cost": college.cost_of_attendance
                }
            )
            documents.append(doc)

        self.stdout.write(f"Created {len(documents)} logic text documents. Generating embeddings... (this may take a moment)")

        try:
            # Use Gemini Embeddings
            embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001", google_api_key=api_key)
            
            # Create FAISS index in batches to respect rate limits (100 req/min typically)
            batch_size = 50
            total_docs = len(documents)
            vector_store = None
            
            self.stdout.write(f"Processing {total_docs} documents in batches of {batch_size}...")

            for i in range(0, total_docs, batch_size):
                batch = documents[i : i + batch_size]
                self.stdout.write(f"  Embedding batch {i // batch_size + 1}/{(total_docs // batch_size) + 1}...")
                
                if vector_store is None:
                    vector_store = FAISS.from_documents(batch, embeddings)
                else:
                    vector_store.add_documents(batch)
                
                # Sleep to avoid hitting rate limits (e.g., 60s per batch if needed, but maybe 2s is enough if limit is per minute)
                # If limit is 1500 req/min, 50 is fine.
                # But error said 100 req/min on free tier? 
                # Let's be conservative: 1 batch per 10 seconds. Or wait 30s if we hit an error.
                # Actually, simply sleeping 2s might be enough if batch count is small.
                # But free tier is often restrictive. The error suggested retry delay 23s.
                # Let's sleep 10s between batches.
                time.sleep(2) 

            # Save locally
            index_path = "college_faiss_index"
            vector_store.save_local(index_path)
            
            self.stdout.write(self.style.SUCCESS(f"Successfully built and saved vector index to '{index_path}'"))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error building index: {e}"))
