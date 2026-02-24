import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';


function Search() {
    const { query: urlQuery } = useParams();
    const [query, setQuery] = useState(urlQuery || "");
    const [searchWarning, setSearchWarning] = useState('');

    useEffect(() => {
        if (urlQuery) {
            setQuery(urlQuery);
        }
    }, [urlQuery]);

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
        <div className="w-full pt-8 pb-4 flex flex-col items-center">
            <form
                className="group flex items-center w-full max-w-xl bg-white/95 backdrop-blur-sm rounded-full shadow-xl border border-gray-100/50 pr-1 focus-within:ring-2 focus-within:ring-teal-500/30 transition-all duration-300"
                onSubmit={handleSearch}
            >
                <div className="pl-5 flex items-center">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </div>
                <input
                    className="flex-grow px-4 py-2.5 text-base text-gray-700 placeholder-gray-400 bg-transparent outline-none border-none focus:ring-0 font-medium"
                    placeholder="Search for a college or specific program..."
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                    }}
                />
                <button
                    type="submit"
                    className="bg-primary hover:bg-teal-700 text-white font-bold py-1.5 px-6 text-sm shrink-0 transition-all duration-200 rounded-full m-1 shadow-sm hover:shadow-md"
                >
                    Search
                </button>
            </form>
            {searchWarning && (
                <div className="mt-3 flex items-center gap-2 animate-bounce">
                    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-500 text-xs font-bold uppercase tracking-wider">{searchWarning}</p>
                </div>
            )}

            <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-2xl px-4 animate-fadeIn">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2 self-center">Popular:</span>
                {['Ivy League', 'California', 'Computer Science', 'HBCU', 'Nursing'].map((tag) => (
                    <button
                        key={tag}
                        onClick={() => {
                            setQuery(tag);
                            navigate('/search/' + tag);
                        }}
                        className="px-4 py-1.5 bg-white/50 backdrop-blur-sm border border-gray-100 hover:border-primary hover:text-primary rounded-full text-xs font-medium text-gray-500 transition-all shadow-sm"
                    >
                        {tag}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default Search;