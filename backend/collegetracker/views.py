from .models import College, Comment, Post, Bookmark, Reply, Like
from django.http import JsonResponse, Http404
from django.db import IntegrityError
from .serializers import CollegeSerializer, UserSerializer, UploadFileSerializer, LoginSerializer, CommentSerializer, PostSerializer, BookmarkSerializer, ReplySerializer, LikeSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status, generics, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken
import pandas as pd
from django.shortcuts import render, redirect,  get_object_or_404
from django.contrib import messages
from .forms import UploadFileForm
from datetime import datetime
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import AccessToken
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Count, Sum
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.contenttypes.models import ContentType


api_view(['GET', 'POST'])


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def post(self, request):
        user = self.request.user

        refresh = RefreshToken.for_user(user)
        tokens = {
            'refresh': str(refresh),
            'access': str(refresh.access_token)
        }

        return self.request.user


class UserUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        user = self.request.user
        # partial=True allows updating only some fields
        serializer = UserSerializer(user, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, format=None):
        user = self.request.user
        # partial=True allows updating only some fields
        serializer = UserSerializer(user, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, format=None):  # Use PATCH for partial updates
        user = self.request.user
        serializer = UserSerializer(
            user, data=request.data, partial=True)  # partial=True is key

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


api_view(['GET', 'POST'])


@permission_classes([IsAuthenticated])
def colleges(request):
    data = College.objects.all()[:10]
    serializer = CollegeSerializer(data, many=True)
    return JsonResponse({"colleges": serializer.data})


class CollegeListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        page = request.query_params.get('page', 1)
        page_size = request.query_params.get('page_size', 10)

        try:
            page = int(page)
            page_size = int(page_size)
        except ValueError:
            return Response({'error': 'Invalid page or page_size'}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate pagination limits
        start = (page - 1) * page_size
        end = page * page_size

        # Get data from the model
        items = College.objects.all()[start:end]

        # Check if there are more items to load
        has_more = College.objects.all().count() > end

        # Serialize data
        serializer = CollegeSerializer(items, many=True)

        # Return response with additional information
        return Response({
            'results': serializer.data,
            'has_more': has_more
        }, status=status.HTTP_200_OK)


api_view(['GET', 'POST'])


@permission_classes([IsAuthenticated])
def college(request, id):
    try:
        data = College.objects.get(pk=id)
    except College.DoesNotExist:
        raise Http404("College does not exist")
    serializer = CollegeSerializer(data)
    return JsonResponse({"college": serializer.data})


api_view(['GET', 'POST'])


@permission_classes([IsAuthenticated])
def search(request, name):
    try:
        data = College.objects.filter(name__contains=name)
    except College.DoesNotExist:
        raise Http404("College does not exist")
    serializer = CollegeSerializer(data, many=True)
    return JsonResponse({"college": serializer.data})


@api_view(['POST'])
def register(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        tokens = {
            'refresh': str(refresh),
            'access': str(refresh.access_token)
        }
        return Response(tokens, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UploadApiView(APIView):
    serializer_class = UploadFileSerializer
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        print(request)
        try:
            data = request.FILES['file']
            # if not serializer.is_valid():
            #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            df = pd.read_csv(data, sep=',', on_bad_lines="skip",
                             index_col=False, na_values=None, na_filter=True, dtype='unicode').convert_dtypes()
            print("df is here", df)

            colleges = list()
            for index, row in df.iterrows():
                college, created = College.objects.get_or_create(
                    name=row['INSTNM'],
                    city=row['CITY'],
                    state=row['STABBR'],
                    website=row['INSTURL'],
                    admission_rate=row['ADM_RATE'],
                    sat_score=row['SAT_AVG'],
                    cost_of_attendance=row['COSTT4_A'],
                    tuition_in_state=row['TUITIONFEE_IN'],
                    tuition_out_state=row['TUITIONFEE_IN'],
                )
                if created:
                    colleges.append(college)
                    messages.success(
                        request, f'Successfully imported {college.name}')
                else:
                    messages.warning(request, f'{college.name} already exists')
            College.objects.bulk_create(colleges)
            return Response({'message': 'File uploaded successfully'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class RegisterView(APIView):
    def post(self, request):
        # print("request is here", request.body)
        # print("request data", request.data)
        if User.objects.filter(email=request.data['email']).exists():
            return Response({'error': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            tokens = {
                'refresh': str(refresh),
                'access': str(refresh.access_token)
            }
            return Response(tokens, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.serializer_class(
            data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        refresh = RefreshToken.for_user(user)
        tokens = {
            'refresh': str(refresh),
            'access': str(refresh.access_token)
        }

        return Response(tokens, status=status.HTTP_201_CREATED)


class LikeListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        content_type_param = request.GET.get('content_type')
        object_id_param = request.GET.get('object_id')
        user_id_param = request.user.id

        if not all([content_type_param, object_id_param, user_id_param]):
            return Response({'error': 'Missing content_type, object_id, or user parameters'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            object_id = int(object_id_param)
        except ValueError:
            return Response({'error': 'Invalid object_id (must be an integer)'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            content_type = ContentType.objects.get(model=content_type_param)
            like = Like.objects.filter(
                content_type=content_type,
                object_id=object_id,
                user_id=user_id_param,
            ).first()

            if like:
                return Response({'count': Like.objects.filter(content_type=content_type, object_id=object_id).count(), 'is_liked': True, 'like_id': like.id})
            else:
                return Response({'count': Like.objects.filter(content_type=content_type, object_id=object_id).count(), 'is_liked': False, 'like_id': None})

        except ContentType.DoesNotExist:
            return Response({'error': f'Invalid content type: {content_type_param}'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'An unexpected error occurred: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LikeCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        try:
            content_type_str = request.data.get('content_type')
            object_id_str = request.data.get('object_id')

            if not content_type_str or not object_id_str:
                return Response({'error': 'content_type and object_id are required'}, status=status.HTTP_400_BAD_REQUEST)

            content_type = ContentType.objects.get(model=content_type_str)
            object_id = int(object_id_str)

            Like.objects.create(user=request.user,
                                content_type=content_type, object_id=object_id)
            return Response({'message': 'Like created successfully'}, status=status.HTTP_201_CREATED)

        except ContentType.DoesNotExist:
            return Response({'error': f"Invalid content type: {content_type_str}"}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'error': f"Invalid object_id: {object_id_str}"}, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return Response({'error': 'User already liked this item'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'Server Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LikeDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, like_id, format=None):
        like = get_object_or_404(Like, pk=like_id)
        if like.user == request.user:
            like.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def post_list(request):
    if request.method == 'GET':
        posts = Post.objects.all()
        serializer = PostSerializer(posts, many=True)
        return Response(serializer)
    elif request.method == 'POST':
        print("request.data!!!", request.data)
        serializer = PostSerializer(data=request.data)
        if serializer.is_valid():
            # Assign the current user as author
            serializer.save(author=request.user)
            print("serializer.data", serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def post_detail(request, pk):
    try:
        post = Post.objects.get(pk=pk)
    except Post.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = PostSerializer(post)
        return Response(serializer.data)
    elif request.method == 'PUT':
        if post.author != request.user:
            return Response({'error': 'You cannot edit this post'}, status=status.HTTP_403_FORBIDDEN)
        serializer = PostSerializer(post, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        if post.author != request.user:
            return Response({'error': 'You cannot delete this post'}, status=status.HTTP_403_FORBIDDEN)
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PostListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        posts = Post.objects.all()
        serializer = PostSerializer(posts, many=True)
        # print("posts:", serializer.data)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = PostSerializer(
            data=request.data, context={'request': request})
        print("Post: request.data!!!!", request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EditPostView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk, format=None):
        post = get_object_or_404(Post, pk=pk)
        if post.author != request.user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = PostSerializer(post, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeletePostView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, format=None):
        post = get_object_or_404(Post, pk=pk)
        if post.author != request.user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PostDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return None

    def get(self, request, pk):
        post = self.get_object(pk)
        if post is None:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = PostSerializer(post)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        post = self.get_object(pk)
        if post is None:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
        if post.author != request.user:
            return Response({'error': 'You cannot edit this post'}, status=status.HTTP_403_FORBIDDEN)
        serializer = PostSerializer(post, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        post = self.get_object(pk)
        if post is None:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
        if post.author != request.user:
            return Response({'error': 'You cannot delete this post'}, status=status.HTTP_403_FORBIDDEN)
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserPostsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id, format=None):
        posts = Post.objects.filter(author_id=user_id)
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)


class CommentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, post_pk):
        """
        Get comments for a specific post.
        """
        try:
            post = Post.objects.get(pk=post_pk)
        except Post.DoesNotExist:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
        comments = post.comments.all()
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, post_pk):
        try:
            post = Post.objects.get(pk=post_pk)
        except Post.DoesNotExist:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(author=request.user, post=post)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CommentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, comment_pk):
        try:
            return Comment.objects.get(pk=comment_pk)
        except Comment.DoesNotExist:
            return None

    def get(self, request, comment_pk):
        comment = self.get_object(comment_pk)
        if comment is None:
            return Response({'error': 'Comment not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, comment_pk):
        comment = self.get_object(comment_pk)
        if comment is None:
            return Response({'error': 'Comment not found'}, status=status.HTTP_404_NOT_FOUND)
        if comment.author != request.user:
            return Response({'error': 'You cannot edit this comment'}, status=status.HTTP_403_FORBIDDEN)
        serializer = CommentSerializer(comment, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, comment_pk):
        comment = self.get_object(comment_pk)
        if comment is None:
            return Response({'error': 'Comment not found'}, status=status.HTTP_404_NOT_FOUND)
        if comment.author != request.user:
            return Response({'error': 'You cannot delete this comment'}, status=status.HTTP_403_FORBIDDEN)
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserCommentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id, format=None):
        comments = Comment.objects.filter(author_id=user_id)
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)


def get_comment_and_reply_counts():
    result = Comment.objects.aggregate(
        comment_count=Count('id'),
        reply_count=Count('replies')
    )
    print("result", result)
    return result


class CommentCountView(APIView):
    def get(self, request):
        counts = get_comment_and_reply_counts()
        print("counts", counts)
        return Response(counts)


class PostCommentCountsView(APIView):
    def get(self, request, pk):
        comment_count = Comment.objects.filter(post_id=pk).count()
        reply_count = Reply.objects.filter(comment__post_id=pk).count()
        return Response({'comment_count': comment_count, 'reply_count': reply_count})


class ReplyListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ReplySerializer

    def get_queryset(self):
        comment_pk = self.kwargs.get('pk')
        # print("comment_pk", comment_pk)
        try:
            comment = Comment.objects.get(pk=comment_pk)
            # print("comment", comment)
            return comment.replies.all()
        except Comment.DoesNotExist:
            return None

    def get(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        if queryset:
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response({'message': 'No replies found for this comment.'}, status=status.HTTP_204_NO_CONTENT)


class ReplyCreateView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Reply.objects.all()
    serializer_class = ReplySerializer

    def perform_create(self, serializer):
        comment_pk = self.kwargs['pk']
        try:
            comment = Comment.objects.get(pk=comment_pk)
        except Comment.DoesNotExist:
            raise serializers.ValidationError({'error': 'Comment not found'})
        serializer.save(author=self.request.user, comment=comment)
        serializer = CommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BookmarkToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, college_pk):
        try:
            college = College.objects.get(pk=college_pk)
        except College.DoesNotExist:
            return Response({'error': 'College not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            bookmark = Bookmark.objects.get(user=request.user, college=college)
            serializer = BookmarkSerializer(bookmark)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Bookmark.DoesNotExist:
            return Response({'bookmarked': False}, status=status.HTTP_200_OK)

    def post(self, request, college_pk):
        try:
            college = College.objects.get(pk=college_pk)
        except College.DoesNotExist:
            return Response({'error': 'College not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            bookmark = Bookmark.objects.get(user=request.user, college=college)
            bookmark.delete()  # Remove bookmark if it exists
            return Response({'message': 'College unbookmarked'}, status=status.HTTP_200_OK)
        except Bookmark.DoesNotExist:
            # Create a dictionary of data for the serializer
            bookmark_data = {
                'user': request.user.id,  # Use user ID
                'college': college.id,  # Use college ID
            }

            serializer = BookmarkSerializer(data=bookmark_data)
            if serializer.is_valid():
                serializer.save()
                # Correct Response
                return Response({'message': 'College bookmarked'}, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BookmarkedCollegesView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CollegeSerializer

    def get_queryset(self):
        user = self.request.user
        bookmarks = Bookmark.objects.filter(
            user=user).select_related('college')
        return bookmarks

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        colleges = [bookmark.college for bookmark in queryset]  # Process here
        serializer = self.get_serializer(colleges, many=True)
        return Response(serializer.data)
