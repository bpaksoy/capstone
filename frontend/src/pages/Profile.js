import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import AddInfoModal from '../utils/AddInfoModal';
import AddBioModal from '../utils/AddBioModal';
import { useCurrentUser } from '../UserProvider/UserProvider';
import { icons, images } from '../constants';
import { baseUrl } from '../shared';
import useFetch from '../hooks/FetchData';
import { useLocation, useNavigate } from 'react-router-dom';

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
    // console.log("pendingRequests", pendingRequests);


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

                                {/* Stats Section (Left) */}
                                <div className="w-full lg:w-4/12 px-4 lg:order-1">
                                    <div className="flex justify-center py-4 lg:pt-4 pt-8 text-gray-600">
                                        <div onClick={() => navigate('/friends')} className="mr-8 p-3 text-center cursor-pointer hover:text-primary transition-colors">
                                            <span className="text-xl font-bold block uppercase tracking-wide text-gray-800">
                                                {friendsLoading ? "..." : friendsData?.friends?.length || 0}
                                            </span>
                                            <span className="text-sm">Friends</span>
                                        </div>
                                        <div className="mr-8 p-3 text-center cursor-pointer hover:text-primary transition-colors">
                                            <span className="text-xl font-bold block uppercase tracking-wide text-gray-800">
                                                {postsLoading ? "..." : postsData?.length || 0}
                                            </span>
                                            <span className="text-sm">Posts</span>
                                        </div>
                                        <div className="lg:mr-4 p-3 text-center cursor-pointer hover:text-primary transition-colors">
                                            <span className="text-xl font-bold block uppercase tracking-wide text-gray-800">
                                                {commentsLoading ? "..." : commentsData?.length || 0}
                                            </span>
                                            <span className="text-sm">Comments</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Profile Image Section (Center) */}
                                <div className="w-full lg:w-4/12 px-4 lg:order-2 flex justify-center">
                                    <div className="relative group">
                                        {user && (
                                            <>
                                                <img
                                                    alt="Profile"
                                                    src={user.image ? baseUrl + user.image : images.avatar}
                                                    className="shadow-xl rounded-full align-middle border-none absolute -m-16 -ml-20 lg:-ml-16 w-32 h-32 object-cover ring-4 ring-white bg-white max-w-[128px] max-h-[128px]"
                                                />
                                                {isUploadingImage && (
                                                    <div className="absolute -m-16 -ml-20 lg:-ml-16 w-32 h-32 flex items-center justify-center bg-black bg-opacity-40 rounded-full z-10 ring-4 ring-white">
                                                        <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        {user?.id && !isUploadingImage && (
                                            <div className="absolute top-10 -right-6 lg:right-[-20px] transition-opacity duration-200">
                                                <label htmlFor="profile-upload-input" className="cursor-pointer bg-white text-gray-700 hover:text-primary hover:bg-gray-100 shadow-md rounded-full p-2 flex items-center justify-center transition-all">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.122 2.122 0 0 0-1.791-1.059H8.637c-.69 0-1.35.295-1.791 1.059l-.822 1.316Z" />
                                                    </svg>
                                                </label>
                                                <input
                                                    type="file"
                                                    id="profile-upload-input"
                                                    style={{ display: 'none' }}
                                                    onChange={handleImageChange}
                                                    accept="image/*"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Pending Requests Section (Right) */}
                                <div className="w-full lg:w-4/12 px-4 lg:order-3">
                                    <div className="py-6 px-3 mt-32 sm:mt-0">
                                        {pendingRequests && pendingRequests.length > 0 ? (
                                            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
                                                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Friend Requests</h4>
                                                <div className="space-y-3">
                                                    {pendingRequests.map((request) => (
                                                        <div key={request.id} className="flex flex-col sm:flex-row justify-between items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                                            <div className="flex items-center gap-2">
                                                                <img src={request.user1.image ? baseUrl + request.user1.image : images.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                                                                <p className="text-sm font-medium text-gray-900 truncate max-w-[100px]">{request.user1.username}</p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleFriendRequestResponse(request.id, 'accept')}
                                                                    className="bg-primary hover:bg-teal-700 text-white text-xs font-bold py-1.5 px-3 rounded-full transition-colors"
                                                                >
                                                                    Accept
                                                                </button>
                                                                <button
                                                                    onClick={() => handleFriendRequestResponse(request.id, 'reject')}
                                                                    className="bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs font-bold py-1.5 px-3 rounded-full transition-colors"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            null
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* User Info & Bio */}
                            <div className="text-center mt-12">
                                <h3 className="text-4xl font-semibold leading-normal text-gray-800 mb-2">
                                    {user?.username}
                                </h3>

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

                            <div className="mt-10 py-10 border-t border-gray-200 text-center">
                                <div className="flex flex-wrap justify-center">
                                    <div className="w-full lg:w-9/12 px-4">
                                        <p className="mb-4 text-lg leading-relaxed text-gray-700">
                                            {user?.bio ? user.bio : <span className="text-gray-400 italic">No bio added yet.</span>}
                                        </p>
                                        <AddBioModal initialValues={user} fetchUser={fetchUser} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section >
        </div >
    );
};

export default Profile;
