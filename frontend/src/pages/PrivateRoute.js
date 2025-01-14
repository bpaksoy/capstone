import React, { useEffect } from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../UserProvider/UserProvider';

function PrivateRoute() {
    const { loggedIn, appLoading } = useCurrentUser();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!appLoading) {
            if (!loggedIn) {
                navigate("/login", {
                    state: {
                        previousUrl: location.pathname
                    }
                });
            }
        }
    }, [appLoading, loggedIn, navigate, location.pathname]);




    // if (appLoading) {
    //     return (
    //         <div className="flex justify-center items-center h-screen">
    //             <div className="spinner border-4 border-t-4 border-primary rounded-full h-16 w-16 animate-spin"></div>
    //         </div>
    //     );
    // }

    return loggedIn ? <Outlet /> : <Navigate to="/login" state={{ previousUrl: location }} />;

}

export default PrivateRoute;