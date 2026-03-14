import { useState, useEffect } from 'react';
import { baseUrl } from '../shared';
import { useCurrentUser } from '../UserProvider/UserProvider';
import { useNavigate } from 'react-router-dom';
import { 
    MagnifyingGlassIcon, 
    SparklesIcon, 
    StarIcon, 
    AcademicCapIcon, 
    CurrencyDollarIcon,
    ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import ScrollToTop from '../components/ScrollToTop';

const Advisors = () => {
    const { user, loggedIn } = useCurrentUser();
    const navigate = useNavigate();
    const [advisors, setAdvisors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [specialization, setSpecialization] = useState('');

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchAdvisors();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [search, specialization]);

    const fetchAdvisors = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${baseUrl}api/advisors/?search=${search}&specialization=${specialization}`);
            if (response.ok) {
                const data = await response.json();
                setAdvisors(data);
            }
        } catch (error) {
            console.error("Error fetching advisors:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <ScrollToTop />
            <div className="bg-[#f8fafc] min-h-screen pt-24 pb-20">
                {/* Hero Section */}
                <div className="max-w-7xl mx-auto px-6 mb-12">
                    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -ml-48 -mb-48"></div>
                        
                        <div className="relative z-10 max-w-2xl">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                                    <SparklesIcon className="w-5 h-5 text-purple-400" />
                                </div>
                                <span className="text-sm font-bold tracking-widest uppercase text-white/50">Wormie Advisor Marketplace</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight leading-tight">
                                Find Your Perfect <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Admissions Advisor</span>
                            </h1>
                            <p className="text-lg text-white/70 leading-relaxed mb-8">
                                Connect with verified experts who can help you navigate college applications, 
                                financial aid, and essay polishing. Personalized guidance starts here.
                            </p>

                            {/* Search Bar */}
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative group">
                                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-purple-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Search by name..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all backdrop-blur-md"
                                    />
                                </div>
                                <div className="md:w-64 relative group">
                                    <AcademicCapIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-purple-400" />
                                    <select 
                                        value={specialization}
                                        onChange={(e) => setSpecialization(e.target.value)}
                                        className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-8 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all backdrop-blur-md"
                                    >
                                        <option value="" className="text-gray-900 bg-white">All Specializations</option>
                                        <option value="Ivy League" className="text-gray-900 bg-white">Ivy League Prep</option>
                                        <option value="Financial Aid" className="text-gray-900 bg-white">Financial Aid & Scholarship</option>
                                        <option value="STEM" className="text-gray-900 bg-white">STEM Applications</option>
                                        <option value="Public Universities" className="text-gray-900 bg-white">Public Universities</option>
                                        <option value="Essay Polishing" className="text-gray-900 bg-white">Essay Polishing</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Advisors Grid */}
                <div className="max-w-7xl mx-auto px-6">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 animate-pulse">
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="w-20 h-20 bg-gray-100 rounded-3xl"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-6 bg-gray-100 rounded w-3/4"></div>
                                            <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                    <div className="h-20 bg-gray-50 rounded-2xl mb-6"></div>
                                    <div className="h-12 bg-gray-100 rounded-2xl"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {advisors.length > 0 ? (
                                advisors.map((advisor) => (
                                    <div key={advisor.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all group flex flex-col h-full">
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className="relative flex-shrink-0">
                                                <img 
                                                    src={advisor.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${advisor.username}`}
                                                    alt={advisor.username} 
                                                    className="w-20 h-20 rounded-3xl object-cover shadow-lg bg-gray-50"
                                                />
                                                <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple transition-colors truncate">
                                                    {advisor.first_name} {advisor.last_name || advisor.username}
                                                </h3>
                                                <p className="text-sm text-gray-500 font-medium mb-2 truncate">{advisor.specialization || 'Generalist Advisor'}</p>
                                                <div className="flex items-center gap-1">
                                                    <StarIcon className="w-4 h-4 text-yellow-500 fill-current" />
                                                    <span className="text-sm font-bold text-gray-900">{advisor.rating || '5.0'}</span>
                                                    <span className="text-xs text-gray-400 font-medium ml-1">Verified</span>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-3 italic flex-1">
                                            "{advisor.advisor_bio || 'Professional admissions advisor ready to help you reach your dream college.'}"
                                        </p>

                                        <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-2xl">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Service Fee</span>
                                                <div className="flex items-center gap-1">
                                                    <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
                                                    <span className="text-lg font-bold text-gray-900">{advisor.hourly_rate ? parseFloat(advisor.hourly_rate).toFixed(0) : '75'}</span>
                                                    <span className="text-sm text-gray-400 font-medium">/ hr</span>
                                                </div>
                                            </div>
                                            <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                                                <AcademicCapIcon className="w-5 h-5 text-purple-600" />
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => {
                                                if (!loggedIn) {
                                                    navigate('/login');
                                                    return;
                                                }
                                                navigate('/messages', { 
                                                    state: { 
                                                        openChatWithUserId: advisor.id,
                                                        openChatWithUserName: advisor.first_name || advisor.username,
                                                        draftText: `Hi ${advisor.first_name || advisor.username}, I saw your profile on the Advisor Marketplace and I'm interested in your services!` 
                                                    } 
                                                });
                                            }}
                                            className="w-full bg-[#17717d] hover:bg-[#135f69] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-[#17717d]/20 mt-auto"
                                        >
                                            <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                            Book Consultation
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-20 text-center">
                                    <div className="p-10 bg-white rounded-[3rem] border border-dashed border-gray-200 inline-block">
                                        <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">No advisors found</h3>
                                        <p className="text-gray-500">Try adjusting your filters or search terms.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Advisors;
