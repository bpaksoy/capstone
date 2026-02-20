import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { baseUrl } from '../shared';
import { useUser, useAuth } from '@clerk/clerk-react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
    const { getToken, signOut } = useAuth();

    // Read token ONCE at module init time (not during render) to avoid re-render loops
    const initialToken = useRef(localStorage.getItem('access'));
    const hasToken = !!initialToken.current;

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    // If token exists, assume logged-in immediately so PrivateRoute doesn't show Loader
    const [loggedIn, setLoggedIn] = useState(hasToken);
    // If token exists, skip the appLoading phase entirely
    const [appLoading, setAppLoading] = useState(!hasToken);
    const [friendRequests, setFriendRequests] = useState([]);
    const [forceFetchFriendRequests, setForceFetchFriendRequests] = useState(false);

    // Keep getToken stable via ref to prevent infinite re-auth loops
    const getTokenRef = useRef(getToken);
    useEffect(() => {
        getTokenRef.current = getToken;
    }, [getToken]);

    // If we already have a token, pre-load the user profile in the background
    // so the page has data immediately on refresh.
    useEffect(() => {
        const token = initialToken.current;
        if (token) {
            axios.get(`${baseUrl}api/user/`, {
                headers: { Authorization: `Bearer ${token}` },
            }).then(res => {
                setUser(res.data);
            }).catch(() => {
                // Token expired — clean up, Clerk will re-sync
                localStorage.removeItem('access');
                localStorage.removeItem('refresh');
                setLoggedIn(false);
                setAppLoading(false);
            });
        }
        // Run only on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync Clerk Session with Backend
    // Only re-runs when the actual Clerk user identity changes (not on every render)
    useEffect(() => {
        const syncUser = async () => {
            if (!isClerkLoaded) return;

            if (clerkUser) {
                setLoading(true);
                try {
                    const token = await getTokenRef.current();
                    const response = await axios.post(`${baseUrl}api/login/clerk/`, { token });

                    if (response.data.access) {
                        localStorage.setItem('access', response.data.access);
                        localStorage.setItem('refresh', response.data.refresh);
                        setLoggedIn(true);

                        const userResponse = await axios.get(`${baseUrl}api/user/`, {
                            headers: { Authorization: `Bearer ${response.data.access}` },
                        });
                        setUser(userResponse.data);
                    }
                } catch (error) {
                    console.error("Error syncing with backend:", error);
                    handleLogout();
                } finally {
                    setLoading(false);
                    setAppLoading(false);
                }
            } else {
                // User is signed out in Clerk
                setUser(null);
                setLoggedIn(false);
                setAppLoading(false);
                localStorage.removeItem('access');
                localStorage.removeItem('refresh');
            }
        };

        syncUser();
        // Only re-run when Clerk user identity or loaded state changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clerkUser?.id, isClerkLoaded]);

    // Cross-tab Synchronization:
    // Listen for tab focus/visibility and storage changes to keep session in sync
    useEffect(() => {
        const handleSync = () => {
            // If the document becomes visible, check if we need to re-sync
            if (document.visibilityState === 'visible') {
                const token = localStorage.getItem('access');
                const currentlyLoggedIn = !!token;

                // If there's a mismatch between state and storage, force a refresh or re-sync
                if (currentlyLoggedIn !== loggedIn) {
                    // One option is window.location.reload(), but we can just re-sync with backend
                    window.location.reload();
                }
            }
        };

        const handleStorageChange = (e) => {
            if (e.key === 'access' || e.key === 'refresh') {
                window.location.reload();
            }
        };

        window.addEventListener('visibilitychange', handleSync);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('visibilitychange', handleSync);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [loggedIn]);

    const handleLogout = useCallback(async () => {
        await signOut();
        localStorage.clear();
        setUser(null);
        setLoggedIn(false);
        setAppLoading(false);
        setFriendRequests([]);
    }, [signOut]);

    const updateLoggedInStatus = async (isLoggedIn) => {
        if (!isLoggedIn) handleLogout();
    };

    const fetchUser = useCallback(async () => {
        const token = localStorage.getItem('access');
        if (token) {
            const response = await axios.get(`${baseUrl}api/user/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUser(response.data);
        }
    }, []);

    const fetchFriendRequests = useCallback(async () => {
        const token = localStorage.getItem('access');
        if (!token) return;
        try {
            const response = await axios.get(`${baseUrl}api/friend-requests/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setFriendRequests(response.data);
        } catch (error) {
            console.error("Error fetching friend requests:", error);
        }
    }, []);

    // Fetch friend requests once when first logged in
    useEffect(() => {
        if (loggedIn) {
            fetchFriendRequests();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loggedIn]);

    // Fetch when forced (e.g., after accepting a request)
    useEffect(() => {
        if (forceFetchFriendRequests) {
            fetchFriendRequests();
            setForceFetchFriendRequests(false);
        }
    }, [forceFetchFriendRequests, fetchFriendRequests]);

    const value = {
        user,
        loading,
        loggedIn,
        fetchUser,
        handleLogout,
        updateLoggedInStatus,
        appLoading,
        friendRequests,
        setForceFetchFriendRequests
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

export const useCurrentUser = () => useContext(UserContext);