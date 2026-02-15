import React, { useState, useRef, useEffect } from 'react';
import {
    ChatBubbleLeftRightIcon,
    XMarkIcon,
    PaperAirplaneIcon,
    SparklesIcon,
    AcademicCapIcon
} from '@heroicons/react/24/outline';
import { useCurrentUser } from '../UserProvider/UserProvider';
import axios from 'axios';
import { baseUrl } from '../shared';

const AIAgent = () => {
    const { user, loggedIn } = useCurrentUser();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([
        {
            role: 'assistant',
            content: "Hello! I'm your College Guru. I can help you find the perfect university, understand admission requirements, or analyze your bookmarks. How can I assist you today?"
        }
    ]);
    const [isThinking, setIsThinking] = useState(false);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory, isThinking]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim() || isThinking) return;

        const userMessage = message.trim();
        setMessage('');
        setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsThinking(true);

        try {
            const token = localStorage.getItem('access');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await axios.post(`${baseUrl}api/ai/chat/`, { message: userMessage }, { headers });

            if (response.data && response.data.reply) {
                setChatHistory(prev => [...prev, { role: 'assistant', content: response.data.reply }]);
            } else {
                throw new Error("No reply from AI");
            }

        } catch (error) {
            console.error('AI Error:', error);
            setChatHistory(prev => [...prev, { role: 'assistant', content: "I'm having a little trouble connecting to my knowledge base. Please try again in a moment!" }]);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[380px] h-[500px] bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden flex flex-col animate-slideUp">
                    {/* Header */}
                    <div className="p-5 bg-primary text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl">
                                <SparklesIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm tracking-tight">College Guru</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                    <span className="text-[10px] text-teal-100 font-medium uppercase tracking-wider">AI Assistant Online</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-gray-50/30">
                        {chatHistory.map((chat, index) => (
                            <div
                                key={index}
                                className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${chat.role === 'user'
                                    ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-teal-500/10'
                                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100 shadow-sm'
                                    }`}>
                                    {chat.content}
                                </div>
                            </div>
                        ))}
                        {isThinking && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-100 p-3.5 rounded-2xl rounded-tl-none shadow-sm">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2 items-center">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Ask the Guru..."
                            className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-gray-700"
                        />
                        <button
                            type="submit"
                            disabled={!message.trim() || isThinking}
                            className="p-2.5 bg-primary text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex-shrink-0"
                        >
                            <PaperAirplaneIcon className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            )}

            {/* Floating Bubble */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group relative p-4 rounded-full shadow-2xl transition-all duration-500 hover:scale-110 active:scale-90 flex items-center justify-center ${isOpen
                    ? 'bg-white text-primary'
                    : 'bg-primary text-white animate-bounce-slow'
                    }`}
            >
                <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20 group-hover:opacity-40"></div>
                {isOpen ? (
                    <XMarkIcon className="w-8 h-8 relative z-10" />
                ) : (
                    <SparklesIcon className="w-8 h-8 relative z-10" />
                )}

                {!isOpen && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></div>
                )}
            </button>
        </div>
    );
};

export default AIAgent;
