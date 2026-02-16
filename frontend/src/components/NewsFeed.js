import React, { useState, useEffect } from 'react';
import { baseUrl } from '../shared';
import axios from 'axios';
import { useCurrentUser } from '../UserProvider/UserProvider';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import NotFound from './NotFound';
import { images } from "../constants";

const NewsFeed = () => {
    const [news, setNews] = useState([]);
    // console.log("news", news);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const [notFound, setNotFound] = useState(false);
    const { updateLoggedInStatus } = useCurrentUser();
    const [errorStatus, setErrorStatus] = useState();

    // useEffect(() => {
    //     const fetchNews = async () => {
    //         setIsLoading(true);
    //         setError(null)
    //         try {
    //             const response = await axios.get(`${baseUrl}api/news-api/`, {
    //                 headers: {
    //                     'Authorization': `Bearer ${localStorage.getItem('access')}`
    //                 }
    //             });
    //             console.log("response for news", response);
    //             if (response.status === 404) {
    //                 setNotFound(true);
    //                 navigate("/404");
    //             } else if (response.status === 401) {
    //                 updateLoggedInStatus(false);
    //                 navigate("/login", {
    //                     state: {
    //                         previousUrl: location.pathname
    //                     }
    //                 });
    //             }
    //             console.log("response.data", response.data);
    //             setNews(response.data.results);
    //         } catch (error) {
    //             setError(error);
    //             console.error("Error fetching news", error);
    //         }
    //         finally {
    //             setIsLoading(false);
    //         }
    //     };
    //     fetchNews();
    // }, []);

    useEffect(() => {
        const fetchNews = async () => {
            setIsLoading(true);
            setError(null)
            try {
                const token = localStorage.getItem('access');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const response = await axios.get(`${baseUrl}api/news/`, {
                    headers: headers
                });
                if (response.status === 404) {
                    setNotFound(true);
                    navigate("/404");
                } else if (response.status === 401) {
                    updateLoggedInStatus(false);
                    navigate("/login", {
                        state: {
                            previousUrl: location.pathname
                        }
                    });
                }
                setNews(response.data.results);
            } catch (error) {
                setError(error);
                console.error("Error fetching news", error);
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchNews();
    }, []);


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="spinner border-4 border-t-4 border-primary rounded-full h-16 w-16 animate-spin"></div>
            </div>
        );
    }

    if (error) return <p>Error: {error.message}</p>

    if (errorStatus === 404) {
        return (
            <>
                <NotFound />
                <Link to="/">Go Home</Link>
            </>
        );
    }

    if (errorStatus) {
        return (
            <>
                <p>There was a problem with the server, try again later.</p>
                <Link to="/">Go Home</Link>
            </>
        );
    }


    return (
        <div className="bg-primary min-h-screen py-16 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Trending News</h1>
                    <p className="text-blue-100 text-lg opacity-80">Latest updates on college admissions and higher education</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {news && news.map((item) => (
                        <div
                            key={item.article_id}
                            className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group border border-white/10"
                        >
                            {/* Image Section */}
                            <div className="md:w-1/3 h-48 md:h-auto relative overflow-hidden shrink-0 bg-gray-100">
                                <img
                                    src={item.image_url || images.collegeImg}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    alt={item.title}
                                    onError={(e) => { e.target.onerror = null; e.target.src = images.collegeImg; }}
                                />
                                <div className="absolute top-4 left-4">
                                    <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold text-primary uppercase tracking-widest shadow-sm">
                                        {item.source}
                                    </span>
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="p-6 md:p-8 flex flex-col flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                    {item.title}
                                </h3>
                                <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed">
                                    {item.description}
                                </p>
                                <div className="mt-auto flex items-center justify-between">
                                    <a
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:gap-3 transition-all"
                                    >
                                        Read Full Article
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {!news || news.length === 0 && (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                        <p className="text-white/60 font-medium">No fresh news at the moment. Check back soon!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewsFeed;