import csv
import os
from django.core.management.base import BaseCommand
from collegetracker.models import College

class Command(BaseCommand):
    help = 'Update College data from IPEDS CSV'

    def handle(self, *args, **options):
        # Define the relative path to the IPEDS file
        # The file is in IPEDS_data at the project root.
        # This script runs from inside backend (usually), so we navigate up.
        # The user's metadata says the file is at /Users/banupaksoy/Desktop/capstone/IPEDS_data/Data_2-16-2026---799.csv
        # We can use the absolute path for safety as it was confirmed by list_dir.
        
        csv_file_path = '/Users/banupaksoy/Desktop/capstone/IPEDS_data/Data_2-16-2026---799.csv'

        if not os.path.exists(csv_file_path):
            self.stdout.write(self.style.ERROR(f'File not found at {csv_file_path}'))
            return

        self.stdout.write(self.style.SUCCESS(f'Reading IPEDS data from {csv_file_path}...'))

        updated_count = 0
        not_found_count = 0
        
        with open(csv_file_path, mode='r', encoding='utf-8-sig') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                unitid = row.get('UnitID')
                if not unitid:
                    continue
                
                # Fetch college by UNITID
                try:
                    # Our College model has UNITID field (case insensitive match might be safer but UNITID is usually clean)
                    college = College.objects.get(UNITID=unitid)
                    
                    # Map fields
                    # "Carnegie Classification 2025..." -> carnegie_classification
                    cc_basic = row.get('Carnegie Classification 2025: Institutional Classification (HD2024)')
                    
                    # "Open admission policy (IC2024)" -> 1=Yes, 2=No
                    open_admit = row.get('Open admission policy (IC2024)')
                    
                    # "All programs offered completely via distance education (IC2024)" -> 1=Yes, 2=No
                    dist_ed = row.get('All programs offered completely via distance education (IC2024)')

                    # Update fields if data exists
                    if cc_basic and cc_basic != '-2': # -2 is Not applicable/Not classified
                         college.carnegie_classification = int(cc_basic)
                    
                    if open_admit == '1':
                        college.is_open_admission = True
                    else:
                        college.is_open_admission = False
                        
                    if dist_ed == '1':
                        college.is_distance_education = True
                    else:
                        college.is_distance_education = False
                        
                    college.save()
                    updated_count += 1
                    
                    if updated_count % 100 == 0:
                         self.stdout.write(f'Updated {updated_count} colleges...')

                except College.DoesNotExist:
                    not_found_count += 1
                    # self.stdout.write(self.style.WARNING(f'College with UNITID {unitid} not found.'))
                    pass
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error updating {unitid}: {str(e)}'))

        self.stdout.write(self.style.SUCCESS(f'Successfully updated {updated_count} colleges.'))
        self.stdout.write(self.style.WARNING(f'Skipped {not_found_count} colleges (not found in DB).'))
