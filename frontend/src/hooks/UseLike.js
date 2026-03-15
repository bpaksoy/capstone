import { useState, useEffect } from 'react';
import axios from 'axios';
import { baseUrl as globalBaseUrl, getApiUrl } from '../shared';
import { useCurrentUser } from '../UserProvider/UserProvider';

const useLike = (contentType, objectId, token, refetchComments) => {

    const { user, fetchUser } = useCurrentUser();
    useEffect(() => {
        fetchUser();
    }, [])


    const [count, setCount] = useState(undefined);
    const [isLiked, setIsLiked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);


    const checkLike = async () => {
        if (user?.id) { //Only run if user.id is available
            try {
                setLoading(true);
                const response = await axios.get(getApiUrl('api/likes/'), {
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
                setCount(response.data.count || 0);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        checkLike();
    }, [user?.id, contentType, objectId, token]);

    const handleLike = async () => {
        try {
            setLoading(true);
            await axios.post(getApiUrl('api/likes/create/'), { content_type: contentType, object_id: objectId }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setIsLiked(true);
            setCount(prev => (prev !== undefined ? prev + 1 : 1));
            if (contentType === 'comment') { // Only refetch if it's a comment
                refetchComments(objectId);
            }
        } catch (error) {
            setError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnlike = async () => {
        try {
            setLoading(true);
            const response = await axios.get(getApiUrl('api/likes/'), {
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

            await axios.delete(getApiUrl(`api/likes/${likeId}/`), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setIsLiked(false);
            setCount(prev => (prev !== undefined ? Math.max(0, prev - 1) : 0));
            if (contentType === 'comment') { // Only refetch if it's a comment
                refetchComments(objectId);
            }
        } catch (error) {
            setError(error);
        } finally {
            setLoading(false);
        }
    };

    return { isLiked, count, loading, error, handleLike, handleUnlike };
};


export default useLike;