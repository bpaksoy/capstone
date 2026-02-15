import React, { useState, useEffect } from 'react';
import PostList from '../components/PostList';
import PostModal from '../utils/PostModal';
import usePosts from '../hooks/FetchPosts';
import { useCurrentUser } from '../UserProvider/UserProvider';
import { baseUrl } from '../shared';
import axios from 'axios';

function Trending() {
    const { posts, updatePosts } = usePosts();
    const { loggedIn } = useCurrentUser();
    const [news, setNews] = useState([]);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const token = localStorage.getItem('access');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const response = await axios.get(`${baseUrl}api/news/`, {
                    headers: headers
                });
                setNews(response.data.results || []);
            } catch (error) {
                console.error("Error fetching news", error);
            }
        };
        fetchNews();
    }, []);

    const handleAddPost = () => {
        updatePosts(); // Trigger refetch after adding a post
    };

    const getMixedFeed = () => {
        const combined = [];
        let p = 0, n = 0;
        const postsList = posts || [];
        const newsList = news || [];

        while (p < postsList.length || n < newsList.length) {
            // Add up to 3 posts
            for (let i = 0; i < 3 && p < postsList.length; i++) {
                combined.push({ isPost: true, itemType: 'post', ...postsList[p++] });
            }
            // Add 1 news item
            if (n < newsList.length) {
                combined.push({ isNews: true, itemType: 'news', ...newsList[n++] });
            }
        }
        return combined;
    };

    const displayFeed = getMixedFeed();

    return (
        <div className="bg-primary min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            {loggedIn && <PostModal onAddPost={handleAddPost} />}
            <PostList posts={displayFeed} onAddPost={handleAddPost} />
        </div>
    )
}

export default Trending;