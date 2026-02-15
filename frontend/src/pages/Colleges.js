import '../index.css';
import { useState, useEffect } from 'react';
import InfiniteScrollScreen from '../components/InfiniteScroll';
import College from '../components/College';
import NotFound from '../components/NotFound';
import { baseUrl } from '../shared';
import Search from '../components/Search';
import { useCurrentUser } from '../UserProvider/UserProvider';
import ScrollToTop from '../components/ScrollToTop';

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
        <div key={college.id} className="w-full flex justify-center">
            <College {...college} />
        </div>
    );

    const showColleges = true;

    return (
        <>
            <ScrollToTop />
            <div>
                {notFound && <NotFound />}
                <div className="bg-primary min-h-screen">
                    <Search />
                    {showColleges ? (
                        <>
                            {viewMode === 'featured' ? (
                                <div className="flex flex-col items-center animate-fadeIn">
                                    <div className="w-full text-center py-8">
                                        <h2 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
                                            Featured Colleges
                                        </h2>
                                        <p className="text-blue-100 mt-2 text-lg">Discover top-rated institutions</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-8 w-full max-w-7xl mx-auto place-items-center">
                                        {featuredColleges.length > 0 ? (
                                            featuredColleges.map((college, index) => (
                                                <div key={college.id} className="w-full flex justify-center">
                                                    <College {...college} />
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-white col-span-full">Loading featured colleges...</div>
                                        )}
                                    </div>

                                    <div className="py-12">
                                        <button
                                            onClick={() => {
                                                setViewMode('all');
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-gray-900 font-pj rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 hover:bg-black hover:scale-105 shadow-xl"
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
                                    <div className="container mx-auto px-4 py-4 mb-4">
                                        <button
                                            onClick={() => {
                                                setViewMode('featured');
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className="flex items-center text-white hover:text-blue-200 transition-colors font-medium"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                            </svg>
                                            Back to Featured
                                        </button>
                                    </div>
                                    <div className="w-full">
                                        <InfiniteScrollScreen
                                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-8 w-full max-w-7xl mx-auto place-items-center"
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