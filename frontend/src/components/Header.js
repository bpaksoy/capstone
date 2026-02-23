import { useContext, useEffect, useState } from 'react';
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Bars3Icon, BellIcon, XMarkIcon, UserIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, ArrowLeftOnRectangleIcon, AcademicCapIcon, ShieldCheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { NavLink, useNavigate } from 'react-router-dom';
import { images } from "../constants";
import { useCurrentUser } from '../UserProvider/UserProvider';
import { baseUrl } from '../shared';
import axios from 'axios';
import SearchProfilesModal from './SearchProfilesModal';

const navigation = [
    { name: 'Home', href: '/', current: true },
    { name: 'Bookmarks', href: '/bookmarks', current: false },
    { name: 'Trending', href: '/trending', current: false },
    { name: 'Profile', href: '/profile', current: false },
    { name: 'Messages', href: '/messages', current: false },
    { name: 'Advanced', href: '/detailed-search', current: false },

]

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}


const Header = (props) => {
    const navigate = useNavigate();
    const { user, handleLogout, loading, loggedIn, forceFetchFriendRequests } = useCurrentUser();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showBadge, setShowBadge] = useState(false);
    const [lastCount, setLastCount] = useState(0);

    const fetchNotifications = async () => {
        if (!loggedIn) return;
        try {
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem('access')}` } };
            const [notifsRes, countRes] = await Promise.all([
                axios.get(`${baseUrl}api/notifications/`, config),
                axios.get(`${baseUrl}api/notifications/count/`, config)
            ]);

            const newCount = countRes.data.unread_count;
            setNotifications(notifsRes.data);
            setUnreadCount(newCount);

            // Show badge only when it's the first fetch or count increased
            if (newCount > 0 && newCount !== lastCount) {
                setShowBadge(true);
                setLastCount(newCount);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Refresh every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [loggedIn, forceFetchFriendRequests]);

    // Handle the "Stand there" issue: hide badge after a delay
    useEffect(() => {
        if (showBadge) {
            const timer = setTimeout(() => {
                setShowBadge(false);
            }, 8000); // 8 seconds visibility
            return () => clearTimeout(timer);
        }
    }, [showBadge]);

    const markAsRead = async (id = null) => {
        try {
            await axios.post(`${baseUrl}api/notifications/mark-read/`,
                { notification_id: id },
                { headers: { Authorization: `Bearer ${localStorage.getItem('access')}` } }
            );
            fetchNotifications();
            setShowBadge(false);
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const getNotificationMessage = (notif) => {
        const sender = notif.sender.username;
        switch (notif.notification_type) {
            case 'like': return <><b>{sender}</b> liked your activity</>;
            case 'comment': return <><b>{sender}</b> commented on your post</>;
            case 'friend_request': return <><b>{sender}</b> sent you a connection request</>;
            case 'accepted_request': return <><b>{sender}</b> accepted your connection request</>;
            case 'direct_message': return <><b>{sender}</b> sent you a private message</>;
            default: return <>New activity from <b>{sender}</b></>;
        }
    };

    return (
        <>
            <Disclosure as="nav" className="bg-gray-800 relative z-50">
                <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
                    <div className="relative flex h-16 items-center justify-between">
                        <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                            {/* Mobile menu button*/}
                            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                                <span className="absolute -inset-0.5" />
                                <span className="sr-only">Open main menu</span>
                                <Bars3Icon aria-hidden="true" className="block h-6 w-6 group-data-[open]:hidden" />
                                <XMarkIcon aria-hidden="true" className="hidden h-6 w-6 group-data-[open]:block" />
                            </DisclosureButton>
                        </div>
                        <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                            <div className="flex flex-shrink-0 items-center">
                                <NavLink to="/" onClick={() => {
                                    if (window.location.pathname === '/') {
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                        window.dispatchEvent(new Event('resetHomeView'));
                                    }
                                }}>
                                    <img src={images.wormLogoFull} alt="Worm" className="h-8 w-auto" />
                                </NavLink>
                            </div>
                            <div className="hidden sm:ml-6 sm:block">
                                <div className="flex space-x-4">
                                    {navigation.map((item) => (
                                        <NavLink
                                            key={item.name}
                                            to={item.href}
                                            onClick={() => {
                                                if (window.location.pathname === item.href) {
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    if (item.href === '/') {
                                                        window.dispatchEvent(new Event('resetHomeView'));
                                                    }
                                                }
                                            }}
                                            aria-current={item.current ? 'page' : undefined}
                                            className={({ isActive }) => {
                                                return classNames(
                                                    isActive ? 'bg-gray-900 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                                                    'rounded-md px-3 py-2 text-sm font-medium transition-all duration-300',
                                                )
                                            }}
                                        >
                                            {item.name}
                                        </NavLink>
                                    ))}
                                    {loggedIn ?
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setIsLogoutModalOpen(true);
                                            }}
                                            className="px-3 py-2 rounded-md text-sm font-medium no-underline text-gray-300 hover:text-white cursor-pointer"
                                        >
                                            Logout
                                        </button>
                                        :
                                        <NavLink to={'/login'}
                                            className="px-3 py-2 rounded-md text-sm font-medium no-underline text-gray-300 hover:text-white">
                                            Login
                                        </NavLink>
                                    }
                                </div>
                            </div>
                        </div>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">

                            {/* Profile Search Button */}
                            <button
                                onClick={() => setIsSearchModalOpen(true)}
                                className="relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 mr-3"
                            >
                                <span className="sr-only">Search profiles</span>
                                <MagnifyingGlassIcon aria-hidden="true" className="h-6 w-6" />
                            </button>

                            {/* Unified Notifications Menu */}
                            <Menu as="div" className="relative">
                                <div>
                                    <MenuButton
                                        onClick={() => setShowBadge(false)}
                                        className="relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                                    >
                                        <span className="sr-only">View notifications</span>
                                        <BellIcon aria-hidden="true" className="h-6 w-6" />
                                        {unreadCount > 0 && showBadge && (
                                            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-purple rounded-full border-2 border-gray-800 shadow-sm animate-pulse transition-opacity duration-500">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </MenuButton>
                                </div>
                                <MenuItems
                                    transition
                                    className="absolute right-0 z-[100] mt-3 w-80 origin-top-right rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-black ring-opacity-5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                                >
                                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-gray-900">Notifications</span>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={() => markAsRead()}
                                                className="text-[10px] font-bold text-primary hover:text-teal-700 uppercase tracking-wider"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>

                                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                        {notifications.length > 0 ? (
                                            notifications.map((notif) => (
                                                <MenuItem key={notif.id}>
                                                    <div
                                                        onClick={() => {
                                                            markAsRead(notif.id);
                                                            if (notif.notification_type === 'friend_request') {
                                                                navigate('/profile');
                                                            } else if (notif.notification_type === 'accepted_request') {
                                                                navigate(`/profile/${notif.sender?.id || ''}`);
                                                            } else if (notif.notification_type === 'direct_message') {
                                                                navigate('/messages', {
                                                                    state: {
                                                                        openChatWithUserId: notif.sender.id,
                                                                        openChatWithUserName: notif.sender.username
                                                                    }
                                                                });
                                                            } else if (notif.notification_type === 'like' || notif.notification_type === 'comment') {
                                                                navigate('/trending');
                                                            }
                                                        }}
                                                        className={`flex items-start gap-3 px-4 py-3 rounded-xl transition-all hover:bg-gray-50 cursor-pointer ${!notif.is_read ? 'bg-teal-50/30 border-l-2 border-primary' : ''}`}
                                                    >
                                                        <div className="flex-shrink-0 mt-1">
                                                            <div className={`p-2 rounded-lg ${!notif.is_read ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                                                                {notif.notification_type === 'like' && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a2 2 0 00-.8 1.6z" /></svg>}
                                                                {notif.notification_type === 'comment' && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>}
                                                                {(notif.notification_type === 'friend_request' || notif.notification_type === 'accepted_request') && <UserIcon className="w-4 h-4" />}
                                                                {notif.notification_type === 'direct_message' && (
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm text-gray-700 leading-tight">
                                                                {getNotificationMessage(notif)}
                                                            </p>
                                                            <span className="text-[10px] text-gray-400 font-medium mt-1 inline-block uppercase">
                                                                {new Date(notif.created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        {!notif.is_read && (
                                                            <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                                                        )}
                                                    </div>
                                                </MenuItem>
                                            ))
                                        ) : (
                                            <div className="py-8 text-center">
                                                <p className="text-sm text-gray-400 italic">No new activity</p>
                                            </div>
                                        )}
                                    </div>
                                </MenuItems>
                            </Menu>

                            {/* Profile dropdown */}
                            <Menu as="div" className="relative ml-3">
                                <div>
                                    <MenuButton className="relative flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                                        <span className="absolute -inset-1.5" />
                                        <span className="sr-only">Open user menu</span>
                                        {user &&
                                            <img
                                                alt=""
                                                src={user.image ? baseUrl + user.image : images.avatar}
                                                className="h-8 w-8 rounded-full enhanced-image"
                                            />
                                        }
                                    </MenuButton>
                                </div>
                                <MenuItems
                                    transition
                                    className="absolute right-0 z-[100] mt-3 w-64 origin-top-right rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-black ring-opacity-5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                                >
                                    {loggedIn && user && (
                                        <div className="px-4 py-3 border-b border-gray-100 mb-2">
                                            <p className="text-sm font-bold text-gray-900 truncate">{user.username}</p>
                                            <p className="text-xs font-medium text-gray-500 truncate">{user.email || 'Member'}</p>
                                        </div>
                                    )}

                                    <MenuItem>
                                        <NavLink
                                            to="/profile"
                                            className="group flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 rounded-xl transition-all hover:bg-teal-50 hover:text-primary data-[focus]:bg-teal-50 data-[focus]:text-primary"
                                        >
                                            <UserIcon className="h-4 w-4 text-gray-400 group-hover:text-primary" />
                                            Your Profile
                                        </NavLink>
                                    </MenuItem>

                                    {user?.role === 'college_staff' && (
                                        <MenuItem>
                                            <NavLink
                                                to="/college/portal"
                                                className="group flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 rounded-xl transition-all hover:bg-teal-50 hover:text-primary data-[focus]:bg-teal-50 data-[focus]:text-primary"
                                            >
                                                <AcademicCapIcon className="h-4 w-4 text-gray-400 group-hover:text-primary" />
                                                College Portal
                                            </NavLink>
                                        </MenuItem>
                                    )}

                                    <MenuItem>
                                        <NavLink
                                            to="/settings"
                                            className="group flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 rounded-xl transition-all hover:bg-teal-50 hover:text-primary data-[focus]:bg-teal-50 data-[focus]:text-primary"
                                        >
                                            <Cog6ToothIcon className="h-4 w-4 text-gray-400 group-hover:text-primary" />
                                            Settings
                                        </NavLink>
                                    </MenuItem>

                                    <div className="my-1 border-t border-gray-100"></div>

                                    <MenuItem>
                                        {loggedIn ? (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setIsLogoutModalOpen(true);
                                                }}
                                                className="group flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 rounded-xl transition-all hover:bg-red-50 data-[focus]:bg-red-50"
                                            >
                                                <ArrowRightOnRectangleIcon className="h-4 w-4 text-red-400 group-hover:text-red-600" />
                                                Logout
                                            </button>
                                        ) : (
                                            <NavLink
                                                to="/login"
                                                className="group flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-teal-600 rounded-xl transition-all hover:bg-teal-50 data-[focus]:bg-teal-50"
                                            >
                                                <ArrowLeftOnRectangleIcon className="h-4 w-4 text-teal-400 group-hover:text-teal-600" />
                                                Login
                                            </NavLink>
                                        )}
                                    </MenuItem>
                                </MenuItems>
                            </Menu>
                        </div>
                    </div>
                </div>

                <DisclosurePanel className="sm:hidden">
                    <div className="space-y-1 px-2 pb-3 pt-2">
                        {navigation.map((item) => (
                            <DisclosureButton
                                key={item.name}
                                as="a"
                                href={item.href}
                                aria-current={item.current ? 'page' : undefined}
                                className={classNames(
                                    item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                                    'block rounded-md px-3 py-2 text-base font-medium',
                                )}
                            >
                                {item.name}
                            </DisclosureButton>
                        ))}
                    </div>
                </DisclosurePanel>
            </Disclosure>
            <div className="bg-gray-300">
                <div className="max-w-7xl mx-auto  px-3">
                    {props.children}
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            {isLogoutModalOpen && (
                <div className="fixed inset-0 z-[100] overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        {/* Overlay */}
                        <div
                            className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75 backdrop-blur-sm"
                            aria-hidden="true"
                            onClick={() => setIsLogoutModalOpen(false)}
                        />

                        {/* Centering trick */}
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        {/* Modal Box */}
                        <div className="inline-block w-full max-w-md overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl sm:my-8" role="dialog" aria-modal="true">
                            <div className="px-8 pt-8 pb-6 bg-white text-center">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 mb-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-primary">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                    </svg>
                                </div>

                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Logout</h3>
                                <p className="text-gray-500 mb-8">
                                    Are you sure you want to log out of your account? You will need to sign in again to access your bookmarks and profile.
                                </p>

                                <div className="flex flex-col sm:flex-row-reverse gap-3">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            await handleLogout();
                                            setIsLogoutModalOpen(false);
                                            // The handleLogout clears state, but a hard redirect ensures a clean slate
                                            window.location.href = '/login';
                                        }}
                                        className="w-full sm:flex-1 py-3 px-4 text-sm font-bold text-white transition-all rounded-xl bg-primary hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg shadow-teal-100"
                                    >
                                        Yes, Log out
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsLogoutModalOpen(false)}
                                        className="w-full sm:flex-1 py-3 px-4 text-sm font-bold text-gray-700 transition-all bg-gray-100 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Search Modal */}
            <SearchProfilesModal
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
            />
        </>

    )
}

export default Header;