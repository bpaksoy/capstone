import React, { useState } from 'react';
import axios from 'axios';
import { baseUrl } from '../shared';
import { images } from '../constants';

const AddBioModal = ({ initialValues = {}, fetchUser }) => {
    const [bio, setBio] = useState(initialValues.bio || '');
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState(null);

    const handleOpenModal = () => {
        setBio(initialValues.bio || '');
        setIsOpen(true);
        setError(null);
    };

    const handleCloseModal = () => {
        setIsOpen(false);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const accessToken = localStorage.getItem('access');

        try {
            const response = await axios.patch(`${baseUrl}api/user/update/`, {
                bio,
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            console.log('User bio updated successfully:', response.data);
            fetchUser();
            handleCloseModal();
        } catch (err) {
            const msg = err.response?.data?.detail || err.response?.data?.message || 'Error updating bio';
            setError(msg);
            console.error("Error updating bio:", err);
        }
    };

    return (
        <div>
            <button
                onClick={handleOpenModal}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2.5 px-6 rounded-full shadow-sm hover:shadow transition-all inline-flex items-center gap-2 mt-2 border border-gray-200"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
                {initialValues?.bio ? 'Edit Bio' : 'Add Bio'}
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75 backdrop-blur-sm" aria-hidden="true" onClick={handleCloseModal} />

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block w-full max-w-lg overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl sm:my-8" role="dialog" aria-modal="true">
                            <div className="px-8 pt-8 pb-6 bg-white">
                                <div className="flex flex-col items-center">
                                    {/* User Profile Circle */}
                                    <div className="relative mb-6">
                                        <div className="w-20 h-20 rounded-full border-4 border-teal-50 overflow-hidden shadow-md">
                                            <img
                                                src={initialValues?.image ? baseUrl + initialValues.image : images.avatar}
                                                alt="User Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full border-2 border-white shadow-sm">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                            </svg>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold text-gray-900 mb-6">
                                        {initialValues?.bio ? 'Update Your Bio' : 'Add a Bio'}
                                    </h3>

                                    {error && (
                                        <div className="w-full bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded shadow-sm mb-6 text-xs flex items-center gap-2" role="alert">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                                            </svg>
                                            <span className="font-medium">{error}</span>
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit} className="w-full">
                                        <div className="mb-8">
                                            <textarea
                                                className="w-full h-40 px-5 py-4 text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none placeholder-gray-400 text-sm leading-relaxed"
                                                id="bio"
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value)}
                                                placeholder="Tell your story... What drives you? Which colleges are you excited about?"
                                            />
                                            <div className="mt-2 text-right text-[10px] text-gray-400 font-medium">
                                                {bio.length} characters
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <button
                                                type="submit"
                                                className="flex-1 py-3 px-6 text-sm font-bold text-white transition-all rounded-xl bg-primary hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg shadow-teal-100"
                                            >
                                                Save Bio
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCloseModal}
                                                className="flex-1 py-3 px-6 text-sm font-bold text-gray-700 transition-all bg-gray-100 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddBioModal;
