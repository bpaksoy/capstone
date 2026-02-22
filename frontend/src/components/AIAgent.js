import React, { useState, useRef, useEffect } from 'react';
import {
    ChatBubbleLeftRightIcon,
    XMarkIcon,
    PaperAirplaneIcon,
    SparklesIcon,
    AcademicCapIcon,
    DocumentDuplicateIcon,
    ArrowPathIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import { useCurrentUser } from '../UserProvider/UserProvider';
import axios from 'axios';
import { baseUrl } from '../shared';

import { useLocation, useNavigate } from 'react-router-dom';

const AIAgent = () => {
    const { user, loggedIn } = useCurrentUser();
    const [isOpen, setIsOpen] = useState(false);
    const [unreadWormieMessage, setUnreadWormieMessage] = useState(null);
    const [message, setMessage] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTargetUser, setActiveTargetUser] = useState(() => {
        const stored = sessionStorage.getItem('activeTargetUser');
        return stored ? JSON.parse(stored) : null;
    });

    const [chatHistory, setChatHistory] = useState([
        {
            role: 'assistant',
            content: user?.role === 'college_staff'
                ? "Hello! I'm Wormie, your institutional development consultant. I'm analyzing your candidate pools and recruitment matches right now..."
                : "Hello! I'm Wormie, your personal college admissions assistant. I'm analyzing your profile to give you the best advice..."
        }
    ]);
    const [isThinking, setIsThinking] = useState(false);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                scrollToBottom();
            }, 50);
        }
    }, [chatHistory, isThinking, isOpen]);

    const notifiedMatchesRef = useRef(new Set(
        JSON.parse(sessionStorage.getItem('notifiedMatches') || '[]')
    ));

    useEffect(() => {
        if (!loggedIn || !user) return;

        const pingOnlineStatus = async () => {
            try {
                const token = localStorage.getItem('access');
                if (!token) return;

                const response = await axios.post(`${baseUrl}api/ping-online/`, {}, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.data && response.data.matches) {
                    const newMatches = response.data.matches.filter(m => !notifiedMatchesRef.current.has(m.user_id));

                    if (newMatches.length > 0) {
                        newMatches.forEach(m => notifiedMatchesRef.current.add(m.user_id));
                        sessionStorage.setItem('notifiedMatches', JSON.stringify(Array.from(notifiedMatchesRef.current)));

                        // Save the last pinged user as the active target for any drafted messages
                        const targetUserObj = {
                            id: newMatches[newMatches.length - 1].user_id,
                            name: newMatches[newMatches.length - 1].name
                        };
                        setActiveTargetUser(targetUserObj);
                        sessionStorage.setItem('activeTargetUser', JSON.stringify(targetUserObj));

                        const aiMessages = newMatches.map(m => {
                            if (user?.role === 'college_staff') {
                                return `Hi! A prospective student, **${m.name}**, who bookmarked your college is currently online. Would you like me to draft a message for them?`;
                            } else {
                                return `Hello! I noticed that a representative from **${m.college_name}** (which you bookmarked) is online! Their name is ${m.name}. Exploring your options is important, would you like to start a chat with them?`;
                            }
                        });

                        setChatHistory(prev => [
                            ...prev,
                            ...aiMessages.map(msg => ({ role: 'assistant', content: msg }))
                        ]);

                        // Set the thought bubble to the first message if it's closed,
                        // otherwise just let it scroll down inside the open chat
                        if (!isOpen) {
                            setUnreadWormieMessage(aiMessages[0]);
                        }
                    }
                }
            } catch (error) {
                console.error("Error pinging online status:", error);
            }
        };

        // Ping immediately on mount/login, then every 30 seconds
        pingOnlineStatus();
        const intervalId = setInterval(pingOnlineStatus, 30000);

        return () => clearInterval(intervalId);
    }, [loggedIn, user]);

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
                    content: user?.role === 'college_staff'
                        ? "Hello! I'm Wormie, your institutional development consultant. I'm analyzing your candidate pools and recruitment matches right now..."
                        : "Hello! I'm Wormie, your personal college admissions assistant. I'm analyzing your profile to give you the best advice..."
                }
            ]);
        }
    }, [loggedIn, user?.role]); // Re-trigger when login state changes

    const handleVisualClear = () => {
        setChatHistory([
            {
                role: 'assistant',
                content: user?.role === 'college_staff'
                    ? "Screen cleared! I still remember our conversation context. How can I help you further?"
                    : "Screen cleared! I'm ready for your next question."
            }
        ]);
    };

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
        setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
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
                    if (fullReply === "") {
                        setIsThinking(false);
                        setChatHistory(prev => [...prev, { role: 'assistant', content: chunkValue }]);
                    } else {
                        setChatHistory(prev => {
                            const newHistory = [...prev];
                            newHistory[newHistory.length - 1] = {
                                role: 'assistant',
                                content: fullReply + chunkValue
                            };
                            return newHistory;
                        });
                    }
                    fullReply += chunkValue;
                }
            }

        } catch (error) {
            console.error('Wormie Chat Error:', error);
            setChatHistory(prev => {
                const newHistory = [...prev];
                newHistory[newHistory.length - 1] = {
                    role: 'assistant',
                    content: `I'm having a little trouble connecting to my knowledge base (Error: ${error.message}). Please try again in a moment!`
                };
                return newHistory;
            });
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="fixed top-1/2 right-6 -translate-y-1/2 z-[9999] flex flex-col items-end pointer-events-none">
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
                                <>
                                    <button
                                        onClick={handleVisualClear}
                                        className="p-1.5 hover:bg-white/10 rounded-xl transition-colors text-white/50 hover:text-white"
                                        title="Clear Screen (Keep Memory)"
                                    >
                                        <ArrowPathIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={handleClearHistory}
                                        className="p-1.5 hover:bg-white/10 rounded-xl transition-colors text-white/50 hover:text-red-400"
                                        title="Wipe Memory (Delete All)"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                }}
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
                                    {chat.content.split('---').map((block, blockIndex) => {
                                        const isDraft = blockIndex % 2 !== 0;
                                        let draftContent = block;
                                        let extractedTarget = null;

                                        if (isDraft) {
                                            const targetMatch = draftContent.match(/\[TARGET_ID:\s*(\d+)\|([^\]]+)\]/);
                                            if (targetMatch) {
                                                extractedTarget = { id: parseInt(targetMatch[1]), name: targetMatch[2].trim() };
                                                draftContent = draftContent.replace(targetMatch[0], '').trim();
                                            } else {
                                                extractedTarget = activeTargetUser;
                                            }
                                        }

                                        return (
                                            <div key={blockIndex} className={isDraft ? "my-3 p-3 bg-purple-50/50 border border-purple-200/60 rounded-xl relative" : ""}>
                                                {draftContent.split('\n').map((line, i) => (
                                                    <React.Fragment key={i}>
                                                        {line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
                                                            if (part.startsWith('**') && part.endsWith('**')) {
                                                                return <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>;
                                                            }
                                                            return <span key={j}>{part}</span>;
                                                        })}
                                                        {i < draftContent.split('\n').length - 1 && <br />}
                                                    </React.Fragment>
                                                ))}
                                                {isDraft && (
                                                    <button
                                                        onClick={() => {
                                                            setIsOpen(false);
                                                            navigate('/messages', {
                                                                state: {
                                                                    draftText: draftContent.trim(),
                                                                    ...(extractedTarget ? {
                                                                        openChatWithUserId: extractedTarget.id,
                                                                        openChatWithUserName: extractedTarget.name
                                                                    } : {})
                                                                }
                                                            });
                                                        }}
                                                        className="mt-3 w-full bg-[#A855F7] hover:bg-purple-600 text-white font-bold py-2 rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                                        Open in Direct Messages
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
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
                            className="flex-1 bg-gray-50/80 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-purple/20 transition-all outline-none text-gray-700 font-medium"
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
                <div className="relative group">
                    {/* Unread thought bubble */}
                    {unreadWormieMessage && (
                        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 transform transition-all duration-300 pointer-events-auto">
                            <div
                                onClick={() => {
                                    setIsOpen(true);
                                    setUnreadWormieMessage(null);
                                }}
                                className="bg-white px-4 py-3 rounded-2xl rounded-tr-sm shadow-xl border border-gray-100 min-w-[200px] max-w-[280px] cursor-pointer hover:bg-gray-50 transition-colors animate-[pulse_3s_ease-in-out_infinite]"
                            >
                                <p className="text-sm font-medium text-gray-800 line-clamp-3">
                                    {unreadWormieMessage}
                                </p>
                                {/* Triangle pointer */}
                                <div className="absolute top-1/2 right-[-6px] -translate-y-1/2 w-3 h-3 bg-white border-r border-t border-gray-100 rotate-45"></div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => {
                            setIsOpen(true);
                            setUnreadWormieMessage(null);
                        }}
                        className={`group relative p-5 rounded-full shadow-2xl transition-all duration-500 hover:scale-110 active:scale-90 flex items-center justify-center pointer-events-auto bg-[#A855F7] text-white border border-white/10 ${unreadWormieMessage ? 'animate-[bounce_2s_infinite]' : ''}`}
                    >
                        <div className={`absolute inset-0 rounded-full bg-purple opacity-20 group-hover:opacity-40 ${unreadWormieMessage ? 'animate-ping' : ''}`}></div>
                        <img src="/wormie-logo.svg" alt="Wormie" className="w-10 h-10 relative z-10" />

                        {/* Red dot indicator if there's a message and bubble is hidden for some reason */}
                        {unreadWormieMessage && (
                            <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-[#A855F7] shadow-sm z-20"></div>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default AIAgent;
