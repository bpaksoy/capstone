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

        def normalize_cip(x):
            s = "".join(c for c in str(x) if c.isdigit())
            if len(s) % 2 != 0: s = '0' + s
            return s[:4]

        # 1. Update Institution level data
        self.stdout.write("Processing Institution data...")
        df_inst = pd.read_csv(inst_csv, usecols=['UNITID', 'INSTNM', 'MD_EARN_WNE_4YR', 'GT_THRESHOLD_4YR'])
        
        colleges_to_update = []
        all_colleges = {c.UNITID: c for c in College.objects.exclude(UNITID__isnull=True)}

        for _, row in df_inst.iterrows():
            unitid = str(row['UNITID'])
            if unitid in all_colleges:
                college = all_colleges[unitid]
                changed = False
                
                # Earnings
                val = row['MD_EARN_WNE_4YR']
                if pd.notna(val) and str(val) not in ['PrivacySuppressed', 'PS', 'None', 'NULL']:
                    try:
                        college.median_earnings_4yr = int(float(val))
                        changed = True
                    except (ValueError, TypeError):
                        pass
                
                # Threshold Indicator (Lower Earnings)
                thresh = row['GT_THRESHOLD_4YR']
                if pd.notna(thresh) and thresh != 'PrivacySuppressed':
                    college.lower_earnings_indicator = float(thresh) < 0.5
                    changed = True
                
                if changed:
                    colleges_to_update.append(college)

        if colleges_to_update:
            College.objects.bulk_update(colleges_to_update, ['median_earnings_4yr', 'lower_earnings_indicator'])
            self.stdout.write(self.style.SUCCESS(f"Updated {len(colleges_to_update)} institutions."))

        # 2. Update Field of Study data
        self.stdout.write("Processing Field of Study data (Bulk Mode)...")
        df_fos = pd.read_csv(fos_csv, usecols=['UNITID', 'CIPCODE', 'CIPDESC', 'CREDDESC', 'EARN_MDN_4YR', 'EARN_MDN_4YR_NAT'])
        
        # We process school by school to manage memory
        for unitid, school_df in df_fos.groupby('UNITID'):
            unitid_str = str(unitid)
            programs = list(CollegeProgram.objects.filter(college__UNITID=unitid_str))
            
            if not programs:
                continue
                
            progs_to_update = []
            for _, row in school_df.iterrows():
                csv_cip_4 = normalize_cip(row['CIPCODE'])
                csv_cred = str(row['CREDDESC']).lower().strip()
                
                for prog in programs:
                    db_cip_4 = normalize_cip(prog.cipcode)
                    db_cred = str(prog.creddesc).lower().strip()
                    
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
                            progs_to_update.append(prog)

            if progs_to_update:
                CollegeProgram.objects.bulk_update(progs_to_update, ['median_earnings', 'national_median'])

        self.stdout.write(self.style.SUCCESS(f"Finished processing program-level data."))
