import { useState, useEffect } from 'react';
import axios from 'axios';
import { useCurrentUser } from '../UserProvider/UserProvider';


const useLike = (contentType, objectId, token, refetchComments) => {

    const { user, fetchUser } = useCurrentUser();
    useEffect(() => {
        fetchUser();
    }, [])


    const [isLiked, setIsLiked] = useState(false);
    //console.log("isLiked", isLiked)
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const baseUrl = 'http://127.0.0.1:8000/api/';

    useEffect(() => {
        const checkLike = async () => {
            if (user?.id) { //Only run if user.id is available
                try {
                    setLoading(true);
                    const response = await axios.get(`${baseUrl}likes/`, {
                        params: {
                            content_type: contentType,
                            object_id: objectId,
                            user: user.id,
                        },
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    setIsLiked(response.data.is_liked);
                } catch (err) {
                    setError(err);
                } finally {
                    setLoading(false);
                }
            }
        };
        checkLike();
    }, [user?.id, contentType, objectId, token]);

    const handleLike = async () => {
        console.log("contentType", contentType, "objectId", objectId);
        try {
            setLoading(true);
            await axios.post(`${baseUrl}likes/create/`, { content_type: contentType, object_id: objectId }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setIsLiked(true);
            refetchComments();

        } catch (error) {
            setError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnlike = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${baseUrl}likes/`, {
                params: {
                    content_type: contentType,
                    object_id: objectId,
                    user: user.id,
                },
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const likeId = response.data.like_id;

            if (!likeId) {
                setIsLiked(false);
                return;
            }

            await axios.delete(`${baseUrl}likes/${likeId}/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setIsLiked(false);
            refetchComments();
        } catch (error) {
            setError(error);
        } finally {
            setLoading(false);
        }
    };

    return { isLiked, loading, error, handleLike, handleUnlike };
};


export default useLike;