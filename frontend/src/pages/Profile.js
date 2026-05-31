import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import axios from 'axios';
import AddInfoModal from '../utils/AddInfoModal';
import AddBioModal from '../utils/AddBioModal';
import { useCurrentUser } from '../UserProvider/UserProvider';
import { icons, images } from '../constants';
import ManageServicesModal from '../utils/ManageServicesModal';
import { baseUrl } from '../shared';
import useFetch from '../hooks/FetchData';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckBadgeIcon, SparklesIcon } from '@heroicons/react/24/solid';
import PostList from '../components/PostList';

const Profile = () => {

    const navigate = useNavigate();
    const { user, fetchUser, loading } = useCurrentUser();
    // console.log("user", user);
    // console.log("loading", loading);
    const token = localStorage.getItem('access');
    const location = useLocation();
    const [isFriend, setIsFriend] = useState(false);
    const otherUser = location.state?.otherUser;
    const [pendingRequests, setPendingRequests] = useState([]);
    const [activeTab, setActiveTab] = useState('about');
    const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
    const tabsRef = useRef(null);


    useEffect(() => {
        fetchUser();
    }, [])

    const [userData, setUserData] = useState({});
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reset the input value so the same file can be selected again if needed
        e.target.value = null;

        const formData = new FormData();
        formData.append('image', file);

        setIsUploadingImage(true);

        try {
            await axios.patch(
                `${baseUrl}api/user/update/`,
                formData,
                {
                    headers: {
                        // Let axios set the Content-Type with the correct boundary for FormData
                        'Authorization': `Bearer ${localStorage.getItem('access')}`,
                    },
                }
            );
            console.log('User image saved successfully!');
            await fetchUser(); // Refresh user data to show new image
        } catch (error) {
            console.error('Error saving user image:', error);
            const errorMessage = error.response?.data?.detail || error.message || 'Unknown error';
            alert(`Error saving user image: ${errorMessage}`);
        } finally {
            setIsUploadingImage(false);
        }
    };

    const { data: commentsData, loading: commentsLoading, error: commentsError, fetchData } = useFetch({}, token);
    const { data: postsData, loading: postsLoading, error: postsError, fetchData: fetchPostsData } = useFetch({}, token);
    const { data: friendsData, loading: friendsLoading, error: friendsError, fetchData: fetchFriendsData } = useFetch({}, token);
    // console.log("friendsData", friendsData);


    useEffect(() => {
        const fetchPosts = async () => {
            if (user?.id) {
                const url = baseUrl + `api/users/${user.id}/posts/`;
                await fetchPostsData(url, 'get');
            }
        };
        fetchPosts();
    }, [user?.id]);


    useEffect(() => {
        const fetchComments = async () => {
            if (user?.id) {
                const url = baseUrl + `api/users/${user.id}/comments/`;
                await fetchData(url, 'get');
            }
        };
        fetchComments();
    }, [user?.id]);


    useEffect(() => {
        const fetchFriends = async () => {
            if (user?.id) {
                fetchFriendsData(`${baseUrl}api/users/${user.id}/friends/`, 'get');
            }
        }
        fetchFriends();
    }, [user?.id]);

    useEffect(() => {
        if (friendsData) {
            setIsFriend(friendsData.is_friend);
        }
    }, [friendsData])



    const handleFriendRequestResponse = async (requestId, action) => {
        try {
            const response = await axios.put(`${baseUrl}api/users/friend-request/${action}/`, { id: requestId }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access')}`,
                },
            });
            alert(response.data.message);
            fetchFriendsData(`${baseUrl}api/users/${user.id}/friends/`);
            const response2 = await axios.get(`${baseUrl}api/users/pending-requests/`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access')}`,
                },
            });
            setPendingRequests(response2.data);

        } catch (error) {
            console.error('Error responding to friend request:', error);
            alert(`Error responding to friend request: ${error.message}`);
        }
    };

    useEffect(() => {
        const fetchPendingRequests = async () => {
            try {
                const response = await axios.get(`${baseUrl}api/users/pending-requests/`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('access')}`,
                    },
                });
                setPendingRequests(response.data);
            } catch (error) {
                console.error("Error fetching pending requests:", error);
            }
        };
        fetchPendingRequests();
    }, []);

    const [meetings, setMeetings] = useState([]);
    const [meetingsLoading, setMeetingsLoading] = useState(false);
    const [availabilities, setAvailabilities] = useState([]);
    const [availabilitiesLoading, setAvailabilitiesLoading] = useState(false);

    // Availability form state
    const [availDate, setAvailDate] = useState('');
    const [availStart, setAvailStart] = useState('');
    const [availEnd, setAvailEnd] = useState('');
    const [availError, setAvailError] = useState('');
    const [availSuccess, setAvailSuccess] = useState('');

    const fetchMeetings = useCallback(async () => {
        setMeetingsLoading(true);
        try {
            const res = await axios.get(`${baseUrl}api/meetings/`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('access')}` }
            });
            setMeetings(res.data);
        } catch (error) {
            console.error("Error fetching meetings:", error);
        } finally {
            setMeetingsLoading(false);
        }
    }, []);

    const fetchAvailabilities = useCallback(async () => {
        if (user?.role !== 'advisor') return;
        setAvailabilitiesLoading(true);
        try {
            const res = await axios.get(`${baseUrl}api/advisors/availability/`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('access')}` }
            });
            setAvailabilities(res.data);
        } catch (error) {
            console.error("Error fetching availabilities:", error);
        } finally {
            setAvailabilitiesLoading(false);
        }
    }, [user?.role]);

    const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);

    const verifyPayment = useCallback(async (sessionId, scheduledAt) => {
        setIsVerifyingPayment(true);
        const token = localStorage.getItem('access');
        try {
            const response = await fetch(`${baseUrl}api/payments/verify/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    scheduled_at: scheduledAt
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.status === 'completed') {
                    setVerificationResult({
                        success: true,
                        advisorName: data.advisor_name,
                        scheduledAt: data.scheduled_at
                    });
                    // Dispatch custom event for Wormie to handle
                    window.dispatchEvent(new CustomEvent('wormie-booking-success', {
                        detail: {
                            advisorName: data.advisor_name,
                            scheduledAt: data.scheduled_at
                        }
                    }));
                    fetchMeetings();
                } else {
                    setVerificationResult({ success: false, error: data.error || 'Payment not verified' });
                }
            } else {
                setVerificationResult({ success: false, error: 'Verification request failed' });
            }
        } catch (err) {
            console.error('Error verifying payment:', err);
            setVerificationResult({ success: false, error: 'Network error during verification' });
        } finally {
            setIsVerifyingPayment(false);
            // Clean up URL query parameters from history
            navigate(location.pathname, { replace: true });
        }
    }, [navigate, location.pathname, fetchMeetings]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const success = params.get('success');
        const sessionId = params.get('session_id');
        const scheduledAt = params.get('scheduled_at');

        if (success === 'true' && sessionId) {
            setActiveTab('appointments');
            verifyPayment(sessionId, scheduledAt);
        }
    }, [location.search, verifyPayment]);


    useEffect(() => {
        if (user?.id) {
            fetchMeetings();
            if (user?.role === 'advisor') {
                fetchAvailabilities();
            }
        }
    }, [user, fetchMeetings, fetchAvailabilities]);

    const handleAddAvailability = async (e) => {
        e.preventDefault();
        setAvailError('');
        setAvailSuccess('');

        if (!availDate || !availStart) {
            setAvailError('All fields are required');
            return;
        }

        let endTimeCalculated = availEnd;
        if (!endTimeCalculated) {
            try {
                const [hours, minutes] = availStart.split(':').map(Number);
                const endHours = (hours + 1) % 24;
                endTimeCalculated = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            } catch (err) {
                setAvailError('Invalid start time format');
                return;
            }
        }

        try {
            const res = await axios.post(`${baseUrl}api/advisors/availability/`, {
                date: availDate,
                start_time: availStart,
                end_time: endTimeCalculated
            }, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('access')}` }
            });

            setAvailSuccess('Availability slot added!');
            setAvailDate('');
            setAvailStart('');
            setAvailEnd('');
            fetchAvailabilities();
        } catch (err) {
            setAvailError(err.response?.data?.error || 'Failed to add availability slot');
        }
    };

    const handleDeleteAvailability = async (id) => {
        if (!window.confirm("Are you sure you want to remove this availability slot?")) return;
        try {
            await axios.delete(`${baseUrl}api/advisors/availability/${id}/`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('access')}` }
            });
            fetchAvailabilities();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete slot');
        }
    };



    return (
        <div className="min-h-screen bg-gradient-to-br from-primary via-teal-700 to-teal-900">
            {/* Cover Image Section */}
            <section className="relative block h-80 opacity-90">
                <div
                    className="absolute top-0 w-full h-full bg-center bg-cover"
                    style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1499336315816-097655dcfbda?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2710&q=80')`
                    }}
                >
                    <span id="blackOverlay" className="w-full h-full absolute opacity-40 bg-teal-900"></span>
                </div>
            </section>

            {/* Profile Content Section */}
            <section className="relative py-16 bg-transparent">
                <div className="container mx-auto px-4">
                    <div className="relative flex flex-col min-w-0 break-words bg-white w-full max-w-4xl mx-auto mb-6 shadow-xl rounded-2xl -mt-64">
                        <div className="px-6">
                            <div className="flex flex-wrap justify-center">

                                {/* Profile Image Section (Center) - Moved to top for mobile rendering */}
                                <div className="w-full lg:w-4/12 px-4 lg:order-2 flex justify-center">
                                    <div className="relative group">
                                        {user ? (
                                            <>
                                                <img
                                                    alt=""
                                                    src={user.image ? (user.image.startsWith('http') ? user.image : `${baseUrl}${user.image.startsWith('/') ? user.image.substring(1) : user.image}`) : images.avatar}
                                                    onError={(e) => { e.target.onerror = null; e.target.src = images.avatar; }}
                                                    className="shadow-xl rounded-full align-middle border-none absolute -m-16 -ml-20 lg:-ml-16 w-32 h-32 object-cover ring-4 ring-white bg-white max-w-[128px] max-h-[128px]"
                                                />
                                                {isUploadingImage && (
                                                    <div className="absolute -m-16 -ml-20 lg:-ml-16 w-32 h-32 rounded-full bg-black/40 flex items-center justify-center z-10">
                                                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="shadow-xl rounded-full align-middle border-none absolute -m-16 -ml-20 lg:-ml-16 w-32 h-32 bg-gray-200 flex items-center justify-center">
                                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                        {user?.id && !isUploadingImage && (
                                            <div className="absolute top-10 -right-4 lg:-right-6 transition-opacity duration-200">
                                                <label htmlFor="profile-upload-input" className="bg-white p-2 rounded-full shadow-lg border border-gray-100 cursor-pointer hover:bg-gray-50 transition-all flex items-center justify-center w-10 h-10 group">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                                                    </svg>
                                                    <input
                                                        type="file"
                                                        id="profile-upload-input"
                                                        style={{ display: 'none' }}
                                                        onChange={handleImageChange}
                                                        accept="image/*"
                                                    />
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Stats Section (Left) */}
                                <div className="w-full lg:w-4/12 px-4 lg:order-1 mt-4 lg:mt-0">
                                    <div className="flex justify-center py-4 lg:pt-4 pt-16 text-gray-600">
                                        <div onClick={() => navigate('/friends')} className="mr-8 p-3 text-center cursor-pointer hover:text-primary transition-colors">
                                            <span className="text-xl font-bold block uppercase tracking-wide text-gray-800">
                                                {friendsLoading ? "..." : friendsData?.friends?.length || 0}
                                            </span>
                                            <span className="text-sm">Friends</span>
                                        </div>
                                        <div onClick={() => {
                                            setActiveTab('posts');
                                            setTimeout(() => {
                                                const yOffset = -20;
                                                const y = tabsRef.current?.getBoundingClientRect().top + window.pageYOffset + yOffset;
                                                window.scrollTo({ top: y, behavior: 'smooth' });
                                            }, 100);
                                        }} className="mr-8 p-3 text-center cursor-pointer hover:text-primary transition-colors">
                                            <span className="text-xl font-bold block uppercase tracking-wide text-gray-800">
                                                {postsLoading ? "..." : postsData?.length || 0}
                                            </span>
                                            <span className="text-sm">Posts</span>
                                        </div>
                                        <div onClick={() => {
                                            setActiveTab('comments');
                                            setTimeout(() => {
                                                const yOffset = -20;
                                                const y = tabsRef.current?.getBoundingClientRect().top + window.pageYOffset + yOffset;
                                                window.scrollTo({ top: y, behavior: 'smooth' });
                                            }, 100);
                                        }} className="lg:mr-4 p-3 text-center cursor-pointer hover:text-primary transition-colors">
                                            <span className="text-xl font-bold block uppercase tracking-wide text-gray-800">
                                                {commentsLoading ? "..." : commentsData?.length || 0}
                                            </span>
                                            <span className="text-sm">Comments</span>
                                        </div>
                                    </div>
                                </div>
 
                                {/* Pending Requests Section (Right) - Empty spacing balance */}
                                <div className="hidden lg:block w-full lg:w-4/12 px-4 lg:order-3">
                                </div>
                            </div>

                            {/* Pending Requests Section (Horizontal under picture) */}
                            {pendingRequests && pendingRequests.length > 0 && (
                                <div className="w-full max-w-lg mx-auto mt-6 mb-6 px-4">
                                    <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest text-center">Pending Friend Requests</h4>
                                    <div className="space-y-3">
                                        {pendingRequests.map((request) => (
                                            <div 
                                                key={request.id} 
                                                onClick={() => navigate(`/profile/${request.user1.id}`)}
                                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-white rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md cursor-pointer gap-3 sm:gap-0"
                                            >
                                                <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                                                    <img
                                                        src={request.user1.image ? (request.user1.image.startsWith('http') ? request.user1.image : `${baseUrl}${request.user1.image.startsWith('/') ? request.user1.image.substring(1) : request.user1.image}`) : images.avatar}
                                                        onError={(e) => { e.target.onerror = null; e.target.src = images.avatar; }}
                                                        alt=""
                                                        className="w-10 h-10 rounded-full object-cover border border-gray-100 shrink-0"
                                                    />
                                                    <div className="flex flex-col min-w-0 text-left">
                                                        <p className="text-sm font-bold text-gray-900 truncate">
                                                            {request.user1.first_name || request.user1.last_name ? `${request.user1.first_name || ''} ${request.user1.last_name || ''}`.trim() : request.user1.username}
                                                        </p>
                                                        {(request.user1.first_name || request.user1.last_name) && (
                                                            <p className="text-xs text-gray-500 font-medium truncate">@{request.user1.username}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 shrink-0 ml-0 sm:ml-4 w-full sm:w-auto">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleFriendRequestResponse(request.id, 'accept'); }}
                                                        className="flex-1 sm:flex-none bg-primary hover:bg-teal-700 text-white text-xs py-2 sm:py-1.5 px-4 rounded-full shadow-sm transition-all active:scale-95 font-bold"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleFriendRequestResponse(request.id, 'reject'); }}
                                                        className="flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-2 sm:py-1.5 px-4 rounded-full shadow-sm transition-all active:scale-95 font-bold"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* User Info & Bio */}
                            <div className="text-center mt-4 lg:mt-12">
                                <div className="flex flex-col items-center justify-center mb-2">
                                    <h3 className="text-4xl font-semibold leading-normal text-gray-800 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3">
                                        {user?.first_name || user?.last_name ? `${user?.first_name || ''} ${user?.last_name || ''}`.trim() : user?.username}
                                        {user?.is_verified && (
                                            <div className="flex items-center gap-1 bg-teal-50 text-teal-600 text-[10px] uppercase tracking-widest px-2 py-1 rounded-lg border border-teal-100 shadow-sm md:ml-2">
                                                <CheckBadgeIcon className="w-4 h-4" />
                                                <span>{user?.role === 'college_staff' ? "Verified Representative" : user?.role === 'advisor' ? "Verified Advisor" : "Verified Ambassador"}</span>
                                            </div>
                                        )}
                                    </h3>
                                    
                                    {(user?.first_name || user?.last_name) && (
                                        <p className="text-md text-gray-500 font-medium">@{user?.username}</p>
                                    )}
                                    
                                    {(!user?.first_name || !user?.last_name) && (
                                        <div className="text-xs font-bold text-purple bg-purple/10 border border-purple/20 px-3 py-1.5 rounded-full flex items-center gap-2 mt-3 shadow-sm">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-purple animate-pulse">
                                                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                                            </svg>
                                            Adding your name helps colleges establish a verified connection with you
                                        </div>
                                    )}
                                </div>

                                <div className="text-sm leading-normal mt-0 mb-2 text-gray-500 font-bold uppercase flex justify-center items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-400">
                                        <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                    </svg>
                                    {user?.city || user?.state || user?.country ? (
                                        [user?.city, user?.state, user?.country]
                                            .filter(item => item)
                                            .join(', ')
                                    ) : (
                                        "Location not set"
                                    )}
                                </div>

                                <div className="mb-2 text-gray-600 mt-4 flex justify-center items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-400">
                                        <path fillRule="evenodd" d="M7.5 5.25a3 3 0 013-3h3a3 3 0 013 3v.205c.933.085 1.857.197 2.774.334 1.454.218 2.476 1.483 2.476 2.917v3.033c0 1.211-.734 2.352-1.936 2.752A24.726 24.726 0 0112 15.75c-2.73 0-5.357-.442-7.814-1.259-1.202-.4-1.936-1.541-1.936-2.752V8.706c0-1.434 1.022-2.7 2.476-2.917A48.814 48.814 0 017.5 5.455V5.25zm7.5 0v.09a49.488 49.488 0 00-6 0v-.09a1.5 1.5 0 011.5-1.5h3a1.5 1.5 0 011.5 1.5zm-3 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                                        <path d="M3 18.4v-2.796a4.3 4.3 0 00.713.31A26.226 26.226 0 0012 17.25c2.892 0 5.68-.468 8.287-1.335.252-.084.49-.189.713-.311V18.4c0 1.452-1.047 2.728-2.523 2.923-2.12.282-4.282.427-6.477.427a49.19 49.19 0 01-6.477-.427C4.047 21.128 3 19.852 3 18.4z" />
                                    </svg>
                                    {user?.major || "Major not set"}
                                </div>

                                <div className="mb-2 text-gray-600 flex justify-center items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-400">
                                        <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0011.7 2.805z" />
                                        <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.667 2.25 2.25 0 002.12 0z" />
                                        <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
                                    </svg>
                                    {user?.education || "University not set"}
                                </div>

                                <div className="mb-2 text-gray-600 flex justify-center items-center gap-6 mt-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] uppercase font-bold text-gray-400">GPA</span>
                                        <span className="font-semibold text-gray-800">{user?.gpa || '—'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] uppercase font-bold text-gray-400">SAT</span>
                                        <span className="font-semibold text-gray-800">{user?.sat_score || '—'}</span>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <AddInfoModal initialValues={user} fetchUser={fetchUser} />
                                </div>
                            </div>

                            {/* Tabs Navigation */}
                            <div ref={tabsRef} className="mt-8 pt-4 border-t border-gray-100 flex justify-center gap-4 sm:gap-8">
                                <button
                                    className={`pb-4 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 border-b-2 focus:outline-none focus:border-primary ${activeTab === 'about' ? 'border-primary text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                    onClick={() => {
                                        setActiveTab('about');
                                        setTimeout(() => {
                                            const yOffset = -20;
                                            const y = tabsRef.current?.getBoundingClientRect().top + window.pageYOffset + yOffset;
                                            window.scrollTo({ top: y, behavior: 'smooth' });
                                        }, 50);
                                    }}
                                >
                                    About
                                </button>
                                <button
                                    className={`pb-4 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 border-b-2 focus:outline-none focus:border-primary ${activeTab === 'posts' ? 'border-primary text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                    onClick={() => {
                                        setActiveTab('posts');
                                        setTimeout(() => {
                                            const yOffset = -20;
                                            const y = tabsRef.current?.getBoundingClientRect().top + window.pageYOffset + yOffset;
                                            window.scrollTo({ top: y, behavior: 'smooth' });
                                        }, 50);
                                    }}
                                >
                                    My Posts
                                </button>
                                <button
                                    className={`pb-4 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 border-b-2 focus:outline-none focus:border-primary ${activeTab === 'comments' ? 'border-primary text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                    onClick={() => {
                                        setActiveTab('comments');
                                        setTimeout(() => {
                                            const yOffset = -20;
                                            const y = tabsRef.current?.getBoundingClientRect().top + window.pageYOffset + yOffset;
                                            window.scrollTo({ top: y, behavior: 'smooth' });
                                        }, 50);
                                    }}
                                >
                                    My Comments
                                </button>
                                <button
                                    className={`pb-4 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 border-b-2 focus:outline-none focus:border-primary ${activeTab === 'appointments' ? 'border-primary text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                    onClick={() => {
                                        setActiveTab('appointments');
                                        setTimeout(() => {
                                            const yOffset = -20;
                                            const y = tabsRef.current?.getBoundingClientRect().top + window.pageYOffset + yOffset;
                                            window.scrollTo({ top: y, behavior: 'smooth' });
                                        }, 50);
                                    }}
                                >
                                    Appointments
                                </button>
                            </div>

                            <div className="mt-8 pb-10 min-h-[300px]">
                                {activeTab === 'about' && (
                                    <div className="w-full lg:w-9/12 mx-auto text-center animate-in fade-in duration-300">
                                        <p className="mb-4 text-lg leading-relaxed text-gray-700">
                                            {user?.bio ? user.bio : <span className="text-gray-400">No bio added yet.</span>}
                                        </p>
                                        <AddBioModal initialValues={user} fetchUser={fetchUser} />

                                        {user?.role === 'advisor' && (
                                            <div className="mt-12 p-8 bg-[#17717d]/5 rounded-[2.5rem] border border-[#17717d]/10 text-left shadow-inner relative overflow-hidden group">
                                                 <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                                    <SparklesIcon className="w-24 h-24 text-[#17717d]" />
                                                 </div>
                                                 <div className="relative z-10">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <SparklesIcon className="w-5 h-5 text-[#17717d]" />
                                                        <span className="text-sm font-black uppercase tracking-widest text-[#17717d]">Professional Advisor Profile</span>
                                                    </div>
                                                    <h4 className="text-2xl font-black text-gray-900 mb-2">{user?.specialization || 'Generalist Advisor'}</h4>
                                                    <p className="text-gray-600 leading-relaxed italic text-lg mb-8">"{user?.advisor_bio || 'Professional advisor profile is being prepared.'}"</p>
                                                    <div className="flex items-center gap-8 p-6 bg-white rounded-2xl border border-[#17717d]/20 shadow-sm">
                                                        <div>
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Consultation Fee</span>
                                                            <p className="text-3xl font-black text-[#17717d]">${parseFloat(user?.hourly_rate || 75).toFixed(0)} <span className="text-base font-medium text-gray-400">/ hr</span></p>
                                                        </div>
                                                        <div className="h-10 w-px bg-gray-100"></div>
                                                        <div>
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Marketplace Status</span>
                                                            <span className="flex items-center gap-2 text-green-600 font-black mt-1 uppercase tracking-tighter text-sm">
                                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                                Live & Active
                                                            </span>
                                                        </div>
                                                        <div className="ml-auto">
                                                            <button 
                                                                onClick={() => setIsServicesModalOpen(true)}
                                                                className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:shadow-lg transition-all active:scale-95"
                                                            >
                                                                Manage Packages
                                                            </button>
                                                        </div>
                                                    </div>
                                                 </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <ManageServicesModal 
                                    isOpen={isServicesModalOpen}
                                    onClose={() => setIsServicesModalOpen(false)}
                                    services={user?.services}
                                    onUpdate={fetchUser}
                                />

                                {activeTab === 'posts' && (
                                    <div className="w-full max-w-2xl mx-auto -mx-4 sm:mx-auto animate-in fade-in duration-300">
                                        {postsLoading ? (
                                            <div className="flex justify-center p-8"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>
                                        ) : postsData && postsData.length > 0 ? (
                                            <PostList posts={postsData} onAddPost={(scrollToTop = true) => {
                                                const url = baseUrl + `api/users/${user.id}/posts/`;
                                                fetchPostsData(url, 'get', !scrollToTop);
                                            }} />
                                        ) : (
                                            <div className="text-center py-12 text-gray-400 italic bg-gray-50 rounded-2xl mx-4 sm:mx-0">
                                                You haven't made any posts yet.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'comments' && (
                                    <div className="w-full max-w-2xl mx-auto space-y-4 animate-in fade-in duration-300">
                                        {commentsLoading ? (
                                            <div className="flex justify-center p-8"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>
                                        ) : commentsData && commentsData.length > 0 ? (
                                            commentsData.map(comment => (
                                                <div key={comment.id} className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left">
                                                    <p className="text-gray-700 text-sm mb-3">"{comment.content}"</p>
                                                    <div className="text-[10px] text-gray-400 flex items-center gap-2 uppercase font-bold tracking-widest bg-gray-50 inline-block px-2 py-1 rounded-md">
                                                        <span>{new Date(comment.created_at).toLocaleDateString()} at {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-12 text-gray-400 italic bg-gray-50 rounded-2xl">
                                                You haven't commented on anything yet.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'appointments' && (
                                    <div className="w-full max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300 text-left">
                                        {/* Advisor-only Availability Manager */}
                                        {user?.role === 'advisor' && (
                                            <div className="bg-[#17717d]/5 border border-[#17717d]/10 rounded-[2.5rem] p-6 sm:p-8 shadow-sm">
                                                <div className="flex items-center gap-2 mb-6">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-[#17717d]">
                                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                                    </svg>
                                                    <h3 className="text-xl font-black text-gray-900">Manage Availability Slots</h3>
                                                </div>

                                                <form onSubmit={handleAddAvailability} className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 items-end bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-slate-800">
                                                    <div className="sm:col-span-1">
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Select Date</label>
                                                        <input 
                                                            type="date"
                                                            min={new Date().toISOString().split('T')[0]}
                                                            value={availDate}
                                                            onChange={(e) => setAvailDate(e.target.value)}
                                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-sm font-semibold"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="sm:col-span-1">
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Start Time</label>
                                                        <input 
                                                            type="time"
                                                            value={availStart}
                                                            onChange={(e) => setAvailStart(e.target.value)}
                                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-sm font-semibold"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="sm:col-span-1">
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">End Time (Optional)</label>
                                                        <input 
                                                            type="time"
                                                            value={availEnd}
                                                            onChange={(e) => setAvailEnd(e.target.value)}
                                                            placeholder="Auto 1-hour"
                                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-sm font-semibold"
                                                        />
                                                    </div>
                                                    <div className="sm:col-span-1">
                                                        <button 
                                                            type="submit"
                                                            className="w-full bg-[#17717d] hover:bg-[#135f69] text-white p-3 rounded-xl font-bold transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
                                                        >
                                                            Add Slot
                                                        </button>
                                                    </div>
                                                </form>

                                                {availError && <p className="text-red-500 text-xs font-bold mb-4">{availError}</p>}
                                                {availSuccess && <p className="text-green-600 text-xs font-bold mb-4">{availSuccess}</p>}

                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Your Availability Calendar</h4>
                                                {availabilitiesLoading ? (
                                                    <div className="flex justify-center p-4"><div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin"></div></div>
                                                ) : availabilities.length > 0 ? (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                        {availabilities.map(slot => (
                                                            <div key={slot.id} className={`p-4 rounded-2xl border flex items-center justify-between ${slot.is_booked ? 'bg-teal-50/50 border-teal-100' : 'bg-white border-gray-100 hover:border-gray-200'} transition-all shadow-sm`}>
                                                                <div>
                                                                    <p className="text-sm font-black text-gray-800">{new Date(slot.date + 'T00:00:00').toLocaleDateString(undefined, {month: 'short', day: 'numeric', weekday: 'short'})}</p>
                                                                    <p className="text-xs text-gray-500 font-bold mt-0.5">{slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}</p>
                                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full inline-block mt-2 ${slot.is_booked ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                        {slot.is_booked ? 'Booked' : 'Available'}
                                                                    </span>
                                                                </div>
                                                                {!slot.is_booked && (
                                                                    <button 
                                                                        onClick={() => handleDeleteAvailability(slot.id)}
                                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                                        title="Delete Slot"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                        </svg>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8 text-gray-400 font-medium italic bg-gray-50/50 rounded-[1.5rem] border border-dashed border-gray-200">
                                                        No availability slots configured yet. Let students know when you are available!
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Scheduled Consultation Meetings List */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-500">
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                                </svg>
                                                <h3 className="text-lg font-black text-gray-900">Upcoming Consultation Meetings</h3>
                                            </div>

                                            {meetingsLoading ? (
                                                <div className="flex justify-center p-8"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>
                                            ) : meetings.length > 0 ? (
                                                <div className="space-y-4">
                                                    {meetings.map(meeting => (
                                                        <div key={meeting.id} className="p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-slate-800">
                                                            <div className="flex items-center gap-4">
                                                                <img
                                                                    src={meeting.other_party_image ? (meeting.other_party_image.startsWith('http') ? meeting.other_party_image : `${baseUrl}${meeting.other_party_image.startsWith('/') ? meeting.other_party_image.substring(1) : meeting.other_party_image}`) : images.avatar}
                                                                    onError={(e) => { e.target.onerror = null; e.target.src = images.avatar; }}
                                                                    alt=""
                                                                    className="w-12 h-12 rounded-full object-cover border border-gray-100 shrink-0"
                                                                />
                                                                <div>
                                                                    <span className="text-[9px] font-black uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">
                                                                        {meeting.service_title}
                                                                    </span>
                                                                    <h4 className="text-base font-black text-gray-900 mt-1">
                                                                        Session with {meeting.other_party_role === 'advisor' ? 'Advisor' : 'Student'} {meeting.other_party_name}
                                                                    </h4>
                                                                    <div className="flex items-center gap-4 text-xs text-gray-500 font-bold mt-1">
                                                                        <span className="flex items-center gap-1.5">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400">
                                                                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                                                            </svg>
                                                                            {new Date(meeting.scheduled_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                                                        </span>
                                                                        <span className="flex items-center gap-1.5">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400">
                                                                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                            </svg>
                                                                            {new Date(meeting.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 shrink-0">
                                                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${meeting.status === 'scheduled' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-gray-100 text-gray-600'}`}>
                                                                    {meeting.status}
                                                                </span>
                                                                <button
                                                                    onClick={() => navigate(`/video/${meeting.room_name}`)}
                                                                    className="bg-[#17717d] hover:bg-[#135f69] text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-2"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                                                                    </svg>
                                                                    Join Room
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-12 text-gray-400 font-medium italic bg-gray-50 rounded-[2rem] border border-gray-100">
                                                    You don't have any upcoming consultation sessions scheduled.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section >

            {/* Booking Verification Overlay */}
            {isVerifyingPayment && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white/10 border border-white/20 rounded-[2.5rem] p-10 max-w-md w-full text-center shadow-2xl backdrop-blur-xl text-white">
                        <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                        <h3 className="text-2xl font-black mb-2 animate-pulse">Verifying Consultation Booking</h3>
                        <p className="text-gray-300 text-sm">Please wait while we confirm your Stripe checkout transaction with our database...</p>
                    </div>
                </div>
            )}

            {verificationResult && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full text-center shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in duration-200 text-slate-800">
                        <button 
                            onClick={() => setVerificationResult(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl p-1"
                        >
                            ✕
                        </button>
                        {verificationResult.success ? (
                            <>
                                <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-teal-100 shadow-inner">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-10 h-10 text-teal-600">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                                    Booking Confirmed
                                </span>
                                <h3 className="text-3xl font-black text-gray-900 mt-4 mb-2">
                                    Session Scheduled!
                                </h3>
                                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                                    Your appointment with <span className="font-extrabold text-[#17717d]">Advisor {verificationResult.advisorName}</span> has been successfully booked for:
                                    <br />
                                    <span className="font-bold text-gray-900 block mt-2 text-base">
                                        {new Date(verificationResult.scheduledAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        <br />
                                        at {new Date(verificationResult.scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </p>
                                <div className="bg-purple-50/50 border border-purple-200/50 p-4 rounded-2xl mb-6 text-left">
                                    <div className="flex gap-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#A855F7] shrink-0 mt-0.5 animate-pulse">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6.75 6.75 0 100-13.5 6.75 6.75 0 000 13.5zM12 7.5v4.5l3 1.5" />
                                        </svg>
                                        <div>
                                            <p className="text-xs font-black text-[#A855F7] uppercase tracking-wider">Message from Wormie</p>
                                            <p className="text-xs text-purple-700/80 mt-0.5 leading-relaxed font-medium">Check your chat! I have loaded your appointment info and am ready to help you prepare.</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setVerificationResult(null)}
                                    className="w-full bg-[#17717d] hover:bg-[#135f69] text-white py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-[#17717d]/20"
                                >
                                    Awesome, thank you!
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-inner">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-10 h-10 text-red-600">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-3 py-1 rounded-full">
                                    Verification Failed
                                </span>
                                <h3 className="text-2xl font-black text-gray-900 mt-4 mb-2">
                                    Couldn't Verify Payment
                                </h3>
                                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                                    We ran into an issue confirming your checkout:
                                    <br />
                                    <span className="font-bold text-red-500 block mt-1">{verificationResult.error}</span>
                                </p>
                                <button
                                    onClick={() => setVerificationResult(null)}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg"
                                >
                                    Close
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div >
    );
};

export default Profile;
