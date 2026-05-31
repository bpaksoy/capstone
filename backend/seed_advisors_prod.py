import os
import django

# Set default settings to prod to ensure it runs against the production DB
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'collegetracker.settings_prod')
django.setup()

import datetime
from django.utils import timezone
from django.contrib.auth import get_user_model
from collegetracker.models import Service, AdvisorAvailability

User = get_user_model()

def seed_advisors():
    print("Starting production advisor seeding...")

    # 1. Create/Update Advisors
    advisors_data = [
        {
            'username': 'college_advisor',
            'first_name': 'Sarah',
            'last_name': 'Jenkins',
            'specialization': 'Ivy League Prep',
            'hourly_rate': 120.00,
            'advisor_bio': 'Expert college counselor with 10+ years experience getting students into Ivy League schools.',
            'role': 'advisor',
            'email': 'sarah.jenkins@example.com'
        },
        {
            'username': 'scholarship_expert',
            'first_name': 'Michael',
            'last_name': 'Chen',
            'specialization': 'Financial Aid',
            'hourly_rate': 95.00,
            'advisor_bio': 'Former financial aid officer helping families secure maximum grants and merit scholarships.',
            'role': 'advisor',
            'email': 'michael.chen@example.com'
        },
        {
            'username': 'stem_coach',
            'first_name': 'David',
            'last_name': 'Patel',
            'specialization': 'STEM',
            'hourly_rate': 150.00,
            'advisor_bio': 'MIT alumnus specializing in competitive STEM applications and research profile building.',
            'role': 'advisor',
            'email': 'david.patel@example.com',
            'image': 'user_images/david_patel.png'
        }
    ]

    for adv_data in advisors_data:
        username = adv_data.pop('username')
        image_path = adv_data.pop('image', None)
        
        adv, created = User.objects.get_or_create(
            username=username,
            defaults=adv_data
        )
        
        if not created:
            # Update attributes
            for k, v in adv_data.items():
                setattr(adv, k, v)
            adv.save()
            print(f"Updated advisor user: {username}")
        else:
            adv.set_password('password123')
            adv.save()
            print(f"Created advisor user: {username}")

        if image_path:
            adv.image = image_path
            adv.save()

        # 2. Re-create service packages
        Service.objects.filter(advisor=adv).delete()

        rate = adv.hourly_rate
        
        # General Consultation
        Service.objects.create(
            advisor=adv,
            title="General Consultation",
            description="An introductory advising session to discuss your academic goals, college choices, and strategy.",
            price=rate,
            duration=60
        )
        print(f"Created General Consultation for {username}")

        # Specialty packages
        if username == 'college_advisor':
            Service.objects.create(
                advisor=adv,
                title="Comprehensive Admissions Review",
                description="Full audit of transcript, GPA, extracurriculars, and strategy.",
                price=150.00,
                duration=60
            )
            Service.objects.create(
                advisor=adv,
                title="Ivy Essay Polishing Session",
                description="Line-by-line review of your Common App essay.",
                price=85.00,
                duration=45
            )
        elif username == 'scholarship_expert':
            Service.objects.create(
                advisor=adv,
                title="FAFSA & CSS Profile Walkthrough",
                description="Complete walk-through of application forms and tax document strategies.",
                price=120.00,
                duration=60
            )
            Service.objects.create(
                advisor=adv,
                title="Scholarship Essay Strategy",
                description="Structure and edit your merit scholarship personal statements.",
                price=65.00,
                duration=40
            )
        elif username == 'stem_coach':
            Service.objects.create(
                advisor=adv,
                title="STEM Project Strategy Consultation",
                description="Ideation and layout for science fairs, coding portfolios, or research projects.",
                price=200.00,
                duration=60
            )
            Service.objects.create(
                advisor=adv,
                title="Coding Portfolio Review",
                description="Technical review of GitHub and project layouts.",
                price=110.00,
                duration=45
            )

        print(f"Service packages setup completed for {username}")

        # 3. Add availability slots for next 7 days
        AdvisorAvailability.objects.filter(advisor=adv).delete()
        
        today = timezone.localdate()
        slots_created = 0
        times = [
            (datetime.time(10, 0), datetime.time(11, 0)),
            (datetime.time(14, 0), datetime.time(15, 0)),
            (datetime.time(16, 0), datetime.time(17, 0))
        ]
        for i in range(1, 8):
            slot_date = today + datetime.timedelta(days=i)
            for start, end in times:
                AdvisorAvailability.objects.create(
                    advisor=adv,
                    date=slot_date,
                    start_time=start,
                    end_time=end,
                    is_booked=False
                )
                slots_created += 1
        print(f"Created {slots_created} availability slots for {username}")

    print("Production advisor seeding completed successfully!")

if __name__ == '__main__':
    seed_advisors()
