import React, { useState } from 'react';
import axios from 'axios';
import { baseUrl } from '../shared';
import { PlusIcon, TrashIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

const ManageServicesModal = ({ isOpen, onClose, services, onUpdate }) => {
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [duration, setDuration] = useState('30');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('access');
            await axios.post(`${baseUrl}api/services/create/`, {
                title,
                price: parseFloat(price),
                duration: parseInt(duration),
                description
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTitle('');
            setPrice('');
            setDescription('');
            onUpdate();
        } catch (error) {
            console.error("Error creating service:", error);
            alert("Failed to create package.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden animate-slideUp max-h-[90vh] flex flex-col">
                <div className="bg-primary p-8 text-white">
                    <h2 className="text-2xl font-black mb-1">Service Packages</h2>
                    <p className="text-white/70 text-sm">Define what students can book with you</p>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* List Existing */}
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Your Active Packages</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {services && services.length > 0 ? (
                                services.map(service => (
                                    <div key={service.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-start group">
                                        <div>
                                            <p className="font-bold text-gray-900">{service.title}</p>
                                            <p className="text-xs text-gray-500 line-clamp-1">{service.description}</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-xs font-black text-primary">${parseFloat(service.price).toFixed(0)}</span>
                                                <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                                                    <ClockIcon className="w-3 h-3" />
                                                    {service.duration}m
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="col-span-full text-center py-8 text-gray-400 italic text-sm">No packages created yet.</p>
                            )}
                        </div>
                    </div>

                    <div className="h-px bg-gray-100"></div>

                    {/* Form New */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Add New Package</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Package Title</label>
                                <input 
                                    type="text" 
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. 30min Discovery Call"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    required
                                />
                            </div>
                            <div className="col-span-1 sm:col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Price ($)</label>
                                <input 
                                    type="number" 
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="49"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    required
                                />
                            </div>
                            <div className="col-span-1 sm:col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Duration (mins)</label>
                                <select 
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                                >
                                    <option value="15">15 mins</option>
                                    <option value="30">30 mins</option>
                                    <option value="45">45 mins</option>
                                    <option value="60">60 mins</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Description</label>
                                <textarea 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe what's included..."
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 h-24 resize-none"
                                    required
                                />
                            </div>
                        </div>
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-primary text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-teal-700 transition-all disabled:opacity-50"
                        >
                            <PlusIcon className="w-5 h-5" />
                            {isSubmitting ? 'Creating...' : 'Add Package'}
                        </button>
                    </form>
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end">
                    <button onClick={onClose} className="text-sm font-bold text-gray-400 hover:text-gray-600 px-4 py-2">Close</button>
                </div>
            </div>
        </div>
    );
};

export default ManageServicesModal;
