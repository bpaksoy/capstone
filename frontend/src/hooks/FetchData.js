import { useState, useCallback, useRef } from 'react';
import axios from 'axios';


const useFetch = (options = {}, token) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Store token in a ref so fetchData stays stable across renders
    const tokenRef = useRef(token);
    tokenRef.current = token;

    const fetchData = useCallback(async (url, method, isBackground = false) => {
        try {
            if (!isBackground) setLoading(true);
            const headers = {};
            if (tokenRef.current && tokenRef.current !== 'null') {
                headers.Authorization = `Bearer ${tokenRef.current}`;
            }

            const res = await axios(url, {
                method,
                headers,
            });
            setData(res.data);
        } catch (err) {
            setError(err);
        } finally {
            if (!isBackground) setLoading(false);
        }
        // Empty deps: fetchData is now stable forever
    }, []);


    return { data, loading, error, fetchData };
};

export default useFetch;