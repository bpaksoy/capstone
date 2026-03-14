import React, { useState } from 'react';
import axios from 'axios';
import { baseUrl } from '../shared';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';

const ReviewModal = ({ isOpen, onClose, advisor, onReviewSubmitted }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('access');
            await axios.post(`${baseUrl}api/reviews/create/`, {
                advisor_id: advisor.id,
                rating,
                comment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onReviewSubmitted();
            onClose();
            // Reset form
            setRating(5);
            setComment('');
        } catch (error) {
            console.error("Error submitting review:", error);
            alert("Failed to submit review. You can only review each advisor once.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden animate-slideUp">
                <div className="bg-[#17717d] p-8 text-white text-center">
                    <h2 className="text-2xl font-black mb-2">Rate {advisor.first_name || advisor.username}</h2>
                    <p className="text-white/80 text-sm">How was your experience with this advisor?</p>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8">
                    <div className="flex justify-center gap-2 mb-8">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className="transform hover:scale-125 transition-transform"
                            >
                                {star <= rating ? (
                                    <StarIcon className="w-10 h-10 text-yellow-400 drop-shadow-md" />
                                ) : (
                                    <StarOutline className="w-10 h-10 text-gray-300" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Your Experience</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share some details about the guidance you received..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#17717d]/50 transition-all h-32 resize-none"
                            required
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 px-6 border border-gray-200 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-4 px-6 bg-[#17717d] text-white rounded-2xl font-bold hover:shadow-xl hover:bg-[#135f69] transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Posting...' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;
