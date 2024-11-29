import React, { useState, useEffect } from 'react';
import { images } from '../constants';
import Reply from './Reply';
import AddReplyModal from '../utils/AddReplyModal';
import axios from 'axios';
import { baseUrl } from '../shared';
import usePosts from '../hooks/FetchPosts';

function Comment({ postId, lastUpdatedComment, onAddPost }) {
  
    const [comments, setComments] = useState([]);
    const [error, setError] = useState(null);


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
                            <AddReplyModal commentId={comment.id} onAddReply={updateReplies} />
                        </div>
                        <Reply commentId={comment.id} lastUpdatedReply={lastUpdatedReply} onAddPost={onAddPost}/>
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