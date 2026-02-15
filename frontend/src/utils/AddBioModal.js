import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { baseUrl } from '../shared';
import { icons } from '../constants';

const AddBioModal = ({ initialValues = {}, fetchUser }) => {

    const [bio, setBio] = useState(initialValues.bio || '');
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setBio(initialValues.bio)
    }, [initialValues.bio]);


    const handleOpenModal = () => {
        setIsOpen(true);
        setError(null)
    };

    const handleCloseModal = () => {
        setIsOpen(false);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const accessToken = localStorage.getItem('access');
        if (bio.trim() === '') {
            setError('Please enter a bio.');
            handleCloseModal();
            return;
        }

        try {
            const response = await axios.post(`${baseUrl}api/user/update/`, {
                bio,
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            console.log('User bio updated successfully:', response.data);
            fetchUser();

        } catch (err) {
            setError(err.response.data.detail || 'Error updating bio');
            console.log("err", err)
        }
        console.log('Submitting user bio:', { bio });
        handleCloseModal();
    };

    return (
        <div>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-2" role="alert">
                    <strong className="font-bold">Ops! </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            <button
                onClick={handleOpenModal}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 px-4 rounded-full shadow-sm hover:shadow transition-all inline-flex items-center gap-2 mt-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
                Update Bio
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" />

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true" />

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                                        {/* Icon or image here */}
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left p-6 w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                                            Add Bio
                                        </h3>
                                        <div className="mt-2">
                                            <form onSubmit={handleSubmit}>
                                                <div className="mb-2">
                                                    {/* <label htmlFor="content" className="block text-gray-700 text-sm font-bold mb-2">
                                                    Content
                                                </label> */}
                                                    <textarea
                                                        className="shadow appearance-none border rounded w-full min-h-[100px] max-h-[200px] py-4 px-6 text-gray-700 leading-tight focus:outline-none focus:shadow-outline larger-textarea"
                                                        id="bio"
                                                        value={bio}
                                                        onChange={(e) => setBio(e.target.value)}
                                                        placeholder='Bio'
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

export default AddBioModal;
