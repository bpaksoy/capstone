import React, { useState } from 'react';
import { icons } from "../constants";
import axios from 'axios';
import { baseUrl } from '../shared';

import { useCurrentUser } from '../UserProvider/UserProvider';
import { images } from "../constants";

function AddPostModal({ onAddPost }) {
    const { user } = useCurrentUser();
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    const handleOpenModal = () => {
        setIsOpen(true);
        setError(null)
    };

    const handleCloseModal = () => {
        setIsOpen(false);
        setTitle('');
        setContent('');
    };

    const handleImageChange = (e) => {
        setImageFile(e.target.files[0]);
    };


    const handleSubmit = async (event) => {
        event.preventDefault();
        const accessToken = localStorage.getItem('access');
        console.log('Submitting data:', { title, content, imageFile });

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            if (imageFile) {
                formData.append('image', imageFile);
            }

            const response = await axios.post(`${baseUrl}api/posts/`, formData, { // Send FormData
                headers: {
                    'Content-Type': 'multipart/form-data', // Important: Set the correct header
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            console.log('Post created successfully:', response.data);
            setTitle('');
            setContent('');
            setImageFile(null); // Clear image state after upload
            onAddPost();
        } catch (err) {
            setError(err.response.data.detail || 'Error creating post');
            console.error("err", err);
        }
        console.log('Submitting post:', { title, content });
        handleCloseModal();
    };


    return (
        <div className="w-full max-w-2xl mb-6">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-2" role="alert">
                    <strong className="font-bold">Ops! </strong>
                    <span className="block sm:inline">Something went wrong! </span>
                </div>
            )}

            <div
                onClick={handleOpenModal}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
            >
                <div className="flex items-center gap-3">
                    <img
                        src={user?.image ? (user.image.startsWith('http') ? user.image : baseUrl + user.image) : images.profile}
                        alt={user?.username || "User"}
                        className="w-10 h-10 rounded-full object-cover border border-gray-100"
                        onError={(e) => { e.target.onerror = null; e.target.src = images.profile; }}
                    />
                    <div className="flex-1 bg-gray-50 hover:bg-gray-100 transition-colors rounded-full px-4 py-2.5 text-gray-500 text-sm font-medium text-left">
                        What's on your mind, {user?.username}?
                    </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 px-2">
                    <div className="flex items-center gap-2 text-gray-500 text-sm font-medium hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                        <span>Photo/Video</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm font-medium hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-yellow-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
                        </svg>
                        <span>Feeling/Activity</span>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        {/* Background overlay */}
                        <div
                            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm"
                            aria-hidden="true"
                            onClick={handleCloseModal}
                        />

                        {/* Modal panel */}
                        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100">
                            {/* Header */}
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-lg leading-6 font-semibold text-gray-900" id="modal-title">
                                    Create Post
                                </h3>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-400 hover:text-gray-500 focus:outline-none bg-gray-100 hover:bg-gray-200 rounded-full p-1"
                                >
                                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="px-6 py-6 sm:p-6 space-y-6">
                                    {/* User Info */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <img
                                            src={user?.image ? (user.image.startsWith('http') ? user.image : baseUrl + user.image) : images.profile}
                                            alt={user?.username}
                                            className="h-10 w-10 rounded-full object-cover"
                                            onError={(e) => { e.target.onerror = null; e.target.src = images.profile; }}
                                        />
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{user?.username}</p>
                                            <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 rounded px-1.5 py-0.5 w-fit mt-0.5">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.75 9.25a.75.75 0 000 1.5h4.59l-2.1 1.95a.75.75 0 001.02 1.1l3.5-3.25a.75.75 0 000-1.1l-3.5-3.25a.75.75 0 10-1.02 1.1l2.1 1.95H6.75z" clipRule="evenodd" />
                                                </svg>
                                                <span>Public</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Inputs */}
                                    <div className="space-y-4">
                                        <div>
                                            <input
                                                type="text"
                                                className="block w-full border-0 p-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:outline-none border-b-2 border-transparent focus:border-primary transition-colors sm:text-lg font-medium leading-6"
                                                placeholder="Give your post a title..."
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <textarea
                                                className="block w-full border-0 p-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:outline-none border-l-2 border-transparent focus:border-primary pl-2 sm:text-base leading-6 resize-none min-h-[120px]"
                                                placeholder={`What's on your mind, ${user?.username}?`}
                                                value={content}
                                                onChange={(e) => setContent(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Image Upload Area */}
                                    <div className="mt-2">
                                        <div className="flex items-center justify-between border border-gray-300 rounded-lg p-3 shadow-sm hover:bg-gray-50 cursor-pointer relative group transition-all hover:border-primary">
                                            <span className="text-sm font-medium text-gray-700">Add to your post</span>
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-full hover:bg-gray-200 text-green-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                                        <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="p-1.5 rounded-full hover:bg-gray-200 text-yellow-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                                        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-2.625 6c-.54 0-.828.419-.936.634a1.96 1.96 0 00-.189.866c0 .298.059.605.189.866.108.215.395.634.936.634.54 0 .828-.419.936-.634.13-.26.189-.568.189-.866 0-.298-.059-.605-.189-.866-.108-.215-.395-.634-.936-.634zm4.314.634c.108-.215.395-.634.936-.634.54 0 .828.419.936.634.13.26.189.568.189.866 0 .298-.059.605-.189.866-.108-.215-.395-.634-.936-.634-.54 0-.828.419-.936.634-.13.26-.189.568-.189.866 0-.298.059-.605.189-.866zm2.023 6.828a.75.75 0 10-1.06-1.06 3.75 3.75 0 01-5.304 0 .75.75 0 00-1.06 1.06 5.25 5.25 0 007.424 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <input
                                                type="file"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                            />
                                        </div>
                                        {imageFile && (
                                            <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                                </svg>
                                                {imageFile.name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-100">
                                    <button
                                        type="submit"
                                        disabled={!title && !content && !imageFile}
                                        className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm ${!title && !content && !imageFile
                                            ? 'bg-gray-300 cursor-not-allowed'
                                            : 'bg-primary hover:opacity-90'
                                            }`}
                                    >
                                        Post
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

export default AddPostModal;