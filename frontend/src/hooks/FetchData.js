import { useState, useCallback, useRef } from 'react';
import axios from 'axios';


const useFetch = (options = {}, token) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Store token in a ref so fetchData stays stable across renders
    const tokenRef = useRef(token);
    tokenRef.current = token;

    const fetchData = useCallback(async (url, method) => {
        try {
            setLoading(true);
            const res = await axios(url, {
                method,
                headers: {
                    Authorization: `Bearer ${tokenRef.current}`,
                },
            });
            setData(res.data);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
        // Empty deps: fetchData is now stable forever
    }, []);


    return { data, loading, error, fetchData };
};

export default useFetch;