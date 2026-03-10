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
        <div className="w-full max-w-2xl mx-auto pt-0">
            <form
                className="group relative flex items-center w-full bg-white rounded-full shadow-lg border border-gray-100 hover:shadow-xl focus-within:ring-2 focus-within:ring-teal-500/20 transition-all duration-300"
                onSubmit={handleSearch}
            >
                <div className="pl-5 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </div>
                <input
                    className="flex-grow min-w-0 px-3 sm:px-4 py-3 text-[15px] sm:text-base text-gray-700 placeholder-gray-400 bg-transparent outline-none border-none focus:ring-0 font-medium truncate"
                    placeholder="Search colleges, majors, or paths..."
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (searchWarning) setSearchWarning('');
                    }}
                />
                <button
                    type="submit"
                    className="bg-primary hover:bg-black-100 text-white font-bold py-2 px-4 sm:px-8 text-xs sm:text-sm shrink-0 transition-all duration-300 rounded-full m-1 shadow-sm active:scale-95"
                >
                    Search
                </button>
            </form>

            {searchWarning && (
                <div className="mt-3 flex items-center justify-center gap-2 animate-bounce">
                    <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">{searchWarning}</p>
                </div>
            )}

            <div className="mt-8 flex flex-wrap justify-center items-center gap-x-3 gap-y-2 animate-fadeIn px-4 sm:px-8">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Popular:</span>
                {['Ivy League', 'California', 'Computer Science', 'HBCU'].map((tag) => (
                    <button
                        key={tag}
                        onClick={() => {
                            setQuery(tag);
                            navigate('/search/' + tag);
                        }}
                        className="px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/5 hover:border-white/20 rounded-full text-xs font-medium text-white/80 hover:text-white transition-all duration-300"
                    >
                        {tag}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default Search;