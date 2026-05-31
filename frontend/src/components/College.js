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

const College = ({ id: collegeId, name, city, state, admission_rate, sat_score, cost_of_attendance, image, img, control, locale, hbcu, hsi, programs_count, relaffil, top_major, grad_rate, retention_rate, avg_net_price, website, logo_url, verified_picture }) => {
    const { loggedIn, user } = useCurrentUser();
    const navigate = useNavigate();
    const location = useLocation();

    // Prioritize backend logo_url
    const [logoUrl, setLogoUrl] = useState(() => {
        if (logo_url && (typeof logo_url === 'string') && !logo_url.startsWith('http') && !logo_url.startsWith('/') && !logo_url.startsWith('data:')) {
            return `https://${logo_url}`;
        }
        return logo_url;
    });

    useEffect(() => {
        if (logo_url && (typeof logo_url === 'string') && !logo_url.startsWith('http') && !logo_url.startsWith('/') && !logo_url.startsWith('data:')) {
            const fixed = `https://${logo_url}`;
            if (logoUrl !== fixed) setLogoUrl(fixed);
        } else if (logo_url !== logoUrl) {
            setLogoUrl(logo_url);
        }
    }, [logo_url, logoUrl]);

    // Dynamic Campus Image - Removed as primary fallback due to risk of incorrect logos/mismatches
    // const dynamicImageUrl = `https://images.unsplash.com/featured/?university,campus,architecture,building,${encodeURIComponent(name)}`;

    const [isBookmarked, setIsBookmarked] = useState(false);
    const [logoError, setLogoError] = useState(false);
    const [bgError, setBgError] = useState(false);

    // Get a unique stable index for fallbacks using the expanded gallery
    // This provides a high-quality, professional 'Vibe' that is much safer than random search results
    const getStableImage = () => {
        // Use a simple hash of the name to ensure each college consistently gets the same 'vibe' image
        let hash = 0;
        const str = name || "";
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0; // Convert to 32bit integer
        }
        const index = Math.abs(hash) % images.collegeImages.length;
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
            <div className="relative flex flex-col rounded-[2rem] bg-slate-950/85 backdrop-blur-xl text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-all duration-500 hover:shadow-[0_8px_32px_rgba(36,173,191,0.4)] hover:-translate-y-1.5 border border-white/10 hover:border-cyan-500/30 overflow-hidden h-full">
                {/* Image Section */}
                <div className="relative aspect-video overflow-hidden shrink-0">
                    <img
                        src={verified_picture && (image || img)
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

                    {/* Location Badge */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white bg-slate-900/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/10 uppercase tracking-wider">
                        <MapPinIcon className="w-3.5 h-3.5 text-cyan-400" />
                        {city}, {state}
                    </div>

                    {/* Bookmark Button */}
                    <button
                        onClick={handleBookmarkToggle}
                        className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/15 transition-all hover:bg-white/10 shadow-sm group/btn"
                        type="button"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className={`w-5 h-5 transition-all duration-300 ${isBookmarked ? 'fill-rose-500 stroke-rose-500 scale-110' : 'fill-transparent stroke-white/80 group-hover/btn:stroke-white group-hover/btn:scale-110'}`}
                            strokeWidth="1.5"
                        >
                            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                        </svg>
                    </button>
                </div>

                {/* Content Section */}
                <div className={`p-4 flex-1 flex flex-col justify-between relative ${logoUrl && !logoError ? 'pt-8' : 'pt-4'}`}>
                    {/* College Logo Overlay floating over the cover boundary */}
                    {logoUrl && !logoError && (
                        <div className="absolute -top-7 left-4 w-14 h-14 bg-white rounded-2xl p-1.5 shadow-lg flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform duration-300 z-10">
                            <img
                                src={logoUrl}
                                alt={`${name} logo`}
                                onError={() => setLogoError(true)}
                                className="w-full h-full object-contain"
                            />
                        </div>
                    )}
                    <div>
                        {/* Vibe Badges */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {control && (
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${control === 1 ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'}`}>
                                    {control === 1 ? 'Public' : 'Private'}
                                </span>
                            )}
                            {locale && (
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white/5 text-cyan-300 border border-white/10">
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
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                    HBCU
                                </span>
                            )}
                            {hsi && (
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-300 border border-orange-500/20">
                                    HSI
                                </span>
                            )}
                            {relaffil && relaffil > 0 && (
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                    Rel. Affil.
                                </span>
                            )}
                            {loggedIn && user?.sat_score && sat_score > 0 && Math.abs(user.sat_score - sat_score) <= 50 && (
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-sm animate-pulse">
                                    Competitive Match
                                </span>
                            )}
                        </div>

                        <h5 className="font-extrabold text-xl text-white leading-tight mb-3 group-hover:text-cyan-400 transition-colors line-clamp-2 min-h-[3rem]">
                            {name}
                        </h5>

                        {/* Stats Container - Grid Version */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 min-h-[160px]">
                            {(() => {
                                const hasStats = programs_count > 0 || admission_rate > 0 || sat_score > 0 || top_major || grad_rate > 0 || avg_net_price > 0 || cost_of_attendance > 0;

                                if (!hasStats) {
                                    return (
                                        <div className="col-span-2 flex items-center justify-center h-[160px] border border-dashed border-white/10 rounded-2xl bg-white/5">
                                            <p className="text-[11px] font-medium text-white/40 italic text-center px-4">
                                                We don't have this information yet. Please check back later.
                                            </p>
                                        </div>
                                    );
                                }

                                return (
                                    <>
                                        {programs_count > 0 && (
                                            <div className="flex items-center gap-2 text-xs text-white/70 group/item">
                                                <div className="p-1.5 rounded-lg bg-white/5 text-cyan-400 group-hover/item:bg-gradient-to-r group-hover/item:from-cyan-400 group-hover/item:to-purple-500 group-hover/item:text-white transition-all shrink-0">
                                                    <BookOpenIcon className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <p className="text-[9px] uppercase font-bold tracking-wider text-white/40 leading-none mb-0.5">Majors</p>
                                                    <p className="font-bold text-white text-sm leading-none">{programs_count}</p>
                                                </div>
                                            </div>
                                        )}
                                        {admission_rate > 0 && (
                                            <div className="flex items-center gap-2 text-xs text-white/70 group/item">
                                                <div className="p-1.5 rounded-lg bg-white/5 text-cyan-400 group-hover/item:bg-gradient-to-r group-hover/item:from-cyan-400 group-hover/item:to-purple-500 group-hover/item:text-white transition-all shrink-0">
                                                    <ChartBarIcon className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <p className="text-[9px] uppercase font-bold tracking-wider text-white/40 leading-none mb-0.5">Acceptance</p>
                                                    <p className="font-bold text-white text-sm leading-none">{(admission_rate * 100).toFixed(1)}%</p>
                                                </div>
                                            </div>
                                        )}

                                        {sat_score > 0 && (
                                            <div className="flex items-center gap-2 text-xs text-white/70 group/item">
                                                <div className="p-1.5 rounded-lg bg-white/5 text-cyan-400 group-hover/item:bg-gradient-to-r group-hover/item:from-cyan-400 group-hover/item:to-purple-500 group-hover/item:text-white transition-all shrink-0">
                                                    <AcademicCapIcon className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <p className="text-[9px] uppercase font-bold tracking-wider text-white/40 leading-none mb-0.5">Avg. SAT</p>
                                                    <p className="font-bold text-white text-sm leading-none">{sat_score}</p>
                                                </div>
                                            </div>
                                        )}

                                        {grad_rate > 0 && (
                                            <div className="flex items-center gap-2 text-xs text-white/70 group/item">
                                                <div className="p-1.5 rounded-lg bg-white/5 text-cyan-400 group-hover/item:bg-gradient-to-r group-hover/item:from-cyan-400 group-hover/item:to-purple-500 group-hover/item:text-white transition-all shrink-0">
                                                    <ChartBarIcon className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <p className="text-[9px] uppercase font-bold tracking-wider text-white/40 leading-none mb-0.5">Grad Rate</p>
                                                    <p className="font-bold text-white text-sm leading-none">
                                                        {grad_rate > 1 ? grad_rate.toFixed(0) : (grad_rate * 100).toFixed(0)}%
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {(avg_net_price > 0 || cost_of_attendance > 0) && (
                                            <div className="flex items-center gap-2 text-xs text-white/70 group/item">
                                                <div className="p-1.5 rounded-lg bg-white/5 text-cyan-400 group-hover/item:bg-gradient-to-r group-hover/item:from-cyan-400 group-hover/item:to-purple-500 group-hover/item:text-white transition-all shrink-0">
                                                    <BanknotesIcon className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <p className="text-[9px] uppercase font-bold tracking-wider text-white/40 leading-none mb-0.5">
                                                        {avg_net_price > 0 ? 'Net Price' : 'Cost'}
                                                    </p>
                                                    <p className="font-bold text-white text-sm leading-none">
                                                        {formatter.format(avg_net_price > 0 ? avg_net_price : cost_of_attendance)}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {top_major && (
                                            <div className="col-span-2 flex items-start gap-2 text-xs text-white/70 group/item mt-1">
                                                <div className="p-1.5 rounded-lg bg-white/5 text-cyan-400 group-hover/item:bg-gradient-to-r group-hover/item:from-cyan-400 group-hover/item:to-purple-500 group-hover/item:text-white transition-all shrink-0">
                                                    <BookOpenIcon className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <p className="text-[9px] uppercase font-bold tracking-wider text-white/40 leading-none mb-0.5">Top Major</p>
                                                    <p className="font-bold text-white text-xs leading-tight break-words">
                                                        {top_major}
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
                            className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#24adbf] to-[#00b4d8] hover:from-[#2ac4d9] hover:to-[#00c4eb] py-3 px-4 text-xs font-bold text-white shadow-[0_4px_20px_rgba(36,173,191,0.4)] transition-all hover:scale-[1.02] active:scale-95"
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
