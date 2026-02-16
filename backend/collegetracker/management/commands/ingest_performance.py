import pandas as pd
from django.core.management.base import BaseCommand
from collegetracker.models import College
import os

class Command(BaseCommand):
    help = 'Ingest performance and financial data from Scorecard CSV'

    def handle(self, *args, **options):
        csv_path = '../Most-Recent-Cohorts-Institution.csv'
        if not os.path.exists(csv_path):
            self.stdout.write(self.style.ERROR(f"CSV not found at {csv_path}"))
            return

        cols = ['UNITID', 'C150_4', 'C150_L4', 'NPT4_PUB', 'NPT4_PRIV', 'FTFTPCTFLOAN']
        df = pd.read_csv(csv_path, usecols=cols, low_memory=False)
        
        # Replace 'PrivacySuppressed' and other non-numeric garbage
        for col in cols:
            df[col] = pd.to_numeric(df[col], errors='coerce')

        update_count = 0
        colleges = College.objects.all()
        college_map = {c.UNITID: c for c in colleges if c.UNITID}

        for _, row in df.iterrows():
            unitid = str(int(row['UNITID'])) if not pd.isna(row['UNITID']) else None
            if unitid in college_map:
                college = college_map[unitid]
                
                # Graduation Rate (Coalesce 4-year and less-than-4-year)
                grad_rate = row['C150_4'] if not pd.isna(row['C150_4']) else row['C150_L4']
                
                # Net Price (Coalesce Public and Private)
                net_price = row['NPT4_PUB'] if not pd.isna(row['NPT4_PUB']) else row['NPT4_PRIV']
                
                # Loan Rate
                loan_rate = row['FTFTPCTFLOAN']

                college.grad_rate = grad_rate
                college.avg_net_price = int(net_price) if not pd.isna(net_price) else None
                college.loan_rate = loan_rate
                
                college.save()
                update_count += 1
                if update_count % 500 == 0:
                    self.stdout.write(f"Updated {update_count} colleges...")

        self.stdout.write(self.style.SUCCESS(f"Successfully updated {update_count} colleges with performance data."))
