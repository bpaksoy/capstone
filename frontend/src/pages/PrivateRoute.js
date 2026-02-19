import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useCurrentUser } from '../UserProvider/UserProvider';
import Loader from '../components/Loader';

function PrivateRoute() {
    const { loggedIn, appLoading } = useCurrentUser();
    const location = useLocation();

    if (appLoading) {
        return <Loader text="Checking whether the user is authenticated..." />;
    }

    return loggedIn ? <Outlet /> : <Navigate to="/login" state={{ previousUrl: location.pathname }} replace />;
}

export default PrivateRoute;