import React, { useState } from 'react';
import { baseUrl } from '../shared';
import axios from 'axios';
import { useCurrentUser } from '../UserProvider/UserProvider';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import NotFound from './NotFound';
import { states } from '../constants/states';
import AutocompleteInput from '../utils/AutocompleteInput';

const DetailedSearch = () => {
    const [colleges, setColleges] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState('');
    const [state, setState] = useState('');
    const [city, setCity] = useState('');
    const [program, setProgram] = useState('');
    const [minSat, setMinSat] = useState('');
    const [maxSat, setMaxSat] = useState('');
    const [control, setControl] = useState('');
    const [localeCategory, setLocaleCategory] = useState('');
    const [isHbcu, setIsHbcu] = useState(false);
    const [isHsi, setIsHsi] = useState(false);
    const [searchError, setSearchError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const { updateLoggedInStatus } = useCurrentUser();
    const [errorStatus] = useState();

    const fetchColleges = async () => {
        setIsLoading(true);
        setSearchError('');
        try {
            const response = await axios.get(`${baseUrl}api/colleges/detailed/`, {
                params: {
                    state, city, program, min_sat: minSat, max_sat: maxSat, name,
                    control, locale_category: localeCategory,
                    hbcu: isHbcu ? 'true' : '', hsi: isHsi ? 'true' : ''
                },
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access')}`
                }
            })
            if (response.status === 404) {
                navigate("/404");
            } else if (response.status === 401) {
                updateLoggedInStatus(false);
                navigate("/login", {
                    state: {
                        previousUrl: location.pathname
                    }
                });
            }
            const data = response.data;
            setColleges(data.colleges);
            const searchQuery = {
                state, city, program, min_sat: minSat, max_sat: maxSat, name,
                control, locale_category: localeCategory, hbcu: isHbcu, hsi: isHsi
            };
            navigate(`/search/detailed/`, { state: { colleges: data.colleges, hasMore: data.has_more, searchQuery: searchQuery } });
        }
        catch (error) {
            setSearchError(error.message || "An unexpected error occurred. Please try again.");
            console.error("Error fetching colleges", error);
        }
        finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (!state && !city && !program && !minSat && !maxSat && !name && !control && !localeCategory && !isHbcu && !isHsi) {
            setSearchError('Please fill in at least one field.');
            return;
        }
        setSearchError('');
        fetchColleges();
    };


    if (errorStatus === 404) {
        return (
            <>
                <NotFound />
                <Link to="/">Search another</Link>
            </>
        );
    }

    if (errorStatus) {
        return (
            <>
                <p>There was a problem with the server, try again later.</p>
                <Link to="/">Search another</Link>
            </>
        );
    }


    return (
        <div className="bg-primary min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-gray-100 relative overflow-visible">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="text-center">
                    <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        Find Your Perfect College
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                        Use our detailed search to narrow down the best options for your future.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSearch}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label htmlFor="name" className="sr-only">College Name</label>
                            <AutocompleteInput
                                placeholder="College Name"
                                value={name}
                                onChange={setName}
                                endpoint="api/colleges/autocomplete/"
                            />
                        </div>

                        <div>
                            <label htmlFor="city" className="sr-only">City</label>
                            <AutocompleteInput
                                placeholder="City"
                                value={city}
                                onChange={setCity}
                                endpoint="api/cities/autocomplete/"
                            />
                        </div>

                        <div>
                            <label htmlFor="state" className="sr-only">State</label>
                            <div className="relative">
                                <select
                                    id="state"
                                    name="state"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    className="appearance-none rounded-xl relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm shadow-sm transition-all bg-white"
                                >
                                    <option value="">Select State</option>
                                    {states.map((stateOption) => (
                                        <option key={stateOption} value={stateOption}>{stateOption}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="program" className="sr-only">Program</label>
                            <AutocompleteInput
                                placeholder="Program of Study (e.g., Computer Science)"
                                value={program}
                                onChange={setProgram}
                                endpoint="api/programs/autocomplete/"
                            />
                        </div>

                        <div>
                            <label htmlFor="control" className="sr-only">Institution Type</label>
                            <div className="relative">
                                <select
                                    id="control"
                                    name="control"
                                    value={control}
                                    onChange={(e) => setControl(e.target.value)}
                                    className="appearance-none rounded-xl relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm shadow-sm transition-all bg-white"
                                >
                                    <option value="">Institution Type</option>
                                    <option value="1">Public</option>
                                    <option value="2">Private Non-profit</option>
                                    <option value="3">Private For-profit</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="locale" className="sr-only">Campus Setting</label>
                            <div className="relative">
                                <select
                                    id="locale"
                                    name="locale"
                                    value={localeCategory}
                                    onChange={(e) => setLocaleCategory(e.target.value)}
                                    className="appearance-none rounded-xl relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm shadow-sm transition-all bg-white"
                                >
                                    <option value="">Campus Setting</option>
                                    <option value="city">City</option>
                                    <option value="suburb">Suburb</option>
                                    <option value="town">Town</option>
                                    <option value="rural">Rural</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="min-sat" className="sr-only">Min SAT</label>
                            <input
                                id="min-sat"
                                name="min-sat"
                                type="number"
                                value={minSat}
                                onChange={(e) => setMinSat(e.target.value)}
                                className="appearance-none rounded-xl relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm shadow-sm transition-all"
                                placeholder="Min SAT Score"
                            />
                        </div>

                        <div>
                            <label htmlFor="max-sat" className="sr-only">Max SAT</label>
                            <input
                                id="max-sat"
                                name="max-sat"
                                type="number"
                                value={maxSat}
                                onChange={(e) => setMaxSat(e.target.value)}
                                className="appearance-none rounded-xl relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm shadow-sm transition-all"
                                placeholder="Max SAT Score"
                            />
                        </div>

                        <div className="md:col-span-2 flex items-center space-x-8 px-2">
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isHbcu}
                                    onChange={(e) => setIsHbcu(e.target.checked)}
                                    className="rounded border-gray-300 text-primary focus:ring-primary h-5 w-5 transition-all"
                                />
                                <span className="ml-3 text-sm font-medium text-gray-700">HBCU</span>
                            </label>

                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isHsi}
                                    onChange={(e) => setIsHsi(e.target.checked)}
                                    className="rounded border-gray-300 text-primary focus:ring-primary h-5 w-5 transition-all"
                                />
                                <span className="ml-3 text-sm font-medium text-gray-700">HSI</span>
                            </label>
                        </div>
                    </div>

                    {searchError && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">{searchError}</h3>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white ${isLoading ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-teal-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'} transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
                        >
                            {isLoading ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                    <svg className="h-5 w-5 text-teal-200 group-hover:text-teal-100 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                    </svg>
                                </span>
                            )}
                            {isLoading ? 'Searching...' : 'Search Colleges'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default DetailedSearch;