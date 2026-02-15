import React, { useEffect } from 'react';
import useLike from '../hooks/UseLike';

const LikeButton = ({ contentType, objectId, onLikeStatusChange, refetchComments, className, children }) => {
    const token = localStorage.getItem('access');
    const { isLiked, loading, error, handleLike, handleUnlike } = useLike(contentType, objectId, token, refetchComments);

    const handleClick = () => {
        if (isLiked) {
            handleUnlike();
            console.log("unlike clicked!");
        } else {
            handleLike();
        }
    };

    useEffect(() => {
        onLikeStatusChange(objectId, isLiked); // Update the like status in the parent component
    }, [isLiked, objectId]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    const buttonClass = className || "underline decoration-solid rounded hover:bg-gray-300 p-2";

    return (
        <button onClick={handleClick} className={buttonClass}>
            {children ? children : (isLiked ? 'Unlike' : 'Like')}
        </button>
    );
};

export default LikeButton;