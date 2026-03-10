import React from 'react';

const Loader = ({ text = "Loading Content...", fullScreen = true }) => {
    return (
        <div className={`flex justify-center items-center ${fullScreen ? 'h-screen' : 'py-20'} bg-primary w-full`}>
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
