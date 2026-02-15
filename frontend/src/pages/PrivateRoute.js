import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useCurrentUser } from '../UserProvider/UserProvider';
import Loader from '../components/Loader';


function PrivateRoute() {
    const { loggedIn, appLoading } = useCurrentUser();
    if (appLoading) {
        return <Loader text="Authenticating secure session..." />;
    }
    return loggedIn ? <Outlet /> : <Navigate to="/login" />;
}

export default PrivateRoute;