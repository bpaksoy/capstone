import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { baseUrl } from '../shared';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, XMarkIcon, UserIcon, UserPlusIcon } from '@heroicons/react/24/outline';

const SearchProfilesModal = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (query.trim()) {
                handleSearch(query);
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSearch = async (searchQuery) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access');
            const res = await axios.get(`${baseUrl}api/users/search/?q=${encodeURIComponent(searchQuery)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResults(res.data);
        } catch (err) {
            console.error("Error searching profiles:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (userId) => {
        try {
            const token = localStorage.getItem('access');
            await axios.post(`${baseUrl}api/users/${userId}/friend-request/`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state to reflect pending status
            setResults(prev => prev.map(u =>
                u.id === userId ? { ...u, friendship_status: 'pending' } : u
            ));
        } catch (err) {
            console.error("Error sending connection request:", err);
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

                <div className="inline-block w-full max-w-lg text-left align-middle transition-all transform sm:my-8 bg-white shadow-2xl rounded-2xl overflow-hidden relative z-10">
                    <div className="flex items-center px-4 py-3 border-b border-gray-100">
                        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 mr-3" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search for people..."
                            className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-gray-900 placeholder-gray-400"
                            autoFocus
                        />
                        <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 transition-colors">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto bg-gray-50/50 min-h-[100px] p-4">
                        {loading && results.length === 0 && (
                            <div className="flex justify-center py-4 text-primary">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}

                        {!loading && query && results.length === 0 && (
                            <div className="text-center py-10 text-gray-400 font-medium pb-20 text-sm">
                                <p>No profiles found matching "{query}"</p>
                            </div>
                        )}

                        {!loading && !query && (
                            <div className="text-center py-8 text-gray-400 font-medium text-sm flex flex-col items-center">
                                <UserIcon className="w-8 h-8 mb-2 opacity-30" />
                                <p>Type to search users</p>
                            </div>
                        )}

                        <div className="space-y-3">
                            {results.map((item) => (
                                <div key={item.id} className="bg-white border text-left border-gray-100 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3 overflow-hidden mr-4">
                                        {item.image ? (
                                            <img src={item.image} alt={item.username} className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center border border-teal-100">
                                                <UserIcon className="w-5 h-5 text-primary" />
                                            </div>
                                        )}
                                        <div className="overflow-hidden">
                                            <h4 className="font-bold text-gray-900 truncate text-sm">{item.username}</h4>
                                            <p className="text-xs text-gray-500 truncate">{item.role === 'college_staff' ? 'College Staff' : 'Student'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {!item.is_private && (
                                            <button
                                                onClick={() => {
                                                    onClose();
                                                    navigate(`/profile/${item.id}`);
                                                }}
                                                className="text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors border-0 outline-none"
                                            >
                                                View Profile
                                            </button>
                                        )}

                                        {item.friendship_status === 'none' && (
                                            <button
                                                onClick={() => handleConnect(item.id)}
                                                className="text-xs font-bold bg-primary text-white hover:bg-teal-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border-0"
                                            >
                                                <UserPlusIcon className="w-3.5 h-3.5" />
                                                Connect
                                            </button>
                                        )}

                                        {item.friendship_status === 'pending' && (
                                            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-inner">
                                                Pending
                                            </span>
                                        )}

                                        {item.friendship_status === 'accepted' && (
                                            <span className="text-xs font-bold text-primary bg-teal-50 px-3 py-1.5 rounded-lg">
                                                Connected
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchProfilesModal;
