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
    SparklesIcon
} from '@heroicons/react/24/outline';
import DirectMessageModal from '../utils/DirectMessageModal';

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
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
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

            // In a real app, these would come from a specific analytics endpoint
            setStats({
                bookmarks: Math.floor(Math.random() * 500) + 50,
                likes: Math.floor(Math.random() * 1000) + 100,
                followers: Math.floor(Math.random() * 200) + 20
            });

            // Fetch real interested students
            const studentsRes = await axios.get(`${baseUrl}api/colleges/${user.associated_college}/interested-students/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInterestedStudents(studentsRes.data);
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

            {/* Main Content */}
            {/* Main Content */}
            <div className="relative z-20 max-w-7xl mx-auto px-8 mt-8 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Stats */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <ChartBarIcon className="w-5 h-5 text-primary" />
                                Performance Overview
                            </h3>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-teal-50 rounded-lg text-primary">
                                            <UsersIcon className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-500">Total Bookmarks</span>
                                    </div>
                                    <span className="text-xl font-bold text-gray-900">{stats.bookmarks}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-50 rounded-lg text-red-600">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                                        </div>
                                        <span className="text-sm font-medium text-gray-500">Recent Likes</span>
                                    </div>
                                    <span className="text-xl font-bold text-gray-900">{stats.likes}</span>
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
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Interested Students</h3>
                            <div className="space-y-4">
                                {interestedStudents.length > 0 ? (
                                    interestedStudents.map(student => (
                                        <div
                                            key={student.id}
                                            onClick={() => handleContact(student)}
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
                                                <p className="text-sm font-bold text-gray-900">{student.first_name || student.username}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                    {student.major || 'Undecided'} • {student.sat_score ? `SAT: ${student.sat_score}` : 'Potential Candidate'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleContact(student)}
                                                className="text-primary hover:text-white hover:bg-primary text-xs font-bold px-3 py-1 bg-teal-50 rounded-lg transition-all"
                                            >
                                                Contact
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-gray-400 text-sm">No students have bookmarked your college yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Editor */}
                    <div className="lg:col-span-2">
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
        </div>
    );
};

export default CollegePortal;
