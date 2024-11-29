import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function useFetch(url, { method, headers, body } = {}) {
    const navigate = useNavigate();
    const location = useLocation();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            const response = await fetch(url, {
                method: method,
                headers: headers,
                body: body,
            });
            if (response.status === 401) {
                navigate("/login/", {
                    state: {
                        previousUrl: location.pathname
                    }
                });
            }
            if (!response.ok) {
                throw response.status;
            }
            const json = await response.json();
            setData(json);
        } catch (error) {
            setError(error);
        } finally {
            setLoading(false);
        }
    }

    const appendData = async (newData) => {
        try {
            const response = await fetch(url, {
                method: method,
                headers: headers,
                body: body,
            });
            if (response.status === 401) {
                navigate("/login/", {
                    state: {
                        previousUrl: location.pathname
                    }
                });
            }
            if (!response.ok) {
                throw response.status;
            }
            const json = await response.json();
            setData([...data, ...json]);
        } catch (error) {
            setError(error);
        } finally {
            setLoading(false);
        }
    }

    return { data, appendData, fetchData, loading, error };
}