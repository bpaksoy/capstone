import { useState, useEffect } from 'react';
import axios from 'axios';
import { useCurrentUser } from '../UserProvider/UserProvider';

const useLike = (contentType, objectId, token) => {

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
        try {
            setLoading(true);
            await axios.post(`${baseUrl}likes/create`, { content_type: contentType, object_id: objectId }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setIsLiked(true);
        } catch (error) {
            setError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnlike = async () => {
        try {
            setLoading(true);
            //Find the id of the like
            const response = await axios.get(`${baseUrl}likes/`, {
                params: {
                    content_type: contentType,
                    object_id: objectId,
                    user: user?.id,
                },
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const likeId = response.data[0].id;

            await axios.delete(`${baseUrl}likes/${likeId}/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setIsLiked(false);
        } catch (error) {
            setError(error);
        } finally {
            setLoading(false);
        }
    };

    return { isLiked, loading, error, handleLike, handleUnlike };
};


export default useLike;