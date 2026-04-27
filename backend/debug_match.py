import os, sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'collegetracker.settings')
import django
django.setup()
from collegetracker.models import CollegeProgram

def normalize_cip(x):
    s = "".join(c for c in str(x) if c.isdigit())
    if len(s) % 2 != 0: s = '0' + s
    return s[:4]

unitid = '100654'
csv_cip = '0109'
csv_cred = "Bachelor's Degree".lower().strip()

csv_cip_4 = normalize_cip(csv_cip)

print(f"Searching for UNITID:{unitid}, CIP4:{csv_cip_4}, CRED:{csv_cred}")

progs = CollegeProgram.objects.filter(college__UNITID=unitid)
print(f"Found {len(progs)} programs for this college in DB.")

for p in progs:
    db_cip_4 = normalize_cip(p.cipcode)
    db_cred = str(p.creddesc).lower().strip()
    if db_cip_4 == csv_cip_4:
        print(f"CIP MATCH! DB CID:{p.cipcode} ({db_cip_4}) CRED:'{db_cred}' vs CSV:'{csv_cred}'")
        if csv_cred in db_cred or db_cred in csv_cred:
             print("CREDENTIAL MATCH FOUND!")
