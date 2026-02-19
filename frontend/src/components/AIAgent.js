import React, { useState, useRef, useEffect } from 'react';
import {
    ChatBubbleLeftRightIcon,
    XMarkIcon,
    PaperAirplaneIcon,
    SparklesIcon,
    AcademicCapIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import { useCurrentUser } from '../UserProvider/UserProvider';
import axios from 'axios';
import { baseUrl } from '../shared';

import { useLocation } from 'react-router-dom';

const AIAgent = () => {
    const { user, loggedIn } = useCurrentUser();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const location = useLocation();

    const [chatHistory, setChatHistory] = useState([
        {
            role: 'assistant',
            content: "Hello! I'm Wormie, your personal college admissions assistant. I'm analyzing your profile to give you the best advice..."
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

    // Load chat history on mount/login
    useEffect(() => {
        if (loggedIn) {
            const fetchHistory = async () => {
                try {
                    const token = localStorage.getItem('access');
                    if (!token) return;

                    const response = await axios.get(`${baseUrl}api/ai/history/`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (response.data && response.data.length > 0) {
                        // Map roles: 'model' -> 'assistant'
                        const history = response.data.map(m => ({
                            role: m.role === 'model' ? 'assistant' : 'user',
                            content: m.content
                        }));
                        setChatHistory(history);
                    }
                } catch (error) {
                    console.error("Error fetching chat history", error);
                }
            };
            fetchHistory();
        } else {
            // Reset to default greeting if logged out
            setChatHistory([
                {
                    role: 'assistant',
                    content: "Hello! I'm Wormie, your personal college admissions assistant. I'm analyzing your profile to give you the best advice..."
                }
            ]);
        }
    }, [loggedIn]); // Re-trigger when login state changes

    const handleClearHistory = async () => {
        if (!window.confirm("Are you sure you want to clear your chat history?")) return;

        try {
            const token = localStorage.getItem('access');
            if (token) {
                await axios.delete(`${baseUrl}api/ai/history/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
            setChatHistory([
                {
                    role: 'assistant',
                    content: "History cleared! How can I help you today?"
                }
            ]);
        } catch (error) {
            console.error("Error clearing history", error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim() || isThinking) return;

        const userMessage = message.trim();
        setMessage('');
        setChatHistory(prev => [...prev, { role: 'user', content: userMessage }, { role: 'assistant', content: "" }]);
        setIsThinking(true);

        try {
            const token = localStorage.getItem('access');
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            const response = await fetch(`${baseUrl}api/ai/chat/`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    message: userMessage,
                    context: {
                        path: location.pathname
                    },
                    history: chatHistory.slice(-5).map(msg => ({
                        role: msg.role === 'assistant' ? 'model' : 'user',
                        parts: [msg.content]
                    }))
                })
            });

            if (!response.ok) throw new Error("Failed to connect to AI");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let fullReply = "";

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunkValue = decoder.decode(value, { stream: !done });

                if (chunkValue) {
                    fullReply += chunkValue;

                    // Update the last message (assistant's reply) with the new chunk
                    setChatHistory(prev => {
                        const newHistory = [...prev];
                        // If it's a proactive greeting (special generic response object from views), 
                        // the format might be different, but here we expect plain text stream.
                        // However, our proactive greeting logic returns JSON. 
                        // Wait, we need to handle if it returns JSON (proactive) vs Stream (chat).
                        // Actually, chat view now returns StreamingHttpResponse for normal chat. 
                        // But proactive returns JSON Response. Fetch handles both but we need to parse.

                        // Check if it looks like JSON error or simple text
                        // For this implementation, we assume stream is text. 

                        newHistory[newHistory.length - 1] = {
                            role: 'assistant',
                            content: fullReply
                        };
                        return newHistory;
                    });
                }
            }

        } catch (error) {
            console.error('AI Error:', error);
            setChatHistory(prev => {
                const newHistory = [...prev];
                newHistory[newHistory.length - 1] = {
                    role: 'assistant',
                    content: "I'm having a little trouble connecting to my knowledge base. Please try again in a moment!"
                };
                return newHistory;
            });
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="fixed top-1/2 right-6 -translate-y-1/2 z-[100] flex flex-col items-end pointer-events-none">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-full max-w-[420px] h-[550px] bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/40 overflow-hidden flex flex-col animate-slideUp pointer-events-auto">
                    {/* Header - Clean & Professional */}
                    <div className="p-6 bg-gray-800 text-white flex items-center justify-between border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#A855F7] rounded-2xl">
                                <img src="/wormie-logo.svg" alt="Wormie" className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg tracking-tight">Wormie</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                                    <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Global Admissions Agent</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {loggedIn && (
                                <button
                                    onClick={handleClearHistory}
                                    className="p-1.5 hover:bg-white/10 rounded-xl transition-colors text-white/50 hover:text-white"
                                    title="Clear History"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 hover:bg-white/10 rounded-xl transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gray-50/30">
                        {chatHistory.map((chat, index) => (
                            <div
                                key={index}
                                className={`flex w-full ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${chat.role === 'user'
                                    ? 'bg-[#A855F7] text-white rounded-tr-none shadow-lg shadow-purple-500/20'
                                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-200 shadow-sm'
                                    }`}>
                                    {chat.content.split('\n').map((line, i) => (
                                        <React.Fragment key={i}>
                                            {line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
                                                if (part.startsWith('**') && part.endsWith('**')) {
                                                    return <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>;
                                                }
                                                return <span key={j}>{part}</span>;
                                            })}
                                            {i < chat.content.split('\n').length - 1 && <br />}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {isThinking && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-100 p-4 rounded-3xl rounded-tl-none shadow-sm">
                                    <div className="flex gap-1.5">
                                        <div className="w-2 h-2 bg-purple/40 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-purple/40 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                        <div className="w-2 h-2 bg-purple/40 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSendMessage} className="p-5 bg-white border-t border-gray-100 flex gap-3 items-center">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 bg-gray-50 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-purple/20 transition-all outline-none text-gray-700 font-medium"
                        />
                        <button
                            type="submit"
                            disabled={!message.trim() || isThinking}
                            className="p-3 bg-black text-white rounded-2xl hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex-shrink-0 shadow-lg shadow-black/30"
                        >
                            <PaperAirplaneIcon className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            )}

            {/* Floating Open Button - Only shows when closed */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group relative p-5 rounded-full shadow-2xl transition-all duration-500 hover:scale-110 active:scale-90 flex items-center justify-center pointer-events-auto bg-[#A855F7] text-white border border-white/10"
                >
                    <div className="absolute inset-0 rounded-full bg-purple animate-ping opacity-20 group-hover:opacity-40"></div>
                    <img src="/wormie-logo.svg" alt="Wormie" className="w-10 h-10 relative z-10" />
                </button>
            )}
        </div>
    );
};

export default AIAgent;
