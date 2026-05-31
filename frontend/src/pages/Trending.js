import React, { useState, useEffect, useCallback } from 'react';
import PostList from '../components/PostList';
import PostModal from '../utils/PostModal';
import { useCurrentUser } from '../UserProvider/UserProvider';
import { baseUrl, getApiUrl } from '../shared';
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
    const fetchPosts = useCallback(async (category = 'all', isBackground = false, pageNum = 1) => {
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
            params.append('page_size', 20);

            const url = getApiUrl(`api/posts/?${params.toString()}`);
            const response = await axios.get(url, { headers });
            
            const newPosts = response.data?.results || [];
            if (pageNum === 1) {
                setPosts(newPosts);
            } else {
                setPosts(prev => [...prev, ...newPosts]);
            }
            
            setHasNext(!!response.data?.has_next);
            setPage(pageNum);
        } catch (error) {
            console.error("Error fetching posts", error);
            if (pageNum === 1) setPosts([]); // Clear to avoid perpetual loader if first page fails
        } finally {
            if (!isBackground && pageNum === 1) {
                setPostsLoading(false);
            }
        }
    }, [baseUrl]); // baseUrl is stable as it's defined outside or in shared.js

    useEffect(() => {
        fetchPosts(activeCategory, false, 1);
    }, [activeCategory]);

    useEffect(() => {
        const fetchNews = async () => {
            setNewsLoading(true);
            try {
                const token = localStorage.getItem('access');
                const headers = (token && token !== 'null') ? { Authorization: `Bearer ${token}` } : {};
                const response = await axios.get(getApiUrl('api/news/'), {
                    headers: headers
                });
                setNews(response.data?.results || []);
            } catch (error) {
                console.error("Error fetching news", error);
            } finally {
                setNewsLoading(false);
            }
        };
        fetchNews();
    }, []);

    const handleAddPost = useCallback((scrollToTop = true) => {
        fetchPosts(activeCategory, !scrollToTop, 1);
        if (scrollToTop) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [activeCategory, fetchPosts]);

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

        // Safely interleave posts and news without infinite loops
        while (p < postsList.length || n < newsList.length) {
            let addedPost = false;
            let addedNews = false;

            if (p < postsList.length) {
                combined.push({ isPost: true, itemType: 'post', ...postsList[p++] });
                addedPost = true;
            }
            
            // Add a news item every 3 posts, or just add them all if we run out of posts
            if (n < newsList.length && (p % 3 === 0 || p >= postsList.length)) {
                combined.push({ isNews: true, itemType: 'news', ...newsList[n++] });
                addedNews = true;
            }

            // Failsafe: if neither incremented, we've hit an edge case and should break to prevent freezing
            if (!addedPost && !addedNews) {
                break;
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
        return (
            <>
                {postsLoading && posts.length === 0 && (
                    <div className="w-full flex justify-center py-20">
                        <Loader text={`Uncovering ${JOURNEY_CATEGORIES.find(c => c.key === activeCategory)?.label}...`} fullScreen={false} />
                    </div>
                )}
                
                {(!postsLoading || posts.length > 0) && (
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

            {loggedIn && (
                <PostModal
                    onAddPost={() => handleAddPost(true)}
                    isOpen={isPostModalOpen}
                    onClose={() => setIsPostModalOpen(false)}
                    initialContent={postModalInitialContent}
                    triggerOpen={() => setIsPostModalOpen(true)}
                />
            )}

            {/* Main Layout Grid */}
            <div className="w-full max-w-7xl mx-auto px-2 lg:px-4 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column: Sticky Filters / Category Navigation (Desktop only) */}
                    <div className="lg:col-span-3 sticky top-24 bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 p-6 hidden lg:block">
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                            <span className="text-sm">⚡</span>
                            <span className="text-white font-black text-xs uppercase tracking-widest">Categories</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            {JOURNEY_CATEGORIES.map(cat => (
                                <button
                                    key={cat.key}
                                    onClick={() => handleCategoryChange(cat.key)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${activeCategory === cat.key
                                        ? 'bg-gradient-to-r from-[#24adbf] to-[#00b4d8] text-white shadow-[0_4px_15px_rgba(36,173,191,0.3)] scale-[1.02]'
                                        : 'bg-white/5 text-white/80 hover:bg-white/10 hover:translate-x-1 border border-white/5'
                                        }`}
                                >
                                    <span className="text-base">{cat.emoji}</span>
                                    <span>{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Center Column: Posts Feed */}
                    <div className="col-span-1 lg:col-span-6 flex flex-col items-center w-full">
                        {/* Mobile Category Slider (Visible on Mobile/Tablet only) */}
                        <div className="w-full mb-6 overflow-x-auto scrollbar-hide lg:hidden">
                            <div className="flex gap-2 pb-2 px-1 min-w-max">
                                {JOURNEY_CATEGORIES.map(cat => (
                                    <button
                                        key={cat.key}
                                        onClick={() => handleCategoryChange(cat.key)}
                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${activeCategory === cat.key
                                            ? 'bg-gradient-to-r from-[#24adbf] to-[#00b4d8] text-white shadow-[0_4px_15px_rgba(36,173,191,0.4)] scale-105'
                                            : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10'
                                            }`}
                                    >
                                        <span className="text-base">{cat.emoji}</span>
                                        <span>{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="w-full max-w-2xl">
                            {renderContent()}
                        </div>
                    </div>

                    {/* Right Column: Sponsored Content & Marketplace Ads */}
                    <div className="col-span-1 lg:col-span-3 space-y-6 lg:sticky lg:top-24 w-full">
                        
                        {/* Title / Section Header */}
                        <div className="flex items-center gap-2 mb-2 px-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                            <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Sponsored Spotlights</span>
                        </div>

                        {/* University Spotlight Ad Card 1 (Stanford) */}
                        <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-md p-6 hover:shadow-xl hover:shadow-[#17717d]/10 hover:border-[#17717d]/30 transition-all duration-300">
                            {/* Background Image / Gradient overlay */}
                            <div className="absolute inset-0 z-0 bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity duration-300" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=400&q=80')` }}></div>
                            <div className="absolute top-4 right-4 z-10 bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider text-white">
                                Ad
                            </div>
                            
                            <div className="relative z-10 flex flex-col h-full text-left">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#24adbf]">Stanford University</span>
                                <h4 className="text-base font-black text-white mt-1 mb-2">Explore the Farm</h4>
                                <p className="text-xs text-white/60 leading-relaxed mb-4">Discover undergraduate research, global study programs, and a world-class startup ecosystem.</p>
                                
                                <div className="grid grid-cols-2 gap-3 mb-5 border-y border-white/10 py-3">
                                    <div>
                                        <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Acceptance Rate</span>
                                        <p className="text-xs font-black text-white mt-0.5">3.9%</p>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Avg. SAT Range</span>
                                        <p className="text-xs font-black text-white mt-0.5">1500-1570</p>
                                    </div>
                                </div>

                                <a 
                                    href="https://admission.stanford.edu"
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="w-full text-center bg-gradient-to-r from-[#24adbf] to-[#00b4d8] hover:shadow-lg hover:shadow-[#24adbf]/20 text-white font-bold py-3 rounded-xl transition-all active:scale-95 text-xs"
                                >
                                    Explore Campus
                                </a>
                            </div>
                        </div>

                        {/* University Spotlight Ad Card 2 (Boston University) */}
                        <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-md p-6 hover:shadow-xl hover:shadow-[#17717d]/10 hover:border-[#17717d]/30 transition-all duration-300">
                            {/* Background Image / Gradient overlay */}
                            <div className="absolute inset-0 z-0 bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity duration-300" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=400&q=80')` }}></div>
                            <div className="absolute top-4 right-4 z-10 bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider text-white">
                                Ad
                            </div>
                            
                            <div className="relative z-10 flex flex-col h-full text-left">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#24adbf]">Boston University</span>
                                <h4 className="text-base font-black text-white mt-1 mb-2">Terrier Nation</h4>
                                <p className="text-xs text-white/60 leading-relaxed mb-4">Learn about BU's urban campus, outstanding study abroad initiatives, and renowned internship network.</p>
                                
                                <div className="grid grid-cols-2 gap-3 mb-5 border-y border-white/10 py-3">
                                    <div>
                                        <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Acceptance Rate</span>
                                        <p className="text-xs font-black text-white mt-0.5">18.6%</p>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Avg. SAT Range</span>
                                        <p className="text-xs font-black text-white mt-0.5">1430-1540</p>
                                    </div>
                                </div>

                                <a 
                                    href="https://www.bu.edu/admissions"
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="w-full text-center bg-gradient-to-r from-[#24adbf] to-[#00b4d8] hover:shadow-lg hover:shadow-[#24adbf]/20 text-white font-bold py-3 rounded-xl transition-all active:scale-95 text-xs"
                                >
                                    Explore Campus
                                </a>
                            </div>
                        </div>

                        {/* Marketplace Advisor Spotlight Ad */}
                        <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-md p-6 hover:shadow-xl hover:shadow-[#17717d]/10 hover:border-[#17717d]/30 transition-all duration-300">
                            <div className="absolute top-4 right-4 z-10 bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider text-white">
                                Featured
                            </div>
                            
                            <div className="relative z-10 flex flex-col h-full text-left">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#A855F7]">1:1 Advising Marketplace</span>
                                <h4 className="text-base font-black text-white mt-1 mb-2">Ivy League Experts</h4>
                                <p className="text-xs text-white/60 leading-relaxed mb-4">Connect with elite application advisors. Get tailored guidance on essays, college list building, and interview preparation.</p>
                                
                                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3 mb-4">
                                    <div className="w-9 h-9 bg-purple-500 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-inner shrink-0">
                                        🎓
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-white">Admissions Counselors</p>
                                        <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest mt-0.5">Top-Rated Coaches</p>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => window.location.href = '/advisors'}
                                    className="w-full text-center bg-purple-600 hover:bg-purple-700 hover:shadow-lg hover:shadow-purple/20 text-white font-bold py-3 rounded-xl transition-all active:scale-95 text-xs"
                                >
                                    Find an Advisor
                                </button>
                            </div>
                        </div>

                        {/* Premium College Finder Tool Banner */}
                        <div className="relative group overflow-hidden rounded-[2.5rem] border border-purple-500/20 bg-gradient-to-br from-purple-900/40 via-teal-900/40 to-teal-800/40 p-6 hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-500/40 transition-all duration-300 text-left">
                            <h4 className="text-base font-black text-white mb-1">Smart Match Finder</h4>
                            <p className="text-xs text-white/70 leading-relaxed mb-4">Get hyper-personalized recommendations matched to your GPA, SAT scores, major interests, and preferences.</p>
                            <button 
                                onClick={() => window.location.href = '/detailed-search'}
                                className="w-full text-center bg-white text-gray-900 font-bold py-3 rounded-xl transition-all active:scale-95 text-xs hover:shadow-lg"
                            >
                                Start Matching Quiz
                            </button>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
}


export default Trending;