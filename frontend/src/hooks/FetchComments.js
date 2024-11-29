import { useState, useEffect } from 'react';
import axios from 'axios';
import { baseUrl } from '../shared';

const useComments = (postId) => {
    console.log("post id here", postId)
    const [comments, setComments] = useState([]);
    //console.log("comments", comments);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const updateComments = () => {
        setLastUpdated(Date.now());
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
    }, [postId, lastUpdated]);

    return { comments, error, updateComments };
};

export default useComments;