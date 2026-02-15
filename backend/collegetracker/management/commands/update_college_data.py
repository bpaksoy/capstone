from django.core.management.base import BaseCommand
import pandas as pd
from collegetracker.models import College

class Command(BaseCommand):
    help = 'Updates college data (deadlines, descriptions) from a CSV file. Expects columns: "name", "deadline", "description" (optional).'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Path to the CSV file')

    def handle(self, *args, **kwargs):
        csv_file = kwargs['csv_file']
        
        try:
            self.stdout.write(f"Reading {csv_file}...")
            df = pd.read_csv(csv_file)
            
            # Normalize columns to lowercase for easier matching
            df.columns = [c.lower().strip() for c in df.columns]
            
            if 'name' not in df.columns:
                self.stdout.write(self.style.ERROR("CSV must contain a 'name' column to match colleges."))
                return

            updated_count = 0
            not_found_count = 0

            for _, row in df.iterrows():
                college_name = row['name']
                
                # Try to find college by name (case insensitive)
                start_matches = College.objects.filter(name__iexact=college_name)
                
                # If no exact match, try contains (risky, so currently skipping to be safe or just logging)
                if not start_matches.exists():
                     # Try "University of X" vs "X University" if needed, but let's stick to exact first
                     # Or try stripped
                     start_matches = College.objects.filter(name__icontains=college_name)
                
                if start_matches.exists():
                    # Take the first best match
                    college = start_matches.first()
                    
                    changed = False
                    if 'deadline' in df.columns and pd.notna(row['deadline']):
                        college.application_deadline = str(row['deadline'])
                        changed = True
                    
                    if 'description' in df.columns and pd.notna(row['description']):
                        college.description = str(row['description'])
                        changed = True
                        
                    if changed:
                        college.save()
                        updated_count += 1
                        self.stdout.write(self.style.SUCCESS(f"Updated {college.name}"))
                else:
                    not_found_count += 1
                    # self.stdout.write(self.style.WARNING(f"College not found: {college_name}"))

            self.stdout.write(self.style.SUCCESS(f"\nDone! Updated {updated_count} colleges. {not_found_count} names not matched."))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error: {str(e)}"))
