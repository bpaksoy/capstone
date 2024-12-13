import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import AddInfoModal from '../utils/AddInfoModal';
import AddBioModal from '../utils/AddBioModal';
import { useCurrentUser } from '../UserProvider/UserProvider';
import { icons, images } from '../constants';
import { baseUrl } from '../shared';
import useFetch from '../hooks/FetchData';
import { useLocation } from 'react-router-dom';

const Profile = () => {

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
    const [isEditing, setIsEditing] = useState(false);
    const [profileImage, setProfileImage] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        console.log("file", file);
        setIsEditing(true);
        setProfileImage(file);
    };

    useEffect(() => {
        if (profileImage) {
            handleImageSave();
        }
    }, [profileImage]);


    const handleImageSave = async () => {
        const formData = new FormData();

        if (profileImage) {
            formData.append('image', profileImage);
        } else {
            alert("Please select an image to upload.");
            return;
        }

        try {
            await axios.patch(
                'http://127.0.0.1:8000/api/user/update/',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${localStorage.getItem('access')}`,
                    },
                }
            );
            setIsEditing(false);
            console.log('User image saved successfully!');
            fetchUser();
        } catch (error) {
            console.error('Error saving user image:', error);
            alert('Error saving user image. Please try again.');
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
                fetchFriendsData(`${baseUrl}api/users/${user.id}/friends/`);
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
        <>
            <section className="relative block h-500-px">
                <div className="w-full h-full bg-center bg-cover bg-primary" style={{
                    backgroundImage: ``,
                    backgroundSize: 'cover',
                    height: '200px',
                    borderRadius: '5px',
                }}>

                </div>
                <div className="top-auto bottom-0 left-0 right-0 w-full absolute pointer-events-none overflow-hidden h-70-px" style={{ transform: 'translateZ(0px)' }}>
                    <svg className="absolute bottom-0 overflow-hidden" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" version="1.1" viewBox="0 0 2560 100" x="0" y="0">
                        <polygon className="text-blueGray-200 fill-current" points="2560 0 2560 100 0 100"></polygon>
                    </svg>
                </div>
            </section>
            <section className="relative py-48 bg-blueGray-200">
                <div className="container mx-auto px-4">
                    <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-xl rounded-lg -mt-64">
                        <div className="px-6">
                            <div className="flex flex-wrap justify-center">
                                <div className="w-full lg:w-3/12 px-4 lg:order-2 flex justify-center">
                                    <div className="relative">
                                        {user && (
                                            <img
                                                alt="..."
                                                src={user.image ? baseUrl + user.image : images.avatar}
                                                className="shadow-xl rounded-full h-auto align-middle border-none relative -m-16 -ml-2 lg:-ml-0 max-w-150-px absolute inset-0"
                                            />
                                        )}
                                        <div className="absolute bg-white hover:bg-gray-200 rounded top-34 right-8 m-2">
                                            <button>
                                                <input type="file" style={{ display: 'none' }} onChange={handleImageChange} id="profile-upload-input" className="text-white font-bold py-2 px-4 rounded flex items-center mt-12" />
                                                <label htmlFor="profile-upload-input" className="mt-2 flex items-center justify-center cursor-pointer">
                                                    <img className="size-8" src={icons.upload} alt="upload" />
                                                </label>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full lg:w-4/12 px-10 lg:order-3 lg:text-right lg:self-center">
                                    {pendingRequests && pendingRequests.length > 0 && (
                                        <div className="mt-4 border border-gray-300 rounded-lg p-4">
                                            {pendingRequests.map((request) => (
                                                <div key={request.id} className="flex justify-between items-center">
                                                    <div className="flex space-x-2">
                                                        <img src={request.user1.image ? baseUrl + request.user1.image : images.avatar} alt="avatar" className="w-8 h-8 rounded-full" />
                                                        <p className="text-gray-800 font-medium">{request.user1.username}</p>
                                                    </div>

                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handleFriendRequestResponse(request.id, 'accept')}
                                                            className="bg-primary hover:bg-gray-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:ring-2 focus:ring-green-300"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleFriendRequestResponse(request.id, 'reject')}
                                                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:ring-2 focus:ring-red-300"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="w-full lg:w-4/12 px-4 lg:order-1">
                                    <div className="flex justify-center py-4 lg:pt-4 pt-8">
                                        {friendsLoading ? (
                                            <div>Loading...</div>
                                        ) : friendsError ? (<div>Error: {friendsError.message}</div>) : (
                                            <div className="mr-4 p-3 text-center">
                                                <span className="text-xl font-bold block uppercase tracking-wide text-blueGray-600">{friendsData.friends.length}</span><span className="text-sm text-blueGray-400">Friends</span>
                                            </div>
                                        )}
                                        {postsLoading ? (
                                            <div>Loading...</div>
                                        ) : postsError ? (
                                            <div>Error: {postsError.message}</div>
                                        ) : (
                                            <div className="lg:mr-4 p-3 text-center">
                                                <span className="text-xl font-bold block uppercase tracking-wide text-blueGray-600">
                                                    {postsData.length}
                                                </span>
                                                <span className="text-sm text-blueGray-400">Posts</span>
                                            </div>
                                        )}
                                        {commentsLoading ? (
                                            <div>Loading...</div>
                                        ) : commentsError ? (
                                            <div>Error: {commentsError.message}</div>
                                        ) : (
                                            <div className="lg:mr-4 p-3 text-center">
                                                <span className="text-xl font-bold block uppercase tracking-wide text-blueGray-600">
                                                    {commentsData.length}
                                                </span>
                                                <span className="text-sm text-blueGray-400">Comments</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-center mt-16">
                                <h3 className="text-4xl font-semibold leading-normal mb-2 text-blueGray-700 mb-2">
                                    {user?.username}
                                </h3>
                                <AddInfoModal fetchUser={fetchUser} />
                                <div className="text-sm leading-normal mt-0 mb-2 text-blueGray-400 font-bold uppercase">
                                    <i className="fas fa-map-marker-alt mr-2 text-lg text-blueGray-400"></i>
                                    {user?.city || user?.state || user?.country ? (
                                        [user?.city, user?.state, user?.country]
                                            .filter(item => item) // Remove empty strings
                                            .join(', ')
                                    ) : (
                                        "Add more info"
                                    )}
                                </div>
                                <div className="mb-2 text-blueGray-600 mt-6">
                                    <i className="fas fa-briefcase mr-2 text-lg text-blueGray-400"></i>{user?.major}
                                </div>
                                <div className="mb-2 text-blueGray-600">
                                    <i className="fas fa-university mr-2 text-lg text-blueGray-400"></i>{user?.education}
                                </div>
                            </div>
                            <div className="mt-10 py-10 border-t border-blueGray-200 text-center">
                                <div className="flex flex-wrap justify-center">
                                    <div className="w-full lg:w-9/12 px-4">
                                        <p className="mb-4 text-lg leading-relaxed text-blueGray-700">
                                            {user?.bio}
                                        </p>

                                        <AddBioModal initialValues={{ bio: user?.bio }} fetchUser={fetchUser} />
                                        {/* <a href="#pablo" className="font-normal text-pink-500">Show more</a> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default Profile;
