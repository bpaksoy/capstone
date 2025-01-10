import React from 'react';
import { images } from '../constants';
import { Link } from 'react-router-dom';
import { baseUrl } from '../shared';


function ArticleItem({ id, title, content, image, created_at, author, slug }) {
    const truncateContent = (text, maxLength) => {
        if (!text) {
            return "";
        }
        if (text.length > maxLength) {
            return text.substring(0, maxLength) + "...";
        }
        return text;
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex flex-col items-center">
                <div key={id} className="bg-white p-4 rounded-lg shadow-md max-w-2xl w-full mb-4 relative">
                    <div className="items-center mb-4">
                        <h2 className="text-xl font-semibold mb-2">{title}</h2>
                        {image && <img src={`${baseUrl}${image}`} alt="Article Thumbnail" className="w-full h-48 object-cover rounded-md mb-2" />}
                        <p className="text-gray-700 mb-4">
                            {truncateContent(content, 300)}
                            <Link to={`/articles/${slug}`} className="text-blue-500 underline ml-1">Read more</Link>
                        </p>
                        <div className="flex justify-between items-center w-full">
                            {author &&
                                (<div className="flex items-center space-x-2">
                                    <img src={images.avatar} alt="User Avatar" className="w-6 h-6 rounded-full" />
                                    <p className="text-gray-500 text-sm">{author.username}</p>
                                </div>
                                )
                            }
                            <p className="text-gray-500 text-sm">Created at: {new Date(created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ArticleItem;