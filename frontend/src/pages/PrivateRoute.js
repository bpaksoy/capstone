import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useCurrentUser } from '../UserProvider/UserProvider';

function PrivateRoute() {
    const { loggedIn } = useCurrentUser();
    return loggedIn ? <Outlet /> : <Navigate to="/login" />;
}

export default PrivateRoute;