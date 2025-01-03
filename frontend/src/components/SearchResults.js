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
                    const detailedSearchOptions = {
                        method: "GET",
                        url: `${baseUrl}api/colleges/detailed/?page=${page}`,
                        params: location.state.searchQuery,
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('access')}`
                        }
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
                const collegeOptions = {
                    method: "GET",
                    url: `${baseUrl}api/search/${query}/`,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access')}`
                    }
                };
                const programOptions = {
                    method: "GET",
                    url: `${baseUrl}api/colleges/programs/?search=${query}&page=${page}`,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('access')}`
                    }
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
                    <div className="flex flex-wrap justify-center">
                        {searchResult.map((college) => {
                            const name = college.name;
                            const city = college.city;
                            const state = college.state;

                            const cost_of_attendance = college.cost_of_attendance
                            const admission_rate = college.admission_rate
                            const sat_score = college.sat_score

                            return (
                                <College
                                    key={college.id}
                                    id={college.id}
                                    name={name}
                                    city={city}
                                    state={state}
                                    admission_rate={admission_rate}
                                    sat_score={sat_score}
                                    cost_of_attendance={cost_of_attendance}
                                    img="https://images.unsplash.com/photo-1677594334053-afe4b41aa0a3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGNvbGxlZ2V8ZW58MHx8MHx8fDA%3D"
                                />
                            );
                        })}
                    </div>
                    {hasMore ?
                        <div className="flex justify-center">
                            <button onClick={loadMore} className="mt-4  select-none rounded-lg bg-gray-800 py-3.5 px-7 text-center align-middle font-sans text-sm font-bold uppercase text-white shadow-md shadow-gray-900/10 transition-all hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none">
                                Load More
                            </button>
                        </div> : null
                    }
                </>
            )}
        </div>
    )
}

export default SearchResults;