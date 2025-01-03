import React, { useState, useEffect } from 'react';
import College from '../components/College';
import { baseUrl } from '../shared';
import axios from 'axios';
import { useCurrentUser } from '../UserProvider/UserProvider';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import NotFound from './NotFound';
import { states } from '../constants/states';

const DetailedSearch = () => {
    const [colleges, setColleges] = useState([]);
    console.log("colleges", colleges);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [name, setName] = useState('');
    const [state, setState] = useState('');
    const [city, setCity] = useState('');
    const [program, setProgram] = useState('');
    const [minSat, setMinSat] = useState('');
    const [maxSat, setMaxSat] = useState('');
    const [searchError, setSearchError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const { updateLoggedInStatus } = useCurrentUser();
    const [errorStatus, setErrorStatus] = useState();
    const [notFound, setNotFound] = useState(false);

    const fetchColleges = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${baseUrl}api/colleges/detailed/`, {
                params: { state, city, program, min_sat: minSat, max_sat: maxSat, name },
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access')}`
                }
            })
            console.log("response for detailed search", response);
            if (response.status === 404) {
                setNotFound(true);
                navigate("/404");
            } else if (response.status === 401) {
                updateLoggedInStatus(false);
                navigate("/login", {
                    state: {
                        previousUrl: location.pathname
                    }
                });
            }
            const data = await response.data;
            console.log("data!!!!", data)
            setColleges(data.colleges);
            const searchQuery = { state, city, program, min_sat: minSat, max_sat: maxSat, name };
            navigate(`/search/detailed/`, { state: { colleges: data.colleges, hasMore: data.has_more, searchQuery: searchQuery } });
        }
        catch (error) {
            setError(error);
            console.error("Error fetching colleges", error);
        }
        finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (!state && !city && !program && !minSat && !maxSat && !name) {
            setSearchError('Please fill in at least one field.');
            return;
        }
        setSearchError('');
        fetchColleges();
    };

    // const isFormValid = () => {
    //     return state || city || program || minSat || maxSat || name;
    // }

    // useEffect(() => {
    //     if (colleges.length > 0) {
    //         const searchQuery = `state=${state}&city=${city}&program=${program}&min_sat=${minSat}&max_sat=${maxSat}&name=${name}`;
    //         console.log("is it coming here?")
    //         navigate(`/search/${encodeURIComponent(searchQuery)}`, { state: { colleges: colleges } });
    //     }
    // }, [colleges, navigate, city, program, state, minSat, maxSat, name]);


    if (errorStatus === 404) {
        return (
            <>
                <NotFound />
                <Link to="/">Search another</Link>
            </>
        );
    }

    if (errorStatus) {
        return (
            <>
                <p>There was a problem with the server, try again later.</p>
                <Link to="/">Search another</Link>
            </>
        );
    }

    // if (isLoading) {
    //     return (
    //         <div className="flex justify-center items-center h-screen">
    //             <div className="spinner border-4 border-t-4 border-primary rounded-full h-16 w-16 animate-spin"></div>
    //         </div>
    //     );
    // }

    if (error) return <p>Error: {error.message}</p>;

    return (
        <div className="bg-primary min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-md p-8 w-1/2">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Detailed Search</h2>
                <form onSubmit={handleSearch} className="flex flex-col gap-4 mb-4">
                    <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="p-2 rounded border border-gray-300 w-full max-w-[400px] focus:outline-none focus:ring-2 focus:ring-gray-400" />
                    <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="p-2 rounded border border-gray-300 max-w-[300px] focus:outline-none focus:ring-2 focus:ring-gray-400" />
                    <select value={state} onChange={(e) => setState(e.target.value)}
                        className="p-2 rounded border border-gray-300 w-full max-w-[400px] focus:outline-none focus:ring-2 focus:ring-gray-400">
                        <option value="">Select State</option>
                        {states.map((stateOption) => (
                            <option key={stateOption} value={stateOption}>
                                {stateOption}
                            </option>
                        ))}
                    </select>
                    <input type="text" placeholder="Program" value={program} onChange={(e) => setProgram(e.target.value)} className="p-2 rounded border border-gray-300 max-w-[500px] focus:outline-none focus:ring-2 focus:ring-gray-400" />
                    <input type="number" placeholder="Min SAT Score" value={minSat} onChange={(e) => setMinSat(e.target.value)} className="p-2 rounded border border-gray-300 max-w-[200px] focus:outline-none focus:ring-2 focus:ring-gray-400" />
                    <input type="number" placeholder="Max SAT Score" value={maxSat} onChange={(e) => setMaxSat(e.target.value)} className="p-2 rounded border border-gray-300 max-w-[200px] focus:outline-none focus:ring-2 focus:ring-gray-400" />
                    <button type="submit" className="bg-gray-800 hover:bg-black text-white font-bold py-3 px-6 rounded-md max-w-[200px]" >Search</button>
                    {searchError && <p className="text-red-500 mt-2">{searchError}</p>}
                </form>
            </div>
        </div>
    );
}

export default DetailedSearch;