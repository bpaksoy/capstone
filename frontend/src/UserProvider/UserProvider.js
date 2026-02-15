import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { baseUrl } from '../shared';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loggedIn, setLoggedIn] = useState(false);
    const [appLoading, setAppLoading] = useState(true);
    const [friendRequests, setFriendRequests] = useState([]);
    const [forceFetchFriendRequests, setForceFetchFriendRequests] = useState(false);

    const fetchUser = useCallback(async () => {
        const token = localStorage.getItem('access');
        if (!token) {
            setUser(null);
            setLoggedIn(false);
            setAppLoading(false);
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(`${baseUrl}api/user/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUser(response.data);
            setLoggedIn(true);
        } catch (error) {
            console.error("Error fetching user, attempting refresh:", error);
            // If fetching user fails, try refreshing the token
            const refreshed = await refreshTokens();
            if (!refreshed) {
                setUser(null);
                setLoggedIn(false);
            }
        } finally {
            setLoading(false);
            setAppLoading(false);
        }
    }, []);

    const refreshTokens = async () => {
        const refresh = localStorage.getItem('refresh');
        if (!refresh) return false;

        try {
            const response = await fetch(`${baseUrl}api/token/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('access', data.access);
                if (data.refresh) localStorage.setItem('refresh', data.refresh);

                // Fetch user with new token
                const userResponse = await axios.get(`${baseUrl}api/user/`, {
                    headers: { Authorization: `Bearer ${data.access}` },
                });
                setUser(userResponse.data);
                setLoggedIn(true);
                return true;
            } else {
                handleLogout();
                return false;
            }
        } catch (error) {
            console.error("Error refreshing tokens:", error);
            handleLogout();
            return false;
        }
    };

    const handleLogout = useCallback(() => {
        localStorage.clear();
        setUser(null);
        setLoggedIn(false);
        setAppLoading(false);
        setFriendRequests([]); // Clear friend requests
    }, []);

    const updateLoggedInStatus = async (isLoggedIn) => {
        setLoggedIn(isLoggedIn);
        if (isLoggedIn) {
            await fetchUser();
        } else {
            handleLogout();
        }
    };

    // Initial check on mount
    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    // Token rotation interval
    useEffect(() => {
        const intervalId = setInterval(() => {
            if (localStorage.getItem('refresh')) {
                refreshTokens();
            }
        }, 1000 * 60 * 10); // Refresh every 10 minutes

        return () => clearInterval(intervalId);
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