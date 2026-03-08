import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { baseUrl } from '../shared';
import { XMarkIcon, MagnifyingGlassIcon, UserIcon, ChatBubbleLeftEllipsisIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useCurrentUser } from '../UserProvider/UserProvider';

const NewChatModal = ({ isOpen, onClose, onStartChat }) => {
    const { user, loggedIn } = useCurrentUser();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('friends'); // 'friends' or 'search'

    useEffect(() => {
        if (isOpen && loggedIn) {
            fetchFriends();
        } else {
            setQuery('');
            setResults([]);
            setFriends([]);
        }
    }, [isOpen, loggedIn]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (activeTab === 'search' && query.trim()) {
                handleSearch(query);
            } else if (activeTab === 'search') {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query, activeTab]);

    const fetchFriends = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access');
            const res = await axios.get(`${baseUrl}api/users/friends/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFriends(res.data.friends || []);
        } catch (err) {
            console.error("Error fetching friends:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (searchQuery) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access');
            const res = await axios.get(`${baseUrl}api/users/search/?q=${encodeURIComponent(searchQuery)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResults(res.data);
        } catch (err) {
            console.error("Error searching users:", err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] overflow-y-auto w-full h-full">
            <div className="flex items-start justify-center min-h-screen pt-20 px-4 pb-20 text-center sm:p-0">
                {/* Overlay */}
                <div
                    className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75 backdrop-blur-sm"
                    onClick={onClose}
                />

                <div className="inline-block w-full max-w-lg text-left align-middle transition-all transform sm:my-8 bg-white shadow-2xl rounded-2xl overflow-hidden relative z-10 flex flex-col max-h-[80vh]">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900">New Message</h3>
                        <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 transition-colors">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-100">
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'friends' ? 'text-primary border-b-2 border-primary bg-teal-50/30' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <UsersIcon className="w-4 h-4" />
                                Friends
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('search')}
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'search' ? 'text-primary border-b-2 border-primary bg-teal-50/30' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <MagnifyingGlassIcon className="w-4 h-4" />
                                Search
                            </span>
                        </button>
                    </div>

                    {/* Search Bar Content */}
                    {activeTab === 'search' && (
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <div className="relative">
                                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search by name or username..."
                                    className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto bg-white p-4 custom-scrollbar">
                        {loading && (results.length === 0 && friends.length === 0) ? (
                            <div className="flex justify-center py-10 text-primary">
                                <div className="modern-loader">
                                    <div></div><div></div><div></div><div></div>
                                </div>
                            </div>
                        ) : activeTab === 'friends' ? (
                            friends.length > 0 ? (
                                <div className="space-y-2">
                                    {friends.map((friend) => (
                                        <div 
                                            key={friend.id} 
                                            onClick={() => {
                                                onStartChat(friend);
                                                onClose();
                                            }}
                                            className="group bg-white border border-gray-100 rounded-xl p-3 flex items-center justify-between shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                {friend.image ? (
                                                    <img src={friend.image} alt={friend.username} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center border border-teal-100 text-primary">
                                                        <UserIcon className="w-5 h-5" />
                                                    </div>
                                                )}
                                                <div className="overflow-hidden">
                                                    <h4 className="font-bold text-gray-900 truncate text-sm">{friend.first_name ? `${friend.first_name} ${friend.last_name || ''}` : friend.username}</h4>
                                                    <p className="text-[10px] uppercase font-bold text-gray-400 truncate">{friend.role === 'college_staff' ? 'Staff' : 'Student'}</p>
                                                </div>
                                            </div>
                                            <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    <UsersIcon className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm font-medium">No friends found yet</p>
                                    <p className="text-[11px] mt-1">Connect with others to message them directly</p>
                                </div>
                            )
                        ) : (
                            /* Search Results */
                            results.length > 0 ? (
                                <div className="space-y-2">
                                    {results.map((item) => (
                                        <div 
                                            key={item.id} 
                                            onClick={() => {
                                                onStartChat(item);
                                                onClose();
                                            }}
                                            className="group bg-white border border-gray-100 rounded-xl p-3 flex items-center justify-between shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.username} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center border border-teal-100 text-primary">
                                                        <UserIcon className="w-5 h-5" />
                                                    </div>
                                                )}
                                                <div className="overflow-hidden">
                                                    <h4 className="font-bold text-gray-900 truncate text-sm">{item.username}</h4>
                                                    <p className="text-[10px] uppercase font-bold text-gray-400 truncate">{item.role === 'college_staff' ? 'Staff' : 'Student'}</p>
                                                </div>
                                            </div>
                                            <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            ) : query ? (
                                <div className="text-center py-12 text-gray-400">
                                    <MagnifyingGlassIcon className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm font-medium">No users found matching "{query}"</p>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    <UserIcon className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm font-medium">Searching for someone specific?</p>
                                    <p className="text-[11px] mt-1">Type their name or username above</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewChatModal;
