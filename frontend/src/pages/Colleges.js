import '../index.css';
import { useState, useEffect } from 'react';
import InfiniteScrollScreen from '../components/InfiniteScroll';
import College from '../components/College';
import NotFound from '../components/NotFound';
import { baseUrl } from '../shared';
import Search from '../components/Search';
import { useCurrentUser } from '../UserProvider/UserProvider';
import ScrollToTop from '../components/ScrollToTop';
import PromotionalHero from '../components/PromotionalHero';
import { ExclamationTriangleIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';

const Colleges = () => {
    const { user, loading, loggedIn } = useCurrentUser();

    const [notFound, setNotFound] = useState(false);
    const [viewMode, setViewMode] = useState('featured');
    const [featuredColleges, setFeaturedColleges] = useState([]);

    useEffect(() => {
        const handleReset = () => {
            setViewMode('featured');
        };
        window.addEventListener('resetHomeView', handleReset);
        return () => window.removeEventListener('resetHomeView', handleReset);
    }, []);

    const fetchColleges = async (page) => {
        const token = localStorage.getItem('access');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const response = await fetch(`${baseUrl}api/colleges/?page=${page}`, {
            headers: headers
        });
        const data = await response.json();
        return { colleges: data.colleges, hasMore: data.has_more };
    };

    useEffect(() => {
        const loadFeatured = async () => {
            try {
                const token = localStorage.getItem('access');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                const response = await fetch(`${baseUrl}api/colleges/featured/`, {
                    headers: headers
                });

                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data)) {
                        setFeaturedColleges(data);
                    } else if (data.results) {
                        // Fallback in case pagination is somehow enabled globally later
                        setFeaturedColleges(data.results);
                    }
                }
            } catch (e) {
                console.error("Failed to load featured colleges", e);
            }
        };
        loadFeatured();
    }, []);

    const renderCollege = (college, index) => (
        <College key={college.id} {...college} />
    );

    const showColleges = true;

    return (
        <>
            <ScrollToTop />
            <div>
                {notFound && <NotFound />}
                <div className="bg-primary min-h-screen pb-24">
                    <PromotionalHero />
                    
                    {loggedIn && user?.role === 'college_staff' && !user?.is_verified && (
                        <div className="max-w-7xl mx-auto px-6 mt-8">
                            <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="flex items-start gap-4">
                                    <div className="bg-amber-100 p-2 rounded-xl">
                                        <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" aria-hidden="true" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-amber-800">Account Pending Verification</h3>
                                        <p className="mt-1 text-sm text-amber-700 leading-relaxed">
                                            Welcome to the Worm community! Your application as a College Representative is currently being reviewed by our team. 
                                            You will receive an email once your account is verified and you can access the full College Portal features.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {loggedIn && user?.is_verified && user?.role === 'college_staff' && (
                         <div className="max-w-7xl mx-auto px-6 mt-8">
                            <div className="bg-teal-50 border-l-4 border-teal-500 p-6 rounded-2xl shadow-sm">
                                <div className="flex items-start gap-4">
                                    <div className="bg-teal-100 p-2 rounded-xl">
                                        <CheckBadgeIcon className="h-6 w-6 text-teal-600" aria-hidden="true" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-teal-900">Verified Representative</h3>
                                        <p className="mt-1 text-sm text-teal-700">
                                            Your account is fully verified. You can now manage your institution from the <a href="/college/portal" className="font-bold underline">College Portal</a>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div id="college-cards-section" className="scroll-mt-8"></div>
                    {showColleges ? (
                        <>
                            {viewMode === 'featured' ? (
                                <div className="flex flex-col items-center animate-fadeIn pt-20">
                                    <div className="w-full text-center pb-16">
                                        <h2 className="text-3xl md:text-4xl font-normal text-gray-900 tracking-tight">
                                            Featured Colleges
                                        </h2>
                                        <div className="w-16 h-1 bg-white/30 mx-auto mt-4 rounded-full"></div>
                                        <p className="text-white/60 mt-4 text-base font-light">Discover top-rated institutions across the country</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-6 w-full max-w-7xl mx-auto">
                                        {featuredColleges.length > 0 ? (
                                            featuredColleges.map((college) => (
                                                <College key={college.id} {...college} />
                                            ))
                                        ) : (
                                            <div className="text-gray-400 col-span-full text-center py-20">
                                                <div className="animate-pulse text-xl opacity-50">Loading featured colleges...</div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="py-24">
                                        <button
                                            onClick={() => {
                                                setViewMode('all');
                                                setTimeout(() => {
                                                    document.getElementById('college-cards-section')?.scrollIntoView({ behavior: 'smooth' });
                                                }, 50);
                                            }}
                                            className="group relative inline-flex items-center justify-center px-10 py-3 text-sm font-semibold text-white/80 hover:text-white transition-all duration-300 bg-white/10 hover:bg-white/20 border border-white/5 hover:border-white/20 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50 active:scale-95"
                                        >
                                            Explore All Colleges
                                            <svg className="w-5 h-5 ml-2 -mr-1 transition-transform group-hover:translate-x-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="animate-fadeIn">
                                    <div className="container mx-auto px-4 py-12">
                                        <button
                                            onClick={() => {
                                                setViewMode('featured');
                                                setTimeout(() => {
                                                    document.getElementById('college-cards-section')?.scrollIntoView({ behavior: 'smooth' });
                                                }, 50);
                                            }}
                                            className="flex items-center !text-white hover:!text-white transition-all duration-300 font-bold group bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-full border border-white/20 hover:border-white/40 backdrop-blur-md shadow-lg active:scale-95"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1 !text-white" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                            </svg>
                                            <span className="!text-white opacity-100 uppercase tracking-wide text-xs">Back to Featured</span>
                                        </button>
                                    </div>
                                    <div className="w-full">
                                        <InfiniteScrollScreen
                                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6 w-full max-w-7xl mx-auto"
                                            renderItem={renderCollege}
                                            fetchColleges={fetchColleges}
                                            keyExtractor={college => college.id} />
                                    </div>
                                </div>
                            )}
                        </>
                    ) : null}
                </div>
            </div>
        </>
    );
}

export default Colleges;