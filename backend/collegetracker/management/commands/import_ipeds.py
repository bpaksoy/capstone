import os
import pandas as pd
from django.core.management.base import BaseCommand
from collegetracker.models import College

class Command(BaseCommand):
    help = 'Import college data from IPEDS CSV files'

    def handle(self, *args, **options):
        ipeds_dir = "/Users/banupaksoy/Desktop/capstone/IPEDS_data"
        
        self.stdout.write("Loading IPEDS data files...")
        
        # Load files with appropriate encodings and UNITID as string
        hd_df = pd.read_csv(os.path.join(ipeds_dir, "hd2024.csv"), encoding='utf-8-sig', low_memory=False)
        hd_df['UNITID'] = hd_df['UNITID'].astype(str)
        
        # Derived Admissions
        drvadm_path = os.path.join(ipeds_dir, "drvadm2024.csv")
        drvadm_df = pd.read_csv(drvadm_path, low_memory=False)
        drvadm_df['UNITID'] = drvadm_df['UNITID'].astype(str)
        
        # Admissions (Scores)
        adm_path = os.path.join(ipeds_dir, "adm2024.csv")
        adm_df = pd.read_csv(adm_path, low_memory=False)
        adm_df['UNITID'] = adm_df['UNITID'].astype(str)
        
        # Derived Cost
        drvcost_path = os.path.join(ipeds_dir, "drvcost2024.csv")
        drvcost_df = pd.read_csv(drvcost_path, low_memory=False)
        drvcost_df['UNITID'] = drvcost_df['UNITID'].astype(str)
        
        # Derived Enrollment
        drvef_path = os.path.join(ipeds_dir, "drvef2024.csv")
        drvef_df = pd.read_csv(drvef_path, low_memory=False)
        drvef_df['UNITID'] = drvef_df['UNITID'].astype(str)

        # Custom Data (Open Admission, Distance Ed, Carnegie)
        custom_path = os.path.join(ipeds_dir, "Data_2-16-2026---799.csv")
        custom_df = pd.read_csv(custom_path, low_memory=False)
        custom_df['UnitID'] = custom_df['UnitID'].astype(str)
        custom_df.rename(columns={'UnitID': 'UNITID'}, inplace=True)

        self.stdout.write("Merging data...")
        
        # Merge all data on UNITID
        df = hd_df[['UNITID', 'INSTNM', 'ADDR', 'CITY', 'STABBR', 'WEBADDR', 'LATITUDE', 'LONGITUD', 'LOCALE', 'CONTROL', 'HBCU', 'C21BASIC', 'HLOFFER']]
        
        df = df.merge(drvadm_df[['UNITID', 'DVADM01']], on='UNITID', how='left')
        df = df.merge(adm_df[['UNITID', 'SATVR50', 'SATMT50', 'ACTCM50']], on='UNITID', how='left')
        df = df.merge(drvcost_df[['UNITID', 'COTSON', 'TUFEYR1', 'TUFEYR3']], on='UNITID', how='left')
        df = df.merge(drvef_df[['UNITID', 'DVEF01']], on='UNITID', how='left')
        
        # Rename columns to match model
        df.rename(columns={
            'INSTNM': 'name',
            'CITY': 'city',
            'STABBR': 'state',
            'WEBADDR': 'website',
            'DVADM01': 'admission_rate',
            'COTSON': 'cost_of_attendance',
            'TUFEYR1': 'tuition_in_state',
            'TUFEYR3': 'tuition_out_state',
            'DVEF01': 'enrollment_all',
            'C21BASIC': 'carnegie_classification'
        }, inplace=True)

        # Merge custom data for Open Admission and distance ed
        custom_cols = {
            'Open admission policy (IC2024)': 'open_ads_raw',
            'All programs offered completely via distance education (IC2024)': 'dist_ed_raw'
        }
        df = df.merge(custom_df[['UNITID'] + list(custom_cols.keys())], on='UNITID', how='left')
        df.rename(columns=custom_cols, inplace=True)

        self.stdout.write(f"Merged dataframe size: {len(df)}")
        if len(df) == 0:
            self.stdout.write("Warning: Merged dataframe is empty!")
            return

        count = 0
        created_count = 0
        self.stdout.write(f"Updating {len(df)} colleges...")
        
        for _, row in df.iterrows():
            # Calculate SAT score as sum of Verbal and Math 50th percentiles
            sat_score = None
            try:
                if pd.notnull(row.get('SATVR50')) and pd.notnull(row.get('SATMT50')):
                    sat_score = int(row['SATVR50']) + int(row['SATMT50'])
                elif pd.notnull(row.get('SATVR50')):
                    sat_score = int(row['SATVR50']) * 2 # Fallback
                elif pd.notnull(row.get('SATMT50')):
                    sat_score = int(row['SATMT50']) * 2 # Fallback
            except:
                pass
            
            college, created = College.objects.update_or_create(
                UNITID=row['UNITID'],
                defaults={
                    'name': row['name'],
                    'city': row['city'],
                    'state': row['state'],
                    'website': str(row['website']) if pd.notnull(row['website']) else '',
                    'admission_rate': float(row['admission_rate'])/100.0 if pd.notnull(row['admission_rate']) else None,
                    'sat_score': sat_score,
                    'cost_of_attendance': int(row['cost_of_attendance']) if pd.notnull(row['cost_of_attendance']) else None,
                    'tuition_in_state': int(row['tuition_in_state']) if pd.notnull(row['tuition_in_state']) else None,
                    'tuition_out_state': int(row['tuition_out_state']) if pd.notnull(row['tuition_out_state']) else None,
                    'latitude': float(row['LATITUDE']) if pd.notnull(row['LATITUDE']) else None,
                    'longitude': float(row['LONGITUD']) if pd.notnull(row['LONGITUD']) else None,
                    'enrollment_all': int(row['enrollment_all']) if pd.notnull(row['enrollment_all']) else None,
                    'carnegie_classification': int(row['carnegie_classification']) if pd.notnull(row['carnegie_classification']) else None,
                    'locale': int(row['LOCALE']) if pd.notnull(row['LOCALE']) else None,
                    'control': int(row['CONTROL']) if pd.notnull(row['CONTROL']) else None,
                    'hbcu': row['HBCU'] == 1 if pd.notnull(row['HBCU']) else False,
                    'is_open_admission': row['open_ads_raw'] == 1 if pd.notnull(row['open_ads_raw']) else False,
                    'is_distance_education': row['dist_ed_raw'] == 1 if pd.notnull(row['dist_ed_raw']) else False,
                }
            )

            # Also update SmartCollege
            from collegetracker.models import SmartCollege
            SmartCollege.objects.update_or_create(
                name=row['name'],
                city=row['city'],
                state=row['state'],
                defaults={
                    'website': str(row['website']) if pd.notnull(row['website']) else '',
                    'admission_rate': float(row['admission_rate'])/100.0 if pd.notnull(row['admission_rate']) else None,
                    'sat_score': sat_score,
                    'cost_of_attendance': int(row['cost_of_attendance']) if pd.notnull(row['cost_of_attendance']) else None,
                    'tuition_in_state': int(row['tuition_in_state']) if pd.notnull(row['tuition_in_state']) else None,
                    'tuition_out_state': int(row['tuition_out_state']) if pd.notnull(row['tuition_out_state']) else None,
                    'latitude': float(row['LATITUDE']) if pd.notnull(row['LATITUDE']) else None,
                    'longitude': float(row['LONGITUD']) if pd.notnull(row['LONGITUD']) else None,
                    'enrollment_all': int(row['enrollment_all']) if pd.notnull(row['enrollment_all']) else None,
                    'CCBASIC': str(row['carnegie_classification']) if pd.notnull(row['carnegie_classification']) else None,
                    'HLOFFER': str(row['HLOFFER']) if pd.notnull(row['HLOFFER']) else None,
                }
            )

            count += 1
            if count % 100 == 0:
                self.stdout.write(f"Processed {count} colleges...")

        self.stdout.write(self.style.SUCCESS(f'Successfully imported {count} colleges'))
