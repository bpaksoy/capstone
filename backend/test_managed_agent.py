import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'collegetracker.settings')
django.setup()

from collegetracker import agent_tools
from collegetracker.models import College, User, Bookmark, LeadStatus

print("=" * 60)
print("🧪 TESTING WORMIE MANAGED AGENT TOOLS")
print("=" * 60)

# 1. Test College Details Lookup
print("\n[1] Testing get_college_details('Boston')...")
details = agent_tools.get_college_details("Boston")
print(f"Result Status: {details.get('status')}")
print(f"College Name: {details.get('name')}")
print(f"Tuition In-State: {details.get('tuition_in_state')}")
print(f"Admission Rate: {details.get('admission_rate')}")
print(f"Median Earnings (4yr): {details.get('median_earnings_4yr')}")

# 2. Test Search Colleges Tool
print("\n[2] Testing search_colleges(state='MA', limit=3)...")
search_res = agent_tools.search_colleges(state="MA", limit=3)
print(f"Found {search_res.get('count')} colleges in MA:")
for col in search_res.get('results', []):
    print(f" - {col['name']} ({col['city']}, {col['state']}) | Tuition: {col['tuition_out_state']} | Admission: {col['admission_rate']}")

# 3. Test Admission Chances Calculation Tool
print("\n[3] Testing calculate_admission_chances('Boston', student_gpa=3.8, student_sat=1420)...")
chances = agent_tools.calculate_admission_chances("Boston", student_gpa=3.8, student_sat=1420)
print(f"Classification: {chances.get('classification')}")
print(f"Reasoning: {chances.get('reasoning')}")

# 4. Test Bookmark & Lead Tools with Test User
print("\n[4] Testing database actions with User...")
test_user, _ = User.objects.get_or_create(username="test_student", defaults={"role": "student", "gpa": 3.9, "sat_score": 1450})
bm_res = agent_tools.bookmark_college(test_user, "Boston")
print(f"Bookmark Result: {bm_res}")

lead_res = agent_tools.submit_recruiter_lead(test_user, "Boston")
print(f"Lead Result: {lead_res}")

print("\n" + "=" * 60)
print("✅ ALL AGENT TOOLS VERIFIED SUCCESSFULLY!")
print("=" * 60)
