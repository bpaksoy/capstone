import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { baseUrl } from '../shared';
import { images } from '../constants';
import { useCurrentUser } from '../UserProvider/UserProvider';
import { ChatBubbleLeftRightIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';

const StudentAmbassadors = ({ collegeId, collegeName }) => {
    const [ambassadors, setAmbassadors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { loggedIn, user } = useCurrentUser();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAmbassadors = async () => {
            try {
                const response = await axios.get(`${baseUrl}api/colleges/${collegeId}/ambassadors/`);
                setAmbassadors(response.data);
            } catch (error) {
                console.error("Error fetching ambassadors:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (collegeId) {
            fetchAmbassadors();
        }
    }, [collegeId]);

    const handleMessage = (ambassador) => {
        if (!loggedIn) {
            navigate('/login');
            return;
        }

        // Prevent messaging self
        if (user && user.id === ambassador.id) {
            return;
        }

        navigate('/messages', {
            state: {
                openChatWithUserId: ambassador.id,
                openChatWithUserName: ambassador.username,
                draftText: `Hi ${ambassador.first_name || ambassador.username}! I saw you're an ambassador for ${collegeName}. Can I ask you a few questions about life on campus?`
            }
        });
    };

    if (isLoading) return null;
    if (ambassadors.length === 0) return null;

    return (
        <div className="mt-8 pt-8 border-t border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        Connect with Students
                        <span className="bg-primary/10 text-primary text-[10px] uppercase px-2 py-0.5 rounded-full font-bold tracking-wider">Verified</span>
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Chat with current students to get the real scoop on {collegeName}.</p>
                </div>
            </div>

            <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar -mx-2 px-2">
                {ambassadors.map((ambassador) => (
                    <div
                        key={ambassador.id}
                        className="flex-shrink-0 w-64 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="relative">
                                <img
                                    src={ambassador.image ? (ambassador.image.startsWith('http') ? ambassador.image : baseUrl + ambassador.image.replace(/^\//, '')) : images.profile}
                                    alt={ambassador.username}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                                    onError={(e) => { e.target.onerror = null; e.target.src = images.profile; }}
                                />
                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                    <CheckBadgeIcon className="w-4 h-4 text-primary" />
                                </div>
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-bold text-gray-900 truncate">
                                    {ambassador.first_name || ambassador.username} {ambassador.last_name}
                                </p>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight truncate">
                                    {ambassador.major || 'Student Ambassador'}
                                </p>
                            </div>
                        </div>

                        {ambassador.bio && (
                            <p className="text-xs text-gray-600 line-clamp-2 mb-4 italic min-h-[32px]">
                                "{ambassador.bio}"
                            </p>
                        )}

                        <button
                            onClick={() => handleMessage(ambassador)}
                            disabled={user && user.id === ambassador.id}
                            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all
                                ${user && user.id === ambassador.id
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-primary text-white hover:bg-teal-700 shadow-sm shadow-teal-700/20 active:scale-95'
                                }`}
                        >
                            <ChatBubbleLeftRightIcon className="w-4 h-4" />
                            Message {ambassador.first_name || 'Ambassador'}
                        </button>
                    </div>
                ))}

                {/* Visual anchor for horizontal scroll */}
                <div className="w-1 flex-shrink-0" />
            </div>
        </div>
    );
};

export default StudentAmbassadors;
