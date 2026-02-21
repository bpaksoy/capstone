import React from 'react';
import { images } from '../constants';
import { Link } from 'react-router-dom';
import { baseUrl } from '../shared';
import ReactHtmlParser from 'html-react-parser';
import sanitizeHtml from 'sanitize-html';


const truncateContent = (html, maxLength) => {
    if (!html) {
        return "";
    }
    // Sanitize HTML
    const sanitizedHtml = sanitizeHtml(html, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
        allowedAttributes: {
            '*': ['href', 'src', 'alt', 'title', 'style']
        }
    });

    try {
        const textContent = ReactHtmlParser(sanitizedHtml)
            .reduce((text, item) => {
                if (typeof item === "string") {
                    return text + item
                } else if (typeof item === "number") {
                    return text + String(item)
                }
                else if (item && typeof item.props?.children === 'string') {
                    return text + item.props?.children;
                }
                else if (item && Array.isArray(item.props?.children)) {
                    return text + item.props.children.reduce((acc, child) => {
                        if (typeof child === 'string') {
                            return acc + child;
                        } else if (typeof child === 'number') {
                            return acc + String(child)
                        } else {
                            return acc
                        }
                    }, "");
                }
                return text
            }, "");

        if (textContent.length > maxLength) {
            return textContent.substring(0, maxLength) + "...";
        }
        return textContent;
    } catch (error) {
        console.error("Error parsing HTML:", error);
        return html.substring(0, maxLength) + "...";
    }
};



const ArticleItem = ({ id, title, content, image, created_at, author, slug }) => {

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
                                    <img
                                        src={author.image ? `${baseUrl}${author.image.startsWith('/') ? author.image.substring(1) : author.image}` : images.avatar}
                                        alt="User Avatar"
                                        className="w-6 h-6 rounded-full object-cover"
                                    />
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