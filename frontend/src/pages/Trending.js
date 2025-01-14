import React, { useState, useEffect } from 'react';
import PostList from '../components/PostList';
import PostModal from '../utils/PostModal';
import usePosts from '../hooks/FetchPosts';
import NewsFeed from '../components/NewsFeed';
import axios from 'axios';
import { baseUrl } from '../shared';
import ArticleItem from '../components/ArticleItem';
import { useCurrentUser } from '../UserProvider/UserProvider';
import { useNavigate, useLocation } from 'react-router-dom';

function Trending() {
    const { posts, updatePosts } = usePosts();
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [allMixedItems, setAllMixedItems] = useState([]) // to hold all the items mixed
    const handleAddPost = () => {
        updatePosts(); // Trigger refetch after adding a post
    };

    const { updateLoggedInStatus } = useCurrentUser();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const response = await axios.get(`${baseUrl}api/articles/?published=true`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('access')}`
                    }
                });
                if (response.status === 401) {
                    updateLoggedInStatus(false);
                    navigate("/login", {
                        state: {
                            previousUrl: location.pathname
                        }
                    });
                } else {
                    setArticles(response.data.articles);
                    setLoading(false);
                }
                console.log("article data", response.data);

            } catch (error) {
                console.log("error here", error);
                setError(error);
                if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
                    updateLoggedInStatus(false);
                    navigate("/login", {
                        state: {
                            previousUrl: location.pathname
                        }
                    });
                }
                else {
                    setError(error);
                }
            }
        };
        fetchArticles();
    }, [updateLoggedInStatus, navigate, location.pathname]);


    // useEffect(() => {
    //     const fetchArticles = async () => {
    //         try {
    //             const response = await axios.get(`${baseUrl}api/articles/?published=true`, {
    //                 headers: {
    //                     Authorization: `Bearer ${localStorage.getItem('access')}`
    //                 }
    //             })
    //             console.log("article data", response.data)
    //             setArticles(response.data.articles);
    //             setLoading(false)
    //         } catch (error) {
    //             console.log("error here", error)
    //             setError(error);
    //         }
    //     };
    //     fetchArticles();
    // }, []);

    useEffect(() => {
        if (!loading) { // mix only when both posts and news are loaded
            const allItems = [...posts, ...articles];
            const shuffledItems = shuffleArray(allItems);
            setAllMixedItems(shuffledItems);
        }
    }, [posts, articles, loading]);

    const shuffleArray = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };


    if (error) return <p>Error: {error.message}</p>
    return (
        <div className="bg-primary min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <PostModal onAddPost={handleAddPost} />
            {loading ? (
                <div className="flex justify-center items-center h-screen">
                    <div className="spinner border-4 border-t-4 border-primary rounded-full h-16 w-16 animate-spin"></div>
                </div>
            ) :
                (allMixedItems.length > 0 ? (
                    allMixedItems.map((item) => {
                        if (item.type === "post") {
                            return <PostList key={item.id} posts={[item]} onAddPost={handleAddPost} />
                        } else if (item.type === "article") {
                            return <ArticleItem key={item.id} {...item} />;
                        }
                    })
                ) : <p>No articles or posts yet</p>)
            }
            <NewsFeed />
        </div>
    );
}

export default Trending;