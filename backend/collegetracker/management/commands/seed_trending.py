import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from collegetracker.models import Post, Comment, Like

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with users, posts, comments, and likes for the trending section.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Starting database seeding...'))

        # 1. Create Users
        users_data = [
            {'username': 'campus_explorer', 'email': 'explorer@example.com', 'password': 'password123', 'bio': 'Visiting colleges across the country!'},
            {'username': 'future_doc', 'email': 'doc@example.com', 'password': 'password123', 'bio': 'Pre-med student looking for the best programs.'},
            {'username': 'tech_whiz', 'email': 'tech@example.com', 'password': 'password123', 'bio': 'CS major interested in AI and robotics.'},
            {'username': 'art_lover', 'email': 'art@example.com', 'password': 'password123', 'bio': 'Searching for vibrant art communities.'},
            {'username': 'college_guide', 'email': 'guide@example.com', 'password': 'password123', 'bio': 'Helping students navigate the admissions process.'},
        ]

        users = []
        for user_data in users_data:
            if not User.objects.filter(username=user_data['username']).exists():
                user = User.objects.create_user(**user_data)
                users.append(user)
                self.stdout.write(f"Created user: {user.username}")
            else:
                users.append(User.objects.get(username=user_data['username']))
                self.stdout.write(f"User {user_data['username']} already exists.")

        if not users:
            self.stdout.write(self.style.WARNING("No users available to seed content."))
            return

        # 2. Create Posts
        posts_data = [
            {
                'author': users[0],
                'title': 'Is early decision worth it?',
                'content': 'I am debating whether to apply Early Decision to my dream school. The acceptance rate is higher, but the financial aid package is binding. Has anyone gone through this? Was it worth the risk?'
            },
            {
                'author': users[1],
                'title': 'Best Pre-Med programs on the East Coast?',
                'content': 'Looking for recommendations for universities with strong pre-med advising and research opportunities. I am considering Johns Hopkins and Boston University, but open to other suggestions!'
            },
            {
                'author': users[2],
                'title': 'Computer Science: Theory vs. Practice',
                'content': 'Some schools focus heavily on theoretical CS (algorithms, math) while others are more practical (software engineering, project-based). Which approach do you think is better for landing a job at a big tech company?'
            },
            {
                'author': users[0],
                'title': 'Campus tour tips?',
                'content': 'Heading out on a college tour road trip next week! What are the most important things to look for or ask about when visiting a campus? I do not want to just see the library and gym.'
            },
            {
                'author': users[4],
                'title': 'Hidden Gem Colleges',
                'content': 'Everyone talks about the Ivies, but what are some underrated colleges that offer an amazing education and student experience without the massive price tag or 5% acceptance rate?'
            }
        ]

        created_posts = []
        for post_data in posts_data:
            post, created = Post.objects.get_or_create(
                author=post_data['author'],
                title=post_data['title'],
                defaults={'content': post_data['content']}
            )
            if created:
                self.stdout.write(f"Created post: {post.title}")
            created_posts.append(post)

        # 3. Create Comments
        comments_data = [
             "Totally worth it if it's your absolute top choice!",
             "I regretted it because my financial aid wasn't great.",
             "Focus on the fit, not just the stats.",
             "Check out Tufts and Northeastern as well.",
             "Practical experience is key for internships.",
             "Theory helps with the interviews though!",
             "Eat at the dining hall! Best way to gauge student life.",
             "Ask students what they do on weekends.",
             "Look into liberal arts colleges in the Midwest.",
             "State schools honors programs are great value."
        ]

        for post in created_posts:
            # Add 2-4 random comments per post
            num_comments = random.randint(2, 4)
            for _ in range(num_comments):
                commenter = random.choice(users)
                content = random.choice(comments_data)
                # Ensure we don't duplicate exact comment content for same user on same post easily (optional check)
                Comment.objects.create(
                    author=commenter,
                    post=post,
                    content=content
                )
            self.stdout.write(f"Added comments to post: {post.title}")

        # 4. Create Likes on Posts
        post_content_type = ContentType.objects.get_for_model(Post)
        for post in created_posts:
            # Random users like the post
            potential_likers = random.sample(users, k=random.randint(0, len(users)))
            for liker in potential_likers:
                Like.objects.get_or_create(
                    user=liker,
                    content_type=post_content_type,
                    object_id=post.id
                )
            self.stdout.write(f"Added likes to post: {post.title}")

        # 5. Create Likes on Comments
        comment_content_type = ContentType.objects.get_for_model(Comment)
        all_comments = Comment.objects.all()
        for comment in all_comments:
            if random.random() > 0.5: # 50% chance to have likes
                potential_likers = random.sample(users, k=random.randint(1, 3))
                for liker in potential_likers:
                    Like.objects.get_or_create(
                        user=liker,
                        content_type=comment_content_type,
                        object_id=comment.id
                    )
        
        self.stdout.write(self.style.SUCCESS('Database seeding completed successfully.'))
