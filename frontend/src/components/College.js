import { useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { baseUrl } from '../shared';
import { useCurrentUser } from '../UserProvider/UserProvider'
import { images } from "../constants";
import {
    AcademicCapIcon,
    BanknotesIcon,
    ChartBarIcon,
    MapPinIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
})

const College = ({ id: collegeId, name, city, state, admission_rate, sat_score, cost_of_attendance }) => {
    const { loggedIn } = useCurrentUser();
    const navigate = useNavigate();
    const location = useLocation();

    const [isBookmarked, setIsBookmarked] = useState(false);

    const checkBookmark = async () => {
        if (!loggedIn) return;
        try {
            const response = await axios.get(
                `${baseUrl}api/colleges/${collegeId}/bookmark/`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access')}`
                    }
                }
            );
            setIsBookmarked(response.data.id ? true : false);
        } catch (error) {
            console.error('Error checking bookmark:', error);
        }
    };

    useEffect(() => {
        checkBookmark();
    }, [collegeId, loggedIn]);

    const handleBookmarkToggle = async (e) => {
        e.stopPropagation();
        if (!loggedIn) {
            navigate("/login", { state: { previousUrl: location.pathname } });
            return;
        }
        try {
            await axios.post(
                `${baseUrl}api/colleges/${collegeId}/bookmark/`,
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
        }
    };

    return (
        <div className="college-item h-full flex flex-col group p-3">
            <div className="relative flex flex-col rounded-3xl bg-white text-gray-700 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-gray-100 overflow-hidden h-full">
                {/* Image Section */}
                <div className="relative aspect-[16/10] overflow-hidden shrink-0">
                    <img
                        src={images.collegeImages[(parseInt(collegeId) || 0) % images.collegeImages.length]}
                        onError={(e) => { e.target.onerror = null; e.target.src = images.collegeImg; }}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        alt={name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                    {/* Location Badge */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-white bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold border border-white/20">
                        <MapPinIcon className="w-3.5 h-3.5" />
                        {city}, {state}
                    </div>

                    {/* Bookmark Button */}
                    <button
                        onClick={handleBookmarkToggle}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 transition-all hover:bg-white hover:text-red-500 text-white shadow-lg group/btn"
                        type="button"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className={`w-5 h-5 transition-colors ${isBookmarked ? 'fill-red-500 text-red-500' : 'fill-transparent text-white'}`}
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                        </svg>
                    </button>
                </div>

                {/* Content Section */}
                <div className="p-6 flex-1 flex flex-col">
                    <h5 className="font-bold text-xl text-gray-900 leading-tight mb-4 group-hover:text-primary transition-colors line-clamp-2 min-h-[3rem]">
                        {name}
                    </h5>

                    {/* Stats Container - Fixed minimum height to ensure uniformity */}
                    <div className="flex-1 min-h-[140px] space-y-3">
                        {admission_rate > 0 ? (
                            <div className="flex items-center gap-3 text-sm text-gray-500 group/item">
                                <div className="p-2 rounded-lg bg-teal-50 text-primary group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                                    <ChartBarIcon className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Acceptance</p>
                                    <p className="font-semibold text-gray-900">{(admission_rate * 100).toFixed(1)}%</p>
                                </div>
                            </div>
                        ) : (
                            <div className="h-[44px] invisible" aria-hidden="true" /> // Spacer for missing data
                        )}

                        {sat_score > 0 ? (
                            <div className="flex items-center gap-3 text-sm text-gray-500 group/item">
                                <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover/item:bg-purple-600 group-hover/item:text-white transition-colors">
                                    <AcademicCapIcon className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Avg. SAT</p>
                                    <p className="font-semibold text-gray-900">{sat_score}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="h-[44px] invisible" aria-hidden="true" /> // Spacer for missing data
                        )}

                        {cost_of_attendance > 0 ? (
                            <div className="flex items-center gap-3 text-sm text-gray-500 group/item">
                                <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover/item:bg-amber-600 group-hover/item:text-white transition-colors">
                                    <BanknotesIcon className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Annual Cost</p>
                                    <p className="font-semibold text-gray-900">{formatter.format(cost_of_attendance)}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="h-[44px] invisible" aria-hidden="true" /> // Spacer for missing data
                        )}
                    </div>

                    <div className="mt-6">
                        <button
                            onClick={handleClickMore}
                            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 px-6 text-sm font-bold text-white shadow-lg shadow-teal-500/20 transition-all hover:shadow-xl hover:bg-teal-700 active:scale-95"
                        >
                            View Details
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default College;
