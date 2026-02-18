import os
import pandas as pd
from django.core.management.base import BaseCommand
from collegetracker.models import College, CollegeProgram

class Command(BaseCommand):
    help = 'Import college programs/majors from IPEDS completions file'

    def handle(self, *args, **options):
        ipeds_dir = "/Users/banupaksoy/Desktop/capstone/IPEDS_data"
        csv_path = os.path.join(ipeds_dir, "c2024_a.csv")
        xlsx_path = os.path.join(ipeds_dir, "c2024_a.xlsx")

        if not os.path.exists(csv_path) or not os.path.exists(xlsx_path):
            self.stdout.write(self.style.ERROR("Required files not found in IPEDS_data"))
            return

        self.stdout.write("Loading CIP and Award dictionaries from Excel...")
        # Load CIP titles
        try:
            dict_df = pd.read_excel(xlsx_path, sheet_name='Frequencies')
            
            # Filter for CIPCODE and AWLEVEL
            cip_entries = dict_df[dict_df['VarName'] == 'CIPCODE']
            award_entries = dict_df[dict_df['VarName'] == 'AWLEVEL']
            
            # Create maps using float-based keys for robust matching
            cip_map = {}
            for _, row in cip_entries.iterrows():
                try:
                    key = float(row['CodeValue'])
                    cip_map[key] = row['ValueLabel']
                except:
                    cip_map[str(row['CodeValue'])] = row['ValueLabel']

            award_map = {}
            for _, row in award_entries.iterrows():
                try:
                    key = float(row['CodeValue'])
                    award_map[key] = row['ValueLabel']
                except:
                    award_map[str(row['CodeValue'])] = row['ValueLabel']
                    
            self.stdout.write(f"Loaded {len(cip_map)} CIP codes and {len(award_map)} Award levels.")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error loading dictionaries: {e}"))
            return

        self.stdout.write("Reading completions CSV (this may take a minute due to size)...")
        # Read completions data
        df = pd.read_csv(csv_path, low_memory=False)
        df['UNITID'] = df['UNITID'].astype(str)
        
        # Filter for primary majors (MAJORNUM=1) and skip 'Total' records (CIPCODE=99 or similar if applicable)
        # Actually CIPCODE 99 is usually 'Grand Total'. 
        df = df[df['MAJORNUM'] == 1]
        
        colleges = {c.UNITID: c for c in College.objects.all()}
        self.stdout.write(f"Loaded {len(colleges)} colleges from database.")

        self.stdout.write(f"Processing {len(df)} program records...")
        
        # Optional: Clear existing programs if you want a clean sync
        CollegeProgram.objects.all().delete()
        self.stdout.write("Cleared existing programs.")

        program_objects = []
        count = 0
        total_records = len(df)

        for _, row in df.iterrows():
            unitid = str(row['UNITID'])
            if unitid in colleges:
                # Handle CIPCODE matching
                cip_val = row['CIPCODE']
                try:
                    # Match as float
                    cip_key = float(cip_val)
                    if cip_key == 99.0: # Skip total rows
                        continue
                    cip_desc = cip_map.get(cip_key, f"Program {cip_val}")
                except:
                    cip_desc = cip_map.get(str(cip_val), f"Program {cip_val}")

                # Handle Award Level matching
                aw_val = row['AWLEVEL']
                try:
                    aw_key = float(aw_val)
                    cred_desc = award_map.get(aw_key, f"Award Level {aw_val}")
                except:
                    cred_desc = award_map.get(str(aw_val), f"Award Level {aw_val}")
                
                program_objects.append(CollegeProgram(
                    college=colleges[unitid],
                    cipcode=str(cip_val),
                    cipdesc=cip_desc,
                    creddesc=cred_desc,
                    UNITID=unitid
                ))
                count += 1
                
            if len(program_objects) >= 5000:
                CollegeProgram.objects.bulk_create(program_objects, ignore_conflicts=True)
                program_objects = []
                self.stdout.write(f"Imported {count} / {total_records} records...")

        if program_objects:
            CollegeProgram.objects.bulk_create(program_objects, ignore_conflicts=True)
            self.stdout.write(f"Imported {count} total program records.")

        self.stdout.write(self.style.SUCCESS(f'Successfully completed program import.'))
