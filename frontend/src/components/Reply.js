import React, { useState, useEffect } from 'react';
import AddReplyModal from '../utils/AddReplyModal';
import axios from 'axios';
import { baseUrl } from '../shared';
import { images } from '../constants';

function Reply({ commentId, lastUpdatedReply, onAddPost, user }) {
    const [replies, setReplies] = useState([]);
    // console.log("replies", replies);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [showReplies, setShowReplies] = useState(false);

    const updateReplies = (time) => {
        setLastUpdated(time);
        onAddPost(false); //update the number of comments
    };

    useEffect(() => {
        const fetchReplies = async () => {
            try {
                const response = await axios.get(
                    `${baseUrl}api/comments/${commentId}/replies/`,
                    {
                        headers: {
                            ...(localStorage.getItem('access') ? { 'Authorization': `Bearer ${localStorage.getItem('access')}` } : {})
                        },
                    }
                );
                setReplies(response.data);
                setIsLoading(false);
                // console.log('Reply added:', response.data);

            } catch (error) {
                console.error('Error adding reply:', error);
                setError(error);
                setIsLoading(false);
            } finally {
                setIsLoading(false);
            }
        };

        if (commentId) {
            fetchReplies();
        }
    }, [commentId, lastUpdated, lastUpdatedReply]);


    if (isLoading) {
        return <p className="text-xs text-gray-500 ml-12">Loading replies...</p>;
    }

    if (!replies || replies.length === 0) return null;

    return (
        <div className="ml-10 mt-2">
            {!showReplies ? (
                <button
                    onClick={() => setShowReplies(true)}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-700"
                >
                    <div className="w-8 h-[1px] bg-gray-300"></div>
                    View {replies.length} replies
                </button>
            ) : (
                <div className="border-l-2 border-gray-200 pl-4 space-y-3">
                    {replies.map((reply) => (
                        <div key={reply.id} className="relative">
                            <div className="flex items-start gap-2">
                                <img src={images.avatar} alt="User Avatar" className="w-5 h-5 rounded-full mt-1 object-cover opacity-70" />
                                <div className="flex-1">
                                    <div className="bg-gray-50 px-3 py-2 rounded-2xl inline-block">
                                        <p className="text-gray-900 font-semibold text-xs">{reply.author.username}</p>
                                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{reply.content}</p>
                                    </div>
                                    <div className="flex items-center gap-4 mt-0.5 px-1">
                                        {/* Reply-to-reply button */}
                                        {user && <AddReplyModal commentId={commentId} onAddReply={updateReplies} />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={() => setShowReplies(false)}
                        className="text-xs font-semibold text-gray-400 hover:text-gray-600 mt-2 ml-1"
                    >
                        Hide replies
                    </button>
                </div>
            )}
        </div>
    );
}

export default Reply;