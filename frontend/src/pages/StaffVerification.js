import React, { useState, useEffect } from 'react';
import { useCurrentUser } from '../UserProvider/UserProvider';
import { baseUrl } from '../shared';
import axios from 'axios';
import {
    ShieldCheckIcon,
    UserGroupIcon,
    CheckCircleIcon,
    XCircleIcon,
    AcademicCapIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

const StaffVerification = () => {
    const { user, loggedIn } = useCurrentUser();
    const [pendingRequests, setPendingRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        if (loggedIn && user?.is_staff) {
            fetchPendingRequests();
        }
    }, [user, loggedIn]);

    const fetchPendingRequests = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('access');
            const res = await axios.get(`${baseUrl}api/admin/pending-staff/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingRequests(res.data);
        } catch (err) {
            console.error("Error fetching pending requests", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (userId, action) => {
        try {
            const token = localStorage.getItem('access');
            await axios.post(`${baseUrl}api/admin/verify-staff/`, {
                user_id: userId,
                action: action
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setStatusMsg({
                type: 'success',
                text: `User ${action === 'approve' ? 'verified' : 'denied'} successfully.`
            });

            // Refresh list
            fetchPendingRequests();

            setTimeout(() => setStatusMsg({ type: '', text: '' }), 3000);
        } catch (err) {
            setStatusMsg({ type: 'error', text: 'Action failed. Please try again.' });
            setTimeout(() => setStatusMsg({ type: '', text: '' }), 3000);
        }
    };

    if (!loggedIn || !user?.is_staff) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm">
                    <ShieldCheckIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-500">Super Admin privileges are required to view this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20 pt-10">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <ShieldCheckIcon className="w-8 h-8 text-primary" />
                            Staff Verification Center
                        </h1>
                        <p className="text-gray-500 mt-1">Approve or deny institutional representative claim requests.</p>
                    </div>
                    <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Pending Requests</p>
                            <p className="text-2xl font-bold text-primary">{pendingRequests.length}</p>
                        </div>
                        <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-primary">
                            <UserGroupIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {statusMsg.text && (
                    <div className={`mb-6 p-4 rounded-2xl font-bold flex items-center gap-2 animate-slideUp ${statusMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                        {statusMsg.type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <XCircleIcon className="w-5 h-5" />}
                        {statusMsg.text}
                    </div>
                )}

                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    {isLoading ? (
                        <div className="p-20 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                            <p className="text-gray-400 mt-4 font-medium">Loading requests...</p>
                        </div>
                    ) : pendingRequests.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Representative</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Institution to Claim</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Request Date</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {pendingRequests.map((req) => (
                                        <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                                        <AcademicCapIcon className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{req.username}</p>
                                                        <p className="text-xs text-gray-500">{req.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-primary">{req.college_name}</span>
                                                    <span className="text-[10px] text-gray-400 font-medium">ID: #{req.college_id}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-gray-500 text-sm">
                                                    <ClockIcon className="w-4 h-4" />
                                                    {new Date(req.request_date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleAction(req.id, 'deny')}
                                                        className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                    >
                                                        Deny
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(req.id, 'approve')}
                                                        className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-teal-700 shadow-lg shadow-teal-100 transition-all"
                                                    >
                                                        Approve
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-20 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircleIcon className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Queue is Clear!</h3>
                            <p className="text-gray-500 max-w-sm mx-auto">There are no pending staff verification requests at this time.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StaffVerification;
