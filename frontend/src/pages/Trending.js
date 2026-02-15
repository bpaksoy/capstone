import React, { useState, useEffect } from 'react';
import PostList from '../components/PostList';
import PostModal from '../utils/PostModal';
import usePosts from '../hooks/FetchPosts';
import { useCurrentUser } from '../UserProvider/UserProvider';
import { baseUrl } from '../shared';
import axios from 'axios';

import InfiniteScroll from 'react-infinite-scroll-component';

function Trending() {
    const { posts, updatePosts, loading: postsLoading } = usePosts();
    const { loggedIn } = useCurrentUser();
    const [news, setNews] = useState([]);
    const [newsLoading, setNewsLoading] = useState(true);
    const [displayLimit, setDisplayLimit] = useState(10); // Initial load

    useEffect(() => {
        const fetchNews = async () => {
            setNewsLoading(true);
            try {
                const token = localStorage.getItem('access');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const response = await axios.get(`${baseUrl}api/news/`, {
                    headers: headers
                });
                setNews(response.data.results || []);
            } catch (error) {
                console.error("Error fetching news", error);
            } finally {
                setNewsLoading(false);
            }
        };
        fetchNews();
    }, []);

    const handleAddPost = () => {
        updatePosts();
    };

    const getMixedFeed = () => {
        const combined = [];
        let p = 0, n = 0;
        const postsList = posts || [];
        const newsList = news || [];

        while (p < postsList.length || n < newsList.length) {
            for (let i = 0; i < 3 && p < postsList.length; i++) {
                combined.push({ isPost: true, itemType: 'post', ...postsList[p++] });
            }
            if (n < newsList.length) {
                combined.push({ isNews: true, itemType: 'news', ...newsList[n++] });
            }
        }
        return combined;
    };

    const fullFeed = getMixedFeed();
    const displayFeed = fullFeed.slice(0, displayLimit);
    const hasMore = displayLimit < fullFeed.length;

    const fetchMoreData = () => {
        // Simulate network delay if needed, or just immediate update
        setTimeout(() => {
            setDisplayLimit(prev => prev + 10);
        }, 500);
    };

    return (
        <div className="bg-primary min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            {loggedIn && <PostModal onAddPost={handleAddPost} />}

            <InfiniteScroll
                dataLength={displayFeed.length}
                next={fetchMoreData}
                hasMore={hasMore}
                loader={
                    <div className="flex justify-center items-center py-10 w-full">
                        <div className="modern-loader">
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                        </div>
                    </div>
                }
                endMessage={
                    (!postsLoading && !newsLoading) ? (
                        <p className="text-white text-center mt-8 pb-8">
                            <b className="opacity-80">You have seen all trends!</b>
                        </p>
                    ) : null
                }
                scrollThreshold={0.9}
                style={{ overflow: 'visible' }} // Important for sticky header/body scrolling
            >
                <PostList posts={displayFeed} onAddPost={handleAddPost} />
            </InfiniteScroll>
        </div>
    )
}

export default Trending;