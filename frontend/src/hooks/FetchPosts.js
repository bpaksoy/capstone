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
                const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
                const response = await axios.get(`${cleanBase}/api/posts/`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(localStorage.getItem('access') ? { 'Authorization': `Bearer ${localStorage.getItem('access')}` } : {})
                    }
                });
                
                const results = response.data?.results || [];
                setPosts(results);
                console.log("Fetched posts count:", results.length);
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

