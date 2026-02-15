import React, { useState, useEffect } from 'react';
import PostList from '../components/PostList';
import PostModal from '../utils/PostModal';
import usePosts from '../hooks/FetchPosts';
import { useCurrentUser } from '../UserProvider/UserProvider';
import { baseUrl } from '../shared';
import axios from 'axios';
import Loader from '../components/Loader';

import InfiniteScroll from 'react-infinite-scroll-component';
import ScrollToTop from '../components/ScrollToTop';

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
        window.scrollTo(0, 0); // Direct user to top on mount
    }, []);

    const handleAddPost = () => {
        updatePosts();
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top after posting
    };

    const getMixedFeed = () => {
        const combined = [];
        let p = 0, n = 0;
        const postsList = posts || [];
        const newsList = news || [];

        console.log(`Mixing Feed: ${postsList.length} posts, ${newsList.length} news`);

        while (p < postsList.length || n < newsList.length) {
            // Facebook-like interleaved feed
            if (p < postsList.length) {
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

    if (postsLoading || newsLoading) {
        return <Loader text="Uncovering the latest trends..." />;
    }

    return (
        <div className="bg-primary min-h-screen flex flex-col items-center justify-start py-12 px-4 sm:px-6 lg:px-8">
            <ScrollToTop />
            <div className="flex items-center justify-center gap-3 mb-8 mt-2">
                <div className="p-3 bg-gray-100 rounded-full shadow-inner">
                    <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                    </svg>
                </div>
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-700 via-gray-900 to-black tracking-tight drop-shadow-sm">Trending</h1>
            </div>
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