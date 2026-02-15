import React, { useState } from 'react';
import { icons } from "../constants";
import axios from 'axios';
import { baseUrl } from '../shared';
import usePosts from '../hooks/FetchPosts';


function AddCommentModal({ postId, onAddComment }) {
    const { updatePosts } = usePosts();
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);
        const accessToken = localStorage.getItem('access');

        try {
            await axios.post(`${baseUrl}api/posts/${postId}/comments/`, {
                content,
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            setContent('');
            onAddComment(Date.now());
            updatePosts();

        } catch (err) {
            console.error("Error posting comment:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full flex items-start gap-2">
            <div className="flex-1 relative">
                <textarea
                    className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-primary focus:outline-none focus:bg-white transition-all resize-none overflow-hidden min-h-[40px] leading-relaxed"
                    placeholder="Write a comment..."
                    value={content}
                    onChange={(e) => {
                        setContent(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    rows={1}
                />
            </div>
            <button
                type="submit"
                disabled={!content.trim() || isSubmitting}
                className={`p-2 rounded-full transition-colors ${content.trim() && !isSubmitting
                    ? 'bg-primary text-white hover:bg-primary/90 shadow-sm'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
            >
                {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 transform rotate-0 translate-x-0.5 -translate-y-0.5">
                        <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                    </svg>
                )}
            </button>
        </form>
    );
}

export default AddCommentModal;