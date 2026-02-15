import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect, useContext } from 'react';
import NotFound from './NotFound';
import { baseUrl } from '../shared';
import { useCurrentUser } from '../UserProvider/UserProvider'
import { images } from "../constants";
import axios from 'axios';

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
})

const College = ({ id: collegeId, name, city, state, admission_rate, sat_score, cost_of_attendance }) => {
    const { user, loading, loggedIn } = useCurrentUser();
    // const { id } = useParams();
    //console.log("collegeId", collegeId);
    const navigate = useNavigate();
    const location = useLocation();

    const [backendData, setBackendData] = useState();
    const [isBookmarked, setIsBookmarked] = useState(false);
    //console.log("isBookedmarked", isBookmarked);

    const checkBookmark = async () => {
        try {
            const response = await axios.get(
                `http://127.0.0.1:8000/api/colleges/${collegeId}/bookmark/`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access')}` // Example, replace with your token retrieval 
                    }
                }
            );
            //console.log("response", response.data);
            setIsBookmarked(response.data.id ? true : false); // True if bookmark exists
        } catch (error) {
            console.error('Error checking bookmark:', error);
        }
    };


    useEffect(() => {
        checkBookmark();
    }, [collegeId]);

    const handleBookmarkToggle = async () => {
        if (!loggedIn) {
            navigate("/login", {
                state: {
                    previousUrl: location.pathname
                }
            });
            return;
        }
        try {
            const response = await axios.post(
                `http://127.0.0.1:8000/api/colleges/${collegeId}/bookmark/`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access')}`
                    }
                }
            );
            setIsBookmarked(!isBookmarked);
        } catch (error) {
            console.error('Error toggling bookmark:', error);
        }
    };

    const handleClickMore = () => {
        const numericCollegeId = parseInt(collegeId, 10);
        if (!isNaN(numericCollegeId)) {
            navigate(`/colleges/${numericCollegeId}/details`);
        } else {
            console.error('Invalid collegeId:', collegeId);
        }
    };

    const [notFound, setNotFound] = useState(false);


    // async function fetchData() {
    //     const url = baseUrl + 'api/colleges/' + id;
    //     const response = await fetch(url);
    //     if (response.status === 404) {
    //         setNotFound(true);
    //         navigate("/404");
    //     } else if (response.status === 401) {
    //         setLoggedIn(false);
    //         navigate("/login", {
    //             state: {
    //                 previousUrl: location.pathname
    //             }
    //         });
    //     }
    //     if (!response.ok) {
    //         throw new Error("Something went wrong!")
    //     }
    //     const data = await response.json();
    //     setBackendData(data.college);
    // }

    // useEffect(() => {
    //     fetchData();
    // }, []);

    return (
        <div className="college-item h-full flex flex-col">
            {notFound && <NotFound />}

            <div className="relative flex flex-col rounded-xl bg-white bg-clip-border text-gray-700 shadow-lg m-3 h-full">
                <div
                    className="relative mx-4 mt-4 overflow-hidden text-white shadow-lg rounded-xl bg-blue-gray-500 bg-clip-border shadow-blue-gray-500/40 h-56 shrink-0">
                    <img
                        src={images.collegeImages[(parseInt(collegeId) || 0) % images.collegeImages.length]}
                        onError={(e) => { e.target.onerror = null; e.target.src = images.collegeImg; }}
                        className="w-full h-full object-cover"
                        alt="college" />
                    <div
                        className="absolute inset-0 w-full h-full to-bg-black-10 bg-gradient-to-tr from-transparent via-transparent to-black/60">
                    </div>
                    <button onClick={handleBookmarkToggle}
                        className={`!absolute top-4 right-4 h-8 max-h-[32px] w-8 max-w-[32px] select-none rounded-full text-center align-middle font-sans text-xs font-medium uppercase transition-all  hover:bg-purple/10 active:bg-purple/30 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none`}
                        type="button">
                        <span className="absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                className={`w-6 h-6 ${isBookmarked ? 'fill-purple' : 'fill-gray-500'} stroke-teal-300 stroke-1`}> {/* Light teal outline */}
                                <path
                                    d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z">
                                </path>
                            </svg>
                        </span>
                    </button>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                        <h5 className="block font-sans text-xl antialiased font-medium leading-snug tracking-normal text-blue-gray-900 line-clamp-2 min-h-[3.5rem]">
                            {name}, {city}, {state}
                        </h5>
                    </div>
                    <div className="flex-1 space-y-2">
                        <p className="block font-sans text-base antialiased font-light leading-relaxed text-gray-700">
                            {`Acceptance Rate : ${(admission_rate * 100).toFixed(2)}%`}
                        </p>
                        <p className="block font-sans text-base antialiased font-light leading-relaxed text-gray-700">
                            {`Average SAT score: ${sat_score}`}
                        </p>
                        <p className="block font-sans text-base antialiased font-light leading-relaxed text-gray-700 min-h-[3rem]">
                            Average Cost of Attendance per Academic Year:<br />
                            <span className="font-medium text-gray-900">
                                {cost_of_attendance > 0 ? (
                                    formatter.format(cost_of_attendance).replace(/(\.|,)00$/g, '')
                                ) : (
                                    "N/A"
                                )}
                            </span>
                        </p>
                    </div>
                </div>
                <div className="p-6 pt-0 mt-auto">
                    <button
                        onClick={handleClickMore}
                        className="block w-full select-none rounded-full bg-primary py-3.5 px-7 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-lg shadow-teal-500/20 transition-all hover:shadow-xl hover:bg-teal-700 hover:scale-105 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none border border-teal-500/20"
                        type="button"
                    >
                        View Details
                    </button>
                </div>
            </div>
        </div>
    );
}
export default College;
