import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PaperAirplaneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { baseUrl } from '../shared';
import { images } from '../constants';

const DirectMessageModal = ({ isOpen, onClose, student, collegeName }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async () => {
        if (!student) return;
        try {
            const token = localStorage.getItem('access');
            const response = await axios.get(`${baseUrl}api/messages/?other_user_id=${student.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(response.data);
            scrollToBottom();
        } catch (err) {
            console.error("Error fetching messages:", err);
        }
    };

    useEffect(() => {
        if (isOpen && student) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 5000); // Polling for new messages
            return () => clearInterval(interval);
        }
    }, [isOpen, student]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !student) return;

        setIsLoading(true);
        try {
            const token = localStorage.getItem('access');
            await axios.post(`${baseUrl}api/messages/send/`, {
                recipient_id: student.id,
                content: newMessage
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewMessage('');
            fetchMessages();
        } catch (err) {
            console.error("Error sending message:", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4 sm:px-0 bg-gray-900/60 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col h-[600px] animate-fadeIn">
                {/* Header */}
                <div className="p-6 bg-primary text-white flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            {student.image ? (
                                <img
                                    src={student.image.startsWith('http') ? student.image : (baseUrl + student.image.replace(/^\//, ''))}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
                                    alt="Avatar"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
                                    <ChatBubbleLeftRightIcon className="w-6 h-6" />
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-primary rounded-full"></div>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">{student.username}</h3>
                            <p className="text-white/70 text-xs font-medium uppercase tracking-widest">Chatting about {collegeName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-2xl transition-all active:scale-90"
                    >
                        <XMarkIcon className="w-7 h-7" />
                    </button>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30 custom-scrollbar">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                            <div className="p-6 bg-teal-50 rounded-[2rem] text-primary">
                                <ChatBubbleLeftRightIcon className="w-12 h-12 opacity-50" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">Start a Conversation</h4>
                                <p className="text-sm text-gray-500 max-w-[200px] mx-auto">Send an invitation to {student.username} to discuss their potential as a candidate.</p>
                            </div>
                        </div>
                    ) : (
                        messages.map((m, idx) => {
                            const isMine = m.sender_id !== student.id;
                            return (
                                <div key={m.id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm shadow-sm ${isMine
                                            ? 'bg-primary text-white rounded-tr-none'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                        }`}>
                                        <p className="leading-relaxed">{m.content}</p>
                                        <p className={`text-[9px] mt-1.5 font-bold uppercase tracking-widest ${isMine ? 'text-white/60' : 'text-gray-400'}`}>
                                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-6 bg-white border-t border-gray-100 flex gap-3 items-center">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Message ${student.username}...`}
                        className="flex-1 bg-gray-100 border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium text-gray-700"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isLoading}
                        className="p-3.5 bg-primary text-white rounded-2xl hover:bg-teal-700 active:scale-95 transition-all shadow-lg shadow-teal-700/20 disabled:opacity-50"
                    >
                        <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DirectMessageModal;
