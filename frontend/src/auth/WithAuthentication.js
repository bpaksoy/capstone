import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '../UserProvider/UserProvider';

const withAuthentication = (WrappedComponent) => {
    return (props) => {
        const { loading, loggedIn } = useCurrentUser();

        if (loading) {
            return <div>Loading...</div>; // Show a loading indicator
        }

        if (!loggedIn) {
            return <Navigate to="/login" replace state={{ from: props.location }} />;
        }

        return <WrappedComponent {...props} />;
    };
};

export default withAuthentication;