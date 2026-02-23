import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { baseUrl } from '../shared';
import { XMarkIcon, UserPlusIcon, UserIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';

const NewStudentMessageModal = ({ isOpen, onClose, onStartChat }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchPublicStudents();
        } else {
            setStudents([]);
        }
    }, [isOpen]);

    const fetchPublicStudents = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access');
            const res = await axios.get(`${baseUrl}api/users/public-students/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudents(res.data);
        } catch (err) {
            console.error("Error fetching public students:", err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] overflow-y-auto w-full h-full">
            <div className="flex items-start justify-center min-h-screen pt-20 px-4 pb-20 text-center sm:p-0">
                {/* Overlay */}
                <div
                    className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75 backdrop-blur-sm"
                    onClick={onClose}
                />

                <div className="inline-block w-full max-w-lg text-left align-middle transition-all transform sm:my-8 bg-white shadow-2xl rounded-2xl overflow-hidden relative z-10">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900">New Public Students</h3>
                        <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 transition-colors">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto bg-gray-50/50 min-h-[100px] p-4">
                        {loading && students.length === 0 ? (
                            <div className="flex justify-center py-4 text-primary">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : students.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 font-medium pb-20 text-sm">
                                <UserIcon className="w-8 h-8 opacity-30 mx-auto mb-2" />
                                <p>No new public students found.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {students.map((student) => (
                                    <div key={student.id} className="bg-white border text-left border-gray-100 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3 overflow-hidden mr-4">
                                            {student.image ? (
                                                <img src={student.image} alt={student.username} className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center border border-teal-100">
                                                    <UserIcon className="w-5 h-5 text-primary" />
                                                </div>
                                            )}
                                            <div className="overflow-hidden">
                                                <h4 className="font-bold text-gray-900 truncate text-sm">{student.username}</h4>
                                                <p className="text-[10px] uppercase font-bold text-primary truncate">Student</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                onStartChat({ id: student.id, username: student.username });
                                                onClose();
                                            }}
                                            className="text-xs font-bold bg-primary text-white hover:bg-teal-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border-0"
                                        >
                                            <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                                            Message
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewStudentMessageModal;
