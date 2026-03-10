import React, { useState, useEffect } from 'react';
import PostList from '../components/PostList';
import PostModal from '../utils/PostModal';
import { useCurrentUser } from '../UserProvider/UserProvider';
import { baseUrl } from '../shared';
import axios from 'axios';
import Loader from '../components/Loader';

import InfiniteScroll from 'react-infinite-scroll-component';
import ScrollToTop from '../components/ScrollToTop';

const JOURNEY_CATEGORIES = [
    { key: 'all', emoji: '⚡', label: 'All' },
    { key: 'acceptance', emoji: '🎉', label: 'Acceptance Stories' },
    { key: 'essay_help', emoji: '✍️', label: 'Essay Help' },
    { key: 'campus_tours', emoji: '🏫', label: 'Campus Tours' },
    { key: 'financial_aid', emoji: '💰', label: 'Financial Aid' },
    { key: 'test_prep', emoji: '📚', label: 'Test Prep' },
    { key: 'advice', emoji: '💡', label: 'Advice' },
    { key: 'general', emoji: '💬', label: 'General' },
];

function Trending() {
    const { loggedIn } = useCurrentUser();
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [postModalInitialContent, setPostModalInitialContent] = useState('');
    const [news, setNews] = useState([]);
    const [newsLoading, setNewsLoading] = useState(true);
    const [posts, setPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);

    // Fetch posts (with optional category filter)
    const fetchPosts = async (category = 'all', isBackground = false, pageNum = 1) => {
        if (!isBackground && pageNum === 1) {
            setPostsLoading(true);
        }
        try {
            const token = localStorage.getItem('access');
            const headers = (token && token !== 'null') ? { Authorization: `Bearer ${token}` } : {};
            
            // Build query params
            const params = new URLSearchParams();
            if (category && category !== 'all') params.append('category', category);
            params.append('page', pageNum);
            params.append('page_size', 10);

            const response = await axios.get(`${baseUrl}api/posts/?${params.toString()}`, { headers });
            
            const newPosts = response.data.results || [];
            if (pageNum === 1) {
                setPosts(newPosts);
            } else {
                setPosts(prev => [...prev, ...newPosts]);
            }
            
            setHasNext(response.data.has_next);
            setPage(pageNum);
        } catch (error) {
            console.error("Error fetching posts", error);
        } finally {
            if (!isBackground && pageNum === 1) {
                setPostsLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchPosts(activeCategory, false, 1);
    }, [activeCategory]);

    useEffect(() => {
        const fetchNews = async () => {
            setNewsLoading(true);
            try {
                const token = localStorage.getItem('access');
                const headers = (token && token !== 'null') ? { Authorization: `Bearer ${token}` } : {};
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
        fetchPosts(activeCategory, !scrollToTop, 1);
        if (scrollToTop) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleOpenPostModal = (content = '') => {
        setPostModalInitialContent(content);
        setIsPostModalOpen(true);
    };

    const handleCategoryChange = (catKey) => {
        if (catKey !== activeCategory) {
            setPosts([]); // Clear posts to show loading state
            setActiveCategory(catKey);
            setPage(1);
            window.scrollTo({ top: 0, behavior: 'instant' });
        }
    };

    const getMixedFeed = () => {
        const combined = [];
        let p = 0, n = 0;
        const postsList = posts || [];
        // Only mix in news when viewing "all"
        const newsList = activeCategory === 'all' ? (news || []) : [];

        // Simple interleaving for the current display
        while (p < postsList.length || n < newsList.length) {
            if (p < postsList.length) {
                combined.push({ isPost: true, itemType: 'post', ...postsList[p++] });
            }
            if (n < newsList.length && p % 3 === 0) { // Add news every 3 posts for variety
                combined.push({ isNews: true, itemType: 'news', ...newsList[n++] });
            }
        }
        return combined;
    };

    const displayFeed = getMixedFeed();

    const fetchMoreData = () => {
        if (hasNext && !postsLoading) {
            fetchPosts(activeCategory, true, page + 1);
        }
    };

    // Base layout remains consistent, we only toggle the feed content
    const renderContent = () => {
        if (postsLoading && posts.length === 0) {
            return (
                <div className="w-full flex justify-center py-20">
                    <Loader text={`Uncovering ${JOURNEY_CATEGORIES.find(c => c.key === activeCategory)?.label}...`} fullScreen={false} />
                </div>
            );
        }

        return (
            <>
                {/* Active Category Indicator */}
                {activeCategory !== 'all' && (
                    <div className="w-full max-w-2xl mb-4">
                        <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/10">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{JOURNEY_CATEGORIES.find(c => c.key === activeCategory)?.emoji}</span>
                                <span className="text-white font-bold text-sm">
                                    {JOURNEY_CATEGORIES.find(c => c.key === activeCategory)?.label}
                                </span>
                                <span className="text-white/40 text-xs ml-1">
                                    {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                                </span>
                            </div>
                            <button
                                onClick={() => handleCategoryChange('all')}
                                className="text-white/60 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}

                <InfiniteScroll
                    dataLength={displayFeed.length}
                    next={fetchMoreData}
                    hasMore={hasNext}
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
                    style={{ overflow: 'visible' }}
                >
                    <PostList
                        posts={displayFeed}
                        onAddPost={handleAddPost}
                        onOpenPostModal={handleOpenPostModal}
                    />
                </InfiniteScroll>

                {/* Empty State for filtered categories */}
                {!postsLoading && activeCategory !== 'all' && posts.length === 0 && (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-4">{JOURNEY_CATEGORIES.find(c => c.key === activeCategory)?.emoji}</div>
                        <h3 className="text-white font-bold text-lg mb-2">No posts in this category yet</h3>
                        <p className="text-white/50 text-sm mb-6">Be the first to share your experience!</p>
                        {loggedIn && (
                            <button
                                onClick={() => setIsPostModalOpen(true)}
                                className="bg-white text-gray-900 font-bold px-6 py-3 rounded-xl hover:shadow-lg transition-all"
                            >
                                Create a Post
                            </button>
                        )}
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="bg-primary min-h-screen flex flex-col items-center justify-start py-12 px-4 sm:px-6 lg:px-8">
            <ScrollToTop />

            {/* Hero Header */}
            <div className="text-center mb-6 mt-4">
                <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-purple/20 rounded-full blur-3xl animate-pulse"></div>
                        <div className="relative p-2 bg-white rounded-2xl shadow-2xl shadow-purple/40 border border-white/20 animate-float">
                            <img
                                src="/wormie-logo.svg"
                                alt="Wormie"
                                className="w-8 h-8 filter brightness-0"
                            />
                        </div>
                    </div>
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">Applicant Journey</h1>
                <p className="text-white/60 text-sm mt-1">Stories, tips & inspiration from the application trail</p>
            </div>

            {/* Category Filter Tabs */}
            <div className="w-full max-w-2xl mb-6 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 pb-2 px-1 min-w-max">
                    {JOURNEY_CATEGORIES.map(cat => (
                        <button
                            key={cat.key}
                            onClick={() => handleCategoryChange(cat.key)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeCategory === cat.key
                                ? 'bg-white text-gray-900 shadow-lg shadow-white/20 scale-105'
                                : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10'
                                }`}
                        >
                            <span className="text-base">{cat.emoji}</span>
                            <span>{cat.label}</span>
                        </button>
                    ))}
                </div>
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

            {renderContent()}
        </div>
    );
}


export default Trending;