import React, { useState, useEffect } from 'react';
import { images } from '../constants';
import Reply from './Reply';
import AddReplyModal from '../utils/AddReplyModal';
import axios from 'axios';
import { baseUrl } from '../shared';
import LikeButton from '../utils/LikeButton';

function Comment({ postId, lastUpdatedComment, onAddPost }) {

    const [comments, setComments] = useState([]);
    //console.log("comments", comments);
    const [error, setError] = useState(null);
    const [commentLikes, setCommentLikes] = useState({});

    const updateLikeStatus = (commentId, isLiked) => {
        setCommentLikes((prevCommentLikes) => ({ ...prevCommentLikes, [commentId]: isLiked }));
        onAddPost(); // Update the post list when a like status changes
    };


    const refetchComments = async () => {
        try {
            const response = await axios.get(`${baseUrl}api/posts/${postId}/comments/`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access')}`,
                },
            });
            setComments(response.data);
        } catch (error) {
            setError(error);
        }
    };

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const response = await axios.get(`${baseUrl}api/posts/${postId}/comments/`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access')}`,
                    },
                });
                setComments(response.data);
            } catch (error) {
                setError(error);
            }
        };
        fetchComments();
    }, [postId, lastUpdatedComment]);


    const [lastUpdatedReply, setLastUpdatedReply] = useState(null);

    const updateReplies = (time) => {
        setLastUpdatedReply(time);
        onAddPost();
    };


    if (postId === undefined || postId === null) {
        return <div>Loading comments... </div>;
    }

    if (error) {
        return <div>Error loading comments: {error.message}</div>;
    }

    return (
        <div>
            <hr className="mt-2 mb-2" />
            <div className="mt-4">
                {comments.map((comment) => (
                    comment &&
                    <div key={comment.id} >
                        <div className="flex items-center space-x-2">
                            <img src={images.avatar} alt="User Avatar" className="w-6 h-6 rounded-full" />
                            <div className="mb-2">
                                <p className="text-gray-800 font-semibold">{comment.author.username}</p>
                                <p className="text-gray-500 text-sm">{comment.content}</p>
                            </div>
                            <button className="flex justify-center items-center gap-2 px-2 hover:bg-gray-50 rounded-full p-1">
                                <svg className={`w-5 h-5 fill-current ${commentLikes[comment.id] ? 'fill-pink-500' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                    <path d="M12 21.35l-1.45-1.32C6.11 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-4.11 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                                <span>{comment.likes_count} Like</span>
                            </button>
                            <AddReplyModal commentId={comment.id} onAddReply={updateReplies} />
                            <LikeButton contentType="comment" objectId={comment.id} onLikeStatusChange={updateLikeStatus} refetchComments={refetchComments} />
                        </div>
                        <Reply commentId={comment.id} lastUpdatedReply={lastUpdatedReply} onAddPost={onAddPost} />
                    </div>
                )
                )}
                <div className="flex items-center space-x-2">
                    <img src={images.avatar} alt="User Avatar" className="w-6 h-6 rounded-full" />
                    <div>
                        <p className="text-gray-800 font-semibold">Jane Smith</p>
                        <p className="text-gray-500 text-sm">Lovely shot! 📸</p>
                    </div>
                </div>

                <div className="flex items-center space-x-2 mt-2">
                    <img src={images.avatar} alt="User Avatar" className="w-6 h-6 rounded-full" />
                    <div>
                        <p className="text-gray-800 font-semibold">Bob Johnson</p>
                        <p className="text-gray-500 text-sm">I can't handle the cuteness! Where can I get one?</p>
                    </div>
                </div>

                <div className="flex items-center space-x-2 mt-2 ml-6">
                    <img src={images.avatar} alt="User Avatar" className="w-6 h-6 rounded-full" />
                    <div>
                        <p className="text-gray-800 font-semibold">John Doe</p>
                        <p className="text-gray-500 text-sm">That little furball is from a local shelter. You should check it out! 🏠😺</p>
                    </div>
                </div>
            </div>
        </div>)
}

export default Comment;