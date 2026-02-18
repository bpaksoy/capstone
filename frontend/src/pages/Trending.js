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
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [postModalInitialContent, setPostModalInitialContent] = useState('');
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

    const handleAddPost = (scrollToTop = true) => {
        updatePosts();
        if (scrollToTop) {
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top after posting
        }
    };

    const handleOpenPostModal = (content = '') => {
        setPostModalInitialContent(content);
        setIsPostModalOpen(true);
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

            <div className="flex items-center justify-center gap-6 mb-12 mt-4 group">
                <div className="relative">
                    {/* Glowing background effect */}
                    <div className="absolute inset-0 bg-purple/20 rounded-full blur-3xl animate-pulse group-hover:bg-purple/40 transition-colors"></div>
                    <div className="absolute -inset-2 bg-gradient-to-tr from-purple via-indigo-500 to-blue-600 rounded-full opacity-0 group-hover:opacity-20 animate-ping"></div>

                    {/* Main Icon Container - Purple electric theme */}
                    <div className="relative p-4 bg-gradient-to-br from-purple via-indigo-600 to-blue-700 rounded-2xl shadow-2xl shadow-purple/40 transform group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500 border border-white/20 animate-float">
                        <svg className="w-8 h-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0111 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>

                <h1 className="text-4xl md:text-5xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple via-indigo-300 to-white tracking-normal drop-shadow-xl pr-4 pb-1 leading-normal">
                    Trending
                </h1>
            </div>

            {loggedIn && (
                <PostModal
                    onAddPost={() => handleAddPost(true)}
                    isOpen={isPostModalOpen}
                    onClose={() => setIsPostModalOpen(false)}
                    initialContent={postModalInitialContent}
                    triggerOpen={() => setIsPostModalOpen(true)}
                />
            )}

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
                <PostList
                    posts={displayFeed}
                    onAddPost={handleAddPost}
                    onOpenPostModal={handleOpenPostModal}
                />
            </InfiniteScroll>
        </div>
    );
}


export default Trending;