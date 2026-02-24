import React, { useState } from 'react';
import axios from 'axios';
import { baseUrl } from '../shared';
import {
    CalendarIcon,
    ClockIcon,
    Bars3CenterLeftIcon,
    ExclamationCircleIcon,
    CheckCircleIcon,
    MegaphoneIcon
} from '@heroicons/react/24/outline';

const AnnouncementManager = ({ college }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [activeTemplate, setActiveTemplate] = useState(null);
    const [eventDate, setEventDate] = useState('');
    const [eventTime, setEventTime] = useState('');
    const [eventLinkOrLocation, setEventLinkOrLocation] = useState('');

    const updateTemplate = (type, d, t, loc) => {
        let newTitle = '';
        let newContent = '';
        const displayDate = d || '[Select Date]';
        const displayTime = t || '[Select Time]';
        const displayLoc = loc || '[Insert Link/Location]';

        if (type === 'info_session') {
            newTitle = 'Virtual Information Session';
            newContent = `Join us for an online information session to learn more about everything ${college?.name} has to offer!\n\n📅 Date: ${displayDate}\n⏰ Time: ${displayTime}\n\nWe will be covering the application process, academic programs, and financial aid options. Click the link below to RSVP:\n🔗 ${displayLoc}`;
        } else if (type === 'deadline') {
            newTitle = 'Application Deadline Approaching';
            newContent = `Attention prospective students! The upcoming application deadline for ${college?.name} is rapidly approaching.\n\n🚨 Deadline: ${displayDate} at ${displayTime}\n\nMake sure all required materials (transcripts, letters of recommendation, etc.) are submitted before the deadline. We look forward to reviewing your application!`;
        } else if (type === 'event') {
            newTitle = 'Campus Visit Event Invitation';
            newContent = `You are formally invited to our upcoming campus visit event!\n\n📍 Location: ${displayLoc}\n📅 Date: ${displayDate} at ${displayTime}\n\nCome experience a tour of our beautiful campus, meet current students, and speak directly with faculty members. We hope to see you there!\n\nRSVP here: ${displayLoc}`;
        } else if (type === 'custom') {
            newTitle = title;
            newContent = content;
        }

        if (type !== 'custom') {
            setTitle(newTitle);
            setContent(newContent);
        }
    };

    const handleTemplateSelect = (type) => {
        setActiveTemplate(type);
        setEventDate('');
        setEventTime('');
        setEventLinkOrLocation('');
        updateTemplate(type, '', '', '');
        setStatus('idle');
    };

    const handleDateChange = (e) => {
        setEventDate(e.target.value);
        if (activeTemplate) updateTemplate(activeTemplate, e.target.value, eventTime, eventLinkOrLocation);
    };

    const handleTimeChange = (e) => {
        setEventTime(e.target.value);
        if (activeTemplate) updateTemplate(activeTemplate, eventDate, e.target.value, eventLinkOrLocation);
    };

    const handleLocChange = (e) => {
        setEventLinkOrLocation(e.target.value);
        if (activeTemplate) updateTemplate(activeTemplate, eventDate, eventTime, e.target.value);
    };


    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) return;

        setStatus('loading');
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('is_announcement', 'True');

            await axios.post(`${baseUrl}api/posts/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('access')}`
                }
            });

            setStatus('success');
            setTimeout(() => {
                setTitle('');
                setContent('');
                setActiveTemplate(null);
                setStatus('idle');
            }, 3000);
        } catch (error) {
            console.error('Error posting announcement', error);
            setStatus('error');
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="bg-violet-50 px-8 py-5 border-b border-violet-100/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl text-violet-600 shadow-sm">
                        <MegaphoneIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-900">Publish Official Announcement</h2>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">These will appear on your public college profile and the trending feed.</p>
                    </div>
                </div>
            </div>

            <div className="p-8">
                <div className="mb-6">
                    <p className="text-sm font-semibold text-gray-700 mb-3">1. Select a Template (Optional)</p>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => handleTemplateSelect('info_session')}
                            className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all flex items-center gap-2 ${activeTemplate === 'info_session' ? 'bg-violet-600 border-violet-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Bars3CenterLeftIcon className="w-4 h-4" /> Info Session
                        </button>
                        <button
                            onClick={() => handleTemplateSelect('deadline')}
                            className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all flex items-center gap-2 ${activeTemplate === 'deadline' ? 'bg-violet-600 border-violet-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <ClockIcon className="w-4 h-4" /> Upcoming Deadline
                        </button>
                        <button
                            onClick={() => handleTemplateSelect('event')}
                            className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all flex items-center gap-2 ${activeTemplate === 'event' ? 'bg-violet-600 border-violet-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <CalendarIcon className="w-4 h-4" /> Event Invite
                        </button>
                        <button
                            onClick={() => handleTemplateSelect('custom')}
                            className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all flex items-center gap-2 ${activeTemplate === 'custom' ? 'bg-violet-600 border-violet-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            Custom
                        </button>
                    </div>

                    {activeTemplate && activeTemplate !== 'custom' && (
                        <div className="mt-4 p-4 bg-gray-50 border border-gray-100 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Event Date</label>
                                <input
                                    type="date"
                                    value={eventDate}
                                    onChange={handleDateChange}
                                    className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Event Time</label>
                                <input
                                    type="time"
                                    value={eventTime}
                                    onChange={handleTimeChange}
                                    className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Link or Location</label>
                                <input
                                    type="text"
                                    placeholder="Zoom link or Room 101"
                                    value={eventLinkOrLocation}
                                    onChange={handleLocChange}
                                    className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none placeholder:text-gray-400"
                                />
                            </div>
                            <div className="md:col-span-3">
                                <p className="text-xs text-blue-500 mt-1">
                                    💡 Fill in these details to automatically generate the template below, then feel free to customize the text manually!
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Announcement Title"
                            className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-50 rounded-xl px-4 py-3 outline-none transition-all font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
                        />
                    </div>
                    <div>
                        <textarea
                            rows="6"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write your announcement details here..."
                            className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-violet-400 focus:ring-4 focus:ring-violet-50 rounded-xl px-4 py-4 outline-none transition-all resize-none leading-relaxed text-gray-700"
                        />
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <div>
                        {status === 'success' && (
                            <div className="flex items-center gap-2 text-green-600 font-medium text-sm animate-fadeIn">
                                <CheckCircleIcon className="w-5 h-5" />
                                Announcement published!
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="flex items-center gap-2 text-red-600 font-medium text-sm animate-fadeIn">
                                <ExclamationCircleIcon className="w-5 h-5" />
                                Failed to publish announcement.
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={!title.trim() || !content.trim() || status === 'loading'}
                        className={`px-8 py-3 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2 ${(!title.trim() || !content.trim() || status === 'loading')
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-violet-500 hover:bg-violet-600 text-white hover:shadow-md'
                            }`}
                    >
                        {status === 'loading' ? 'Publishing...' : 'Publish to Students'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementManager;
