import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { baseUrl } from '../shared';
import { useCurrentUser } from '../UserProvider/UserProvider';
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon, UsersIcon, PaperClipIcon, ArrowDownTrayIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const DirectMessages = () => {
    const { user, loggedIn } = useCurrentUser();
    const [conversations, setConversations] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showSideBadge, setShowSideBadge] = useState(true);
    const [lastTotalUnread, setLastTotalUnread] = useState(0);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Fade out sidebar badges after 8 seconds to prevent them "standing there"
    useEffect(() => {
        if (showSideBadge) {
            const timer = setTimeout(() => setShowSideBadge(false), 8000);
            return () => clearTimeout(timer);
        }
    }, [showSideBadge]);

    const fetchAllMessages = async () => {
        try {
            const token = localStorage.getItem('access');
            const response = await axios.get(`${baseUrl}api/messages/`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            let currentTotalUnread = 0;
            const groups = {};
            response.data.forEach(m => {
                const otherUser = m.sender_id === user.id ?
                    { id: m.recipient_id, username: m.recipient_name } :
                    { id: m.sender_id, username: m.sender_name };

                if (!groups[otherUser.id]) {
                    groups[otherUser.id] = {
                        user: otherUser,
                        lastMessage: m,
                        unreadCount: (!m.is_read && m.recipient_id === user.id) ? 1 : 0
                    };
                } else {
                    if (new Date(m.created_at) > new Date(groups[otherUser.id].lastMessage.created_at)) {
                        groups[otherUser.id].lastMessage = m;
                    }
                    if (!m.is_read && m.recipient_id === user.id) {
                        groups[otherUser.id].unreadCount++;
                    }
                }
            });

            // Calculate total unread to trigger badge visibility
            Object.values(groups).forEach(g => {
                currentTotalUnread += g.unreadCount;
            });

            if (currentTotalUnread > lastTotalUnread) {
                setShowSideBadge(true);
            }
            setLastTotalUnread(currentTotalUnread);

            const sortedConversations = Object.values(groups).sort((a, b) =>
                new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at)
            );
            setConversations(sortedConversations);
        } catch (err) {
            console.error("Error fetching conversations:", err);
        }
    };

    const fetchChatMessages = async (otherUserId) => {
        try {
            const token = localStorage.getItem('access');
            const response = await axios.get(`${baseUrl}api/messages/?other_user_id=${otherUserId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(response.data);
            scrollToBottom();
            // Refresh conversation list to clear unread counts immediately
            fetchAllMessages();
        } catch (err) {
            console.error("Error fetching chat messages:", err);
        }
    };

    useEffect(() => {
        if (loggedIn && user) {
            fetchAllMessages();
            const interval = setInterval(fetchAllMessages, 10000);
            return () => clearInterval(interval);
        }
    }, [loggedIn, user]);

    useEffect(() => {
        if (selectedUser) {
            fetchChatMessages(selectedUser.id);
            const interval = setInterval(() => fetchChatMessages(selectedUser.id), 5000);
            return () => clearInterval(interval);
        }
    }, [selectedUser]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || !selectedUser) return;

        setIsLoading(true);
        const formData = new FormData();
        formData.append('recipient_id', selectedUser.id);
        if (newMessage.trim()) formData.append('content', newMessage);
        if (selectedFile) formData.append('attachment', selectedFile);

        try {
            const token = localStorage.getItem('access');
            await axios.post(`${baseUrl}api/messages/send/`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setNewMessage('');
            setSelectedFile(null);
            fetchChatMessages(selectedUser.id);
            fetchAllMessages();
        } catch (err) {
            console.error("Error sending message:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const renderAttachment = (m) => {
        if (!m.attachment_url) return null;

        const isImage = m.attachment_url.match(/\.(jpeg|jpg|gif|png)$/i);
        const isMine = m.sender_id === user.id;

        if (isImage) {
            return (
                <div className="mt-2 rounded-xl overflow-hidden border border-white/20 shadow-sm max-w-full">
                    <img src={m.attachment_url} alt="Attachment" className="max-h-60 object-contain mx-auto" />
                    <a
                        href={m.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-2 bg-black/10 hover:bg-black/20 text-[10px] font-bold uppercase tracking-wider transition-all"
                    >
                        <ArrowDownTrayIcon className="w-3 h-3" />
                        Download
                    </a>
                </div>
            );
        }

        return (
            <div className={`mt-2 p-3 rounded-xl border flex items-center justify-between gap-3 shadow-inner ${isMine ? 'bg-white/10 border-white/20' : 'bg-gray-50 border-gray-100'
                }`}>
                <div className="flex items-center gap-2 overflow-hidden">
                    <DocumentIcon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-xs font-medium truncate">
                        {m.attachment_url.split('/').pop()}
                    </span>
                </div>
                <a
                    href={m.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-1.5 rounded-lg transition-all ${isMine ? 'bg-white/20 hover:bg-white/30' : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                </a>
            </div>
        );
    };

    if (!loggedIn) return <div className="p-20 text-center">Please login to view messages.</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 h-[calc(100-200px)]">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex h-[700px]">
                {/* Conversations List */}
                <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/30">
                    <div className="p-6 border-b border-gray-100 bg-white">
                        <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {conversations.length > 0 ? (
                            conversations.map(conv => (
                                <div
                                    key={conv.user.id}
                                    onClick={() => setSelectedUser(conv.user)}
                                    className={`p-4 rounded-2xl cursor-pointer transition-all ${selectedUser?.id === conv.user.id
                                        ? 'bg-primary text-white shadow-lg shadow-teal-700/20'
                                        : 'hover:bg-white text-gray-700 hover:shadow-sm'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="font-bold text-sm truncate">{conv.user.username}</p>
                                        <p className={`text-[10px] font-bold ${selectedUser?.id === conv.user.id ? 'text-white/60' : 'text-gray-400'}`}>
                                            {new Date(conv.lastMessage.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <p className={`text-xs truncate ${selectedUser?.id === conv.user.id ? 'text-white/80' : 'text-gray-500'}`}>
                                        {conv.lastMessage.content || 'Sent an attachment'}
                                    </p>
                                    {conv.unreadCount > 0 && selectedUser?.id !== conv.user.id && showSideBadge && (
                                        <div className="mt-2 flex justify-end transition-opacity duration-500">
                                            <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                                {conv.unreadCount}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 opacity-40">
                                <UsersIcon className="w-10 h-10 mx-auto mb-2" />
                                <p className="text-xs font-bold uppercase tracking-widest">No messages yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-white">
                    {selectedUser ? (
                        <>
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-primary border border-teal-100">
                                        <UsersIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 leading-none">{selectedUser.username}</h3>
                                        <Link to={`/profile/${selectedUser.id}`} className="text-[10px] text-primary font-bold uppercase hover:underline">View Profile</Link>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gray-50/10">
                                {messages.map((m, idx) => {
                                    const isMine = m.sender_id === user.id;
                                    return (
                                        <div key={m.id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm shadow-sm ${isMine
                                                ? 'bg-primary text-white rounded-tr-none'
                                                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                                }`}>
                                                {m.content && <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>}
                                                {renderAttachment(m)}
                                                <p className={`text-[9px] mt-1.5 font-bold uppercase tracking-widest ${isMine ? 'text-white/60' : 'text-gray-400'}`}>
                                                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {selectedFile && (
                                <div className="px-6 py-2 bg-teal-50 border-t border-teal-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <PaperClipIcon className="w-4 h-4 text-primary" />
                                        <span className="text-xs font-bold text-gray-700 truncate">{selectedFile.name}</span>
                                    </div>
                                    <button onClick={() => setSelectedFile(null)} className="text-red-500 p-1">
                                        <XMarkIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            <form onSubmit={handleSend} className="p-6 border-t border-gray-100 flex gap-3 items-center">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-3 bg-gray-100 text-gray-500 rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
                                >
                                    <PaperClipIcon className="w-5 h-5" />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium text-gray-700"
                                />
                                <button
                                    type="submit"
                                    disabled={(!newMessage.trim() && !selectedFile) || isLoading}
                                    className="p-3.5 bg-primary text-white rounded-2xl hover:bg-teal-700 active:scale-95 transition-all shadow-lg shadow-teal-700/20 disabled:opacity-50"
                                >
                                    <PaperAirplaneIcon className="w-5 h-5" />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4 opacity-40">
                            <ChatBubbleLeftRightIcon className="w-20 h-20 text-gray-200" />
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Your Conversations</h3>
                                <p className="text-sm text-gray-500 max-w-sm mx-auto">Select a chat from the left to view your messages with students or college representatives.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DirectMessages;
