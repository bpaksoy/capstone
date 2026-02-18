import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { baseUrl } from '../shared';
import { useUser, useAuth } from '@clerk/clerk-react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
    const { getToken, signOut } = useAuth();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loggedIn, setLoggedIn] = useState(false);
    const [appLoading, setAppLoading] = useState(true);
    const [friendRequests, setFriendRequests] = useState([]);
    const [forceFetchFriendRequests, setForceFetchFriendRequests] = useState(false);

    // Sync Clerk Session with Backend
    useEffect(() => {
        const syncUser = async () => {
            if (!isClerkLoaded) return;

            if (clerkUser) {
                setLoading(true);
                try {
                    // 1. Get Clerk Token
                    const token = await getToken();

                    // 2. Exchange for Django Token (or verify session)
                    const response = await axios.post(`${baseUrl}api/login/clerk/`, { token });

                    if (response.data.access) {
                        localStorage.setItem('access', response.data.access);
                        localStorage.setItem('refresh', response.data.refresh);
                        setLoggedIn(true);

                        // 3. Fetch Full Django User Profile
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
    }, [clerkUser, isClerkLoaded, getToken]);

    const handleLogout = useCallback(async () => {
        await signOut();
        localStorage.clear();
        setUser(null);
        setLoggedIn(false);
        setAppLoading(false);
        setFriendRequests([]);
    }, [signOut]);

    // Legacy function support (can be deprecated later)
    const updateLoggedInStatus = async (isLoggedIn) => {
        // This is now handled by Clerk's state
        if (!isLoggedIn) {
            handleLogout();
        }
    };

    // No need for explicit fetchUser exposed anymore, it's automatic.
    // But we keep the function signature if other components call it manually.
    const fetchUser = useCallback(async () => {
        // No-op or re-trigger sync if needed
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
        if (!loggedIn || !token) return;

        try {
            const response = await axios.get(`${baseUrl}api/friend-requests/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setFriendRequests(response.data);
        } catch (error) {
            console.error("Error fetching friend requests:", error);
        }
    }, [loggedIn]);

    useEffect(() => {
        if (loggedIn && (forceFetchFriendRequests || friendRequests.length === 0)) {
            fetchFriendRequests();
            setForceFetchFriendRequests(false);
        }
    }, [loggedIn, forceFetchFriendRequests, fetchFriendRequests, friendRequests.length]);

    useEffect(() => {
        if (loggedIn && (forceFetchFriendRequests || friendRequests.length === 0)) {
            fetchFriendRequests();
            setForceFetchFriendRequests(false);
        }
    }, [loggedIn, forceFetchFriendRequests, fetchFriendRequests, friendRequests.length]);

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