import React, { useState, useEffect } from 'react';
import { useCurrentUser } from '../UserProvider/UserProvider';
import { baseUrl } from '../shared';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
    ChartBarIcon,
    PencilSquareIcon,
    UsersIcon,
    CheckBadgeIcon,
    ExclamationTriangleIcon,
    GlobeAltIcon,
    AcademicCapIcon,
    PhotoIcon,
    SparklesIcon,
    CalendarIcon,
    ClockIcon,
    Bars3CenterLeftIcon,
    MegaphoneIcon
} from '@heroicons/react/24/outline';
import DirectMessageModal from '../utils/DirectMessageModal';
import AnnouncementManager from '../components/AnnouncementManager';
const CollegePortal = () => {
    const { user, loggedIn, fetchUserData } = useCurrentUser();
    const [college, setCollege] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ bookmarks: 0, likes: 0, followers: 0 });
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [saveStatus, setSaveStatus] = useState('idle');
    const [logoError, setLogoError] = useState(false);
    const [bgError, setBgError] = useState(false);
    const [interestedStudents, setInterestedStudents] = useState([]);
    const [pendingAmbassadors, setPendingAmbassadors] = useState([]);
    const [verifiedAmbassadors, setVerifiedAmbassadors] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [statsModalType, setStatsModalType] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (loggedIn && user?.role === 'college_staff' && user?.associated_college) {
            fetchCollegeData();
        } else if (loggedIn && user?.role === 'student') {
            // Redirect students back to search
            navigate('/');
        }
    }, [user, loggedIn]);

    const fetchCollegeData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('access');
            const res = await axios.get(`${baseUrl}api/colleges/${user.associated_college}/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCollege(res.data.college);
            setEditData({
                description: res.data.college.description || '',
                website: res.data.college.website || '',
                top_major: res.data.college.top_major || '',
            });

            // Fetch real analytics
            try {
                const analyticsRes = await axios.get(`${baseUrl}api/colleges/${user.associated_college}/analytics/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats({
                    bookmarks: analyticsRes.data.bookmarks || 0,
                    recent_bookmarks: analyticsRes.data.recent_bookmarks || 0,
                    followers: analyticsRes.data.followers || 0
                });
            } catch (analyticsErr) {
                console.error("Error fetching analytics", analyticsErr);
                setStats({ bookmarks: 0, recent_bookmarks: 0, followers: 0 });
            }

            // Fetch real interested students
            const studentsRes = await axios.get(`${baseUrl}api/colleges/${user.associated_college}/interested-students/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInterestedStudents(studentsRes.data);

            // Fetch pending ambassadors
            const ambassadorRes = await axios.get(`${baseUrl}api/colleges/${user.associated_college}/pending-ambassadors/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingAmbassadors(ambassadorRes.data);

            // Fetch verified ambassadors
            const verifiedRes = await axios.get(`${baseUrl}api/colleges/${user.associated_college}/ambassadors/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVerifiedAmbassadors(verifiedRes.data);
        } catch (err) {
            console.error("Error fetching college portal data", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleContact = (student) => {
        setSelectedStudent(student);
        setIsMessageModalOpen(true);
    };

    const handleUpdateStatus = async (studentId, newStatus) => {
        try {
            const token = localStorage.getItem('access');
            await axios.post(`${baseUrl}api/colleges/update-lead-status/`, {
                college_id: user.associated_college,
                student_id: studentId,
                status: newStatus
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state
            setInterestedStudents(prev =>
                prev.map(s => s.id === studentId ? { ...s, status: newStatus } : s)
            );
        } catch (err) {
            console.error("Error updating lead status", err);
        }
    };

    const handleVerifyAmbassador = async (studentId) => {
        try {
            const token = localStorage.getItem('access');
            await axios.post(`${baseUrl}api/ambassador/verify/`, {
                student_id: studentId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingAmbassadors(prev => prev.filter(s => s.id !== studentId));
            setUpdateMessage({ text: "Ambassador verified!", type: "success" });
            setTimeout(() => setUpdateMessage({ text: "", type: "" }), 3000);
        } catch (err) {
            console.error("Error verifying ambassador", err);
        }
    };

    const [updateMessage, setUpdateMessage] = useState({ text: "", type: "" });

    const handleSave = async () => {
        setSaveStatus('saving');
        try {
            const token = localStorage.getItem('access');
            const formData = new FormData();

            if (editData.description) formData.append('description', editData.description);
            if (editData.website) formData.append('website', editData.website);
            if (editData.top_major) formData.append('top_major', editData.top_major);
            if (editData.logo instanceof File) {
                formData.append('logo', editData.logo);
            }
            if (editData.image instanceof File) {
                formData.append('image', editData.image);
            }

            const res = await axios.patch(`${baseUrl}api/colleges/${college.id}/staff-update/`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setCollege(res.data.college);
            setSaveStatus('success');
            setIsEditing(false);
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (err) {
            console.error("Save error:", err);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };

    if (!loggedIn) return <div className="p-20 text-center">Please login to access the portal.</div>;
    if (user?.role !== 'college_staff') return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-xl border border-gray-100 text-center">
                <AcademicCapIcon className="w-16 h-16 text-primary mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Account Detected</h2>
                <p className="text-gray-500 mb-8">The College Portal is exclusively for verified institutional representatives.</p>
                <Link to="/" className="inline-block bg-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-teal-700 transition-all">
                    Back to Search
                </Link>
            </div>
        </div>
    );

    if (isLoading) return (
        <div className="flex justify-center items-center h-screen bg-gray-50 text-primary">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header / Banner Area */}
            <div className="relative bg-primary pt-24 pb-32 px-8 overflow-hidden group/banner">
                {isEditing && (
                    <div className="absolute top-6 right-8 z-30 flex gap-3">
                        <label className="bg-white/90 hover:bg-white backdrop-blur-md text-primary font-bold px-4 py-2 rounded-xl cursor-pointer transition-all shadow-lg flex items-center gap-2 text-sm">
                            <PhotoIcon className="w-5 h-5" />
                            Change Banner
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        setEditData({ ...editData, image: e.target.files[0] });
                                        setBgError(false);
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            setCollege(prev => ({ ...prev, image: event.target.result }));
                                        };
                                        reader.readAsDataURL(e.target.files[0]);
                                    }
                                }}
                            />
                        </label>
                    </div>
                )}
                <img
                    src={college.image
                        ? (college.image.startsWith('http') || college.image.startsWith('data:') ? college.image : baseUrl + college.image.replace(/^\//, ''))
                        : (bgError ? `https://images.unsplash.com/featured/?university,campus` : `https://images.unsplash.com/featured/?university,campus,${encodeURIComponent(college.name)}`)
                    }
                    onError={(e) => {
                        if (!bgError && !college.image) {
                            setBgError(true);
                        } else {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1541339907198-e08756ebafe3?q=80&w=2070&auto=format&fit=crop';
                        }
                    }}
                    alt="Campus"
                    className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-transparent"></div>
                <div className="relative max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 bg-white rounded-2xl p-2 shadow-2xl flex items-center justify-center overflow-hidden border border-white/20 relative group">
                                {(() => {
                                    const url = college.website;
                                    let domain = null;
                                    if (url) {
                                        try {
                                            domain = url.replace('http://', '').replace('https://', '').split(/[/?#]/)[0];
                                            if (domain.startsWith('www.')) domain = domain.substring(4);
                                        } catch (e) { }
                                    }
                                    const logoUrl = college.logo
                                        ? (college.logo.startsWith('http') || college.logo.startsWith('data:') ? college.logo : baseUrl + (college.logo.startsWith('/') ? college.logo.substring(1) : college.logo))
                                        : (college.logo_url || (domain ? `https://logo.clearbit.com/${domain}` : null));

                                    if (logoUrl && !logoError) {
                                        return (
                                            <img
                                                src={logoUrl}
                                                alt="logo"
                                                className="w-full h-full object-contain"
                                                onError={() => setLogoError(true)}
                                            />
                                        );
                                    }
                                    return (
                                        <div className="w-full h-full bg-gradient-to-br from-teal-400/20 to-primary/20 flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform duration-500">
                                            <AcademicCapIcon className="w-12 h-12 text-primary/10 absolute -bottom-2 -right-2 transform rotate-12" />
                                            <SparklesIcon className="w-6 h-6 text-primary/40 animate-pulse" />
                                        </div>
                                    );
                                })()}
                                {isEditing && (
                                    <div className="absolute inset-0 bg-gray-100/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20">
                                        <label className="bg-white/95 text-primary text-[10px] font-bold px-2 py-1.5 rounded-lg shadow-md cursor-pointer hover:bg-white flex items-center gap-1 uppercase tracking-tighter">
                                            <PencilSquareIcon className="w-3 h-3" />
                                            Update
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) {
                                                        const file = e.target.files[0];
                                                        setEditData({ ...editData, logo: file });
                                                        setLogoError(false);
                                                        const reader = new FileReader();
                                                        reader.onload = (event) => {
                                                            setCollege(prev => ({ ...prev, logo: event.target.result }));
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">{college.name}</h1>
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-bold text-white uppercase tracking-wider">
                                        Staff Portal
                                    </span>
                                    {user.is_verified ? (
                                        <span className="flex items-center gap-1 text-teal-300 text-sm font-bold">
                                            <CheckBadgeIcon className="w-5 h-5" />
                                            Verified Institution
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-orange-300 text-sm font-bold">
                                            <ExclamationTriangleIcon className="w-5 h-5" />
                                            Verification Pending
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <button
                                onClick={() => {
                                    document.getElementById('announcement-manager').scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="bg-[#17717d] hover:bg-[#125a64] text-white font-bold px-6 py-3 rounded-xl transition-all shadow-xl flex items-center gap-2 border border-[#17717d]"
                            >
                                <MegaphoneIcon className="w-5 h-5 text-white" />
                                <span className="text-white">Post Announcement</span>
                            </button>
                            <Link
                                to={`/colleges/${college.id}/details`}
                                className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2"
                            >
                                <GlobeAltIcon className="w-5 h-5" />
                                View Public Page
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            {/* Main Content */}
            <div className="relative z-20 max-w-7xl mx-auto px-8 mt-8 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Stats & Students */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <ChartBarIcon className="w-5 h-5 text-primary" />
                                Performance Overview
                            </h3>
                            <div className="space-y-2">
                                <div
                                    onClick={() => setStatsModalType('bookmarks')}
                                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-teal-50 rounded-lg text-primary">
                                            <UsersIcon className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-500">Total Bookmarks</span>
                                    </div>
                                    <span className="text-xl font-bold text-gray-900">{stats.bookmarks}</span>
                                </div>
                                <div
                                    onClick={() => setStatsModalType('recent_bookmarks')}
                                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-50 rounded-lg text-red-600">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                                        </div>
                                        <span className="text-sm font-medium text-gray-500">Recent Bookmarks</span>
                                    </div>
                                    <span className="text-xl font-bold text-gray-900">{stats.recent_bookmarks}</span>
                                </div>
                                <div
                                    onClick={() => setStatsModalType('followers')}
                                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-teal-50 rounded-lg text-teal-600">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                        </div>
                                        <span className="text-sm font-medium text-gray-500">Active Followers</span>
                                    </div>
                                    <span className="text-xl font-bold text-gray-900">{stats.followers}</span>
                                </div>
                            </div>
                            <div className="mt-8 pt-8 border-t border-gray-50">
                                <p className="text-xs text-info leading-relaxed">
                                    Statistics are updated in real-time based on student engagement with your institution.
                                </p>
                            </div>
                        </div>

                        {/* Recent Student Bookmarks */}
                        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <UsersIcon className="w-5 h-5 text-primary" />
                                Interested Students
                            </h3>
                            <div className="space-y-4">
                                {interestedStudents.length > 0 ? (
                                    interestedStudents.map(student => (
                                        <div
                                            key={student.id}
                                            onClick={() => navigate(`/profile/${student.id}`)}
                                            className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer group"
                                        >
                                            {student.image ? (
                                                <img src={student.image.startsWith('http') ? student.image : (baseUrl + student.image.replace(/^\//, ''))} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-100 to-gray-50 flex items-center justify-center border border-gray-100 shadow-inner group-hover:scale-105 transition-transform duration-300">
                                                    <UsersIcon className="w-5 h-5 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-gray-900">{student.first_name || student.username}</p>
                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${student.status === 'enrolled' ? 'bg-green-100 text-green-600' :
                                                        student.status === 'qualified' ? 'bg-teal-100 text-teal-600' :
                                                            student.status === 'contacted' ? 'bg-amber-100 text-amber-600' :
                                                                student.status === 'interviewed' ? 'bg-purple-100 text-purple-600' :
                                                                    student.status === 'rejected' ? 'bg-red-100 text-red-600' :
                                                                        'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {student.status || 'new'}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                    {student.major || 'Undecided'} • {student.sat_score ? `SAT: ${student.sat_score}` : 'Potential Candidate'}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-2.5">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleContact(student); }}
                                                    className="text-primary hover:text-white hover:bg-primary text-[10px] font-bold px-3 py-1 bg-teal-50 rounded-lg transition-all"
                                                >
                                                    Contact
                                                </button>
                                                <select
                                                    value={student.status || 'new'}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => handleUpdateStatus(student.id, e.target.value)}
                                                    className="text-[9px] font-bold text-purple-700 bg-purple-50/30 border border-purple-400/50 rounded-lg px-2 py-1 cursor-pointer focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all"
                                                >
                                                    <option value="new">New</option>
                                                    <option value="contacted">Contacted</option>
                                                    <option value="interviewed">Interviewed</option>
                                                    <option value="qualified">Qualified</option>
                                                    <option value="enrolled">Enrolled</option>
                                                    <option value="rejected">Rejected</option>
                                                </select>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-gray-400 text-sm">No students have bookmarked your college yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Pending Ambassador Requests */}
                        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 mt-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <CheckBadgeIcon className="w-5 h-5 text-primary" />
                                    Ambassador Requests
                                </h3>
                                {pendingAmbassadors.length > 0 && (
                                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                        {pendingAmbassadors.length} NEW
                                    </span>
                                )}
                            </div>
                            <div className="space-y-4">
                                {pendingAmbassadors.length > 0 ? (
                                    pendingAmbassadors.map(student => (
                                        <div
                                            key={student.id}
                                            className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all group"
                                        >
                                            <div className="flex items-center gap-3 mb-4">
                                                {student.image ? (
                                                    <img src={student.image.startsWith('http') ? student.image : (baseUrl + student.image.replace(/^\//, ''))} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-200">
                                                        <UsersIcon className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">{student.username}</p>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{student.major || 'Current Student'}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleVerifyAmbassador(student.id)}
                                                    className="flex-1 bg-primary text-white text-[10px] font-bold py-2 rounded-xl hover:bg-teal-700 transition-all shadow-sm shadow-teal-700/10"
                                                >
                                                    Verify as Ambassador
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/profile/${student.id}`)}
                                                    className="px-3 py-2 bg-white text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                                                >
                                                    <UsersIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 opacity-40">
                                        <CheckBadgeIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">No requests</p>
                                    </div>
                                )}
                            </div>
                            {updateMessage.text && (
                                <div className={`mt-4 p-3 rounded-xl text-xs font-bold text-center ${updateMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {updateMessage.text}
                                </div>
                            )}
                        </div>

                        {/* Current Verified Ambassadors */}
                        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 mt-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <CheckBadgeIcon className="w-5 h-5 text-violet-500" />
                                    Current Ambassadors
                                </h3>
                                {verifiedAmbassadors.length > 0 && (
                                    <span className="bg-violet-100 text-violet-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        {verifiedAmbassadors.length} ACTIVE
                                    </span>
                                )}
                            </div>
                            <div className="space-y-3">
                                {verifiedAmbassadors.length > 0 ? (
                                    verifiedAmbassadors.map(amb => (
                                        <div
                                            key={amb.id}
                                            onClick={() => navigate(`/profile/${amb.id}`)}
                                            className="p-3 bg-violet-50/50 rounded-2xl border border-violet-100 hover:bg-violet-50 hover:shadow-sm transition-all cursor-pointer flex items-center gap-3 group"
                                        >
                                            {amb.image ? (
                                                <img src={amb.image.startsWith('http') ? amb.image : (baseUrl + amb.image.replace(/^\//, ''))} alt="Avatar" className="w-9 h-9 rounded-full object-cover ring-2 ring-violet-200" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center ring-2 ring-violet-200">
                                                    <UsersIcon className="w-4 h-4 text-violet-400" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-900 text-sm truncate">{amb.first_name || amb.username}</p>
                                                <p className="text-[10px] text-violet-500 font-bold uppercase tracking-wider">{amb.major || 'Student'}</p>
                                            </div>
                                            <CheckBadgeIcon className="w-4 h-4 text-violet-400 flex-shrink-0" />
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 opacity-40">
                                        <UsersIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">No ambassadors yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Editor */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Institutional Profile Manager</h3>
                                    <p className="text-sm text-gray-500">Update how students see your college.</p>
                                </div>
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 bg-primary text-white font-bold px-6 py-2.5 rounded-xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-100"
                                    >
                                        <PencilSquareIcon className="w-5 h-5 text-teal-300" />
                                        Edit Profile
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="text-gray-500 font-bold px-4 py-2 hover:text-gray-900"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={saveStatus === 'saving'}
                                            className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl hover:bg-teal-700 transition-all shadow-lg"
                                        >
                                            {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Official Website</label>
                                        <input
                                            type="text"
                                            disabled={!isEditing}
                                            value={editData.website}
                                            onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                                            className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-primary rounded-2xl px-5 py-3 outline-none transition-all disabled:opacity-60"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Top Major / Flagship Program</label>
                                        <input
                                            type="text"
                                            disabled={!isEditing}
                                            value={editData.top_major}
                                            onChange={(e) => setEditData({ ...editData, top_major: e.target.value })}
                                            className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-primary rounded-2xl px-5 py-3 outline-none transition-all disabled:opacity-60"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Institutional Description</label>
                                    <textarea
                                        rows="12"
                                        disabled={!isEditing}
                                        value={editData.description}
                                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                        className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-primary rounded-2xl px-5 py-4 outline-none transition-all resize-none leading-relaxed disabled:opacity-60"
                                        placeholder="Tell students what makes your institution unique..."
                                    />
                                </div>
                            </div>

                            {saveStatus === 'success' && (
                                <div className="mx-8 mb-8 p-4 bg-green-50 border border-green-100 rounded-2xl text-green-700 text-sm font-bold flex items-center gap-2 animate-slideUp">
                                    <CheckBadgeIcon className="w-5 h-5 text-green-500" />
                                    Profile updated successfully! Changes are live.
                                </div>
                            )}
                        </div>

                        {/* Official Announcements Manager — same column as Profile Manager */}
                        <div id="announcement-manager">
                            {college && <AnnouncementManager college={college} />}
                        </div>
                    </div>
                </div>

                {college && (
                    <DirectMessageModal
                        isOpen={isMessageModalOpen}
                        onClose={() => setIsMessageModalOpen(false)}
                        student={selectedStudent}
                        collegeName={college.name}
                    />
                )}

                {/* Stats Modals */}
                {statsModalType && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm" style={{ zIndex: 9999 }}>
                        <div className="bg-white rounded-3xl p-6 shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    {statsModalType === 'bookmarks' && <><UsersIcon className="w-6 h-6 text-primary" /> Total Bookmarks</>}
                                    {statsModalType === 'followers' && <><svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> Active Followers</>}
                                    {statsModalType === 'recent_bookmarks' && <><svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg> Recent Bookmarks</>}
                                </h3>
                                <button onClick={() => setStatsModalType(null)} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-50 rounded-full">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                                {(() => {
                                    const filteredStudents = interestedStudents.filter(s => {
                                        if (statsModalType === 'bookmarks' || statsModalType === 'recent_bookmarks') return s.has_bookmarked;
                                        if (statsModalType === 'followers') return s.is_following;
                                        return false;
                                    });

                                    if (filteredStudents.length === 0) {
                                        return (
                                            <div className="text-center py-8">
                                                <p className="text-gray-400 text-sm">No students found matching this criteria.</p>
                                            </div>
                                        );
                                    }

                                    return filteredStudents.map(student => (
                                        <div
                                            key={student.id}
                                            onClick={() => navigate(`/profile/${student.id}`)}
                                            className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer border border-gray-100/50 hover:border-gray-200 group"
                                        >
                                            {student.image ? (
                                                <img src={student.image.startsWith('http') ? student.image : (baseUrl + student.image.replace(/^\//, ''))} alt="Avatar" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-100 to-gray-50 flex items-center justify-center border border-gray-100 shadow-sm group-hover:scale-105 transition-transform duration-300">
                                                    <UsersIcon className="w-5 h-5 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-gray-900">{student.first_name || student.username}</p>
                                                </div>
                                                <p className="text-xs text-gray-500 font-medium opacity-80">
                                                    {student.major || 'Undecided'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setStatsModalType(null); handleContact(student); }}
                                                className="text-primary hover:text-white hover:bg-primary text-xs font-bold px-4 py-1.5 bg-teal-50 rounded-lg transition-all shadow-sm"
                                            >
                                                Message
                                            </button>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default CollegePortal;
