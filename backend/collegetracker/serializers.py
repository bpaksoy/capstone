from rest_framework import serializers
from .models import College
from django.contrib.auth import authenticate
from .models import Comment, Post, Bookmark, Reply, User


class CollegeSerializer(serializers.ModelSerializer):
    class Meta:
        model = College
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name',
                  'city', 'state', 'country', 'major', 'education', 'bio', 'image')

    def create(self, validated_data):
        print("validated data", validated_data)
        user = User.objects.create(
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            username=validated_data['username'],
            email=validated_data['email']
        )

        user.set_password(validated_data['password'])
        user.save()
        return user
    
    def update(self, instance, validated_data):
        if 'image' in validated_data:
            instance.image = validated_data['image']
        # Update other fields...
        instance.save()
        return instance


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        user = authenticate(username=username, password=password)
        if user is None:
            raise serializers.ValidationError("Invalid credentials")
        return {'user': user}


class UploadFileSerializer(serializers.Serializer):
    file = serializers.FileField()


class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Post
        fields = '__all__'

    def create(self, validated_data):
        # Retrieve the current user from the context
        user = self.context['request'].user
        # Create the post and assign the user as author
        post = Post.objects.create(author=user, **validated_data)
        return post


class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    post = PostSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'post', 'author',
                  'content', 'created_at', 'updated_at']


class CommentCountsSerializer(serializers.Serializer):
    comment_count = serializers.IntegerField()
    reply_count = serializers.IntegerField()


class ReplySerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    comment = CommentSerializer(read_only=True)

    class Meta:
        model = Reply
        fields = ['id', 'comment', 'author',
                  'content', 'created_at', 'updated_at']


class BookmarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bookmark
        fields = '__all__'  # Include all fields (user, post, created_at)
