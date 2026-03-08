import React, { useState } from 'react';
import axios from 'axios';
import { baseUrl } from '../shared';
import { icons } from '../constants';
import { states as statesList } from '../constants/states';
import { countries as countriesList } from '../constants/countries';
import AutocompleteInput from './AutocompleteInput';

const AddInfoModal = ({ initialValues = {}, fetchUser }) => {
    const [firstName, setFirstName] = useState(initialValues?.first_name || '');
    const [lastName, setLastName] = useState(initialValues?.last_name || '');
    const [city, setCity] = useState(initialValues?.city || '');
    const [state, setState] = useState(initialValues?.state || '');
    const [country, setCountry] = useState(initialValues?.country || '');
    const [major, setMajor] = useState(initialValues?.major || '');
    const [education, setEducation] = useState(initialValues?.education || '');
    const [gpa, setGpa] = useState(initialValues?.gpa || '');
    const [satScore, setSatScore] = useState(initialValues?.sat_score || '');
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState(null);

    const handleOpenModal = () => {
        // Reset state to current initialValues when opening
        setFirstName(initialValues?.first_name || '');
        setLastName(initialValues?.last_name || '');
        setCity(initialValues?.city || '');
        setState(initialValues?.state || '');
        setCountry(initialValues?.country || '');
        setMajor(initialValues?.major || '');
        setEducation(initialValues?.education || '');
        setGpa(initialValues?.gpa || '');
        setSatScore(initialValues?.sat_score || '');
        setIsOpen(true);
        setError(null)
    };

    const handleCloseModal = () => {
        setIsOpen(false);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const accessToken = localStorage.getItem('access');

        const data = {
            first_name: firstName || '',
            last_name: lastName || '',
            city: city || '',
            state: state || '',
            country: country || '',
            major: major || '',
            education: education || '',
            gpa: gpa || null,
            sat_score: satScore || null,
        };

        try {
            const response = await axios.patch(`${baseUrl}api/user/update/`, data, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            console.log('User information updated successfully:', response.data);
            fetchUser();
            handleCloseModal();
        } catch (err) {
            const msg = err.response?.data?.detail || err.response?.data?.message || 'Error updating profile info';
            setError(msg);
            console.error("Error updating profile:", err);
        }
    };

    return (
        <div>
            <button
                onClick={handleOpenModal}
                className="bg-primary hover:bg-teal-700 text-white text-sm font-bold py-2 px-6 rounded-full shadow hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2 mx-auto"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Edit Profile
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" aria-hidden="true" onClick={handleCloseModal} />

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block w-full max-w-lg overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-xl sm:my-8" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
                            <div className="px-8 pt-8 pb-6 bg-white">
                                <div className="flex items-start">
                                    <div className="w-full">
                                        <h3 className="text-xl font-bold leading-6 text-gray-900 mb-6" id="modal-headline">
                                            Edit Profile Info
                                        </h3>
                                        
                                        {error && (
                                            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded shadow-sm mb-4 text-xs flex items-center gap-2" role="alert">
                                                <span className="font-medium">{error}</span>
                                            </div>
                                        )}

                                        <form onSubmit={handleSubmit}>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label htmlFor="firstName" className="sr-only">First Name</label>
                                                        <input
                                                            type="text"
                                                            id="firstName"
                                                            value={firstName || ''}
                                                            onChange={(e) => setFirstName(e.target.value)}
                                                            className="w-full px-3 py-3 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-gray-400"
                                                            placeholder="First Name"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label htmlFor="lastName" className="sr-only">Last Name</label>
                                                        <input
                                                            type="text"
                                                            id="lastName"
                                                            value={lastName || ''}
                                                            onChange={(e) => setLastName(e.target.value)}
                                                            className="w-full px-3 py-3 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-gray-400"
                                                            placeholder="Last Name"
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label htmlFor="city" className="sr-only">City</label>
                                                        <AutocompleteInput
                                                            placeholder="City"
                                                            value={city || ''}
                                                            onChange={setCity}
                                                            endpoint="api/cities/autocomplete/"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label htmlFor="state" className="sr-only">State</label>
                                                        <div className="relative">
                                                            <select
                                                                id="state"
                                                                value={state || ''}
                                                                onChange={(e) => setState(e.target.value)}
                                                                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm shadow-sm transition-all bg-white"
                                                            >
                                                                <option value="">Select State</option>
                                                                {statesList.map((st) => (
                                                                    <option key={st} value={st}>{st}</option>
                                                                ))}
                                                            </select>
                                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label htmlFor="country" className="sr-only">Country</label>
                                                    <div className="relative">
                                                        <select
                                                            id="country"
                                                            value={country || ''}
                                                            onChange={(e) => setCountry(e.target.value)}
                                                            className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm shadow-sm transition-all bg-white"
                                                        >
                                                            <option value="">Select Country</option>
                                                            {countriesList.map((c) => (
                                                                <option key={c} value={c}>{c}</option>
                                                            ))}
                                                        </select>
                                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label htmlFor="major" className="sr-only">Major</label>
                                                    <AutocompleteInput
                                                        placeholder="Major (e.g., Computer Science)"
                                                        value={major || ''}
                                                        onChange={setMajor}
                                                        endpoint="api/programs/autocomplete/"
                                                    />
                                                </div>

                                                <div>
                                                    <label htmlFor="education" className="sr-only">Education</label>
                                                    <AutocompleteInput
                                                        placeholder="College / University"
                                                        value={education || ''}
                                                        onChange={setEducation}
                                                        endpoint="api/colleges/autocomplete/"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label htmlFor="gpa" className="sr-only">GPA</label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            id="gpa"
                                                            value={gpa === null ? '' : gpa}
                                                            onChange={(e) => setGpa(e.target.value)}
                                                            className="w-full px-3 py-3 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-gray-400"
                                                            placeholder="GPA (e.g. 3.8)"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label htmlFor="satScore" className="sr-only">SAT Score</label>
                                                        <input
                                                            type="number"
                                                            id="satScore"
                                                            value={satScore === null ? '' : satScore}
                                                            onChange={(e) => setSatScore(e.target.value)}
                                                            className="w-full px-3 py-3 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-gray-400"
                                                            placeholder="SAT Score"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-3 mt-8">
                                                <button
                                                    type="submit"
                                                    className="px-6 py-2 text-sm font-bold text-white transition-colors rounded-lg bg-primary hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                                >
                                                    Save Changes
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleCloseModal}
                                                    className="px-6 py-2 text-sm font-bold text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
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
                </div>
            )}
        </div>
    );
};

export default AddInfoModal;
