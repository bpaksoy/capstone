import React from 'react';
import College from './College';
import NotFound from './NotFound';
import Search from './Search';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';
import { baseUrl } from '../shared';
import { LoginContext } from '../App';
import axios from "axios";
import { useCurrentUser } from '../UserProvider/UserProvider';


function SearchResults() {
    let { query } = useParams();
    console.log("query in Search Results", query);
    const { loggedIn, updateLoggedInStatus } = useCurrentUser();
    const [searchResult, setSearchResult] = useState([]);
    console.log("searchResult", searchResult);
    const [isLoading, setLoading] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [errorStatus, setErrorStatus] = useState();
    const [hasMore, setHasMore] = useState(true)
    const [page, setPage] = useState(1);


    const navigate = useNavigate();
    const location = useLocation();

    const [backendData, setBackendData] = useState();
    // console.log("backendData", backendData);


    async function fetchData() {
        setLoading(true);
        try {
            let collegeData = null;
            let programData = null;
            if (location.state && location.state.colleges) {
                collegeData = location.state.colleges;
                setHasMore(location.state.hasMore);
                if (location.state.searchQuery) {
                    const token = localStorage.getItem('access');
                    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                    const detailedSearchOptions = {
                        method: "GET",
                        url: `${baseUrl}api/colleges/detailed/?page=${page}`,
                        params: location.state.searchQuery,
                        headers: headers
                    };
                    const detailedResponse = await axios.request(detailedSearchOptions);
                    if (detailedResponse.status === 200) {
                        setHasMore(detailedResponse.data.has_more);
                        if (detailedResponse.data.colleges) {
                            collegeData = detailedResponse.data.colleges;
                        }
                    }
                }
            } else {
                console.log("query goes in here", query);
                const token = localStorage.getItem('access');
                const headers = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

                const collegeOptions = {
                    method: "GET",
                    url: `${baseUrl}api/search/${query}/`,
                    headers: headers
                };
                const programOptions = {
                    method: "GET",
                    url: `${baseUrl}api/colleges/programs/?search=${query}&page=${page}`,
                    headers: headers
                };


                const [collegeResponse, programResponse] = await Promise.all([
                    axios.request(collegeOptions),
                    axios.request(programOptions),

                ]);
                if (collegeResponse.status === 404 && programResponse.status === 404) {
                    setNotFound(true);
                    navigate("/404");
                } else if (collegeResponse.status === 401 || programResponse.status === 401) {
                    updateLoggedInStatus(false);
                    navigate("/login", {
                        state: {
                            previousUrl: location.pathname
                        }
                    });
                }

                if (collegeResponse.status === 200) {
                    collegeData = collegeResponse.data.college;
                }
                if (programResponse.status === 200) {
                    programData = programResponse.data;
                    if (programData.colleges) {
                        setHasMore(programData.has_more);
                        programData = programData.colleges;
                    } else {
                        programData = null
                    }
                }


            }
            let combinedResults = [];
            if (collegeData) {
                combinedResults.push(...collegeData);
            }
            if (programData) {
                combinedResults.push(...programData);
            }

            let uniqueResults = [];
            if (page > 1) {
                uniqueResults = Array.from(new Set([...searchResult, ...combinedResults].map((college) => college.id))).map((id) => {
                    return [...searchResult, ...combinedResults].find((college) => college.id === id);
                });

            }
            else {
                uniqueResults = Array.from(new Set(combinedResults.map((college) => college.id))).map((id) => {
                    return combinedResults.find((college) => college.id === id);
                });
            }
            setSearchResult(uniqueResults);
            setBackendData(combinedResults)
        } catch (error) {
            setSearchError(error);
            console.log(error);
        } finally {
            setLoading(false);
        }
    }


    useEffect(() => {
        fetchData();
    }, [query, page, location]);


    const loadMore = () => {
        if (hasMore) {
            setPage(page + 1)

        }
    }

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
        <div className="bg-primary min-h-screen">
            <Search />
            {searchResult && searchResult.length > 0 && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-8 w-full max-w-7xl mx-auto mt-12">
                        {searchResult.map((college) => {
                            return (
                                <College
                                    key={college.id}
                                    id={college.id}
                                    name={college.name}
                                    city={college.city}
                                    state={college.state}
                                    admission_rate={college.admission_rate}
                                    sat_score={college.sat_score}
                                    cost_of_attendance={college.cost_of_attendance}
                                />
                            );
                        })}
                    </div>
                    {hasMore ? (
                        <div className="flex justify-center py-12 pb-20">
                            <button
                                onClick={loadMore}
                                className="group relative inline-flex items-center justify-center px-6 py-2 text-sm font-medium text-white transition-all duration-200 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50 shadow-sm"
                            >
                                {isLoading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Loading...
                                    </span>
                                ) : (
                                    <>
                                        Load More Results
                                        <svg className="w-5 h-5 ml-2 -mr-1 transition-transform group-hover:translate-x-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="pb-20 text-center">
                            <p className="text-white/60 font-medium">No more colleges to display</p>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default SearchResults;