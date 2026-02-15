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
        <div className="w-full p-4 mb-8 flex flex-col items-center">
            <form
                className="flex items-center w-full md:w-[36rem] bg-white rounded-full shadow-md border border-gray-200 overflow-hidden"
                onSubmit={handleSearch}
            >
                <input
                    className="flex-grow px-6 py-1.5 text-base text-gray-700 placeholder-gray-500 bg-transparent outline-none border-none focus:ring-0"
                    placeholder="Search for a college/program"
                    type="text"
                    onChange={(e) => {
                        setQuery(e.target.value);
                    }}
                />
                <button type="submit" className="bg-gray-800 hover:bg-black text-white font-bold py-1.5 px-8 text-base shrink-0 transition-colors duration-200">
                    Search
                </button>
            </form>
            {searchWarning && <p className="text-red-500 mt-2 font-medium">{searchWarning}</p>}
        </div>
    );
}

export default Search;