import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { baseUrl } from '../shared';
import { images } from '../constants';
import useFetch from '../hooks/FetchData';
import { useCurrentUser } from '../UserProvider/UserProvider';

const PublicProfile = () => {
    const location = useLocation();
    let otherUser = location.state?.otherUser;
    console.log("otherUser", otherUser);
    const { userId } = useParams();
    const [isFriend, setIsFriend] = useState(false);
    const [isPending, setIsPending] = useState(false);
    console.log("isFriend", isFriend);
    console.log("isPending", isPending);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [otherUserData, setOtherUserData] = useState(otherUser);
    const { user: currentUser, loading: currentUserLoading, handleLogout } = useCurrentUser();
    const token = localStorage.getItem('access');

    const { data: friendsData, loading: friendsLoading, error: friendsError, fetchData: fetchFriendsData } = useFetch({}, token);
    console.log("friendsData Public", friendsData)

    useEffect(() => {
        const fetchFriends = async () => {
            const url = baseUrl + `api/users/${userId}/friends/`;
            if (userId) {
                await fetchFriendsData(url, 'get');
            }
        }
        fetchFriends();
    }, [userId]);

    useEffect(() => {
        if (friendsData) {
            setIsFriend(friendsData.is_friend);
            setIsPending(friendsData.is_pending);
        }
    }, [friendsData]);

    useEffect(() => {
        const fetchPendingRequests = async () => {
            try {
                const response = await axios.get(`${baseUrl}api/users/pending-requests/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setPendingRequests(response.data);
            } catch (error) {
                console.error("Error fetching pending requests:", error);
            }
        };
        fetchPendingRequests();
    }, []);


    const { data: updatedOtherUserData, loading: updatedLoading, error: updatedError, fetchData: refetchOtherUser } = useFetch({}, token);
    useEffect(() => {
        const refetchOtherUserData = async () => {
            const url = baseUrl + `api/users/${userId}/`;
            if (userId) {
                await refetchOtherUser(url, 'get');
            }
            if (updatedLoading) return <p>Loading...</p>;
            if (updatedError) return <p>Error: {updatedError.message}</p>;
        };
        refetchOtherUserData();
    }, [userId]);

    useEffect(() => {
        if (updatedOtherUserData) {
            setOtherUserData(updatedOtherUserData);
        }
    }, [updatedOtherUserData]);


    const handleFriendRequest = async (friendId) => {
        try {
            const response = await axios({
                method: isFriend ? 'delete' : 'post',
                url: `${baseUrl}api/users/${friendId}/${isFriend ? 'unfriend/' : 'friend-request/'}`,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            console.log("Friend request response", response);
            alert(isFriend ? 'User unfriended successfully!' : 'Friend request sent!');
            setIsFriend(response.data.is_friend);
            setIsPending(response.data.is_pending);
            fetchFriendsData(baseUrl + `api/users/${userId}/friends/`, 'get');
        } catch (error) {
            console.error('Error handling friend request:', error);
            alert('Error handling friend request.');
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
                    <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-xl rounded-2xl -mt-64">
                        <div className="px-6">
                            <div className="flex flex-wrap justify-center">

                                {/* Stats Section (Left) */}
                                <div className="w-full lg:w-4/12 px-4 lg:order-1">
                                    <div className="flex justify-center py-4 lg:pt-4 pt-8 text-gray-600">
                                        <div className="mr-8 p-3 text-center">
                                            <span className="text-xl font-bold block uppercase tracking-wide text-gray-800">
                                                {friendsLoading ? "..." : friendsData?.friends?.length || 0}
                                            </span>
                                            <span className="text-sm">Friends</span>
                                        </div>
                                        {/* Placeholders for Posts/Comments if available in future, or just empty space to match Profile.js layout balance */}
                                        <div className="lg:mr-4 p-3 text-center opacity-50">
                                            {/* <span className="text-xl font-bold block uppercase tracking-wide text-gray-800">0</span> */}
                                            {/* <span className="text-sm">Posts</span> */}
                                        </div>
                                    </div>
                                </div>

                                {/* Profile Image Section (Center) */}
                                <div className="w-full lg:w-4/12 px-4 lg:order-2 flex justify-center">
                                    <div className="relative">
                                        {otherUser && (
                                            <img
                                                alt="Profile"
                                                src={otherUser.image ? baseUrl + otherUser.image : images.avatar}
                                                className="shadow-xl rounded-full h-auto align-middle border-none absolute -m-16 -ml-20 lg:-ml-16 max-w-[128px] max-h-[128px] w-32 h-32 object-cover ring-4 ring-white bg-white"
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Actions Section (Right) */}
                                <div className="w-full lg:w-4/12 px-4 lg:order-3">
                                    <div className="py-6 px-3 mt-32 sm:mt-0 flex justify-center lg:justify-end">
                                        <button
                                            className={`uppercase font-bold hover:shadow-md shadow text-xs px-6 py-3 rounded-full outline-none focus:outline-none ease-linear transition-all duration-150 ${isFriend
                                                ? 'bg-red-500 text-white hover:bg-red-600'
                                                : isPending
                                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                                    : 'bg-primary text-white hover:bg-teal-700'
                                                }`}
                                            type="button"
                                            onClick={() => handleFriendRequest(otherUser.id)}
                                            disabled={isPending}
                                        >
                                            {isFriend ? "Disconnect" : isPending ? "Pending" : "Connect"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* User Info & Bio */}
                            <div className="text-center mt-12">
                                <h3 className="text-4xl font-semibold leading-normal text-gray-800 mb-2">
                                    {otherUser?.username}
                                </h3>

                                <div className="text-sm leading-normal mt-0 mb-2 text-gray-500 font-bold uppercase flex justify-center items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-400">
                                        <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                    </svg>
                                    {otherUser?.city || otherUser?.state || otherUser?.country ? (
                                        [otherUser?.city, otherUser?.state, otherUser?.country]
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
                                    {otherUser?.major || "Major not set"}
                                </div>

                                <div className="mb-2 text-gray-600 flex justify-center items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-400">
                                        <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0011.7 2.805z" />
                                        <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.667 2.25 2.25 0 002.12 0z" />
                                        <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
                                    </svg>
                                    {otherUser?.education || "University not set"}
                                </div>
                            </div>

                            <div className="mt-10 py-10 border-t border-gray-200 text-center">
                                <div className="flex flex-wrap justify-center">
                                    <div className="w-full lg:w-9/12 px-4">
                                        <p className="mb-4 text-lg leading-relaxed text-gray-700">
                                            {otherUser?.bio || <span className="text-gray-400 italic">No bio added.</span>}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default PublicProfile;