import React, { useEffect } from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../UserProvider/UserProvider';
import Loader from '../components/Loader';

function PrivateRoute() {
    const { loggedIn, appLoading } = useCurrentUser();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!appLoading && !loggedIn) {
            navigate("/login", {
                state: {
                    previousUrl: location.pathname
                }
            });
        }
    }, [appLoading, loggedIn, navigate, location.pathname]);

    if (appLoading) {
        return <Loader text="Authenticating secure session..." />;
    }

    return loggedIn ? <Outlet /> : <Navigate to="/login" state={{ previousUrl: location }} />;
}

export default PrivateRoute;