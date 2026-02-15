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
                const response = await axios.get(`${baseUrl}api/posts/`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(localStorage.getItem('access') ? { 'Authorization': `Bearer ${localStorage.getItem('access')}` } : {})
                    }
                });

                // The serializer already provides comments_count and likes_count
                // We map them to the expected names if necessary, or just use what we have
                setPosts(response.data);
                console.log("Fetched posts count:", response.data.length);
            } catch (error) {
                console.error("Error fetching posts:", error);
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

