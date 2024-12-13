import { useContext, useEffect, useState } from 'react';
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { NavLink } from 'react-router-dom';
import { images } from "../constants";
import { useCurrentUser } from '../UserProvider/UserProvider';
import { baseUrl } from '../shared';
import axios from 'axios';

const navigation = [
    { name: 'Home', href: '/', current: true },
    { name: 'Bookmarks', href: '/bookmarks', current: false },
    { name: 'Trending', href: '/trending', current: false },
    { name: 'Profile', href: '/profile', current: false },
]

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}


const Header = (props) => {
    const { user, handleLogout, loading, loggedIn, forceFetchFriendRequests, setForceFetchFriendRequests } = useCurrentUser();
    const [friendRequestCount, setFriendRequestCount] = useState(0);
    //console.log("friendRequestCount", friendRequestCount);
    const [acceptedFriendRequestCount, setAcceptedFriendRequestCount] = useState(0);
    //console.log("acceptedFriendRequestCount", acceptedFriendRequestCount);
    const [showPopup, setShowPopup] = useState(false);
    const [friendRequests, setFriendRequests] = useState([]);
    //console.log("friendRequests", friendRequests);

    useEffect(() => {
        const fetchFriendRequestCount = async () => {
            try {
                if (loggedIn) {
                    const response = await axios.get(`${baseUrl}api/friend-request-count/`, {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('access')}`,
                        },
                    });
                    setFriendRequestCount(response.data.pending_count);
                    setAcceptedFriendRequestCount(response.data.accepted_count);
                }
            } catch (error) {
                console.error('Error fetching friend request count:', error);
            }
        };

        fetchFriendRequestCount();
    }, [loggedIn, forceFetchFriendRequests]);

    useEffect(() => {
        const fetchFriendRequests = async () => {
            try {
                if (loggedIn) {
                    const response = await axios.get(`${baseUrl}api/friend-requests/`, {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('access')}`,
                        },
                    });
                    setFriendRequests(response.data);

                }
            } catch (error) {
                console.error("Error fetching friend requests:", error);
            }
        };
        fetchFriendRequests();
    }, [loggedIn, forceFetchFriendRequests]);


    useEffect(() => {
        setFriendRequestCount(friendRequests.filter(request => request.status === 'pending').length);
    }, [friendRequests]);


    const handleClosePopup = async () => {
        setShowPopup(false);
        await Promise.all(friendRequests.map(async (request) => {
            if (request.status === 'accepted') {
                await axios.put(`${baseUrl}api/friend-requests/${request.id}/read/`, {}, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('access')}`,
                    },
                });
            }
        }));
        setAcceptedFriendRequestCount(0);
    };


    return (
        <>
            <Disclosure as="nav" className="bg-gray-800">
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
                                <img
                                    alt="Your Company"
                                    src={images.logo6}
                                    className="h-8 w-auto"

                                />
                            </div>
                            <div className="hidden sm:ml-6 sm:block">
                                <div className="flex space-x-4">
                                    {navigation.map((item) => (
                                        <NavLink
                                            key={item.name}
                                            to={item.href}
                                            aria-current={item.current ? 'page' : undefined}
                                            /* className={classNames(
                                                item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                                                'rounded-md px-3 py-2 text-sm font-medium',
                                            )} */
                                            className={({ isActive }) => {
                                                return classNames(
                                                    isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                                                    'rounded-md px-3 py-2 text-sm font-medium',
                                                )
                                            }}
                                        >
                                            {item.name}
                                        </NavLink>
                                    ))}
                                    {loggedIn ?
                                        <NavLink to={'/login'}
                                            onClick={() => {
                                                handleLogout();
                                                console.log("logout");

                                            }}
                                            className="px-3 py-2 rounded-md text-sm font-medium no-underline text-gray-300 hover:text-white">
                                            Logout
                                        </NavLink>
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
                            <button
                                type="button"
                                onClick={() => setShowPopup(!showPopup)}
                                className="relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                            >
                                <span className="absolute -inset-1.5" />
                                <span className="sr-only">View notifications</span>
                                <BellIcon aria-hidden="true" className="h-6 w-6" />
                                {friendRequestCount > 0 && (
                                    <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-white">
                                        {friendRequestCount}
                                    </span>
                                )}
                                {acceptedFriendRequestCount > 0 && (
                                    <span className="absolute top-0 right-5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-600 text-white">
                                        {acceptedFriendRequestCount}
                                    </span>
                                )}
                            </button>
                            {showPopup && (
                                <div className="absolute z-50 bg-white rounded shadow-lg p-4 top-12 right-2">
                                    {friendRequests.map((request) => (
                                        <div key={request.id} className="flex justify-between items-center mb-2">
                                            <p className="text-gray-800 font-medium">
                                                {request.user1.id === user.id ?  // Check if the current user is the sender or receiver of the friend request
                                                    (request.status === 'pending' ? `Friend request sent to ${request.user2.username}` : `Friend request sent to ${request.user2.username} accepted`)
                                                    : (request.status === 'pending' ? `Friend request from ${request.user1.username}` : `Friend request from ${request.user1.username} accepted`)
                                                }
                                            </p>
                                        </div>
                                    ))}
                                    <button onClick={handleClosePopup} className="mt-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-1 px-2 rounded">Close</button>
                                </div>
                            )}

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
                                    className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                                >
                                    <MenuItem>
                                        <a href="#" className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100">
                                            Your Profile
                                        </a>
                                    </MenuItem>
                                    <MenuItem>
                                        <a href="#" className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100">
                                            Settings
                                        </a>
                                    </MenuItem>
                                    <MenuItem>
                                        {loggedIn ?
                                            <a href={'/login'}
                                                onClick={() => {
                                                    handleLogout();
                                                    console.log("logout");
                                                }}
                                                className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100" >
                                                Logout
                                            </a> :
                                            <a href={'/login'}
                                                onClick={() => <NavLink to={'/login'} />}
                                                className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100" >
                                                Login
                                            </a>
                                        }
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
        </>

    )
}

export default Header;