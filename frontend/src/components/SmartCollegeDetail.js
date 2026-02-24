import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { baseUrl } from '../shared';
import { images } from '../constants';
import { useCurrentUser } from '../UserProvider/UserProvider';
import { TrashIcon } from '@heroicons/react/24/outline';

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
})


const SmartCollegeDetail = () => {
    const { id: collegeId } = useParams();
    const { user, loggedIn } = useCurrentUser();
    const [college, setCollege] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [programs, setPrograms] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    console.log("programs", programs);


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
                const response = await fetch(`${baseUrl}api/smart-colleges/${collegeId}/`, {
                    headers: headers,
                });

                console.log("response", response);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setCollege(data);
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

        const fetchAnnouncements = async () => {
            try {
                const token = localStorage.getItem('access');
                const response = await fetch(`${baseUrl}api/colleges/${collegeId}/announcements/`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                if (response.ok) {
                    const data = await response.json();
                    setAnnouncements(data);
                }
            } catch (err) {
                console.error("Error fetching announcements:", err);
            }
        };

        fetchCollegeDetails();
        fetchCollegePrograms();
        fetchAnnouncements();
        window.scrollTo(0, 0);
    }, [collegeId]);

    const handleDeleteAnnouncement = async (announcementId) => {
        if (!window.confirm("Are you sure you want to delete this announcement?")) return;

        try {
            const token = localStorage.getItem('access');
            const response = await fetch(`${baseUrl}api/posts/${announcementId}/delete/`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
            } else {
                alert("Failed to delete announcement.");
            }
        } catch (error) {
            console.error("Error deleting announcement:", error);
            alert("Error deleting announcement.");
        }
    };


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="spinner border-4 border-t-4 border-primary rounded-full h-16 w-16 animate-spin"></div>
            </div>)
    }
    if (error) return <p>Error: {error.message}</p>;
    if (!college) return <p>College not found</p>;

    return (
        <>
            <div className="bg-primary min-h-screen">
                <div className="container mx-auto px-4 py-8">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <img src={images.collegeImg} alt={college.name} className="w-64 h-64 rounded-lg object-cover shadow-md md:w-auto md:max-w-[300px]" />
                            <div>
                                <h1 className="text-3xl font-bold mb-2">{college.name}</h1>
                                <p className="text-gray-600 text-lg mb-4">{college.city}, {college.state}</p>
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
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-blue-600">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a5.97 5.97 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                                        </svg>
                                        <p className="font-medium">Student-to-Faculty: {college.student_faculty_ratio ? `${college.student_faculty_ratio}:1` : 'N/A'}</p>
                                    </div>
                                    {college.grad_rate && (
                                        <div className="bg-green-100 p-3 rounded-lg flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-green-600">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0V6.75A2.25 2.25 0 0 1 10.5 4.5h3a2.25 2.25 0 0 1 2.25 2.25v9.75m-4.5 0V9a1.5 1.5 0 0 0-3 0v7.5m-3 0h3" />
                                            </svg>
                                            <p className="font-medium">Grad Rate: {((college.grad_rate > 1 ? college.grad_rate / 100 : college.grad_rate) * 100).toFixed(0)}%</p>
                                        </div>
                                    )}
                                    {college.retention_rate && (
                                        <div className="bg-teal-100 p-3 rounded-lg flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-teal-600">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                            </svg>
                                            <p className="font-medium">Retention: {(college.retention_rate * 100).toFixed(0)}%</p>
                                        </div>
                                    )}
                                    {college.top_major && (
                                        <div className="bg-indigo-100 p-3 rounded-lg flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-indigo-600">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                                            </svg>
                                            <p className="font-medium font-semibold italic">Top Major: {college.top_major}</p>
                                        </div>
                                    )}
                                </div>

                                {announcements && announcements.length > 0 && (
                                    <div className="mt-8 pt-8 border-t border-gray-100">
                                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                            <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2.25m0 2.25h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                </svg>
                                            </div>
                                            Official Announcements
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {announcements.map(announcement => (
                                                <div key={announcement.id} className="bg-gradient-to-br from-violet-50/50 to-white border border-violet-100 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between h-full">
                                                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-violet-200/50 to-violet-100/50 opacity-20 transform rotate-45 translate-x-8 -translate-y-8 rounded-full"></div>
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="font-bold text-gray-900 line-clamp-2">{announcement.title}</h4>
                                                            {loggedIn && user && announcement.author?.id === user.id && (
                                                                <button
                                                                    onClick={() => handleDeleteAnnouncement(announcement.id)}
                                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                                    title="Delete Announcement"
                                                                >
                                                                    <TrashIcon className="w-5 h-5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <p className="text-gray-700 text-sm mb-4 line-clamp-3 leading-relaxed">
                                                            {announcement.content}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[10px] uppercase font-bold text-gray-400 mt-auto pt-4 border-t border-violet-100/50">
                                                        <span>Posted by {announcement.author?.first_name || announcement.author?.username}</span>
                                                        <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {programs && programs.length > 0 && (
                                    <div className="mt-4">
                                        <h3 className="text-xl font-semibold mb-2">Programs Offered</h3>
                                        <ul>
                                            {programs.map(program => (
                                                <li key={program.id} className="ml-4 list-disc">
                                                    {program.cipdesc}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <a href={college.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{college.website}</a>

                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
};

export default SmartCollegeDetail;