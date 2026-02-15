import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { baseUrl } from '../shared';
import { images } from '../constants';
import ReactHtmlParser from 'html-react-parser';

const ArticleDetails = () => {
    const { slug } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const response = await axios.get(`${baseUrl}api/articles/${slug}/`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('access')}`,
                    },
                });
                console.log("response data:", response.data);
                setArticle(response.data);
                setLoading(false);
            } catch (error) {
                setError(error);
                setLoading(false);
            }
        };
        fetchArticle();
    }, [slug]);


    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="spinner border-4 border-t-4 border-primary rounded-full h-16 w-16 animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return <p>Error: {error.message}</p>;
    }


    return (
        <div className="bg-primary min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            {article ? (
                <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl w-full">
                    <h1 className="text-3xl font-semibold mb-4">{article.title}</h1>
                    <div className="flex items-center space-x-2 mb-4">
                        <img src={images.avatar} alt="User Avatar" className="w-6 h-6 rounded-full" />
                        <p className="text-gray-500 text-sm">{article.author.username}</p>
                    </div>
                    {article.image && <img src={`${baseUrl}${article.image}`} alt="Article Thumbnail" className="w-full h-auto object-cover rounded-md mb-4" />}
                    {ReactHtmlParser(article.content)}
                </div>
            ) : (
                <p>Article not found</p>
            )}
        </div>
    );
};
export default ArticleDetails;