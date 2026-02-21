import { useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { baseUrl } from '../shared';
import { useCurrentUser } from '../UserProvider/UserProvider'
import { images } from "../constants";
import {
    AcademicCapIcon,
    BanknotesIcon,
    ChartBarIcon,
    MapPinIcon,
    BookOpenIcon,
    LifebuoyIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
})

const College = ({ id: collegeId, name, city, state, admission_rate, sat_score, cost_of_attendance, image, img, control, locale, hbcu, hsi, programs_count, relaffil, top_major, grad_rate, retention_rate, avg_net_price, website, logo_url }) => {
    const { loggedIn, user } = useCurrentUser();
    const navigate = useNavigate();
    const location = useLocation();

    // Prioritize backend logo_url, then fallback to dynamic Clearbit extraction
    const [logoUrl, setLogoUrl] = useState(logo_url);

    useEffect(() => {
        if (!logoUrl && website) {
            try {
                let domain = website.replace('http://', '').replace('https://', '').split(/[/?#]/)[0];
                if (domain.startsWith('www.')) domain = domain.substring(4);
                setLogoUrl(`https://logo.clearbit.com/${domain}`);
            } catch (e) { }
        }
    }, [website, logoUrl]);

    const [isBookmarked, setIsBookmarked] = useState(false);
    const [logoError, setLogoError] = useState(false);
    const [bgError, setBgError] = useState(false);

    // Get a unique stable index for fallbacks using the expanded gallery
    const getStableImage = () => {
        const idInt = parseInt(collegeId) || 0;
        const salt = name ? name.length : 0;
        const index = (idInt + salt) % images.collegeImages.length;
        return images.collegeImages[index];
    };

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
                <div className="relative aspect-video overflow-hidden shrink-0">
                    <img
                        src={(image || img)
                            ? ((image || img).startsWith('http') ? (image || img) : `${baseUrl}${(image || img).replace(/^\//, '')}`)
                            : getStableImage()
                        }
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = images.collegeImg;
                        }}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        alt={`${name} campus`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                    {/* College Logo Overlay */}
                    {logoUrl && !logoError && (
                        <div className="absolute top-3 left-3 w-12 h-12 bg-white rounded-2xl p-1.5 shadow-lg flex items-center justify-center border border-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                            <img
                                src={logoUrl}
                                alt={`${name} logo`}
                                onError={() => setLogoError(true)}
                                className="w-full h-full object-contain"
                            />
                        </div>
                    )}

                    {/* Location Badge */}
                    <div className={`absolute bottom-3 ${logoUrl && !logoError ? 'right-3' : 'left-3'} flex items-center gap-1 text-white bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/10 uppercase tracking-tight`}>
                        <MapPinIcon className="w-3 h-3" />
                        {city}, {state}
                    </div>

                    {/* Bookmark Button */}
                    <button
                        onClick={handleBookmarkToggle}
                        className="absolute top-3 right-3 p-2 rounded-full bg-white/95 backdrop-blur-sm border border-gray-200 transition-all hover:bg-teal-50 shadow-sm group/btn"
                        type="button"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className={`w-5 h-5 transition-all duration-300 ${isBookmarked ? 'fill-purple' : 'fill-transparent'}`}
                            stroke="#17717d"
                            strokeWidth="1.5"
                        >
                            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                        </svg>
                    </button>
                </div>

                {/* Content Section */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                        {/* Vibe Badges */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {control && (
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${control === 1 ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-purple-50 text-purple-700 border border-purple-100'}`}>
                                    {control === 1 ? 'Public' : 'Private'}
                                </span>
                            )}
                            {locale && (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-gray-50 text-gray-600 border border-gray-100">
                                    {(() => {
                                        if (locale >= 11 && locale <= 13) return 'City';
                                        if (locale >= 21 && locale <= 23) return 'Suburb';
                                        if (locale >= 31 && locale <= 33) return 'Town';
                                        if (locale >= 41 && locale <= 43) return 'Rural';
                                        return 'Campus';
                                    })()}
                                </span>
                            )}
                            {hbcu && (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                                    HBCU
                                </span>
                            )}
                            {hsi && (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-100">
                                    HSI
                                </span>
                            )}
                            {relaffil && relaffil > 0 && (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    Rel. Affil.
                                </span>
                            )}
                            {loggedIn && user?.sat_score && sat_score > 0 && Math.abs(user.sat_score - sat_score) <= 50 && (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-teal-600 text-white border border-teal-500 shadow-sm animate-pulse">
                                    Competitive Match
                                </span>
                            )}
                        </div>

                        <h5 className="font-bold text-lg text-gray-900 leading-tight mb-3 group-hover:text-primary transition-colors line-clamp-2 min-h-[3rem]">
                            {name}
                        </h5>

                        {/* Stats Container - Compact version */}
                        <div className="space-y-2.5 min-h-[200px]">
                            {(() => {
                                const hasStats = programs_count > 0 || admission_rate > 0 || sat_score > 0 || top_major || grad_rate > 0 || avg_net_price > 0 || cost_of_attendance > 0;

                                if (!hasStats) {
                                    return (
                                        <div className="flex items-center justify-center h-[200px] border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                                            <p className="text-[11px] font-medium text-gray-400 italic text-center px-4">
                                                We don't have this information yet. Please check back later.
                                            </p>
                                        </div>
                                    );
                                }

                                return (
                                    <>
                                        {programs_count > 0 && (
                                            <div className="flex items-start gap-2.5 text-xs text-gray-500 group/item">
                                                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover/item:bg-blue-600 group-hover/item:text-white transition-colors shrink-0">
                                                    <BookOpenIcon className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <p className="text-[9px] uppercase font-bold tracking-tight text-gray-400 leading-none mb-0.5">Majors Offered</p>
                                                    <p className="font-semibold text-gray-900 leading-none">{programs_count}</p>
                                                </div>
                                            </div>
                                        )}
                                        {admission_rate > 0 && (
                                            <div className="flex items-start gap-2.5 text-xs text-gray-500 group/item">
                                                <div className="p-1.5 rounded-lg bg-teal-50 text-primary group-hover/item:bg-primary group-hover/item:text-white transition-colors shrink-0">
                                                    <ChartBarIcon className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <p className="text-[9px] uppercase font-bold tracking-tight text-gray-400 leading-none mb-0.5">Acceptance</p>
                                                    <p className="font-semibold text-gray-900 leading-none">{(admission_rate * 100).toFixed(1)}%</p>
                                                </div>
                                            </div>
                                        )}

                                        {sat_score > 0 && (
                                            <div className="flex items-start gap-2.5 text-xs text-gray-500 group/item">
                                                <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 group-hover/item:bg-purple-600 group-hover/item:text-white transition-colors shrink-0">
                                                    <AcademicCapIcon className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <p className="text-[9px] uppercase font-bold tracking-tight text-gray-400 leading-none mb-0.5">Avg. SAT</p>
                                                    <p className="font-semibold text-gray-900 leading-none">{sat_score}</p>
                                                </div>
                                            </div>
                                        )}

                                        {top_major && (
                                            <div className="flex items-start gap-2.5 text-xs text-gray-500 group/item">
                                                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover/item:bg-indigo-600 group-hover/item:text-white transition-colors flex-shrink-0">
                                                    <BookOpenIcon className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <p className="text-[9px] uppercase font-bold tracking-tight text-gray-400 leading-none mb-0.5">Top Major</p>
                                                    <p className="font-semibold text-gray-900 leading-tight break-words">
                                                        {top_major}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {grad_rate > 0 && (
                                            <div className="flex items-start gap-2.5 text-xs text-gray-500 group/item">
                                                <div className="p-1.5 rounded-lg bg-green-50 text-green-600 group-hover/item:bg-green-600 group-hover/item:text-white transition-colors shrink-0">
                                                    <ChartBarIcon className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <p className="text-[9px] uppercase font-bold tracking-tight text-gray-400 leading-none mb-0.5">Graduation Rate</p>
                                                    <p className="font-semibold text-gray-900 leading-none">
                                                        {grad_rate > 1 ? grad_rate.toFixed(0) : (grad_rate * 100).toFixed(0)}%
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {(avg_net_price > 0 || cost_of_attendance > 0) && (
                                            <div className="flex items-start gap-2.5 text-xs text-gray-500 group/item">
                                                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 group-hover/item:bg-amber-600 group-hover/item:text-white transition-colors shrink-0">
                                                    <BanknotesIcon className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <p className="text-[9px] uppercase font-bold tracking-tight text-gray-400 leading-none mb-0.5">
                                                        {avg_net_price > 0 ? 'Avg. Net Price' : 'Annual Cost'}
                                                    </p>
                                                    <p className="font-semibold text-gray-900 leading-none">
                                                        {formatter.format(avg_net_price > 0 ? avg_net_price : cost_of_attendance)}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="mt-5">
                        <button
                            onClick={handleClickMore}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-teal-700 active:scale-95"
                        >
                            View Details
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default College;
