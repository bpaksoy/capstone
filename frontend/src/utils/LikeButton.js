import React from 'react';
import useLike from '../hooks/UseLike';

const LikeButton = ({ contentType, objectId, userId }) => {
    const token = localStorage.getItem('access');

    const { isLiked, loading, error, handleLike, handleUnlike } = useLike(contentType, objectId, token);

    console.log("isLiked inside the Like Button", isLiked);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div>
            {isLiked ? (
                <button onClick={handleUnlike}>Unlike</button>
            ) : (
                <button onClick={handleLike}>Like</button>
            )}
        </div>
    );
};

export default LikeButton;