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
        <div className="bg-primary min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <h1 className="text-white font-bold text-2xl mb-4">Trending News</h1>
            <div className="flex flex-col gap-4 w-full max-w-2xl ">
                {news && news.map((item) => (
                    <div key={item.article_id} className="bg-white rounded-lg shadow-md p-6 flex gap-4">
                        <div className='max-w-[100px] max-h-[100px] min-w-[100px] min-h-[100px]'>
                            <img src={item.image_url ? item.image_url : images.toss} className="w-full h-full object-cover" alt="News thumbnail" />
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                            <p className="text-gray-700">{item.description}</p>
                            <a className="text-blue-500 underline" href={item.link} target="_blank" rel="noopener noreferrer">Read More</a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NewsFeed;