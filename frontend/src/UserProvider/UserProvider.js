import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { baseUrl } from '../shared';

// Create the context
export const UserContext = createContext();

// Provide user information within your application
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    // console.log("USER IN USERPROVIDER", user);
    const fetchUser = async () => {
        const accessToken = localStorage.getItem('access')
        try {
            const response = await axios.get('http://localhost:8000/api/user/', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
            });

            setUser(response.data);
        } catch (error) {
            console.error(error);
        }
    };


    return (
        <UserContext.Provider value={{ user, fetchUser }}>
            {children}
        </UserContext.Provider>
    );
}


export const useCurrentUser = () => useContext(UserContext);