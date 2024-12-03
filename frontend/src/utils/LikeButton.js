import React, { useEffect } from 'react';
import useLike from '../hooks/UseLike';

const LikeButton = ({ contentType, objectId, onLikeStatusChange, refetchComments }) => {
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

    return (
        <button onClick={handleClick} className="underline decoration-solid rounded hover:bg-gray-300 p-2">
            {isLiked ? 'Unlike' : 'Like'}
        </button>
    );
};

export default LikeButton;