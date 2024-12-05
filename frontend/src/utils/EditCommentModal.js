import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { baseUrl } from '../shared';
import { icons } from '../constants';

function EditCommentModal({ onAddPost, comment, isOpen, onClose, refetchComments }) {
    const [content, setContent] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        if (comment) {
            setContent(comment.content);
            setIsLoading(false);
        }
    }, [comment]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const accessToken = localStorage.getItem('access');

        try {
            setIsLoading(true);
            const response = await axios.put(`${baseUrl}api/comments/${comment.id}/edit/`, {
                content,
            }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            console.log("response.data", response.data);
            setIsLoading((prevIsLoading) => !prevIsLoading);
            console.log('Comment updated successfully:', response.data);
            //onAddPost();
            refetchComments();
            onClose();
        } catch (err) {
            setError(err.response.data.detail || 'Error creating/updating comment');
            console.error("err", err);
            setIsLoading(false);
        }
        console.log('Submitting comment:', { content });
    };

    const handleCloseModal = () => {
        onClose();
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

            {isOpen && comment && (
                <div className="fixed inset-0 z-10 overflow-y-auto flex justify-center items-center min-h-screen">
                    <LoadingIndicator isLoading={isLoading} />
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        {/* <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" />

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true" /> */}

                        <div className="inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <img src={icons.plus} alt="edit post" className="" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                                            Edit Comment
                                        </h3>
                                        <div className="mt-2">
                                            <form onSubmit={handleSubmit}>
                                                <div className="mb-4">
                                                    <label htmlFor="content" className="block text-gray-700 text-sm font-bold mb-2">
                                                        Content
                                                    </label>
                                                    <textarea
                                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                        id="content"
                                                        value={content}
                                                        onChange={(e) => setContent(e.target.value)}
                                                    />
                                                </div>
                                                <div className="flex justify-end">
                                                    <button type="submit" className="bg-primary hover:bg-gray-900 text-white font-bold py-2 px-4 rounded">
                                                        Save
                                                    </button>
                                                    <button type="button" onClick={handleCloseModal} className="ml-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EditCommentModal;