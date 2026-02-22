import re
import json
import jwt
import difflib
from goose3 import Goose
from .models import User, College, Comment, Post, Bookmark, Reply, Like, Friendship, SmartCollege, CollegeProgram, Article, Notification, ChatMessage, DirectMessage
from django.http import JsonResponse, Http404
from django.db import IntegrityError
from .serializers import CollegeSerializer, UserSerializer, UploadFileSerializer, LoginSerializer, CommentSerializer, PostSerializer, BookmarkSerializer, ReplySerializer, LikeSerializer, FriendshipSerializer, SmartCollegeSerializer, CollegeProgramSerializer, ArticleSerializer, NotificationSerializer, ChatMessageSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status, generics, serializers
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken
import pandas as pd
from django.shortcuts import render, redirect,  get_object_or_404
from django.contrib import messages
from .forms import UploadFileForm
from datetime import datetime
# from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import AccessToken
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db.models import Count, Sum, Avg
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
import chardet
from io import StringIO
import feedparser
import requests
import os
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from django.conf import settings
from django.core.cache import cache
from datetime import datetime, timedelta
load_dotenv()

api_view(['GET', 'POST'])


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
        return Response(tokens, status=status.HTTP_200_OK)

# Simple module-level cache for Clerk to avoid repeated network calls
_JWKS_CACHE = None
_USER_INFO_CACHE = {}

class ClerkLoginView(APIView):
    permission_classes = []  # Allow anyone to call this endpoint

    def post(self, request):
        global _JWKS_CACHE, _USER_INFO_CACHE
        token = request.data.get('token')
        if not token:
            return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. Decode the token header to find the Key ID (kid)
            header = jwt.get_unverified_header(token)
            
            # 2. Fetch or Use Cached Clerk's JWKS
            if _JWKS_CACHE is None:
                jwks_url = "https://close-calf-1.clerk.accounts.dev/.well-known/jwks.json"
                _JWKS_CACHE = requests.get(jwks_url).json()
            
            jwks = _JWKS_CACHE
            
            # 3. Find the matching key
            public_key = None
            for key in jwks['keys']:
                if key['kid'] == header['kid']:
                    public_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key))
                    break
            
            if not public_key:
                return Response({'error': 'Invalid token key'}, status=status.HTTP_401_UNAUTHORIZED)

            # 4. Verify the token signature
            payload = jwt.decode(token, public_key, algorithms=['RS256'], options={"verify_aud": False})
            user_id = payload['sub']
            
            # 5. Extract User Info (Cache Clerk API responses)
            if user_id not in _USER_INFO_CACHE:
                clerk_secret_key = os.getenv('CLERK_SECRET_KEY')
                user_info_resp = requests.get(
                    f"https://api.clerk.com/v1/users/{user_id}",
                    headers={"Authorization": f"Bearer {clerk_secret_key}"}
                )
                
                if not user_info_resp.ok:
                    return Response({'error': 'Failed to fetch user info from Clerk'}, status=status.HTTP_401_UNAUTHORIZED)
                
                _USER_INFO_CACHE[user_id] = user_info_resp.json()
            
            user_info = _USER_INFO_CACHE[user_id]
            email = user_info['email_addresses'][0]['email_address']
            first_name = user_info.get('first_name', '')
            last_name = user_info.get('last_name', '')
            username = user_info.get('username') or user_info.get('unsafe_metadata', {}).get('username') or email.split('@')[0]

            # 6. Content Sync: Get or Create Django User
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': username,
                    'first_name': first_name,
                    'last_name': last_name,
                }
            )
            
            if created:
                user.set_unusable_password()
                user.save()

            # 7. Issue SimpleJWT Tokens
            refresh = RefreshToken.for_user(user)
            tokens = {
                'refresh': str(refresh),
                'access': str(refresh.access_token)
            }
            
            return Response(tokens, status=status.HTTP_200_OK)

        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token has expired'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.DecodeError:
            return Response({'error': 'Token decode error'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            print(f"Clerk Auth Error: {e}")
            return Response({'error': 'Authentication failed'}, status=status.HTTP_401_UNAUTHORIZED)


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


class UserDetailView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, user_id, format=None):
        try:
            target_user = get_object_or_404(User, pk=user_id)
            current_user = request.user
            
            is_friend = False
            if current_user.is_authenticated:
                is_friend = Friendship.objects.filter(
                    (Q(user1=target_user, user2=current_user) | Q(user1=current_user, user2=target_user)),
                    status='accepted'
                ).exists()

            serializer = UserSerializer(target_user)
            data = serializer.data
            data['is_friend'] = is_friend
            return Response(data)
        except Http404:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

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


class NotificationListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        try:
            notification_id = request.data.get('notification_id')
            if notification_id:
                notification = Notification.objects.get(
                    pk=notification_id, recipient=request.user)
                notification.is_read = True
                notification.save()
            else:
                Notification.objects.filter(
                    recipient=request.user, is_read=False).update(is_read=True)
            return Response({'message': 'Notifications updated'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NotificationCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        try:
            unread_count = Notification.objects.filter(
                recipient=request.user, is_read=False).count()
            return Response({'unread_count': unread_count}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


api_view(['GET', 'POST'])


@permission_classes([IsAuthenticatedOrReadOnly])
def colleges(request):
    data = College.objects.all()
    serializer = CollegeSerializer(data, many=True)
    return JsonResponse({"colleges": serializer.data})


class FeaturedCollegesView(generics.ListAPIView):
    serializer_class = CollegeSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return College.objects.filter(
            state__in=['MA', 'NY', 'CA'],
            admission_rate__isnull=False,
            admission_rate__gt=0.0
        ).order_by('admission_rate')[:9]


class CollegeListView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, format=None):
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 9))

        # Order the queryset!  Choose an appropriate field for ordering.
        paginator = Paginator(College.objects.all().order_by('id'), page_size)

        try:
            colleges = paginator.page(page)
        except PageNotAnInteger:
            colleges = paginator.page(1)
        except EmptyPage:
            colleges = paginator.page(paginator.num_pages)

        serializer = CollegeSerializer(colleges, many=True)
        return Response({
            'colleges': serializer.data,
            'has_more': colleges.has_next()
        })


class CollegeDetailView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, college_id, format=None):
        try:
            college = College.objects.get(pk=college_id)
        except College.DoesNotExist:
            raise Http404("College not found")

        serializer = CollegeSerializer(college)
        return Response(serializer.data)


class SmartCollegeDetailView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, college_id, format=None):
        try:
            college = SmartCollege.objects.get(pk=college_id)
        except SmartCollege.DoesNotExist:
            raise Http404("College not found")

        serializer = SmartCollegeSerializer(college)
        return Response(serializer.data)


class FilteredCollegeListView(generics.ListAPIView):
    serializer_class = CollegeSerializer

    def get_queryset(self):
        states_param = self.request.query_params.get('states', None)
        if not states_param:
            raise ValidationError("The 'states' query parameter is required.")
        states_list = [state.strip() for state in states_param.split(',')]
        queryset = College.objects.filter(state__in=states_list)
        return queryset


class FilteredSmartCollegeListView(generics.ListAPIView):
    serializer_class = SmartCollegeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        states_param = self.request.query_params.get('states', None)
        if not states_param:
            raise ValidationError("The 'states' query parameter is required.")
        states_list = [state.strip() for state in states_param.split(',')]
        queryset = SmartCollege.objects.filter(state__in=states_list)
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        # print(serializer.data)
        return Response({'colleges': serializer.data})


class CollegeRecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # Get colleges from the Bookmark model
        bookmarked_college_ids = Bookmark.objects.filter(user=user).values_list('college_id', flat=True)
        bookmarks = College.objects.filter(id__in=bookmarked_college_ids)
        
        if not bookmarks.exists():
            return Response({'colleges': [], 'message': 'No bookmarks yet'}, status=status.HTTP_200_OK)

        # 1. Build Profile
        states = list(bookmarks.values_list('state', flat=True).distinct())
        avg_sat = bookmarks.aggregate(Avg('sat_score'))['sat_score__avg'] or 1100
        avg_adm = bookmarks.aggregate(Avg('admission_rate'))['admission_rate__avg'] or 0.6
        avg_cost = bookmarks.aggregate(Avg('cost_of_attendance'))['cost_of_attendance__avg'] or 30000

        # 2. Query Candidates (Limit to relevant states)
        # Exclude already bookmarked
        queryset = College.objects.filter(state__in=states).exclude(id__in=bookmarked_college_ids)
        
        # 3. Simple scoring in Python (for speed/simplicity since it's filtered by states)
        # For even more speed, we could do this in SQL but Python is fine for <1000 records
        candidates = list(queryset[:500]) # Safety limit
        
        scored_candidates = []
        for c in candidates:
            # Normalized differences
            sat_score = c.sat_score or 1100
            adm_rate = c.admission_rate or 0.6
            cost = c.cost_of_attendance or 30000
            
            sat_diff = abs(sat_score - avg_sat) / 1600
            adm_diff = abs(adm_rate - avg_adm)
            cost_diff = abs(cost - avg_cost) / 60000
            
            score = (sat_diff * 0.4) + (adm_diff * 0.4) + (cost_diff * 0.2)
            scored_candidates.append((c, score))

        scored_candidates.sort(key=lambda x: x[1]) # Lower is better
        
        top_10 = [c[0] for c in scored_candidates[:10]]
        serializer = CollegeSerializer(top_10, many=True)
        
        return Response({'colleges': serializer.data}, status=status.HTTP_200_OK)


class CollegeProgramListView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, college_id):
        try:
            college = College.objects.get(pk=college_id)
        except College.DoesNotExist:
            return Response({'error': 'College not found'}, status=status.HTTP_404_NOT_FOUND)
        search_query = request.query_params.get('search', '')
        programs = college.programs.filter(cipdesc__icontains=search_query)
        serializer = CollegeProgramSerializer(programs, many=True)
        return Response({'programs': serializer.data}, status=status.HTTP_200_OK)


# class ProgramSearchListView(generics.ListAPIView):
#     serializer_class = CollegeSerializer
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         search_query = self.request.query_params.get('search', '')
#         if not search_query:
#             raise ValidationError("The 'search' query parameter is required.")
#         queryset = College.objects.filter(
#             programs__cipdesc__icontains=search_query
#         ).distinct()
#         return queryset


class ProgramSearchListView(generics.ListAPIView):
    serializer_class = CollegeSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        search_query = self.request.query_params.get('search', '')
        if not search_query:
            raise ValidationError("The 'search' query parameter is required.")

        page = int(self.request.query_params.get('page', 1))
        page_size = int(self.request.query_params.get('page_size', 9))

        queryset = College.objects.filter(
            programs__cipdesc__icontains=search_query
        ).distinct()

        paginator = Paginator(queryset, page_size)
        try:
            colleges = paginator.page(page)
        except PageNotAnInteger:
            colleges = paginator.page(1)
        except EmptyPage:
            colleges = paginator.page(paginator.num_pages)

        return colleges

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'colleges': serializer.data,
            'has_more': queryset.has_next()
        })


class DetailedSearchListView(generics.ListAPIView):
    serializer_class = CollegeSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = College.objects.all()
        state_param = self.request.query_params.get('state', None)
        city_param = self.request.query_params.get('city', None)
        program_param = self.request.query_params.get('program', None)
        min_sat_param = self.request.query_params.get('min_sat', None)
        max_sat_param = self.request.query_params.get('max_sat', None)
        name_param = self.request.query_params.get('name', None)
        control_param = self.request.query_params.get('control', None)
        locale_category = self.request.query_params.get('locale_category', None)
        hbcu_param = self.request.query_params.get('hbcu', None)
        hsi_param = self.request.query_params.get('hsi', None)
        min_cost_param = self.request.query_params.get('min_cost', None)
        max_cost_param = self.request.query_params.get('max_cost', None)
        min_admission_param = self.request.query_params.get('min_admission', None)
        max_admission_param = self.request.query_params.get('max_admission', None)
        page = int(self.request.query_params.get('page', 1))
        page_size = int(self.request.query_params.get('page_size', 9))

        if state_param:
            queryset = queryset.filter(state__iexact=state_param)

        if city_param:
            queryset = queryset.filter(city__iexact=city_param)
        if name_param:
            queryset = queryset.filter(name__icontains=name_param)

        if control_param:
            queryset = queryset.filter(control=control_param)

        if locale_category:
            if locale_category == 'city':
                queryset = queryset.filter(locale__gte=11, locale__lte=13)
            elif locale_category == 'suburb':
                queryset = queryset.filter(locale__gte=21, locale__lte=23)
            elif locale_category == 'town':
                queryset = queryset.filter(locale__gte=31, locale__lte=33)
            elif locale_category == 'rural':
                queryset = queryset.filter(locale__gte=41, locale__lte=43)

        if hbcu_param == 'true':
            queryset = queryset.filter(hbcu=True)
        if hsi_param == 'true':
            queryset = queryset.filter(hsi=True)

        if min_cost_param:
            try:
                min_cost = int(min_cost_param)
                queryset = queryset.filter(cost_of_attendance__gte=min_cost)
            except ValueError:
                pass
        
        if max_cost_param:
            try:
                max_cost = int(max_cost_param)
                queryset = queryset.filter(cost_of_attendance__lte=max_cost)
            except ValueError:
                pass

        if min_admission_param:
            try:
                min_adm = float(min_admission_param)
                queryset = queryset.filter(admission_rate__gte=min_adm)
            except ValueError:
                pass

        if max_admission_param:
            try:
                max_adm = float(max_admission_param)
                queryset = queryset.filter(admission_rate__lte=max_adm)
            except ValueError:
                pass

        if program_param:
            queryset = queryset.filter(
                programs__cipdesc__icontains=program_param).distinct()
        if min_sat_param:
            try:
                min_sat = int(min_sat_param)
                queryset = queryset.filter(sat_score__gte=min_sat)
            except ValueError:
                pass
        if max_sat_param:
            try:
                max_sat = int(max_sat_param)
                queryset = queryset.filter(sat_score__lte=max_sat)
            except ValueError:
                pass

        # Add Ordering
        sort_param = self.request.query_params.get('sort', 'name')
        if sort_param == 'admission_rate':
            queryset = queryset.order_by('admission_rate')
        elif sort_param == 'cost':
            queryset = queryset.order_by('cost_of_attendance')
        elif sort_param == 'grad_rate':
            queryset = queryset.order_by('-grad_rate')
        else:
            queryset = queryset.order_by('name')

        paginator = Paginator(queryset, page_size)
        try:
            colleges = paginator.page(page)
        except PageNotAnInteger:
            colleges = paginator.page(1)
        except EmptyPage:
            colleges = paginator.page(paginator.num_pages)
        return colleges

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        suggestion = None
        
        name_param = self.request.query_params.get('name', None)
        if not data and name_param:
            # Try intelligent fuzzy matching
            name_lower = name_param.lower()
            original_names = list(College.objects.values_list('name', flat=True))
            
            def get_score(n):
                n_lower = n.lower()
                ratio = difflib.SequenceMatcher(None, name_lower, n_lower).ratio()
                # Bonus if any word starts with the first 3 letters of query
                if any(word.startswith(name_lower[:3]) for word in n_lower.split()):
                    ratio += 0.4
                return ratio

            scored_matches = sorted([(get_score(n), n) for n in original_names], key=lambda x: x[0], reverse=True)
            
            if scored_matches and scored_matches[0][0] > 0.4:
                suggestion = scored_matches[0][1]
                suggested_colleges = College.objects.filter(name=suggestion)
                data = self.get_serializer(suggested_colleges, many=True).data

        return Response({
            'colleges': data,
            'has_more': queryset.has_next() if hasattr(queryset, 'has_next') else False,
            'suggestion': suggestion
        })


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


@permission_classes([IsAuthenticatedOrReadOnly])
def search(request, name):
    data = College.objects.filter(name__icontains=name)
    suggestion = None
    
    if not data.exists():
        # Intelligent fuzzy match
        name_lower = name.lower()
        original_names = list(College.objects.values_list('name', flat=True))
        
        def get_score(n):
            n_lower = n.lower()
            ratio = difflib.SequenceMatcher(None, name_lower, n_lower).ratio()
            if any(word.startswith(name_lower[:3]) for word in n_lower.split()):
                ratio += 0.4
            return ratio

        scored_matches = sorted([(get_score(n), n) for n in original_names], key=lambda x: x[0], reverse=True)
        
        if scored_matches and scored_matches[0][0] > 0.4:
            suggestion = scored_matches[0][1]
            data = College.objects.filter(name=suggestion)
            
    serializer = CollegeSerializer(data, many=True)
    return JsonResponse({
        "college": serializer.data,
        "suggestion": suggestion
    })


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
                # enrollment_all = int(row['UG']) if pd.notna(
                #     row['UG']) and not pd.isna(row['UG']) else print("row", row)

                college, created = College.objects.get_or_create(
                    name=row['INSTNM'],
                    city=row['CITY'],
                    state=row['STABBR'],
                    website=row['INSTURL'],
                    admission_rate=row['ADM_RATE'],
                    sat_score=row['SAT_AVG'],
                    cost_of_attendance=row['COSTT4_A'],
                    tuition_in_state=row['TUITIONFEE_IN'],
                    tuition_out_state=row['TUITIONFEE_OUT'],
                    latitude=row['LATITUDE'],
                    longitude=row['LONGITUDE'],
                    ft_faculty_rate=row['PFTFAC'],
                    enrollment_all=row['UGDS'],
                    UNITID=row['UNITID']
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


class UploadApiView2(APIView):
    serializer_class = UploadFileSerializer
    parser_classes = [MultiPartParser, FormParser]
    # permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            data = request.FILES['file']
            raw_data = data.read()
            encoding = chardet.detect(raw_data)['encoding']
            if not encoding:
                raise Exception("Could not detect the encoding of the file")
            decoded_data = raw_data.decode(encoding, 'replace')
            df = pd.read_csv(StringIO(decoded_data),  sep=',', on_bad_lines='skip', index_col=False,
                             na_values=None, na_filter=True, dtype='unicode').convert_dtypes()

            colleges = []
            for index, row in df.iterrows():
                try:
                    unit_id = row['UNITID']
                    college = College.objects.filter(
                        Q(UNITID=unit_id)
                    ).first()

                    if college and all([college.admission_rate, college.sat_score, college.cost_of_attendance, college.tuition_in_state,
                                        college.tuition_out_state, college.latitude, college.longitude,
                                        college.ft_faculty_rate, college.enrollment_all,
                                        row.get('HLOFFER'), row.get('CCBASIC')]):
                        admission_rate = college.admission_rate
                        sat_score = college.sat_score
                        website = college.website
                        cost_of_attendance = college.cost_of_attendance
                        tuition_in_state = college.tuition_in_state
                        tuition_out_state = college.tuition_out_state
                        latitude = college.latitude
                        longitude = college.longitude
                        enrollment_all = college.enrollment_all
                        ft_faculty_rate = college.ft_faculty_rate
                        hloffers = str(row.get('HLOFFER')) if pd.notna(
                            row.get('HLOFFER')) else None
                        ccbasic = str(row.get('CCBASIC')) if pd.notna(
                            row.get('CCBASIC')) else None
                        smart_college, created = SmartCollege.objects.update_or_create(
                            name=row['INSTNM'],
                            defaults={
                                'city': row['CITY'],
                                'state': row['STABBR'],
                                'website': website,
                                'admission_rate': admission_rate,
                                'sat_score': sat_score,
                                'cost_of_attendance': cost_of_attendance,
                                'tuition_in_state': tuition_in_state,
                                'tuition_out_state': tuition_out_state,
                                'latitude': latitude,
                                'longitude': longitude,
                                'enrollment_all': enrollment_all,
                                'ft_faculty_rate': ft_faculty_rate,
                                'HLOFFER': hloffers,
                                'CCBASIC': ccbasic,
                            }
                        )

                        if created:
                            messages.success(
                                request, f'Successfully imported {smart_college.name}')
                        else:
                            messages.warning(
                                request, f'{smart_college.name} updated')
                except (ValueError, KeyError) as e:
                    messages.error(
                        request, f"Error processing row {index+1}: {e}")
            return Response({'message': 'File uploaded successfully'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            messages.error(request, f"An unexpected error occurred: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UploadApiView3(APIView):
    serializer_class = UploadFileSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            data = request.FILES['file']
            df = pd.read_csv(data, sep=',', on_bad_lines='skip', index_col=False,
                             na_values=None, na_filter=True, dtype='unicode', encoding='latin1').convert_dtypes()

            colleges = []
            for index, row in df.iterrows():
                try:
                    unit_id = row['UNITID'] if pd.notna(
                        row['UNITID']) else None
                    enrollment_all = int(row['UG']) if pd.notna(
                        row['UG']) and not pd.isna(row['UG']) else None
                    college, created = College.objects.update_or_create(
                        name=row['INSTNM'],
                        defaults={
                            'city': row['CITY'],
                            'state': row['STABBR'],
                            'website': row['INSTURL'],
                            'admission_rate': row['ADM_RATE'],
                            'sat_score': row['SAT_AVG'],
                            'cost_of_attendance': row['COSTT4_A'],
                            'tuition_in_state': row['TUITIONFEE_IN'],
                            'tuition_out_state': row['TUITIONFEE_OUT'],
                            'latitude': row['LATITUDE'],
                            'longitude': row['LONGITUDE'],
                            'ft_faculty_rate': row['PFTFAC'],
                            'UNITID': unit_id,
                            'enrollment_all': enrollment_all,
                        }
                    )
                    if created:
                        messages.success(
                            request, f'Successfully imported {college.name}')
                    else:
                        messages.warning(request, f'{college.name} updated')
                except (ValueError, KeyError) as e:
                    messages.error(
                        request, f"Error processing row {index+1}: {e}")
            return Response({'message': 'File uploaded successfully'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            messages.error(request, f"An unexpected error occurred: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UploadApiView4(APIView):
    serializer_class = UploadFileSerializer
    parser_classes = [MultiPartParser, FormParser]
    # permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            data = request.FILES['file']
            df = pd.read_csv(data, sep=',', on_bad_lines='skip', index_col=False,
                             na_values=None, na_filter=True, dtype='unicode', encoding='latin1').convert_dtypes()
            programs = []
            for index, row in df.iterrows():
                try:
                    unit_id = row['UNITID'] if pd.notna(
                        row['UNITID']) else None
                    college = College.objects.filter(Q(UNITID=unit_id)).first()
                    if college:
                        college_program, created = CollegeProgram.objects.get_or_create(
                            college=college,
                            cipcode=row['CIPCODE'],
                            defaults={
                                'cipdesc': row['CIPDESC'],
                                'UNITID': unit_id,
                                'creddesc': row['CREDDESC'],
                            }
                        )
                        if created:
                            print("college_program", college_program)
                            messages.success(
                                request, f'Successfully imported {college_program.cipdesc}')
                        else:
                            messages.warning(
                                request, f'{college_program.cipdesc} updated')
                except (ValueError, KeyError) as e:
                    messages.error(
                        request, f'Error processing row {index+1}: {e}')
            return Response({'message': 'File uploaded successfully'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            messages.error(request, f"An unexpected error occurred: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


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

            like = Like.objects.create(user=request.user,
                                content_type=content_type, object_id=object_id)
            
            # Create notification
            target_obj = like.content_object
            recipient = None
            if hasattr(target_obj, 'author'):
                recipient = target_obj.author
            elif hasattr(target_obj, 'user'):
                recipient = target_obj.user
                
            if recipient and recipient != request.user:
                Notification.objects.create(
                    recipient=recipient,
                    sender=request.user,
                    notification_type='like',
                    content_object=target_obj
                )

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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def claim_college(request):
    college_id = request.data.get('college_id')
    try:
        college_obj = College.objects.get(pk=college_id)
    except College.DoesNotExist:
        return Response({"error": "College not found"}, status=404)
    
    user = request.user
    if not user.is_eligible_to_claim:
        return Response({"error": "You are not authorized to claim a college. This process is invitation-only. Please contact support for access."}, status=403)

    if user.associated_college:
        return Response({"error": "You already have an associated college"}, status=400)
    
    user.role = 'college_staff'
    user.associated_college = college_obj
    user.is_verified = False  # Requires admin approval
    user.save()
    
    serializer = UserSerializer(user)
    return Response({
        "message": "Claim request submitted successfully. Verification pending.",
        "user": serializer.data
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def staff_update_college(request, pk):
    try:
        college = College.objects.get(pk=pk)
    except College.DoesNotExist:
        return Response({"error": "College not found"}, status=404)

    user = request.user
    if user.role != 'college_staff' or user.associated_college_id != college.id:
        return Response({"error": "You do not have permission to edit this college"}, status=403)

    # Fields allowed to be updated by staff
    allowed_fields = ['description', 'website', 'top_major']
    for field in allowed_fields:
        if field in request.data:
            setattr(college, field, request.data.get(field))

    # Handle logo upload
    if 'logo' in request.FILES:
        college.logo = request.FILES['logo']
        
    # Handle banner image upload
    if 'image' in request.FILES:
        college.image = request.FILES['image']

    college.save()

    return Response({
        "message": "College updated successfully",
        "college": CollegeSerializer(college).data
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_interested_students(request, pk):
    try:
        college = College.objects.get(pk=pk)
    except College.DoesNotExist:
        return Response({"error": "College not found"}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    if user.role != 'college_staff' or user.associated_college_id != college.id:
        return Response({"error": "You do not have permission to view this college's data"}, status=status.HTTP_403_FORBIDDEN)

    # Students who bookmarked this college
    bookmarks = Bookmark.objects.filter(college=college).select_related('user')
    students = []
    for b in bookmarks:
        s = b.user
        students.append({
            "id": s.id,
            "username": s.username,
            "first_name": s.first_name,
            "major": s.major,
            "gpa": s.gpa,
            "sat_score": s.sat_score,
            "image": s.image.url if s.image else None
        })

    return Response(students)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_college_analytics(request, college_id):
    user = request.user
    # Ensure only authorized staff or admin can see analytics
    if user.role != 'college_staff' and not user.is_staff:
        return Response({"error": "Unauthorized"}, status=403)
    
    if user.role == 'college_staff' and user.associated_college_id != int(college_id):
        return Response({"error": "You can only view analytics for your own institution"}, status=403)

    try:
        college = College.objects.get(pk=college_id)
    except College.DoesNotExist:
        return Response({"error": "College not found"}, status=404)

    # Real data aggregation
    bookmarks_count = Bookmark.objects.filter(college=college).count()
    followers_count = User.objects.filter(following_colleges=college).count()
    
    # Recent Trend - bookmarks in the last 7 days
    seven_days_ago = timezone.now() - timedelta(days=7)
    recent_bookmarks = Bookmark.objects.filter(college=college, created_at__gte=seven_days_ago).count()

    return Response({
        "college_id": college.id,
        "college_name": college.name,
        "bookmarks": bookmarks_count,
        "followers": followers_count,
        "recent_bookmarks": recent_bookmarks,
        "engagement_score": (bookmarks_count * 2) + followers_count
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_unverified_staff(request):
    if not request.user.is_staff:
        return Response({"error": "Admin access required"}, status=403)
    
    unverified_users = User.objects.filter(role='college_staff', is_verified=False).select_related('associated_college')
    data = []
    for u in unverified_users:
        data.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "college_id": u.associated_college.id if u.associated_college else None,
            "college_name": u.associated_college.name if u.associated_college else "N/A",
            "request_date": u.date_joined # Using joined date as request date for now
        })
    return Response(data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_staff(request):
    if not request.user.is_staff:
        return Response({"error": "Admin access required"}, status=403)
    
    user_id = request.data.get('user_id')
    action = request.data.get('action') # 'approve' or 'deny'
    
    try:
        target_user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    
    if action == 'approve':
        target_user.is_verified = True
        target_user.save()
        return Response({"message": f"User {target_user.username} verified successfully."})
    elif action == 'deny':
        target_user.role = 'student'
        target_user.associated_college = None
        target_user.is_verified = False
        target_user.save()
        return Response({"message": f"User {target_user.username} claim denied and reverted to student."})
    else:
        return Response({"error": "Invalid action"}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_direct_message(request):
    recipient_id = request.data.get('recipient_id')
    content = request.data.get('content')
    attachment = request.FILES.get('attachment')

    if not recipient_id:
        return Response({"error": "Missing recipient_id"}, status=status.HTTP_400_BAD_REQUEST)
    
    if not content and not attachment:
        return Response({"error": "Message must have content or an attachment"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        recipient = User.objects.get(id=recipient_id)
    except User.DoesNotExist:
        return Response({"error": "Recipient not found"}, status=status.HTTP_404_NOT_FOUND)

    message = DirectMessage.objects.create(
        sender=request.user,
        recipient=recipient,
        content=content,
        attachment=attachment
    )

    # Create notification for recipient
    from django.contrib.contenttypes.models import ContentType
    Notification.objects.create(
        recipient=recipient,
        sender=request.user,
        notification_type='direct_message',
        content_type=ContentType.objects.get_for_model(DirectMessage),
        object_id=message.id
    )

    return Response({
        "message": "Message sent successfully", 
        "id": message.id,
        "attachment_url": message.attachment.url if message.attachment else None
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_messages(request):
    other_user_id = request.query_params.get('other_user_id')
    
    if other_user_id:
        messages = DirectMessage.objects.filter(
            (Q(sender=request.user) & Q(recipient_id=other_user_id)) |
            (Q(sender_id=other_user_id) & Q(recipient=request.user))
        ).order_by('created_at')
        # Mark incoming messages as read
        messages.filter(recipient=request.user, is_read=False).update(is_read=True)
    else:
        messages = DirectMessage.objects.filter(
            Q(sender=request.user) | Q(recipient=request.user)
        ).order_by('created_at')
    
    # We might need a serializer for this or just manual mapping
    data = []
    for m in messages:
        attachment_url = None
        if m.attachment:
            attachment_url = request.build_absolute_uri(m.attachment.url)
            
        data.append({
            "id": m.id,
            "sender_id": m.sender.id,
            "sender_name": m.sender.username,
            "recipient_id": m.recipient.id,
            "recipient_name": m.recipient.username,
            "content": m.content,
            "attachment_url": attachment_url,
            "created_at": m.created_at,
            "is_read": m.is_read
        })
    return Response(data)



@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def post_list(request):
    if request.method == 'GET':
        posts = Post.objects.all()
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)
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
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        try:
            from django.db.models import Q
            user = request.user
            
            if user.is_authenticated:
                # Visibility logic:
                # 1. Author is NOT private
                # 2. OR Author is the current user themselves
                # 3. OR Author is private but current user is an accepted friend
                posts = Post.objects.filter(
                    Q(author__is_private=False) |
                    Q(author=user) |
                    Q(author__friendship_user1__user2=user, author__friendship_user1__status='accepted') |
                    Q(author__friendship_user2__user1=user, author__friendship_user2__status='accepted')
                ).distinct()
            else:
                # Unauthenticated users only see posts from non-private profiles
                posts = Post.objects.filter(author__is_private=False)

            serializer = PostSerializer(posts, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request, format=None):
        try:
            # print("request.data", request.data)
            serializer = PostSerializer(
                data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'error': e.detail}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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

    def get(self, request, pk, format=None):
        try:
            post = get_object_or_404(Post, pk=pk)
            serializer = PostSerializer(post)
            return Response(serializer.data)
        except Http404:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GlobalCommentListView(generics.ListAPIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_class = CommentSerializer

    def get_queryset(self):
        from django.db.models import Q
        user = self.request.user
        if user.is_authenticated:
            return Comment.objects.filter(
                Q(author__is_private=False) |
                Q(author=user) |
                Q(author__friendship_user1__user2=user, author__friendship_user1__status='accepted') |
                Q(author__friendship_user2__user1=user, author__friendship_user2__status='accepted')
            ).distinct().order_by('-created_at')[:30]
        else:
            return Comment.objects.filter(author__is_private=False).order_by('-created_at')[:30]


class UserPostsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id, format=None):
        target_user = get_object_or_404(User, pk=user_id)
        current_user = request.user

        is_own_profile = (target_user.id == current_user.id)
        is_friend = Friendship.objects.filter(
            (Q(user1=target_user, user2=current_user) | Q(user1=current_user, user2=target_user)),
            status='accepted'
        ).exists()

        if target_user.is_private and not (is_own_profile or is_friend):
            return Response({'error': 'This profile is private'}, status=status.HTTP_403_FORBIDDEN)

        posts = Post.objects.filter(author_id=user_id)
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)


class CommentListView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

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
            comment = serializer.save(author=request.user, post=post)
            
            # Create notification for post owner
            if post.author and post.author != request.user:
                Notification.objects.create(
                    recipient=post.author,
                    sender=request.user,
                    notification_type='comment',
                    content_object=post
                )
                
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EditCommentView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk, format=None):
        comment = get_object_or_404(Comment, pk=pk)
        if comment.author != request.user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = CommentSerializer(
            comment, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeleteCommentView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, format=None):
        comment = get_object_or_404(Comment, pk=pk)
        if comment.author != request.user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CommentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return Comment.objects.get(pk=pk)
        except Comment.DoesNotExist:
            return None

    def get(self, request, pk):
        comment = self.get_object(pk)
        if comment is None:
            return Response({'error': 'Comment not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserCommentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id, format=None):
        target_user = get_object_or_404(User, pk=user_id)
        current_user = request.user

        is_own_profile = (target_user.id == current_user.id)
        is_friend = Friendship.objects.filter(
            (Q(user1=target_user, user2=current_user) | Q(user1=current_user, user2=target_user)),
            status='accepted'
        ).exists()

        if target_user.is_private and not (is_own_profile or is_friend):
            return Response({'error': 'This profile is private'}, status=status.HTTP_403_FORBIDDEN)

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
    def get(self, request, pk, format=None):
        try:
            post = get_object_or_404(Post, pk=pk)
            comment_count = Comment.objects.filter(post_id=pk).count()
            reply_count = Reply.objects.filter(comment__post_id=pk).count()
            return Response({'comment_count': comment_count, 'reply_count': reply_count})
        except Http404:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReplyListView(generics.ListAPIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
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
        
        reply = serializer.save(author=self.request.user, comment=comment)

        # Create notification for comment owner
        if comment.author and comment.author != self.request.user:
            Notification.objects.create(
                recipient=comment.author,
                sender=self.request.user,
                notification_type='comment',
                content_object=comment
            )


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


class FriendRequestCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, friend_id, format=None):
        try:
            friend = get_object_or_404(User, pk=friend_id)
            friendship, created = Friendship.objects.get_or_create(
                user1=request.user,
                user2=friend,
            )
            if created:
                # Create notification
                Notification.objects.create(
                    recipient=friend,
                    sender=request.user,
                    notification_type='friend_request',
                    content_object=friendship
                )
                return Response({'message': 'Friend request sent'}, status=status.HTTP_201_CREATED)
            else:
                return Response({'message': 'Friend request already exists'}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FriendRequestDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, friend_id, format=None):
        try:
            friend = get_object_or_404(User, pk=friend_id)
            friendship = Friendship.objects.get(
                user1=request.user, user2=friend)
            friendship.delete()
            return Response({'message': 'Friend request deleted'}, status=status.HTTP_204_NO_CONTENT)
        except Friendship.DoesNotExist:
            return Response({'error': 'Friend request not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FriendRequestRespondView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, action, format=None):
        try:
            request_id = request.data.get('id')
            if not request_id:
                return Response({'error': 'Request ID is required'}, status=status.HTTP_400_BAD_REQUEST)

            friendship = get_object_or_404(Friendship, pk=request_id)

            if friendship.user2 != request.user:
                return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

            if action == 'accept':
                friendship.status = 'accepted'
                friendship.save()
                
                # Create notification for the original sender
                Notification.objects.create(
                    recipient=friendship.user1,
                    sender=request.user,
                    notification_type='accepted_request',
                    content_object=friendship
                )
                
                return Response({'message': 'Friend request accepted'}, status=status.HTTP_200_OK)
            elif action == 'reject':
                friendship.delete()
                return Response({'message': 'Friend request rejected'}, status=status.HTTP_204_NO_CONTENT)
            else:
                return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PendingFriendRequestsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        try:
            pending_requests = Friendship.objects.filter(
                user2=request.user, status='pending')
            serializer = FriendshipSerializer(pending_requests, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FriendsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id, format=None):
        try:
            user = get_object_or_404(User, pk=user_id)
            current_user = request.user
            
            # Check friendship status for privacy and response
            is_friend = Friendship.objects.filter(
                (Q(user1=user, user2=current_user) | Q(user1=current_user, user2=user)),
                status='accepted'
            ).exists()

            is_pending = Friendship.objects.filter(
                (Q(user1=user, user2=current_user) | Q(user1=current_user, user2=user)),
                status='pending'
            ).exists()

            is_own_profile = (user.id == current_user.id)

            # If profile is private and requester is not friend/self, restricted friends list
            if user.is_private and not (is_friend or is_own_profile):
                return Response({
                    'friends': [], 
                    'is_friend': is_friend, 
                    'is_pending': is_pending,
                    'restricted': True
                })

            friendships = Friendship.objects.filter(
                user1=user,
                status='accepted',
            ) | Friendship.objects.filter(
                user2=user,
                status='accepted',
            )

            friends = [friendship.user1 for friendship in friendships if friendship.user1 != user] + \
                      [friendship.user2 for friendship in friendships if friendship.user2 != user]

            serializer = UserSerializer(friends, many=True)
            return Response({'friends': serializer.data, 'is_friend': is_friend, 'is_pending': is_pending})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




class MyFriendsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        try:
            user = request.user
            
            # Get all accepted friendships where user is either user1 or user2
            friendships = Friendship.objects.filter(
                Q(user1=user, status='accepted') | Q(user2=user, status='accepted')
            )

            # Extract the friend (the other user in the relationship)
            friends = []
            for friendship in friendships:
                friend = friendship.user2 if friendship.user1 == user else friendship.user1
                friends.append(friend)

            serializer = UserSerializer(friends, many=True)
            return Response({'friends': serializer.data}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UnfriendView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, friend_id, format=None):
        try:
            friend = get_object_or_404(User, pk=friend_id)
            friendships = Friendship.objects.filter(
                user1=request.user,
                user2=friend,
                status='accepted',
            ) | Friendship.objects.filter(
                user1=friend,
                user2=request.user,
                status='accepted',
            )

            if friendships.exists():
                friendships.delete()
                return Response({'message': 'Friend removed'}, status=status.HTTP_204_NO_CONTENT)
            else:
                return Response({'error': 'Friendship not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FriendRequestCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pending_count = Friendship.objects.filter(
            user2=request.user, status='pending').count()
        accepted_count = Friendship.objects.filter(
            user2=request.user, status='accepted').count()
        return Response({'pending_count': pending_count, 'accepted_count': accepted_count})


class FriendRequestsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        friend_requests = Friendship.objects.filter(
            user2=request.user).order_by('-created_at')
        serializer = FriendshipSerializer(friend_requests, many=True)
        return Response(serializer.data)


class FriendRequestReadView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, request_id, format=None):
        try:
            friendship = get_object_or_404(Friendship, pk=request_id)
            friendship.read = True
            friendship.save()
            return Response({'message': 'Friend request read'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# class NewsFeedView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         try:
#             api_key = os.environ.get('NEWS_API_KEY')
#             if not api_key:
#                 return Response({'error': 'News API key not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#             news_items = []

#             # 1. News API
#             news_api_url = 'https://newsapi.org/v2/everything'
#             today = datetime.now().date()
#             from_date = today - timedelta(days=7)

#             news_api_params = {
#                 'q': 'college OR university OR "higher education" AND (student OR faculty OR professor OR research OR "campus life" OR admissions OR tuition OR scholarships) NOT sports',
#                 'from': from_date.strftime('%Y-%m-%d'),
#                 'language': 'en',
#                 'sortBy': 'relevancy',
#                 'apiKey': api_key,
#                 'pageSize': 3,
#             }
#             news_api_response = requests.get(
#                 news_api_url, params=news_api_params)
#             news_api_response.raise_for_status()
#             news_api_data = news_api_response.json()

#             for item in news_api_data.get('articles', []):
#                 description = item.get('description', '')
#                 if description:
#                     description = "\n".join(description.split("\n")[:10])
#                 news_items.append({
#                     'title': item.get('title'),
#                     'description': description,
#                     'link': item.get('url'),
#                     'image_url': item.get('urlToImage'),
#                     'article_id': item.get('url'),
#                     'source': 'News API'
#                 })

#             # 2. Inside Higher Ed RSS Feed
#             inside_higher_ed_url = 'https://www.insidehighered.com/rss.xml'
#             inside_higher_ed_feed = feedparser.parse(
#                 requests.get(inside_higher_ed_url).text)
#             for entry in inside_higher_ed_feed.entries[:3]:
#                 summary = BeautifulSoup(
#                     entry.summary, 'html.parser').get_text().strip()
#                 if summary:
#                     summary = "\n".join(summary.split("\n")[:10])
#                 news_items.append({
#                     'title': entry.title,
#                     'description': summary,
#                     'link': entry.link,
#                     'image_url': None,
#                     'article_id': entry.id,
#                     'source': 'Inside Higher Ed RSS'
#                 })

#             # 3. College RSS Feeds
#             college_rss_feeds = [
#                 {'name': 'MIT News', 'url': 'http://news.mit.edu/rss/feed.xml'},
#                 {'name': 'Harvard Gazette', 'url': 'https://news.harvard.edu/feed/'},
#                 {'name': 'Stanford News', 'url': 'https://news.stanford.edu/feed/'},
#                 {'name': 'Yale News', 'url': 'https://news.yale.edu/rss'},
#                 {'name': 'Caltech News',
#                     'url': 'https://www.caltech.edu/about/news/feed'},
#                 {'name': 'Princeton News', 'url': 'https://www.princeton.edu/news/feed'},
#                 {'name': 'UChicago News', 'url': 'https://news.uchicago.edu/rss'}

#             ]

#             for college in college_rss_feeds:
#                 try:
#                     feed = feedparser.parse(requests.get(college['url']).text)
#                     for entry in feed.entries[:2]:
#                         summary = BeautifulSoup(
#                             entry.summary, 'html.parser').get_text().strip()
#                         if summary:
#                             summary = "\n".join(summary.split("\n")[:10])
#                         news_items.append({
#                             'title': entry.title,
#                             'description': summary,
#                             'link': entry.link,
#                             'image_url': None,
#                             'article_id': entry.id,
#                             'source': college['name']
#                         })
#                 except Exception as e:
#                     print(
#                         f"Error fetching RSS feed for {college['name']}: {e}")

#             return Response({'results': news_items}, status=status.HTTP_200_OK)

#         except requests.exceptions.RequestException as e:
#             print("request exception:", e)
#             return Response({'error': f"An unexpected error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
#         except Exception as e:
#             print("Exception:", e)
#             return Response({'error': f"An unexpected error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NewsFeedView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        cache_key = 'trending_news_feed'
        
        # Check if user wants to force refresh (optional, but let's clear it for now to show changes)
        if request.query_params.get('refresh') == 'true':
            cache.delete(cache_key)
            
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response({'results': cached_data}, status=status.HTTP_200_OK)

        try:
            api_key = os.environ.get('NEWS_API_KEY')
            if not api_key:
                return Response({'error': 'News API key not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            news_items = []

            # 1. News API - High-Relevance Education Focus
            news_api_url = 'https://newsapi.org/v2/everything'
            
            # Target domains known for high-quality education/admissions news
            edu_domains = 'insidehighered.com,chronicle.com,highereddive.com,ed.gov,collegeboard.org,usnews.com,nytimes.com,wsj.com,forbes.com'
            
            news_api_params = {
                'q': '("college admissions" OR "university application" OR "SAT scores" OR "ACT scores" OR FAFSA OR "financial aid" OR "Common App") -sabbatical -vacation -"adult gap year" -work -travel',
                'domains': edu_domains,
                'language': 'en',
                'sortBy': 'relevancy',
                'apiKey': api_key,
                'pageSize': 8,
            }
            try:
                news_api_response = requests.get(news_api_url, params=news_api_params, timeout=5)
                news_api_response.raise_for_status()
                news_api_data = news_api_response.json()
                for item in news_api_data.get('articles', []):
                    news_items.append({
                        'title': item.get('title'),
                        'description': item.get('description')[:300] if item.get('description') else "",
                        'link': item.get('url'),
                        'image_url': item.get('urlToImage'),
                        'article_id': item.get('url'),
                        'source': item.get('source', {}).get('name', 'News API')
                    })
            except Exception as e:
                print(f"News API error: {e}")

            # 2. Inside Higher Ed RSS - Quick Parse
            try:
                ihe_url = 'https://www.insidehighered.com/rss.xml'
                ihe_feed = feedparser.parse(requests.get(ihe_url, timeout=5).text)
                for entry in ihe_feed.entries[:4]:
                    news_items.append({
                        'title': entry.title,
                        'description': BeautifulSoup(entry.summary, 'html.parser').get_text()[:300] if hasattr(entry, 'summary') else "",
                        'link': entry.link,
                        'image_url': None, # Don't scrape for speed
                        'article_id': entry.id if hasattr(entry, 'id') else entry.link,
                        'source': 'Inside Higher Ed'
                    })
            except Exception as e:
                print(f"RSS error: {e}")

            # Store in cache for 1 hour (3600 seconds)
            cache.set('trending_news_feed', news_items, 3600)
            
            return Response({'results': news_items}, status=status.HTTP_200_OK)

        except requests.exceptions.RequestException as e:
            print("request exception:", e)
            return Response({'error': f"An unexpected error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            print("Exception:", e)
            return Response({'error': f"An unexpected error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# class NewsAPIView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         try:
#             api_key = os.environ.get('NEWS_API_KEY')
#             if not api_key:
#                 return Response({'error': 'News API key not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#             url = 'https://newsapi.org/v2/everything'
#             today = datetime.now().date()
#             from_date = today - timedelta(days=7)

#             params = {
#                 'q': 'college OR university OR "higher education" AND (student OR faculty OR professor OR research OR "campus life" OR admissions OR tuition OR scholarships) NOT sports',
#                 'from': from_date.strftime('%Y-%m-%d'),
#                 'language': 'en',
#                 'sortBy': 'relevancy',
#                 'apiKey': api_key,
#                 'pageSize': 5,
#             }
#             response = requests.get(url, params=params)
#             response.raise_for_status()
#             data = response.json()

#             articles = []
#             g = Goose()
#             for article in data.get('articles', []):
#                 try:
#                     article_goose = g.extract(url=article.get('url'))
#                     cleaned_text = article_goose.cleaned_text.strip()

#                     paragraphs = [p.strip() for p in cleaned_text.split("\n")]
#                     cleaned_text = "\n\n".join(paragraphs)

#                     articles.append({
#                         'title': article.get('title'),
#                         'description': cleaned_text,
#                         'link': article.get('url'),
#                         'image_url': article_goose.top_image if article_goose else None,
#                         'article_id': article.get('url')
#                     })
#                 except Exception:
#                     articles.append({
#                         'title': article.get('title'),
#                         'description': article.get('description'),
#                         'link': article.get('url'),
#                         'image_url': None,
#                         'article_id': article.get('url')
#                     })

#             return Response({'results': articles}, status=status.HTTP_200_OK)

#         except requests.exceptions.RequestException as e:
#             print("request exception:", e)
#             return Response({'error': f"An unexpected error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
#         except Exception as e:
#             print("Exception:", e)
#             return Response({'error': f"An unexpected error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NewsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            api_key = os.environ.get('NEWS_API_KEY')
            if not api_key:
                return Response({'error': 'News API key not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            url = 'https://newsapi.org/v2/everything'
            today = datetime.now().date()
            from_date = today - timedelta(days=7)

            params = {
                'q': 'college OR university OR "higher education" AND (student OR faculty OR professor OR research OR "campus life" OR admissions OR tuition OR scholarships) NOT sports',
                'from': from_date.strftime('%Y-%m-%d'),
                'language': 'en',
                'sortBy': 'relevancy',
                'apiKey': api_key,
                'pageSize': 5,
            }
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            articles = []
            g = Goose()
            for article in data.get('articles', []):
                try:
                    article_goose = g.extract(url=article.get('url'))
                    cleaned_text = article_goose.cleaned_text.strip()
                    paragraphs = [p.strip() for p in cleaned_text.split("\n")]

                    articles.append({
                        'title': article.get('title'),
                        'description': paragraphs,
                        'link': article.get('url'),
                        'image_url': article_goose.top_image if article_goose else None,
                        'article_id': article.get('url')
                    })
                except Exception:
                    articles.append({
                        'title': article.get('title'),
                        'description': article.get('description'),
                        'link': article.get('url'),
                        'image_url': None,
                        'article_id': article.get('url')
                    })

            return Response({'results': articles}, status=status.HTTP_200_OK)

        except requests.exceptions.RequestException as e:
            print("request exception:", e)
            return Response({'error': f"An unexpected error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            print("Exception:", e)
            return Response({'error': f"An unexpected error occurred: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ArticleListView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, format=None):
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))

        # Filter the queryset based on the published date and order by the published date or created date
        published_param = request.query_params.get('published', None)
        published_only = published_param == 'true'

        # Apply the filters to Article model using the class
        if published_only:
            articles = Article.objects.filter(published_date__isnull=False)
        else:
            articles = Article.objects.all()

        paginator = Paginator(articles, page_size)
        try:
            articles_page = paginator.page(page)
        except PageNotAnInteger:
            articles_page = paginator.page(1)
        except EmptyPage:
            articles_page = paginator.page(paginator.num_pages)

        serializer = ArticleSerializer(articles_page, many=True)
        return Response({
            'articles': serializer.data,
            'has_more': articles_page.has_next()
        }, status=status.HTTP_200_OK)

    def post(self, request, format=None):
        try:
            serializer = ArticleSerializer(
                data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            serializer.save(author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'error': e.detail}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ArticleDetailView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self, slug):
        try:
            return Article.objects.get(slug=slug)
        except Article.DoesNotExist:
            raise Http404("Article not found")

    def get(self, request, slug, format=None):
        article = self.get_object(slug)
        serializer = ArticleSerializer(article)
        return Response(serializer.data)


class EditArticleView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, slug, format=None):
        article = self.get_object(slug)
        if article.author != request.user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = ArticleSerializer(
            article, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get_object(self, slug):
        try:
            return Article.objects.get(slug=slug)
        except Article.DoesNotExist:
            raise Http404("Article not found")


class DeleteArticleView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, slug, format=None):
        article = self.get_object(slug)
        if article.author != request.user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        article.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_object(self, slug):
        try:
            return Article.objects.get(slug=slug)
        except Article.DoesNotExist:
            raise Http404("Article not found")

class CityAutoCompleteView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        query = request.query_params.get('query', '')
        if len(query) < 2:
            return Response([])
        cities = College.objects.filter(city__icontains=query).values_list(
            'city', flat=True).distinct()[:10]
        return Response(list(cities))


class ProgramAutoCompleteView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        query = request.query_params.get('query', '')
        if len(query) < 2:
            return Response([])
        programs = CollegeProgram.objects.filter(cipdesc__icontains=query).values_list(
            'cipdesc', flat=True).distinct()[:10]
        return Response(list(programs))

class CollegeAutoCompleteView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        query = request.query_params.get('query', '')
        if len(query) < 2:
            return Response([])
        colleges = College.objects.filter(name__icontains=query).values_list(
            'name', flat=True).distinct()[:10]
        return Response(list(colleges))

import google.generativeai as genai
from django.http import StreamingHttpResponse
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import os

# Configure Gemini once at module level and cache the model
# Re-initializing on every request adds ~1-2s overhead
_GEMINI_MODEL = None
_VECTOR_STORE = None
_EMBEDDINGS = None

def _get_gemini_model():
    global _GEMINI_MODEL
    if _GEMINI_MODEL is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            print(f"DEBUG: Initializing Gemini with key found (length: {len(api_key)})")
            genai.configure(api_key=api_key)
            # Using verified model that works: models/gemini-flash-latest
            _GEMINI_MODEL = genai.GenerativeModel('gemini-flash-latest')
        else:
            print("DEBUG: GEMINI_API_KEY NOT FOUND IN ENVIRONMENT")
    return _GEMINI_MODEL

def _get_vector_store():
    global _VECTOR_STORE, _EMBEDDINGS
    index_path = "college_faiss_index"
    if _VECTOR_STORE is None and os.path.exists(index_path):
        try:
            api_key = os.environ.get("GEMINI_API_KEY")
            if api_key:
                if _EMBEDDINGS is None:
                    _EMBEDDINGS = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001", google_api_key=api_key)
                _VECTOR_STORE = FAISS.load_local(index_path, _EMBEDDINGS, allow_dangerous_deserialization=True)
        except Exception as e:
            print(f"Error loading FAISS index: {e}")
    return _VECTOR_STORE

try:
    _get_gemini_model()
    _get_vector_store()
except Exception as e:
    print(f"Error initializing cached AI resources: {e}")

from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny

class ChatHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        messages = ChatMessage.objects.filter(user=request.user).order_by('created_at')
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)

    def delete(self, request):
        ChatMessage.objects.filter(user=request.user).delete()
        return Response({'message': 'Chat history cleared'})


class AIChatView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        print("DEBUG: AIChatView POST received")
        user_message = request.data.get('message', '')
        context = request.data.get('context', {})
        current_path = context.get('path', '')

        # Save user message to memory
        if request.user.is_authenticated and user_message != "PROACTIVE_GREETING":
            ChatMessage.objects.create(user=request.user, role='user', content=user_message)
        
        # --- SPECIAL: PROACTIVE GREETING (Keep generic for now or use LLM later) ---
        if user_message == "PROACTIVE_GREETING":
             # ... (Keep existing proactive logic or simplify. For now, let's keep it simple to focus on streaming chat)
            response = ""
            if request.user.is_authenticated:
                 first_name = request.user.first_name or "there"
                 response = f"👋 Hi {first_name}! I'm connected and ready to chat. Ask me anything about colleges!"
            else:
                 response = "👋 Hi there! I'm Wormie. I can answer your college questions in real-time now."
            return Response({'reply': response}, status=status.HTTP_200_OK)


        # --- 1. GATHER CONTEXT FOR LLM (Hybrid Retrieval) ---
        found_colleges_info = ""
        vector_results = []
        
        # A. Try Vector Search First (Semantic Search) - Using Cached Index
        if len(user_message) > 5:
            try:
                vector_store = _get_vector_store()
                if vector_store:
                    print("DEBUG: Vector store found, searching...")
                    # Search for 3 most relevant colleges
                    docs = vector_store.similarity_search(user_message, k=3)
                    if docs:
                        found_colleges_info += "Relevant Colleges based on description:\n"
                        for doc in docs:
                            vector_results.append(doc.metadata.get("name"))
                            found_colleges_info += f"- {doc.page_content}\n"
                        found_colleges_info += "\n"
            except Exception as e:
                print(f"Vector search warning: {e}")

        # B. Fallback/Supplement: Smart college name matching from DB
        STOP_WORDS = {
            'what', 'where', 'when', 'which', 'tell', 'about', 'hard',
            'college', 'university', 'institute', 'school', 'rate', 'cost',
            'tuition', 'admission', 'looking', 'want', 'need', 'know',
            'does', 'have', 'with', 'from', 'that', 'this', 'more', 'into',
            'their', 'there', 'find', 'good', 'best', 'like', 'also', 'offer',
            'program', 'programs', 'major', 'majors', 'degree', 'campus',
            'apply', 'applied', 'attend', 'enrolled', 'student', 'students',
        }

        meaningful_words = []
        for w in re.findall(r'[a-zA-Z]+', user_message):
            w_lower = w.lower()
            if w_lower in STOP_WORDS:
                continue
            # Keep acronyms (ALL-CAPS words >= 2 chars like UCLA, NYU, HBCU)
            if w.isupper() and len(w) >= 2:
                meaningful_words.append(w)
            # Keep normal words >= 5 chars (reduces false positives)
            elif len(w) >= 5:
                meaningful_words.append(w)

        # Map common acronyms to full substrings for better matching
        ACRONYM_MAP = {
            'MIT': 'Massachusetts Institute of Technology',
            'UCLA': 'University of California-Los Angeles',
            'UCB': 'University of California-Berkeley',
            'UCSD': 'University of California-San Diego',
            'UCSB': 'University of California-Santa Barbara',
            'UCI': 'University of California-Irvine',
            'UCD': 'University of California-Davis',
            'NYU': 'New York University',
            'USC': 'University of Southern California',
            'UNC': 'University of North Carolina',
            'UVA': 'University of Virginia',
            'UMICH': 'University of Michigan',
            'UPENN': 'University of Pennsylvania',
            'LSU': 'Louisiana State University',
            'ASU': 'Arizona State University',
            'PSU': 'Pennsylvania State University',
            'MSU': 'Michigan State University',
            'OSU': 'Ohio State University',
            'TAMU': 'Texas A & M',
            'BYU': 'Brigham Young University',
            'RPI': 'Rensselaer Polytechnic Institute',
            'RIT': 'Rochester Institute of Technology',
            'WPI': 'Worcester Polytechnic Institute',
            'CMU': 'Carnegie Mellon',
            'SMU': 'Southern Methodist University',
            'TCU': 'Texas Christian University',
        }

        expanded_words = []
        for w in meaningful_words:
            upper_w = w.upper()
            if upper_w in ACRONYM_MAP:
                # Add the full name parts to the search
                full_name = ACRONYM_MAP[upper_w]
                # We add the whole phrase as a single query term if possible, or just use the mapped string
                # For regex search we'll use the mapped string directly in the loop below
                expanded_words.append(full_name) # Treat as a direct phrase to search
            else:
                expanded_words.append(w)
        
        if expanded_words:
            query = Q()
            for w in expanded_words:
                # If it looks like a full name (has spaces), use icontains
                if ' ' in w:
                     query |= Q(name__icontains=w)
                else:
                    # Use word-boundary regex so 'UCLA' doesn't match 'Paul Mitchell'
                    query |= Q(name__iregex=rf'\b{re.escape(w)}\b')

            matches = College.objects.filter(query).distinct()

            # Score: count how many meaningful words appear (word-bounded) in the college name
            scored = []
            for c in matches:
                # Check match against original or expanded words
                score = 0
                c_name_lower = c.name.lower()
                for w in expanded_words:
                    if ' ' in w:
                        if w.lower() in c_name_lower: score += 1
                    else:
                        if re.search(rf'\b{re.escape(w)}\b', c.name, re.IGNORECASE): score += 1
                
                # Require reliable match
                if score > 0:
                    scored.append((score, c))

            scored.sort(key=lambda x: -x[0])
            top_matches = [c for _, c in scored[:3]]

            if top_matches:
                db_info = ""
                for c in top_matches:
                    if c.name in vector_results:
                        continue
                    db_info += f"- Name: {c.name}\n"
                    db_info += f"  - Location: {c.city}, {c.state}\n"
                    if c.admission_rate: db_info += f"  - Admission Rate: {c.admission_rate*100:.1f}%\n"
                    if c.sat_score: db_info += f"  - Avg SAT: {c.sat_score}\n"
                    if c.cost_of_attendance: db_info += f"  - Cost of Attendance: ${c.cost_of_attendance:,}\n"
                    if c.tuition_in_state: db_info += f"  - Tuition (In-State): ${c.tuition_in_state:,}\n"
                    if c.tuition_out_state: db_info += f"  - Tuition (Out-of-State): ${c.tuition_out_state:,}\n"
                    if c.grad_rate: db_info += f"  - Graduation Rate: {c.grad_rate*100:.1f}%\n"
                    if c.retention_rate: db_info += f"  - Retention Rate: {c.retention_rate*100:.1f}%\n"
                    cc_disp = c.get_carnegie_classification_display()
                    if cc_disp and cc_disp != "Not classified":
                        db_info += f"  - Classification: {cc_disp}\n"
                    if c.is_open_admission:
                        db_info += f"  - Admissions: Open Admission Policy\n"
                    if c.is_distance_education:
                        db_info += f"  - Learning Mode: 100% Online/Distance Education\n"
                    if c.top_major:
                        db_info += f"  - Top Major: {c.top_major}\n"
                    db_info += "\n"

                if db_info:
                    found_colleges_info += "Database Match from IPEDS data:\n" + db_info

        # --- 2. GATHER USER MEMORY & RECRUITMENT INTELLIGENCE ---
        user_memory = ""
        try:
            if request.user.is_authenticated:
                u = request.user
                
                if u.role == 'college_staff' and u.associated_college:
                    college = u.associated_college
                    # 1. Fans: Students who have bookmarked this college
                    fans = User.objects.filter(role='student', bookmarks__college=college).distinct()[:5]
                    # 2. Smart Matches: Students who match the college stats or major
                    match_query = Q(role='student') & (Q(major=college.top_major) | Q(sat_score__gte=college.sat_score or 1200))
                    matches = User.objects.filter(match_query).exclude(id__in=[f.id for f in fans]).distinct()[:5]
                    
                    fan_names = [f"{f.first_name or f.username} (Major: {f.major or 'Undecided'}, SAT: {f.sat_score or 'N/A'})" for f in fans]
                    match_names = [f"{m.first_name or m.username} (Major: {m.major or 'Undecided'}, SAT: {m.sat_score or 'N/A'})" for m in matches]
                    
                    user_memory = f"""
                    - YOU ARE ACTING AS: A Recruitment Consultant/Advisor for {college.name}.
                    - USER: {u.first_name or u.username} ({u.role})
                    - INSTITUTION: {college.name} ({college.city}, {college.state})
                    - TOP PROSPECTS (Bookmarked your college): {', '.join(fan_names) if fan_names else 'None identified yet'}
                    - SMART MATCHES (High potential for your college): {', '.join(match_names) if match_names else 'None identified yet'}
                    
                    MISSION: Help the staff member identify the best students to recruit and suggest personalized outreach messages. 
                    Focus on the students listed above.
                    """
                else:
                    # Existing Student Logic
                    bookmarks_qs = Bookmark.objects.filter(user=u).select_related('college')
                    bookmark_names = [b.college.name for b in bookmarks_qs]
                    
                    bookmark_details = ""
                    recommendations_text = ""
                    
                    trigger_words = ['recommend', 'suggest', 'fit', 'next', 'other', 'match']
                    is_first_msg = not ChatMessage.objects.filter(user=u).exists()
                    is_rec_request = any(word in user_message.lower() for word in trigger_words)

                    if bookmarks_qs.exists() and (is_first_msg or is_rec_request):
                        colleges = [b.college for b in bookmarks_qs]
                        calc_sat = [c.sat_score for c in colleges if c.sat_score]
                        calc_adm = [c.admission_rate for c in colleges if c.admission_rate]
                        avg_sat = sum(calc_sat) / max(1, len(calc_sat)) if calc_sat else 1100
                        avg_adm = sum(calc_adm) / max(1, len(calc_adm)) if calc_adm else 0.6
                        common_states = list(set(c.state for c in colleges))
                        
                        bookmark_details = f"Average stats of bookmarks: SAT: {avg_sat:.0f}, Admission Rate: {avg_adm*100:.1f}%. Common regions: {', '.join(common_states)}."
                        
                        rec_query = Q(state__in=common_states) | Q(admission_rate__range=(avg_adm-0.1, avg_adm+0.1))
                        recs = College.objects.filter(rec_query).exclude(id__in=[c.id for c in colleges]).distinct()[:3]
                        if recs:
                            recommendations_text = "Based on their bookmarks, here are some smart recommendations to suggest:\n"
                            for r in recs:
                                adm_str = f"{r.admission_rate*100:.1f}%" if r.admission_rate is not None else "N/A"
                                recommendations_text += f"- {r.name} ({r.city}, {r.state}) - Admission: {adm_str}\n"

                    user_memory = f"""
                    - YOU ARE ACTING AS: A Personal Admissions Assistant for {u.first_name or u.username}.
                    - User Goal/Major: {u.major or 'Undecided'}
                    - GPA: {u.gpa or 'Not provided'}
                    - SAT Score: {u.sat_score or 'Not provided'}
                    - Bookmarked Colleges: {', '.join(bookmark_names) if bookmark_names else 'None yet'}
                    {bookmark_details}
                    
                    PROACTIVE RECOMMENDATIONS:
                    {recommendations_text if recommendations_text else 'No specific suggestions yet.'}
                    """
        except Exception as memory_e:
            print(f"Memory processing error: {memory_e}")
            user_memory = "Error gathering user context."

        # --- 3. CONSTRUCT SYSTEM PROMPT ---
        is_staff = request.user.is_authenticated and request.user.role == 'college_staff'
        
        goal_text = "Your goal is to help institutional representatives identify and recruit the best student matches for their college." if is_staff else "Your goal is to help students find their perfect college match."
        
        system_prompt = f"""You are Wormie, a helpful, enthusiastic, and knowledgeable AI college counselor agent.
        {goal_text}
        
        CONTEXT FROM DATABASE (Real IPEDS data):
        {found_colleges_info}
        
        USER PROFILE & MEMORY:
        {user_memory if user_memory else 'User is a guest. Encourage them to sign up to save bookmarks and profile info.'}

        INSTRUCTIONS:
        1. Answer the user's question conversationally.
        2. Use the "Relevant College Data" provided above if it matches the user's question. If the data isn't there, rely on your general knowledge but mention you are estimating.
        3. Be concise but warm. Use emojis occasionally (👋, 🎓, ✨).
        4. If the user asks about a specific college not in your context, say you can look it up if they provide the full name.
        5. Format important stats (tuition, rates) in **bold**.
        
        User Query: {user_message}
        """

        # --- 3. CALL GEMINI & STREAM (using cached model) ---
        try:
            model = _get_gemini_model()
            if not model:
                raise Exception("GEMINI_API_KEY not configured.")

            # Parse history for Gemini
            raw_history = request.data.get('history', [])
            gemini_history = []
            for msg in raw_history:
                role = msg.get('role')
                content = msg.get('parts', [""])[0]
                if role and content:
                    gemini_history.append({"role": role, "parts": [content]})
            
            # --- CONVERSATIONAL PERSISTENCE: Restore history if UI was cleared ---
            if not gemini_history and request.user.is_authenticated:
                # Retrieve last 8 messages to maintain context even after visual clear
                last_messages = ChatMessage.objects.filter(user=request.user).order_by('-created_at')[:8]
                # Map and reverse to maintain chronological order for Gemini
                for m in reversed(last_messages):
                    gemini_history.append({
                        "role": m.role if m.role else "user",
                        "parts": [m.content]
                    })

            # Create a generator for the streaming response
            def event_stream():
                full_response = ""
                try:
                    # Construct full prompt with history
                    full_prompt = system_prompt
                    if gemini_history:
                        history_text = "\n\nCHAT HISTORY:\n"
                        for msg in gemini_history:
                            role = "User" if msg['role'] == 'user' else "Wormie"
                            history_text += f"{role}: {msg['parts'][0]}\n"
                        full_prompt = history_text + "\n" + system_prompt

                    response = model.generate_content(full_prompt, stream=True)
                    for chunk in response:
                        if chunk.text:
                            full_response += chunk.text
                            yield chunk.text
                    
                    # Save AI response once done
                    if request.user.is_authenticated and full_response:
                        ChatMessage.objects.create(user=request.user, role='model', content=full_response)

                except Exception as stream_e:
                    error_str = str(stream_e).lower()
                    if "429" in error_str or "quota" in error_str:
                        yield "\n\n(I'm currently receiving too many requests. Please try again in about a minute!)"
                    else:
                        yield f"\n[Error: {str(stream_e)}]"

            return StreamingHttpResponse(event_stream(), content_type='text/plain')

        except Exception as e:
            print(f"LLM Setup Error: {e}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
