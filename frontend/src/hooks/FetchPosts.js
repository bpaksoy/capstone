import { useState, useEffect } from 'react';
import axios from 'axios';
import { baseUrl } from '../shared';

const usePosts = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(0); // Initialize to 0

    const updatePosts = () => {
        setLastUpdated(Date.now());
    };

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await axios.get(`${baseUrl}api/posts/?updated_since=${lastUpdated}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access')}`
                    }
                });

                const postsWithCountsPromises = response.data.map(async (post) => {
                    const commentCountResponse = await axios.get(`${baseUrl}api/posts/${post.id}/comment_counts/`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('access')}`
                        }
                    });
                    return { ...post, comment_count: commentCountResponse.data.comment_count, reply_count: commentCountResponse.data.reply_count };
                });

                const postsWithCounts = await Promise.all(postsWithCountsPromises);
                setPosts(postsWithCounts);
            } catch (error) {
                setError(error);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [lastUpdated]);



    return { posts, loading, error, updatePosts };
};

export default usePosts;