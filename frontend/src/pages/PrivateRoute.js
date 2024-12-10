import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useCurrentUser } from '../UserProvider/UserProvider';


function PrivateRoute() {
    const { loggedIn, appLoading } = useCurrentUser();
    if (appLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="spinner border-4 border-t-4 border-primary rounded-full h-16 w-16 animate-spin"></div>
            </div>
        );
    }
    return loggedIn ? <Outlet /> : <Navigate to="/login" />;
}

export default PrivateRoute;