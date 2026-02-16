
from django.core.management.base import BaseCommand
from collegetracker.models import College
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
import os
import time

import pandas as pd

class Command(BaseCommand):
    help = 'Builds a FAISS vector index from College data for RAG.'

    def handle(self, *args, **kwargs):
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            self.stdout.write(self.style.ERROR("GEMINI_API_KEY not found."))
            return

        # Load Metadata from Scorecard
        scorecard_path = 'College_Scorecard_Raw_Data_10032025/Most-Recent-Cohorts-Institution.csv'
        df_meta = pd.DataFrame()
        try:
            if os.path.exists(scorecard_path):
                self.stdout.write(f"Loading metadata from {scorecard_path}...")
                cols = ['UNITID', 'HBCU', 'HSI', 'LOCALE', 'CCBASIC', 'CONTROL', 'RELAFFIL', 'WOMENONLY', 'MENONLY']
                df_meta = pd.read_csv(scorecard_path, usecols=cols, low_memory=False)
                df_meta['UNITID'] = df_meta['UNITID'].astype(str)
                df_meta.set_index('UNITID', inplace=True)
                self.stdout.write(f"Loaded metadata for {len(df_meta)} institutions.")
            else:
                self.stdout.write(self.style.WARNING(f"Scorecard CSV not found at {scorecard_path}. Skipping enrichment."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error loading scorecard: {e}"))

        self.stdout.write("Fetching colleges from database...")
        # Processing all colleges now, prefetching programs for efficiency
        colleges = College.objects.prefetch_related('programs').all()
        
        documents = []
        for college in colleges:
            # Synthesize a descriptive text for the embedding
            # This is what the AI will "search" against
            description = f"{college.name} is a college located in {college.city}, {college.state}. "
            
            # Enrich with Scorecard Metadata
            if college.UNITID and str(college.UNITID) in df_meta.index:
                row = df_meta.loc[str(college.UNITID)]
                
                # Control
                control_map = {1: "public", 2: "private non-profit", 3: "private for-profit"}
                if row['CONTROL'] in control_map:
                    description += f"It is a {control_map[row['CONTROL']]} institution. "

                # Locale
                if pd.notna(row['LOCALE']):
                    loc = int(row['LOCALE'])
                    setting = "urban" if 11 <= loc <= 13 else \
                              "suburban" if 21 <= loc <= 23 else \
                              "town" if 31 <= loc <= 33 else \
                              "rural" if 41 <= loc <= 43 else ""
                    if setting:
                        description += f"The campus setting is {setting}. "

                # Carnegie Classification (Simplified)
                # 15=R1, 16=R2 -> Research
                # 21,22 -> Master's
                # 31,32 -> Baccalaureate / Liberal Arts
                if pd.notna(row['CCBASIC']):
                    cc = int(row['CCBASIC'])
                    if cc in [15, 16]:
                        description += "It is a major research university. "
                    elif cc in [31, 32]:
                        description += "It is a liberal arts college. "
                    elif cc == 33:
                        description += "It focuses on diverse fields. " ## Arts & Sciences

                # Special Mission
                if row['HBCU'] == 1: description += "It is a Historically Black College or University (HBCU). "
                if row['HSI'] == 1: description += "It is a Hispanic-Serving Institution (HSI). "
                if row['WOMENONLY'] == 1: description += "It is a women's college. "
                if row['MENONLY'] == 1: description += "It is a men's college. "
                
                # Religious
                if pd.notna(row['RELAFFIL']) and row['RELAFFIL'] > 0:
                     description += "It has a religious affiliation. "

            
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

            # Add Programs
            programs = list(college.programs.all())
            if programs:
                # Deduplicate program names (case insensitive)
                seen_progs = set()
                unique_progs = []
                for p in programs:
                    p_name = p.cipdesc.strip()
                    if p_name.lower() not in seen_progs:
                        unique_progs.append(p_name)
                        seen_progs.add(p_name.lower())
                
                # Limit to top 20 to keep context manageable, but informative
                prog_list = ", ".join(unique_progs[:20])
                description += f"It offers undergraduate programs in: {prog_list}."
            
            if college.website:
                 description += f" Website: {college.website}"

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
