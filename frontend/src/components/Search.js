import '../index.css';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';


function Search() {
    const [query, setQuery] = useState("");
    //console.log("query", query);
    const navigate = useNavigate();

    return (
        <form
            className="flex space-between space-x-2 max-w-[300px] p-2"
            onSubmit={(e) => {
                e.preventDefault();
                navigate('/search/' + query);
                setQuery("");
            }}
        >
            <input
                className="shrink min-w-0 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                placeholder="Search for a college"
                type="text"
                onChange={(e) => {
                    setQuery(e.target.value);
                }}
            />
            <button type="submit" className="bg-gray-800 hover:bg-black text-white font-bold py-1 px-2 rounded">
                Search
            </button>
        </form>
    );
}

export default Search;