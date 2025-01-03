import '../index.css';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';


function Search() {
    const [query, setQuery] = useState("");
    const [searchWarning, setSearchWarning] = useState('');
    console.log("query", query);
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (!query.trim()) {
            setSearchWarning('Please enter a search term');
            return;
        }
        setSearchWarning('');
        navigate('/search/' + query);
        setQuery("");
    };

    return (
        <form
            className="flex space-between space-x-2 max-w-full p-2"
            onSubmit={handleSearch}
        >
            <input
                className="shrink min-w-0 px-2 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-400 w-fit"
                placeholder="Search for a college/program"
                type="text"
                onChange={(e) => {
                    setQuery(e.target.value);
                }}
            />
            <button type="submit" className="bg-gray-800 hover:bg-black text-white font-bold py-1 px-2 rounded">
                Search
            </button>
            {searchWarning && <p className="text-red-500">{searchWarning}</p>}
        </form>
    );
}

export default Search;