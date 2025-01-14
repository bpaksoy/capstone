import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { baseUrl } from '../shared';

const UserContext = createContext();
 
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loggedIn, setLoggedIn] = useState(false);
    const [forceFetch, setForceFetch] = useState(false);
    const [refreshTokenInterval, setRefreshTokenInterval] = useState(null);
    const [appLoading, setAppLoading] = useState(true);
    const [forceFetchFriendRequests, setForceFetchFriendRequests] = useState(false);
    const [friendRequests, setFriendRequests] = useState([]);

    const fetchUser = useCallback(async () => {
        setLoading(true);
        setAppLoading(true);
        try {
            const token = localStorage.getItem('access');
            if (token) {
                const response = await axios.get(`${baseUrl}api/user/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUser(response.data);
                setLoggedIn(true);
            } else {
                setUser(null);
                setLoggedIn(false);
            }
        } catch (error) {
            console.error("Error fetching user:", error);
            setUser(null);
            setLoggedIn(false);
        } finally {
            setLoading(false);
            setForceFetch(false);
            setAppLoading(false);
        }
    }, [appLoading]);

    useEffect(() => {
        if (forceFetch) {
            fetchUser();
        }
    }, [forceFetch, fetchUser]);

    const refreshTokens = async () => {
        if (localStorage.getItem('refresh')) {
            try {
                const response = await fetch(`${baseUrl}api/token/refresh/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh: localStorage.getItem('refresh') }),
                });
                const data = await response.json();
                localStorage.setItem('access', data.access);
                localStorage.setItem('refresh', data.refresh);
                setForceFetch(true); // Trigger a user data fetch after successful refresh
            } catch (error) {
                console.error("Error refreshing tokens:", error);
                handleLogout();
            }
        }
    };

    useEffect(() => {
        const minute = 1000 * 60;
        refreshTokens(); // Initial refresh
        const intervalId = setInterval(refreshTokens, minute * 3);
        setRefreshTokenInterval(intervalId); //Store interval in state
        return () => clearInterval(intervalId); //Clean up interval
    }, []);


    const handleLogout = () => {
        clearInterval(refreshTokenInterval);
        localStorage.clear();
        setUser(null);
        setLoggedIn(false);
    };

    const updateLoggedInStatus = (isLoggedIn) => {
        setLoggedIn(isLoggedIn);
        setForceFetch(true);
    };

    const fetchFriendRequests = useCallback(async () => {
        try {
            if (loggedIn) {
                const response = await axios.get(`${baseUrl}api/friend-requests/`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('access')}` },
                });
                setFriendRequests(response.data);
            }
        } catch (error) {
            console.error("Error fetching friend requests:", error);
        }
    }, [loggedIn]);

    useEffect(() => {
        if (forceFetchFriendRequests) {
            fetchFriendRequests();
        }
    }, [forceFetchFriendRequests, fetchFriendRequests]);


    const value = {
        user, loading, loggedIn, fetchUser, handleLogout, updateLoggedInStatus, appLoading, forceFetchFriendRequests,
        setForceFetchFriendRequests, friendRequests, setFriendRequests
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

export const useCurrentUser = () => useContext(UserContext);