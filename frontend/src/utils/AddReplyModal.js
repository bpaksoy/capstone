import React, { useState } from 'react';
import axios from 'axios';
import { baseUrl } from '../shared';
import usePosts from '../hooks/FetchPosts';

function AddReplyModal({ commentId, onAddReply }) {
    const { updatePosts } = usePosts();
    const [isReplying, setIsReplying] = useState(false);
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);
        const accessToken = localStorage.getItem('access');

        try {
            await axios.post(`${baseUrl}api/comments/${commentId}/replies/create/`, {
                content,
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            setContent('');
            setIsReplying(false);
            onAddReply(Date.now());
            updatePosts();

        } catch (err) {
            console.error("Error posting reply:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isReplying) {
        return (
            <button
                onClick={() => setIsReplying(true)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 hover:underline"
            >
                Reply
            </button>
        );
    }

    return (
        <div className="mt-2 pl-2 border-l-2 border-gray-100">
            <form onSubmit={handleSubmit} className="w-full flex items-start gap-2">
                <div className="flex-1 relative">
                    <textarea
                        className="w-full bg-gray-50 border-0 rounded-2xl px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-primary focus:outline-none focus:bg-white transition-all resize-none overflow-hidden min-h-[36px] leading-relaxed"
                        placeholder="Write a reply..."
                        value={content}
                        onChange={(e) => {
                            setContent(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        rows={1}
                        autoFocus
                    />
                </div>
                <button
                    type="submit"
                    disabled={!content.trim() || isSubmitting}
                    className={`p-1.5 rounded-full transition-colors ${content.trim() && !isSubmitting
                        ? 'bg-primary text-white hover:bg-primary/90 shadow-sm'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 transform rotate-0 translate-x-0.5 -translate-y-0.5">
                            <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                        </svg>
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setIsReplying(false);
                        setContent('');
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                </button>
            </form>
        </div>
    );
}

export default AddReplyModal;
