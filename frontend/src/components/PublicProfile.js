import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { baseUrl } from '../shared';
import { images } from '../constants';
import useFetch from '../hooks/FetchData';
import { useCurrentUser } from '../UserProvider/UserProvider';
import PostList from '../components/PostList';
import { LockClosedIcon, ChatBubbleLeftRightIcon, Squares2X2Icon } from '@heroicons/react/24/outline';

const PublicProfile = () => {
    const location = useLocation();
    let otherUser = location.state?.otherUser;
    const { userId } = useParams();
    const [isFriend, setIsFriend] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [otherUserData, setOtherUserData] = useState(otherUser);
    const { user: currentUser } = useCurrentUser();
    const token = localStorage.getItem('access');

    const { data: friendsData, loading: friendsLoading, fetchData: fetchFriendsData } = useFetch({}, token);
    const { data: postsData, loading: postsLoading, fetchData: fetchPostsData } = useFetch({}, token);
    const { data: commentsData, loading: commentsLoading, fetchData: fetchCommentsData } = useFetch({}, token);
    const { data: updatedOtherUserData, fetchData: refetchOtherUser } = useFetch({}, token);

    useEffect(() => {
        if (userId) {
            fetchFriendsData(`${baseUrl}api/users/${userId}/friends/`, 'get');
            refetchOtherUser(`${baseUrl}api/users/${userId}/`, 'get');
            fetchPostsData(`${baseUrl}api/users/${userId}/posts/`, 'get');
            fetchCommentsData(`${baseUrl}api/users/${userId}/comments/`, 'get');
        }
    }, [userId]);

    useEffect(() => {
        if (friendsData) {
            setIsFriend(friendsData.is_friend);
            setIsPending(friendsData.is_pending);
        }
    }, [friendsData]);

    useEffect(() => {
        if (updatedOtherUserData) {
            setOtherUserData(updatedOtherUserData);
        }
    }, [updatedOtherUserData]);

    const handleFriendRequest = async (friendId) => {
        try {
            await axios({
                method: isFriend ? 'delete' : 'post',
                url: `${baseUrl}api/users/${friendId}/${isFriend ? 'unfriend/' : 'friend-request/'}`,
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchFriendsData(baseUrl + `api/users/${userId}/friends/`, 'get');
        } catch (error) {
            console.error('Error handling friend request:', error);
        }
    };

    const isOwnProfile = currentUser?.id === parseInt(userId);
    const isRestricted = otherUserData?.is_private && !isFriend && !isOwnProfile;

    return (
        <div className="min-h-screen bg-primary pb-20">
            {/* Cover Image Section */}
            <section className="relative block h-72">
                <div
                    className="absolute top-0 w-full h-full bg-center bg-cover"
                    style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1499336315816-097655dcfbda?ixlib=rb-1.2.1&auto=format&fit=crop&w=2710&q=80')`
                    }}
                >
                    <span className="w-full h-full absolute opacity-40 bg-gray-900"></span>
                </div>
            </section>

            {/* Profile Content Section */}
            <section className="relative -mt-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-3xl border border-white/20">
                        <div className="px-8 pb-10">
                            <div className="flex flex-wrap justify-between items-end -mt-12 sm:-mt-16 mb-8 gap-6">
                                {/* Profile Information (Left/Center) */}
                                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
                                    <div className="relative group">
                                        <img
                                            alt="Profile"
                                            src={otherUserData?.image ? baseUrl + otherUserData.image : images.avatar}
                                            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover ring-4 ring-white bg-white shadow-lg"
                                        />
                                        {otherUserData?.is_private && (
                                            <div className="absolute -top-2 -right-2 bg-primary p-2 rounded-xl shadow-lg border-2 border-white">
                                                <LockClosedIcon className="w-5 h-5 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="pb-2">
                                        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                                            {otherUserData?.username}
                                        </h1>
                                        <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-2 text-sm text-gray-500 font-medium">
                                            <span className="flex items-center gap-1.5">
                                                <Squares2X2Icon className="w-4 h-4 text-gray-400" />
                                                {otherUserData?.major || "Undecided Major"}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                                                {otherUserData?.city || "No Location"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions (Right) */}
                                <div className="pb-2 w-full sm:w-auto">
                                    {!isOwnProfile && (
                                        <button
                                            className={`w-full sm:w-auto px-8 py-3 rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl active:scale-95 ${isFriend
                                                ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'
                                                : isPending
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'bg-primary text-white hover:bg-teal-700'
                                                }`}
                                            onClick={() => handleFriendRequest(otherUserData.id)}
                                            disabled={isPending}
                                        >
                                            {isFriend ? "Unfriend" : isPending ? "Request Sent" : "Add Connection"}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-gray-100 pt-10">
                                {/* Sidebar Info */}
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">About</h3>
                                        <p className="text-gray-600 leading-relaxed italic">
                                            {otherUserData?.bio || "No biography provided yet."}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500 font-medium">Connections</span>
                                            <span className="text-sm font-bold text-gray-900">{friendsData?.friends?.length || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500 font-medium">Activity</span>
                                            <span className="text-sm font-bold text-gray-900">{postsData?.length || 0} Posts</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Activity Feed */}
                                <div className="md:col-span-2">
                                    {isRestricted ? (
                                        <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-center">
                                            <div className="p-5 bg-white shadow-xl rounded-full mb-6">
                                                <LockClosedIcon className="w-10 h-10 text-primary" />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">This Profile is private</h3>
                                            <p className="text-gray-500 max-w-sm">Connect with {otherUserData?.username} to see their posts, comments, and other activity.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-10">
                                            <section>
                                                <div className="flex items-center gap-2 mb-6 text-gray-900">
                                                    <Squares2X2Icon className="w-6 h-6 text-primary" />
                                                    <h2 className="text-xl font-bold">Latest Posts</h2>
                                                </div>
                                                {postsLoading ? (
                                                    <div className="animate-pulse space-y-4">
                                                        <div className="h-40 bg-gray-100 rounded-2xl"></div>
                                                    </div>
                                                ) : postsData?.length > 0 ? (
                                                    <PostList posts={postsData} />
                                                ) : (
                                                    <p className="text-gray-400 italic">No posts yet.</p>
                                                )}
                                            </section>

                                            <section>
                                                <div className="flex items-center gap-2 mb-6 text-gray-900">
                                                    <ChatBubbleLeftRightIcon className="w-6 h-6 text-primary" />
                                                    <h2 className="text-xl font-bold">Comments</h2>
                                                </div>
                                                {commentsLoading ? (
                                                    <div className="animate-pulse h-20 bg-gray-100 rounded-2xl"></div>
                                                ) : commentsData?.length > 0 ? (
                                                    <div className="space-y-4">
                                                        {commentsData.map(comment => (
                                                            <div key={comment.id} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                                                <p className="text-gray-700 text-sm">"{comment.content}"</p>
                                                                <div className="mt-2 text-[10px] text-gray-400 flex items-center gap-2 uppercase font-bold tracking-widest">
                                                                    <span>on {new Date(comment.created_at).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-400 italic">No comments yet.</p>
                                                )}
                                            </section>
                                        </div>
                                    )}
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