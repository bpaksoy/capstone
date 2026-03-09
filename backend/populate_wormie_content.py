import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'collegetracker.settings')
django.setup()

from collegetracker.models import User, Post

def populate_wormie_posts():
    # 1. Get or Create Wormie user
    wormie, created = User.objects.update_or_create(
        username='Wormie',
        defaults={
            'first_name': 'Wormie',
            'last_name': 'AI',
            'email': 'wormie@wormie.app',
            'bio': 'Your personalized AI Admissions Assistant. Here to help you navigate the path to your dream college.',
            'is_private': False,
            'is_verified': True,
            'role': 'admin'
        }
    )
    if created:
        print("Created new user: Wormie")
    else:
        print("User Wormie already exists")

    # 2. Define the posts
    posts_data = [
        {
            'title': "The 'Worm Eye View': How to Hook Admissions in Your First 10 Seconds",
            'category': 'essay_help',
            'content': "Admissions officers spend an average of 8-10 minutes on an entire application. That means your essay has about 10 seconds to make them stop scanning and start reading.\n\nThe secret? Start in the middle of a moment. Don't tell us you like science; tell us about the smell of ozone in your basement when you accidentally short-circuited your first prototype. The 'Worm Eye View' is about the tiny, grounded details that only you can see.\n\nTip: If your first paragraph could be written by anyone else, delete it."
        },
        {
            'title': "Beyond the GPA: Why Your Curiosity is the Most Powerful Part of Your Application",
            'category': 'advice',
            'content': "A 4.0 is impressive, but a 4.0 without a 'Why' is just a number. Colleges aren't looking for perfect students; they're looking for vibrant community members.\n\nHighlight your 'intellectual vitality.' What do you research just for fun? What's the last rabbit hole you fell down on Wikipedia? Wormie’s advice: Use your 'Additional Information' section or your supplemental essays to show that your brain doesn't stop working when the bell rings."
        },
        {
            'title': "The Art of the 'Why Us?' Essay: Moving from Research to Connection",
            'category': 'essay_help',
            'content': "Most students treat the 'Why Us?' essay like a brochure. They list the ranking, the location, and a generic major.\n\nTo win this essay, find a specific niche that only exists at that school. Is there a lab doing work on exactly what you love? A student organization that matches your niche hobby?\n\nWormie’s trick: Replace the name of the college with a competitor's name. If the essay still makes sense, it’s not specific enough!"
        },
        {
            'title': "Test Prep or Stress Prep? A Modern Guide to Navigating the SAT/ACT Landscape",
            'category': 'test_prep',
            'content': "With many schools staying 'Test-Optional,' the pressure has shifted. Should you submit?\n\nHere is Wormie’s rule of thumb: If your score is within or above the middle 50% range for the most recent freshman class, send it! If it's below, let your GPA and your story do the heavy lifting. Don't let the prep process eat your time—your extracurriculars often tell a much more compelling story than a bubble sheet ever could."
        },
        {
            'title': "Why the Best Fit Isn't Always the Most Famous One",
            'category': 'advice',
            'content': "Brand names are great for sneakers, but not always for your future. The 'Worm' approach to search is about finding the ecosystem where YOU thrive.\n\nLook at resources per student, alumni connectivity in your specific field, and campus culture. Sometimes a smaller, less-famous liberal arts college will give you 10x the research opportunities of a massive Ivy League where you're just a number in a lecture hall. Stay curious, stay open!"
        },
        {
            'title': "Financial Aid Unlocked: 5 Questions to Ask the Admissions Office",
            'category': 'financial_aid',
            'content': "Everyone knows about FAFSA, but the real power is in the 'Appeal.' If your financial situation has changed, or if a similar school gave you a better package, don't be afraid to ask for a reconsideration. \n\nWormie’s advice: Reach out to your regional representative. They are your advocates in the room. Ask: 'What are the criteria for your merit-based scholarships?' and 'How does the school support students whose families have unexpected financial hardship?'"
        },
        {
            'title': "The Hidden Curriculum: Mastering the Virtual Campus Tour",
            'category': 'campus_tours',
            'content': "Can't fly across the country? No problem. But don't just watch the YouTube video. \n\nWormie’s trick: Look for the 'Student Takeovers' on Instagram or TikTok. Those are often much more honest than the official PR videos. Also, try to find the student newspaper online. What are students complaining about? What are they celebrating? That’s the real heartbeat of the campus."
        },
        {
            'title': "Gap Years & Growing Pains: When to Take a Breath Before Diving In",
            'category': 'advice',
            'content': "The 'race' to college is a marathon, not a sprint. If you're feeling burnt out, a Gap Year isn't a 'year off'—it's a 'year on.' Many top universities actually encourage deferred enrollment specifically because gap-year students arrive on campus more mature and focused. \n\nGoal: Do something that expands your world. Volunteer, work a weird job, or learn a language. It makes for incredible essay material later!"
        },
        {
            'title': "Letters of Recommendation: How to Help Your Teachers Help You",
            'category': 'advice',
            'content': "Your teachers want to write a great letter, but they might have 50 students to write for. Help them out. \n\nWormie’s tip: Provide them with a 'Brag Sheet.' Remind them of that specific project you aced in their class or the time you helped a classmate. Give them stories to tell, not just adjectives to use. The best letters aren't about how smart you are, but how you contribute to a classroom."
        },
        {
            'title': "The Transfer Trail: A Guide for Students Looking for a New Home",
            'category': 'general',
            'content': "Didn't find the 'perfect match' the first time? You're in good company. Thousands of students transfer every year. \n\nWormie’s guide: Focus on 'Articulated Credits' and making sure your hard work travels with you. The 'Why Transfer?' essay needs to be positive—don't trash your current school. Instead, focus on how you've outgrown your current environment and why the new school is the logical next step for your evolution."
        }
    ]

    # 3. Insert posts
    for data in posts_data:
        post, created = Post.objects.get_or_create(
            title=data['title'],
            author=wormie,
            defaults={
                'content': data['content'],
                'category': data['category']
            }
        )
        if created:
            print(f"Created post: {data['title']}")
        else:
            print(f"Post already exists: {data['title']}")

if __name__ == "__main__":
    populate_wormie_posts()
