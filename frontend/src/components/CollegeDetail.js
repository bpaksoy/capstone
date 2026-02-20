import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { baseUrl } from '../shared';
import { images } from '../constants';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import ScrollToTop from './ScrollToTop';

ChartJS.register(ArcElement, Tooltip, Legend);


const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

const CollegeDetail = () => {
    const { id: collegeId } = useParams();
    //console.log("collegeId", collegeId);
    const [college, setCollege] = useState(null);
    // console.log("College", college);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [programs, setPrograms] = useState([]);
    const [showAllPrograms, setShowAllPrograms] = useState(false);
    const [logoError, setLogoError] = useState(false);
    const [bgError, setBgError] = useState(false);
    const PROGRAMS_LIMIT = 10;


    useEffect(() => {
        const fetchCollegeDetails = async () => {
            setIsLoading(true);
            setError(null);

            try {
                if (!collegeId) {
                    throw new Error('College ID is missing');
                }

                const token = localStorage.getItem('access');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const response = await fetch(`${baseUrl}api/colleges/${collegeId}/`, {
                    headers: headers,
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log("College Details", data);
                setCollege(data.college);
            } catch (error) {
                setError(error);
                console.error("Error fetching college details:", error);
            } finally {
                setIsLoading(false);
            }
        };
        const fetchCollegePrograms = async () => {

            try {
                const token = localStorage.getItem('access');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const response = await fetch(`${baseUrl}api/colleges/${collegeId}/programs/`, {
                    headers: headers,
                }
                );
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setPrograms(data.programs);
            }
            catch (error) {
                setError(error);
                console.error("Error fetching college programs:", error);
            }
        }

        fetchCollegeDetails();
        fetchCollegePrograms();
        window.scrollTo(0, 0);
    }, [collegeId]);


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="spinner border-4 border-t-4 border-primary rounded-full h-16 w-16 animate-spin"></div>
            </div>)
    }
    if (error) return <p>Error: {error.message}</p>;
    if (!college) return <p>College not found</p>;

    const mapCenter = [college.latitude, college.longitude];

    return (
        <>
            <div className="bg-primary min-h-screen">
                <div className="container mx-auto px-4 py-8">
                    <ScrollToTop />
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex flex-col md:flex-row items-start gap-8">
                            <img
                                src={college.image
                                    ? (college.image.startsWith('http') ? college.image : baseUrl + college.image.replace(/^\//, ''))
                                    : (bgError ? images.collegeImages[(parseInt(collegeId) || 0) % images.collegeImages.length] : `https://images.unsplash.com/featured/?university,campus,${encodeURIComponent(college.name)}`)
                                }
                                onError={(e) => {
                                    if (!bgError && !college.image) {
                                        setBgError(true);
                                    } else {
                                        e.target.onerror = null;
                                        e.target.src = images.collegeImg;
                                    }
                                }}
                                alt={`${college.name} campus`}
                                className="w-64 h-64 rounded-lg object-cover shadow-md md:w-auto md:max-w-[300px]"
                            />
                            <div>
                                <div className="flex items-center gap-4 mb-2">
                                    {(() => {
                                        const url = college.website;
                                        let domain = null;
                                        if (url) {
                                            try {
                                                domain = url.replace('http://', '').replace('https://', '').split(/[/?#]/)[0];
                                                if (domain.startsWith('www.')) domain = domain.substring(4);
                                            } catch (e) { }
                                        }
                                        const logoUrl = college.logo_url || (domain ? `https://logo.clearbit.com/${domain}` : null);

                                        if (logoUrl && !logoError) {
                                            return (
                                                <div className="w-16 h-16 bg-white rounded-xl p-2 shadow-sm border border-gray-100 flex items-center justify-center">
                                                    <img
                                                        src={logoUrl}
                                                        alt="logo"
                                                        className="w-full h-full object-contain"
                                                        onError={() => setLogoError(true)}
                                                    />
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                    <div>
                                        <h1 className="text-3xl font-bold">{college.name}</h1>
                                        <p className="text-gray-600 text-lg">{college.city}, {college.state}</p>
                                    </div>
                                </div>

                                {/* New Metadata Badges */}
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {/* Control (Public/Private) */}
                                    {college.control && (
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${college.control === 1 ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                                            {college.control === 1 ? 'Public' : college.control === 2 ? 'Private Non-profit' : 'Private For-profit'}
                                        </span>
                                    )}

                                    {/* Locale */}
                                    {college.locale && (
                                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">
                                            {(() => {
                                                const l = college.locale;
                                                if (l >= 11 && l <= 13) return 'City';
                                                if (l >= 21 && l <= 23) return 'Suburb';
                                                if (l >= 31 && l <= 33) return 'Town';
                                                if (l >= 41 && l <= 43) return 'Rural';
                                                return 'Campus Setting';
                                            })()}
                                        </span>
                                    )}

                                    {/* Special Missions */}
                                    {college.hbcu && <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">HBCU</span>}
                                    {college.hsi && <span className="px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-800">HSI</span>}
                                    {college.women_only && <span className="px-3 py-1 rounded-full text-sm font-semibold bg-pink-100 text-pink-800">Women's College</span>}
                                    {college.men_only && <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-200 text-blue-800">Men's College</span>}
                                    {college.relaffil && college.relaffil > 0 && <span className="px-3 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-800">Religious Affiliation</span>}

                                    {/* NEW: Open Admissions & Distance Ed */}
                                    {college.is_open_admission && <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-50 text-green-700 border border-green-200">Open Admissions</span>}
                                    {college.is_distance_education && <span className="px-3 py-1 rounded-full text-sm font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">Online Only</span>}

                                    {/* NEW: Carnegie Classification */}
                                    {college.carnegie_classification_display && college.carnegie_classification_display !== "Not classified" && (
                                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                            {college.carnegie_classification_display}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-4 mb-4">
                                    <div className="bg-blue-100 p-3 rounded-lg flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                                        </svg>
                                        <p className="font-medium">Acceptance Rate: {(college.admission_rate * 100).toFixed(2)}%</p>
                                    </div>
                                    <div className="bg-blue-100 p-3 rounded-lg flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                                        </svg>
                                        <p className="font-medium">Average SAT: {college.sat_score}</p>
                                    </div>
                                    <div className="bg-blue-100 p-3 rounded-lg flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                        </svg>
                                        <p className="font-medium">Cost: {formatter.format(college.cost_of_attendance).replace(/(\.|,)00$/g, '')}</p>
                                    </div>
                                    <div className="bg-blue-100 p-3 rounded-lg flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                        </svg>
                                        <p className="font-medium">Tuition in state: {formatter.format(college.tuition_in_state).replace(/(\.|,)00$/g, '')}</p>
                                    </div>
                                    <div className="bg-blue-100 p-3 rounded-lg flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                        </svg>
                                        <p className="font-medium">Tuition out of state: {formatter.format(college.tuition_out_state).replace(/(\.|,)00$/g, '')}</p>
                                    </div>
                                    <div className="bg-blue-100 p-3 rounded-lg flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-blue-600">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a5.97 5.97 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                                        </svg>
                                        <p className="font-medium">Student-to-Faculty: {college.student_faculty_ratio ? `${college.student_faculty_ratio}:1` : 'N/A'}</p>
                                    </div>
                                    {college.top_major && (
                                        <div className="bg-indigo-100 p-3 rounded-lg flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-indigo-600">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                                            </svg>
                                            <p className="font-medium font-semibold italic">Top Major: {college.top_major}</p>
                                        </div>
                                    )}
                                </div>

                                {/* New Financial & Outcome Sections */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 mb-10">
                                    {/* Financial Aid & Value */}
                                    {!!(college.avg_net_price || college.loan_rate) && (
                                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
                                                <div className="p-2 rounded-lg bg-teal-50 text-primary">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                    </svg>
                                                </div>
                                                Financial Value
                                            </h3>
                                            <div className="space-y-6">
                                                {college.avg_net_price && (
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Average Net Price</p>
                                                        <p className="text-3xl font-black text-gray-900 leading-none">
                                                            {formatter.format(college.avg_net_price).replace(/(\.|,)00$/g, '')}
                                                        </p>
                                                        <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">Average cost after aid for students receiving Title IV aid.</p>
                                                    </div>
                                                )}
                                                {college.loan_rate && (
                                                    <div className="pt-4 border-t border-gray-50">
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Federal Loan Rate</p>
                                                        <p className="text-2xl font-bold text-gray-900">
                                                            {(college.loan_rate * 100).toFixed(1)}%
                                                        </p>
                                                        <p className="text-[11px] text-gray-500 mt-1">Percent of students who take out federal loans.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Student Outcomes */}
                                    {!!(college.grad_rate || college.retention_rate) && (
                                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
                                                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                                                    </svg>
                                                </div>
                                                Student Outcomes
                                            </h3>
                                            <div className="space-y-6">
                                                {college.grad_rate && (
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Graduation Rate</p>
                                                        <div className="flex items-baseline gap-2">
                                                            <p className="text-4xl font-black text-gray-900 leading-none">
                                                                {(college.grad_rate * 100).toFixed(0)}%
                                                            </p>
                                                            <span className="text-gray-400 text-xs font-semibold">(150% time)</span>
                                                        </div>
                                                        <div className="w-full bg-gray-100 rounded-full h-2 mt-4 overflow-hidden">
                                                            <div
                                                                className="bg-primary h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(23,113,125,0.3)]"
                                                                style={{ width: (college.grad_rate * 100) + '%' }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )}
                                                {college.retention_rate && (
                                                    <div className="pt-6 border-t border-gray-50">
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Retention Rate</p>
                                                        <div className="flex items-baseline gap-2">
                                                            <p className="text-3xl font-bold text-gray-900 leading-none">
                                                                {(college.retention_rate * 100).toFixed(0)}%
                                                            </p>
                                                        </div>
                                                        <p className="text-[11px] text-gray-500 mt-2">Percent of first-year students who return for their second year.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>


                                <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col gap-4">
                                    <h3 className="text-xl font-bold text-gray-900">About {college.name}</h3>
                                    <p className="text-gray-600 leading-relaxed text-sm lg:text-base">
                                        {college.description || `Explore detailed information about ${college.name}, located in ${college.city}, ${college.state}. This institution offers a variety of programs and is recognized for its commitment to academic excellence and student success.`}
                                    </p>
                                </div>
                                {programs && programs.length > 0 && (
                                    <div className="mt-8">
                                        <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
                                            Programs Offered
                                            <span className="ml-3 text-sm font-normal text-gray-400">
                                                ({programs.length} total)
                                            </span>
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {(showAllPrograms ? programs : programs.slice(0, PROGRAMS_LIMIT)).map(program => (
                                                <div key={program.id} className="bg-gray-50 hover:bg-white border border-gray-100 p-4 rounded-xl transition-all duration-300 hover:shadow-md hover:border-blue-100 group flex items-start gap-3">
                                                    <div className="bg-white p-2 rounded-lg text-blue-500 group-hover:text-blue-600 transition-colors shadow-sm">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800 leading-tight group-hover:text-blue-800 transition-colors">
                                                            {program.cipdesc}
                                                        </p>
                                                        {program.creddesc && (
                                                            <p className="text-sm text-gray-500 mt-1 font-medium">
                                                                {program.creddesc}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {programs.length > PROGRAMS_LIMIT && (
                                            <div className="mt-6 flex justify-center">
                                                <button
                                                    onClick={() => setShowAllPrograms(prev => !prev)}
                                                    className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-full shadow-sm hover:shadow-md hover:border-blue-300 hover:text-blue-600 transition-all duration-200"
                                                >
                                                    {showAllPrograms ? (
                                                        <>
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                                                            </svg>
                                                            Show less
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                                            </svg>
                                                            Show all {programs.length} programs
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}


                                <a href={college.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{college.website}</a>
                                {college.latitude && college.longitude &&
                                    <div className="mt-8 h-[300px] w-full md:w-[600px]">
                                        <div className="mt-8 rounded-lg shadow-md overflow-hidden">
                                            <MapContainer
                                                center={mapCenter}
                                                zoom={10}
                                                scrollWheelZoom={false}
                                                doubleClickZoom={false}
                                                touchZoom={false}
                                                style={{ height: '300px', width: '100%' }}
                                                className="rounded-lg" // Applying border-radius to MapContainer
                                            >
                                                <TileLayer
                                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                />
                                                <Marker position={mapCenter}>
                                                    <Popup>{college.name}</Popup>
                                                </Marker>
                                            </MapContainer>
                                        </div>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CollegeDetail;