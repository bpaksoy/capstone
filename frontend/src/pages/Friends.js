import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { baseUrl } from '../shared';
import { images } from '../constants';
import { UserIcon, AcademicCapIcon, MapPinIcon } from '@heroicons/react/24/outline';

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
        navigate(`/profile/${friendId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary via-teal-700 to-teal-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-primary py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">My Connections</h1>
                    <p className="text-teal-100 text-lg font-medium">
                        {friends.length} {friends.length === 1 ? 'Friend' : 'Friends'}
                    </p>
                </div>

                {/* Friends Grid */}
                {error ? (
                    <div className="text-center py-20">
                        <p className="text-red-300 font-medium">Error loading friends: {error}</p>
                    </div>
                ) : friends.length === 0 ? (
                    <div className="text-center py-20 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 max-w-2xl mx-auto shadow-2xl">
                        <div className="w-24 h-24 mx-auto mb-6 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm">
                            <UserIcon className="w-12 h-12 text-white/80" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-3">No connections yet</h2>
                        <p className="text-white/70 mb-8 text-lg px-4">Start connecting with other students to build your network!</p>
                        <button
                            onClick={() => navigate('/')}
                            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary font-bold rounded-2xl hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
                        >
                            Explore Colleges
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {friends.map((friend) => (
                            <div
                                key={friend.id}
                                className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:bg-white group border border-white/20"
                            >
                                <div className="p-6 text-center">
                                    {/* Profile Image */}
                                    <div className="relative inline-block mb-5">
                                        <div className="relative">
                                            <img
                                                src={friend.image ? baseUrl + friend.image : images.avatar}
                                                alt={friend.username}
                                                className="w-28 h-28 rounded-3xl object-cover ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all shadow-lg"
                                            />
                                            <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-green-500 rounded-full border-4 border-white shadow-md"></div>
                                        </div>
                                    </div>

                                    {/* User Info */}
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 truncate">
                                        {friend.username}
                                    </h3>

                                    <div className="space-y-2 mb-5">
                                        {friend.education && (
                                            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">
                                                <AcademicCapIcon className="w-4 h-4 text-primary flex-shrink-0" />
                                                <span className="truncate font-medium">{friend.education}</span>
                                            </div>
                                        )}

                                        {friend.major && (
                                            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-primary flex-shrink-0">
                                                    <path fillRule="evenodd" d="M6 3.75A2.75 2.75 0 018.75 1h2.5A2.75 2.75 0 0114 3.75v.443c.572.055 1.14.122 1.706.2C17.053 4.582 18 5.75 18 7.07v3.469c0 1.126-.694 2.191-1.83 2.54-1.952.599-4.024.921-6.17.921s-4.219-.322-6.17-.921C2.694 12.73 2 11.665 2 10.539V7.07c0-1.321.947-2.489 2.294-2.676A41.047 41.047 0 016 4.193V3.75zm6.5 0v.325a41.622 41.622 0 00-5 0V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25zM10 10a1 1 0 00-1 1v.01a1 1 0 001 1h.01a1 1 0 001-1V11a1 1 0 00-1-1H10z" clipRule="evenodd" />
                                                    <path d="M3 15.055v-.684c.126.053.255.1.39.142 2.092.642 4.313.987 6.61.987 2.297 0 4.518-.345 6.61-.987.135-.041.264-.089.39-.142v.684c0 1.347-.985 2.53-2.363 2.686a41.454 41.454 0 01-9.274 0C3.985 17.585 3 16.402 3 15.055z" />
                                                </svg>
                                                <span className="truncate font-medium">{friend.major}</span>
                                            </div>
                                        )}

                                        {(friend.city || friend.state) && (
                                            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">
                                                <MapPinIcon className="w-4 h-4 text-primary flex-shrink-0" />
                                                <span className="truncate font-medium">
                                                    {[friend.city, friend.state].filter(Boolean).join(', ')}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* View Profile Button */}
                                    <button
                                        onClick={() => handleViewProfile(friend.id)}
                                        className="w-full px-4 py-3 bg-primary hover:bg-teal-700 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95"
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
