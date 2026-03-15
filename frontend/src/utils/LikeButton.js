import React, { useEffect } from 'react';
import useLike from '../hooks/UseLike';

const LikeButton = ({ contentType, objectId, onLikeStatusChange, refetchComments, className, children }) => {
    const token = localStorage.getItem('access');
    const { isLiked, count, loading, error, handleLike, handleUnlike } = useLike(contentType, objectId, token, refetchComments);

    const handleClick = (e) => {
        if (e) e.stopPropagation();
        if (isLiked) {
            handleUnlike();
            console.log("unlike clicked!");
        } else {
            handleLike();
        }
    };

    useEffect(() => {
        if (onLikeStatusChange) {
            onLikeStatusChange(objectId, isLiked, count); // Update the like status in the parent component
        }
    }, [isLiked, count, objectId, onLikeStatusChange]);

    const buttonClass = className || "underline decoration-solid rounded hover:bg-gray-300 p-2";

    const renderContent = () => {
        if (typeof children === 'function') {
            return children({ isLiked, count, loading, error });
        }
        return children ? children : (isLiked ? 'Unlike' : 'Like');
    };

    if (loading) return (
        <button type="button" disabled className={`${buttonClass} opacity-50 cursor-wait`}>
            {renderContent()}
        </button>
    );

    if (error) return (
        <button type="button" disabled className={`${buttonClass} opacity-50 cursor-not-allowed`}>
            {renderContent()}
        </button>
    );

    return (
        <button type="button" onClick={handleClick} className={buttonClass}>
            {renderContent()}
        </button>
    );
};

export default LikeButton;