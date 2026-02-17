import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { baseUrl } from '../shared';
import { images } from '../constants';
import { UserIcon } from '@heroicons/react/24/outline';

const Friends = () => {
    const navigate = useNavigate();
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const token = localStorage.getItem('access');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await axios.get(`${baseUrl}api/users/friends/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setFriends(response.data.friends || []);
            } catch (error) {
                console.error('Error fetching friends:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchFriends();
    }, [navigate]);

    const handleViewProfile = (friendId) => {
        navigate(`/public-profile/${friendId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary via-teal-700 to-teal-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary via-teal-700 to-teal-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-white mb-3 tracking-tight">My Friends</h1>
                    <p className="text-blue-100 text-lg opacity-80">
                        {friends.length} {friends.length === 1 ? 'Connection' : 'Connections'}
                    </p>
                </div>

                {/* Friends Grid */}
                {error ? (
                    <div className="text-center py-20">
                        <p className="text-red-300 font-medium">Error loading friends: {error}</p>
                    </div>
                ) : friends.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 max-w-2xl mx-auto">
                        <div className="w-20 h-20 mx-auto mb-6 bg-white/10 rounded-2xl flex items-center justify-center">
                            <UserIcon className="w-10 h-10 text-white/60" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">No friends yet</h2>
                        <p className="text-white/60 mb-8">Start connecting with other students to build your network!</p>
                        <button
                            onClick={() => navigate('/')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-lg"
                        >
                            Explore
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {friends.map((friend) => (
                            <div
                                key={friend.id}
                                className="bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 group"
                            >
                                <div className="p-6 text-center">
                                    {/* Profile Image */}
                                    <div className="relative inline-block mb-4">
                                        <img
                                            src={friend.image ? baseUrl + friend.image : images.avatar}
                                            alt={friend.username}
                                            className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all"
                                        />
                                        <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-4 border-white"></div>
                                    </div>

                                    {/* User Info */}
                                    <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">
                                        {friend.username}
                                    </h3>

                                    {friend.education && (
                                        <p className="text-sm text-gray-600 mb-1 truncate flex items-center justify-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                                                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                                            </svg>
                                            {friend.education}
                                        </p>
                                    )}

                                    {friend.major && (
                                        <p className="text-sm text-gray-500 mb-4 truncate">
                                            {friend.major}
                                        </p>
                                    )}

                                    {/* View Profile Button */}
                                    <button
                                        onClick={() => handleViewProfile(friend.id)}
                                        className="w-full mt-4 px-4 py-2 bg-primary hover:bg-teal-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
                                    >
                                        View Profile
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Friends;
