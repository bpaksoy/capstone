import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PaperAirplaneIcon, ChatBubbleLeftRightIcon, PaperClipIcon, ArrowDownTrayIcon, DocumentIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { baseUrl } from '../shared';
import { images } from '../constants';

const DirectMessageModal = ({ isOpen, onClose, student, collegeName }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const [customTemplates, setCustomTemplates] = useState([]);
    const [isAddingTemplate, setIsAddingTemplate] = useState(false);
    const [isSavingAsTemplate, setIsSavingAsTemplate] = useState(false);
    const [newTemplateLabel, setNewTemplateLabel] = useState('');
    const [newTemplateText, setNewTemplateText] = useState('');
    const [saveTemplateLabel, setSaveTemplateLabel] = useState('');

    useEffect(() => {
        if (isOpen) {
            const custom = JSON.parse(localStorage.getItem('custom_templates') || '[]');
            setCustomTemplates(custom);
        }
    }, [isOpen]);

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

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || !student) return;

        setIsLoading(true);
        const formData = new FormData();
        formData.append('recipient_id', student.id);
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
            fetchMessages();
        } catch (err) {
            console.error("Error sending message:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const renderAttachment = (m) => {
        if (!m.attachment_url) return null;

        const isImage = m.attachment_url.match(/\.(jpeg|jpg|gif|png)$/i);

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
            <div className="mt-2 p-3 bg-white/10 rounded-xl border border-white/20 flex items-center justify-between gap-3 shadow-inner">
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
                    className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
                >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                </a>
            </div>
        );
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
                                        {m.content && <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>}
                                        {renderAttachment(m)}
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

                {/* Selected File Preview */}
                {selectedFile && (
                    <div className="px-6 py-2 bg-teal-50 border-t border-teal-100 flex items-center justify-between animate-slideUp">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <PaperClipIcon className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold text-gray-700 truncate">{selectedFile.name}</span>
                        </div>
                        <button onClick={() => setSelectedFile(null)} className="text-red-500 p-1">
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Input Area */}
                <div className="px-6 py-2 bg-gray-50/50 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quick Templates</span>
                        {newMessage.trim() && (
                            !isSavingAsTemplate ? (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setIsSavingAsTemplate(true);
                                    }}
                                    className="text-[10px] font-bold text-primary hover:text-teal-700 uppercase tracking-widest transition-colors flex items-center gap-1"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                    Save as Template
                                </button>
                            ) : (
                                <div className="flex items-center gap-2 animate-fadeIn">
                                    <input
                                        autoFocus
                                        placeholder="Template Label..."
                                        className="bg-white border border-primary/20 rounded-full px-3 py-0.5 text-[9px] font-bold outline-none ring-1 ring-primary/5 w-32"
                                        value={saveTemplateLabel}
                                        onChange={(e) => setSaveTemplateLabel(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                if (saveTemplateLabel) {
                                                    const custom = JSON.parse(localStorage.getItem('custom_templates') || '[]');
                                                    const updated = [...custom, { label: `⭐ ${saveTemplateLabel}`, text: newMessage }];
                                                    localStorage.setItem('custom_templates', JSON.stringify(updated));
                                                    setCustomTemplates(updated);
                                                    setSaveTemplateLabel('');
                                                    setIsSavingAsTemplate(false);
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIsSavingAsTemplate(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <XMarkIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                    <div className="overflow-x-auto no-scrollbar flex gap-2 pb-1 relative">
                        {/* Permanent Add Button */}
                        {!isAddingTemplate ? (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsAddingTemplate(true);
                                }}
                                className="whitespace-nowrap px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-full text-[11px] font-bold text-primary hover:bg-primary hover:text-white transition-all shadow-sm shrink-0 flex items-center gap-1"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                                Add
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 bg-primary/5 p-1 rounded-full border border-primary/20 animate-fadeIn shrink-0">
                                <input
                                    autoFocus
                                    placeholder="Label (e.g. 👋 Welcome)"
                                    className="bg-white border-none rounded-full px-3 py-1 text-[10px] font-bold outline-none ring-1 ring-primary/10 w-32"
                                    value={newTemplateLabel}
                                    onChange={(e) => setNewTemplateLabel(e.target.value)}
                                />
                                <input
                                    placeholder="Message text..."
                                    className="bg-white border-none rounded-full px-3 py-1 text-[10px] font-medium outline-none ring-1 ring-primary/10 w-48"
                                    value={newTemplateText}
                                    onChange={(e) => setNewTemplateText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            if (newTemplateLabel && newTemplateText) {
                                                const custom = JSON.parse(localStorage.getItem('custom_templates') || '[]');
                                                const updated = [...custom, { label: `⭐ ${newTemplateLabel}`, text: newTemplateText }];
                                                localStorage.setItem('custom_templates', JSON.stringify(updated));
                                                setCustomTemplates(updated);
                                                setNewTemplateLabel('');
                                                setNewTemplateText('');
                                                setIsAddingTemplate(false);
                                            }
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (newTemplateLabel && newTemplateText) {
                                            const custom = JSON.parse(localStorage.getItem('custom_templates') || '[]');
                                            const updated = [...custom, { label: `⭐ ${newTemplateLabel}`, text: newTemplateText }];
                                            localStorage.setItem('custom_templates', JSON.stringify(updated));
                                            setCustomTemplates(updated);
                                            setNewTemplateLabel('');
                                            setNewTemplateText('');
                                            setIsAddingTemplate(false);
                                        }
                                    }}
                                    className="p-1 bg-primary text-white rounded-full hover:bg-teal-700 transition-all"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingTemplate(false)}
                                    className="p-1 bg-gray-200 text-gray-500 rounded-full hover:bg-gray-300 transition-all"
                                >
                                    <XMarkIcon className="w-3 h-3" />
                                </button>
                            </div>
                        )}

                        {[
                            { label: '👋 Welcome', text: `Hi ${student.username}, thanks for your interest in ${collegeName}! We'd love to tell you more about our campus life and programs.` },
                            { label: '📅 Info Session', text: `Hello ${student.username}! We're hosting a virtual info session for ${collegeName} soon. Would you like to join?` },
                            { label: '✍️ Apply Now', text: `Hi ${student.username}, our application deadline for ${collegeName} is approaching! Do you have any questions about the process?` },
                            { label: '🎯 Interview', text: `Hi ${student.username}, we're impressed by your profile! Would you be available for a brief chat with an admissions officer?` },
                            ...customTemplates
                        ].map((template, i) => (
                            <div key={i} className="relative group/tag shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setNewMessage(template.text)}
                                    className="whitespace-nowrap px-3 py-1.5 bg-white border border-gray-200 rounded-full text-[11px] font-bold text-gray-600 hover:border-primary hover:text-primary transition-all shadow-sm"
                                >
                                    {template.label}
                                </button>
                                {template.label.startsWith('⭐') && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const updated = customTemplates.filter((_, idx) => idx !== (i - 4));
                                            localStorage.setItem('custom_templates', JSON.stringify(updated));
                                            setCustomTemplates(updated); // Instant UI update
                                        }}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/tag:opacity-100 transition-opacity"
                                    >
                                        <XMarkIcon className="w-2.5 h-2.5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                <form onSubmit={handleSend} className="p-6 bg-white border-t border-gray-100 flex gap-3 items-center">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 bg-gray-50 text-gray-500 rounded-2xl border border-gray-200/50 hover:bg-gray-100 transition-all active:scale-95"
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
                        placeholder={`Message ${student.username}...`}
                        className="flex-1 bg-gray-50 border border-gray-200/50 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary/30 transition-all outline-none font-medium text-gray-700"
                    />
                    <button
                        type="submit"
                        disabled={(!newMessage.trim() && !selectedFile) || isLoading}
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
