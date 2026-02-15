import React from 'react';

const Loader = ({ text = "Loading Bookmarks..." }) => {
    return (
        <div className="flex justify-center items-center h-screen bg-primary">
            <div className="loader-container">
                <div className="modern-loader">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <p className="loader-text">{text}</p>
            </div>
        </div>
    );
};

export default Loader;
