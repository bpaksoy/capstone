import React, { useState, useEffect } from 'react';
import AddReplyModal from '../utils/AddReplyModal';
import axios from 'axios';
import { baseUrl } from '../shared';
import { images } from '../constants';

function Reply({ commentId, lastUpdatedReply, onAddPost }) {
    const [replies, setReplies] = useState([]);
    // console.log("replies", replies);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const updateReplies = (time) => {
        setLastUpdated(time);
        onAddPost(); //update the number of comments
    };

    useEffect(() => {
        const fetchReplies = async () => {
            try {
                const response = await axios.get(
                    `${baseUrl}api/comments/${commentId}/replies/`,
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('access')}`,
                        },
                    }
                );
                setReplies(response.data);
                setIsLoading(false);
                console.log('Reply added:', response.data);

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
        return <p>Loading replies...</p>;
    }

    return (
        <div>
            {replies ? replies.map((reply) => (
                <div key={reply.id}>
                    <div className="flex items-center space-x-2 mt-2 ml-6">
                        <img src={images.avatar} alt="User Avatar" className="w-6 h-6 rounded-full" />
                        <div className="mb-4">
                            <p className="text-gray-800 font-semibold">{reply.author.username}</p>
                            <p className="text-gray-500 text-sm">{reply.content}</p>
                        </div>
                        <AddReplyModal commentId={commentId} onAddReply={updateReplies} />
                    </div>

                </div>
            )) : null}
        </div>
    );
}

export default Reply;