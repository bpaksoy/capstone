import pandas as pd
from django.core.management.base import BaseCommand
from collegetracker.models import College, CollegeProgram

class Command(BaseCommand):
    help = 'Updates college data using the latest 2026 Scorecard files (Institution and Field of Study).'

    def add_arguments(self, parser):
        parser.add_argument('inst_csv', type=str, help='Path to Most-Recent-Cohorts-Institution.csv')
        parser.add_argument('fos_csv', type=str, help='Path to Most-Recent-Cohorts-Field-of-Study.csv')

    def handle(self, *args, **kwargs):
        inst_csv = kwargs['inst_csv']
        fos_csv = kwargs['fos_csv']

        # 1. Update Institution level data
        self.stdout.write("Processing Institution data...")
        # We use UNITID for matching as it's reliable. 
        # Scorecard data often uses 'PrivacySuppressed' for small cohorts, we handle that.
        df_inst = pd.read_csv(inst_csv, usecols=['UNITID', 'INSTNM', 'MD_EARN_WNE_4YR', 'GT_THRESHOLD_4YR'])
        
        updated_inst = 0
        for _, row in df_inst.iterrows():
            unitid = str(row['UNITID'])
            try:
                college = College.objects.get(UNITID=unitid)
                
                # Earnings
                val = row['MD_EARN_WNE_4YR']
                if pd.notna(val) and str(val) not in ['PrivacySuppressed', 'PS', 'None', 'NULL']:
                    try:
                        college.median_earnings_4yr = int(float(val))
                    except (ValueError, TypeError):
                        pass
                
                # Threshold Indicator (Lower Earnings)
                # If GT_THRESHOLD is low, it means grads might be earning less than HS grads
                # Note: This logic might need refinement based on exact FSA definitions, 
                # but we'll flag if it's below a certain threshold or null if suppressed.
                thresh = row['GT_THRESHOLD_4YR']
                if pd.notna(thresh) and thresh != 'PrivacySuppressed':
                    # If the percentage above threshold is very low, set the indicator
                    college.lower_earnings_indicator = float(thresh) < 0.5
                
                college.save()
                updated_inst += 1
            except College.DoesNotExist:
                continue

        self.stdout.write(self.style.SUCCESS(f"Updated {updated_inst} institutions."))

        # 2. Update Field of Study data
        self.stdout.write("Processing Field of Study data...")
        # Program matching: UNITID + CIPCODE + CREDDESC
        df_fos = pd.read_csv(fos_csv, usecols=['UNITID', 'CIPCODE', 'CIPDESC', 'CREDDESC', 'EARN_MDN_4YR', 'EARN_MDN_4YR_NAT'])
        
        updated_fos = 0
        total_fos_rows = len(df_fos)
        self.stdout.write(f"Total rows to check: {total_fos_rows}")

        # Optimization: Get all programs once to minimize queries? 
        # No, table is too large. But we can optimize by UNITID.
        
        # We'll use a slightly broader filter and then refine in Python
        for i, row in df_fos.iterrows():
            if i % 10000 == 0:
                self.stdout.write(f"Processed {i}/{total_fos_rows} rows...")
                
            unitid = str(row['UNITID'])
            
            def normalize_cip(x):
                s = "".join(c for c in str(x) if c.isdigit())
                if len(s) % 2 != 0: s = '0' + s
                return s[:4]

            csv_cip_4 = normalize_cip(row['CIPCODE'])
            csv_cred = str(row['CREDDESC']).lower().strip()
            
            # Find all programs for this college via relationship
            programs = CollegeProgram.objects.filter(college__UNITID=unitid)
            
            for prog in programs:
                db_cip_4 = normalize_cip(prog.cipcode)
                db_cred = str(prog.creddesc).lower().strip()
                
                # Check if CIP-4 and Credential match (loose)
                if db_cip_4 == csv_cip_4 and (csv_cred in db_cred or db_cred in csv_cred):
                    changed = False
                    
                    earn = row['EARN_MDN_4YR']
                    if pd.notna(earn) and str(earn) not in ['PrivacySuppressed', 'PS', 'None', 'NULL']:
                        try:
                            prog.median_earnings = int(float(earn))
                            changed = True
                        except (ValueError, TypeError):
                            pass
                        
                    nat = row['EARN_MDN_4YR_NAT']
                    if pd.notna(nat) and str(nat) not in ['PrivacySuppressed', 'PS', 'None', 'NULL']:
                        try:
                            prog.national_median = int(float(nat))
                            changed = True
                        except (ValueError, TypeError):
                            pass
                    
                    if changed:
                        prog.save()
                        updated_fos += 1

        self.stdout.write(self.style.SUCCESS(f"Updated {updated_fos} program-level data points."))
