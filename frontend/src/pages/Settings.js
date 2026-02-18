import React, { useState } from 'react';
import { useCurrentUser } from '../UserProvider/UserProvider';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { baseUrl } from '../shared';
import { LockClosedIcon, GlobeAltIcon, ShieldCheckIcon, XMarkIcon, UserIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
    const { user: djangoUser, fetchUser } = useCurrentUser();
    const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
    const [isUpdating, setIsUpdating] = useState(false);
    const [username, setUsername] = useState("");
    const [updateMessage, setUpdateMessage] = useState({ text: "", type: "" });
    const navigate = useNavigate();

    // Sync local state when Clerk loads
    React.useEffect(() => {
        if (isClerkLoaded && clerkUser?.username) {
            setUsername(clerkUser.username);
        }
    }, [isClerkLoaded, clerkUser]);

    const handleUpdateUsername = async (e) => {
        e.preventDefault();
        if (!isClerkLoaded || !clerkUser) return;

        setIsUpdating(true);
        setUpdateMessage({ text: "", type: "" });
        try {
            await clerkUser.update({ username: username.trim() });
            setUpdateMessage({ text: "Username updated successfully! You can now log in with it.", type: "success" });
            fetchUser();
        } catch (error) {
            console.error('Error updating username:', error);
            setUpdateMessage({
                text: error.errors?.[0]?.message || 'Failed to update username. It might already be taken.',
                type: "error"
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const togglePrivacy = async (newValue) => {
        setIsUpdating(true);
        try {
            await axios.patch(
                `${baseUrl}api/user/update/`,
                { is_private: newValue },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('access')}`,
                    },
                }
            );
            await fetchUser();
        } catch (error) {
            console.error('Error updating privacy status:', error);
            alert('Failed to update privacy settings.');
        } finally {
            setIsUpdating(false);
        }
    };

    if (!isClerkLoaded) return <div className="p-8 text-center text-gray-500">Checking account status...</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-100 relative">
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute top-6 right-6 text-teal-100 hover:text-white transition-colors z-10 p-2 hover:bg-white/10 rounded-full"
                        title="Close Settings"
                    >
                        <XMarkIcon className="w-8 h-8" />
                    </button>

                    <div className="bg-primary px-8 py-10 text-white">
                        <h1 className="text-3xl font-extrabold flex items-center gap-3">
                            <ShieldCheckIcon className="w-10 h-10" />
                            Account Settings
                        </h1>
                        <p className="mt-2 text-teal-100 opacity-90"> Manage your identity and privacy preferences.</p>
                    </div>

                    <div className="p-8 space-y-10">
                        {/* Profile Section */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <UserIcon className="w-6 h-6 text-primary" />
                                Profile Identity
                            </h2>
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                                <form onSubmit={handleUpdateUsername}>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Username (used for login)</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="Set your username"
                                            className="flex-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary border border-gray-300 rounded-xl py-2 px-4 transition-all"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={isUpdating || username === clerkUser?.username}
                                            className="bg-primary text-white font-bold py-2 px-6 rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-all shadow-md"
                                        >
                                            {isUpdating ? "Saving..." : "Update"}
                                        </button>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500 italic">
                                        {clerkUser?.username
                                            ? `✅ Your official login username is currently: ${clerkUser.username}`
                                            : "⚠️ You haven't set an official username yet. Set one here to enable username-based login."}
                                    </p>
                                    {updateMessage.text && (
                                        <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${updateMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                                            {updateMessage.text}
                                        </div>
                                    )}
                                </form>
                            </div>
                        </section>

                        {/* Privacy Section */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <LockClosedIcon className="w-6 h-6 text-primary" />
                                Privacy Controls
                            </h2>

                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 transition-all hover:border-primary/30">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            {djangoUser?.is_private ? "Private Profile" : "Public Profile"}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                            {djangoUser?.is_private
                                                ? "Only your accepted connections can see your posts, comments, and detailed activity."
                                                : "Anyone on the platform can see your posts and activity."
                                            }
                                        </p>
                                    </div>

                                    <div className="flex items-center">
                                        <button
                                            onClick={() => togglePrivacy(!djangoUser?.is_private)}
                                            disabled={isUpdating}
                                            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${djangoUser?.is_private ? 'bg-primary' : 'bg-gray-300'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${djangoUser?.is_private ? 'translate-x-8' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className={`p-4 rounded-xl border-2 transition-all ${!djangoUser?.is_private ? 'border-primary bg-teal-50/50' : 'border-transparent bg-white shadow-sm hover:border-gray-200'}`}>
                                        <GlobeAltIcon className={`w-8 h-8 mb-2 ${!djangoUser?.is_private ? 'text-primary' : 'text-gray-400'}`} />
                                        <h4 className="font-bold text-gray-800">Public</h4>
                                        <p className="text-xs text-gray-500 mt-1">Maximum visibility. Best for building a professional network.</p>
                                    </div>
                                    <div className={`p-4 rounded-xl border-2 transition-all ${djangoUser?.is_private ? 'border-primary bg-teal-50/50' : 'border-transparent bg-white shadow-sm hover:border-gray-200'}`}>
                                        <LockClosedIcon className={`w-8 h-8 mb-2 ${djangoUser?.is_private ? 'text-primary' : 'text-gray-400'}`} />
                                        <h4 className="font-bold text-gray-800">Private</h4>
                                        <p className="text-xs text-gray-500 mt-1">Restricted to connections. Best for personal privacy.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="flex flex-col items-center gap-4 pt-6 border-t border-gray-100">
                            <button
                                onClick={() => navigate('/profile')}
                                className="text-primary hover:text-teal-700 font-bold text-sm transition-colors"
                            >
                                ← Return to Profile
                            </button>
                            <div className="italic text-gray-400 text-xs text-center">
                                Last updated: {new Date().toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
