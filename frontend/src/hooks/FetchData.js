import { useState, useCallback } from 'react';
import axios from 'axios';


const useFetch = (options = {}, token) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async (url) => {
        try {
            setLoading(true);
            const res = await axios(url, {
                ...options,
                headers: {
                    ...options.headers,
                    Authorization: `Bearer ${token}`,
                },
            });
            setData(res.data);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [options, token]);


    return { data, loading, error, fetchData };
};

export default useFetch;