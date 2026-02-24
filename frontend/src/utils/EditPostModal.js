import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { baseUrl } from '../shared';
import { icons } from '../constants';

function EditPostModal({ onAddPost, post, isOpen, onClose }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        if (post) {
            setTitle(post.title);
            setContent(post.content);
            setIsLoading(false);
        }
    }, [post]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const accessToken = localStorage.getItem('access');

        try {
            setIsLoading(true);
            const response = await axios.put(`${baseUrl}api/posts/${post.id}/edit/`, {
                title,
                content,
            }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            //console.log("response.data", response.data);
            setIsLoading((prevIsLoading) => !prevIsLoading);
            console.log('Post updated successfully:', response.data);
            onAddPost();
            onClose();
        } catch (err) {
            setError(err.response.data.detail || 'Error creating/updating post');
            console.error("err", err);
            setIsLoading(false);
        }
        console.log('Submitting post:', { title, content });
    };

    const handleCloseModal = () => {
        onClose();
        setTitle('');
        setContent('');
        setError(null);
        setIsLoading(false);
    };

    const LoadingIndicator = ({ isLoading }) => {
        return isLoading ? <p>Loading...</p> : null;
    };


    return (
        <div>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-2" role="alert">
                    <strong className="font-bold">Ops! </strong>
                    <span className="block sm:inline">Something went wrong! </span>
                </div>
            )}

            {isOpen && post && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        {/* Background overlay - much lighter now */}
                        <div
                            className="fixed inset-0 bg-gray-400 bg-opacity-20 transition-opacity"
                            aria-hidden="true"
                            onClick={handleCloseModal}
                        />

                        {/* Modal panel - matches AddPostModal style */}
                        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100">
                            {/* Header */}
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-lg leading-6 font-semibold text-gray-900" id="modal-title">
                                    Edit Post
                                </h3>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-400 hover:text-gray-500 focus:outline-none bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors"
                                >
                                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="px-6 py-6 sm:p-6 space-y-6">
                                    {/* Inputs - Styled like AddPostModal */}
                                    <div className="space-y-4">
                                        <div>
                                            <input
                                                type="text"
                                                className="block w-full border-0 p-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:outline-none border-b-2 border-transparent focus:border-primary transition-colors sm:text-lg font-medium leading-6"
                                                placeholder="Post title..."
                                                id="title"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <textarea
                                                className="block w-full border-0 p-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:outline-none border-l-2 border-transparent focus:border-primary pl-2 sm:text-base leading-6 resize-none min-h-[150px]"
                                                placeholder="Update your content..."
                                                id="content"
                                                value={content}
                                                onChange={(e) => setContent(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-100">
                                    <button
                                        type="submit"
                                        disabled={isLoading || (!title && !content)}
                                        className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-bold text-white sm:ml-3 sm:w-auto sm:text-sm ${isLoading || (!title && !content)
                                                ? 'bg-gray-300 cursor-not-allowed'
                                                : 'bg-primary hover:opacity-90'
                                            }`}
                                    >
                                        {isLoading ? 'Saving...' : 'Post'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EditPostModal;
