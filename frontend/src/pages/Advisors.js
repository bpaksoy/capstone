import { useState, useEffect } from 'react';
import { baseUrl, getApiUrl } from '../shared';
import { useCurrentUser } from '../UserProvider/UserProvider';
import { useNavigate } from 'react-router-dom';
import { 
    MagnifyingGlassIcon, 
    SparklesIcon, 
    StarIcon, 
    AcademicCapIcon, 
    CurrencyDollarIcon,
    ChatBubbleLeftRightIcon,
    VideoCameraIcon,
    ClockIcon,
    CheckBadgeIcon
} from '@heroicons/react/24/outline';
import ScrollToTop from '../components/ScrollToTop';
import ReviewModal from '../utils/ReviewModal';

const Advisors = () => {
    const { user, loggedIn } = useCurrentUser();
    const navigate = useNavigate();
    const [advisors, setAdvisors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedAdvisor, setSelectedAdvisor] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);

    const handleBookingSubmit = async () => {
        if (!loggedIn) {
            navigate('/login');
            return;
        }
        setBookingLoading(true);
        const scheduledAt = new Date(`${bookingDate}T${bookingTime}:00`).toISOString();
        const token = localStorage.getItem('access');
        
        try {
            const res = await fetch(getApiUrl('api/payments/create-session/'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    service_id: selectedService.id,
                    scheduled_at: scheduledAt,
                    success_url: window.location.origin + '/bookmarks',
                    cancel_url: window.location.origin + '/advisors'
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.url) {
                    window.location.href = data.url;
                } else {
                    alert("Failed to initiate payment session.");
                    setBookingLoading(false);
                }
            } else {
                alert("Payment error. Please try again.");
                setBookingLoading(false);
            }
        } catch (err) {
            console.error("Booking error:", err);
            alert("Network error booking session.");
            setBookingLoading(false);
        }
    };


    const specializations = [
        { value: "", label: "All Specializations" },
        { value: "Ivy League", label: "Ivy League Prep" },
        { value: "Financial Aid", label: "Financial Aid & Scholarship" },
        { value: "STEM", label: "STEM Applications" },
        { value: "Public Universities", label: "Public Universities" },
        { value: "Essay Polishing", label: "Essay Polishing" },
    ];

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchAdvisors();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [search, specialization]);

    const fetchAdvisors = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const url = getApiUrl(`api/advisors/?search=${search}&specialization=${specialization}`);
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setAdvisors(data);
            } else {
                setErrorMsg("Failed to load advisors. Please try again later.");
            }
        } catch (error) {
            console.error("Error fetching advisors:", error);
            setErrorMsg("Network error. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <ScrollToTop />
            <div className="bg-[#f8fafc] min-h-screen pt-24 pb-20">
                {/* Hero Section */}
                <div className="max-w-7xl mx-auto px-4 md:px-6 mb-8 md:mb-12">
                    <div className="bg-gradient-to-br from-[#17717d] via-[#135f69] to-[#0d4b53] rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-12 text-white relative shadow-2xl overflow-visible">
                        {/* decorative background circles - clipped to rounded corners */}
                        <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] md:rounded-[3rem] pointer-events-none">
                            <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-white/10 rounded-full blur-[80px] md:blur-[100px] -mr-32 md:-mr-48 -mt-32 md:-mt-48"></div>
                            <div className="absolute bottom-0 left-0 w-64 md:w-96 h-64 md:h-96 bg-[#24adbf]/20 rounded-full blur-[80px] md:blur-[100px] -ml-32 md:-ml-48 -mb-32 md:-mb-48"></div>
                        </div>
                        
                        <div className="relative z-10 max-w-2xl">
                            <div className="flex items-center gap-2 mb-4 md:mb-6">
                                <div className="p-1.5 md:p-2 bg-white/10 rounded-xl backdrop-blur-md">
                                    <SparklesIcon className="w-4 h-4 md:w-5 md:h-5 text-purple" />
                                </div>
                                <span className="text-xs md:text-sm font-bold tracking-widest uppercase text-white/50">Wormie Advisor Marketplace</span>
                            </div>
                            <h1 className="text-3xl md:text-6xl font-black mb-4 md:mb-6 tracking-tight leading-[1.1]">
                                Find Your Perfect <br className="hidden md:block" />
                                <span className="bg-gradient-to-r from-white via-[#aaf0d1] to-white bg-clip-text text-transparent drop-shadow-md">
                                    Admissions Advisor
                                </span>
                            </h1>
                            <p className="text-lg md:text-xl text-white font-medium leading-relaxed mb-6 md:mb-8 max-w-xl">
                                Connect with verified experts who can help you navigate college applications, 
                                financial aid, and essay polishing. Personalized guidance starts here.
                            </p>

                            {/* Search Bar */}
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative group">
                                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-purple" />
                                    <input 
                                        type="text" 
                                        placeholder="Search by name..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple/50 transition-all backdrop-blur-md"
                                    />
                                </div>
                                <div className="md:w-72 relative">
                                    <button 
                                        type="button"
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className={`w-full bg-white/10 border ${isDropdownOpen ? 'border-purple/50 ring-2 ring-purple/50' : 'border-white/20'} rounded-2xl py-4 pl-12 pr-10 text-white text-left transition-all backdrop-blur-md relative group focus:outline-none focus:ring-2 focus:ring-purple/50`}
                                    >
                                        <AcademicCapIcon className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDropdownOpen ? 'text-purple' : 'text-gray-400'}`} />
                                        <span className="block truncate">
                                            {specializations.find(s => s.value === specialization)?.label || "Select Specialization"}
                                        </span>
                                        <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-purple' : 'text-white/40'}`}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </button>

                                    {isDropdownOpen && (
                                        <>
                                            <div 
                                                className="fixed inset-0 z-10" 
                                                onClick={() => setIsDropdownOpen(false)}
                                            ></div>
                                            <div className="absolute z-[100] mt-3 w-full bg-white/95 backdrop-blur-2xl rounded-[1.5rem] md:rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                {specializations.map((spec) => (
                                                    <button
                                                        key={spec.value}
                                                        type="button"
                                                        onClick={() => {
                                                            setSpecialization(spec.value);
                                                            setIsDropdownOpen(false);
                                                        }}
                                                        className={`w-full text-left px-4 md:px-6 py-3 md:py-4 text-sm font-semibold transition-all flex items-center gap-3
                                                            ${specialization === spec.value 
                                                                ? 'bg-purple text-white' 
                                                                : 'text-gray-700 hover:bg-purple/10 hover:text-purple'
                                                            }`}
                                                    >
                                                        <div className={`p-1.5 rounded-lg ${specialization === spec.value ? 'bg-white/20' : 'bg-gray-100 transition-colors'}`}>
                                                            <AcademicCapIcon className="w-4 h-4" />
                                                        </div>
                                                        <span className="flex-1 truncate">{spec.label}</span>
                                                        {specialization === spec.value && (
                                                            <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6">
                    {errorMsg ? (
                        <div className="py-20 text-center">
                            <div className="p-10 bg-red-50 rounded-[3rem] border border-red-100 inline-block">
                                <h3 className="text-xl font-bold text-red-900 mb-2">{errorMsg}</h3>
                                <button 
                                    onClick={fetchAdvisors}
                                    className="text-red-600 font-bold hover:underline"
                                >
                                    Try again
                                </button>
                            </div>
                        </div>
                    ) : loading ? (
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
                                                    src={advisor.image 
                                                        ? (advisor.image.startsWith('http') ? advisor.image : `${baseUrl}${advisor.image.startsWith('/') ? advisor.image.substring(1) : advisor.image}`)
                                                        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${advisor.username}`}
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
                                                <div 
                                                    className="flex items-center gap-1 group/rating cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors"
                                                    onClick={() => {
                                                        if (!loggedIn) {
                                                            navigate('/login');
                                                            return;
                                                        }
                                                        setSelectedAdvisor(advisor);
                                                        setIsReviewModalOpen(true);
                                                    }}
                                                >
                                                    <StarIcon className="w-4 h-4 text-yellow-500 fill-current group-hover/rating:scale-110 transition-transform" />
                                                    <span className="text-sm font-bold text-gray-900">{parseFloat(advisor.rating).toFixed(1) || '5.0'}</span>
                                                    <span className="text-xs text-gray-400 font-medium ml-1">({advisor.reviews_count || 0} reviews)</span>
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

                                        {advisor.services && advisor.services.length > 0 && (
                                            <div className="mb-6 space-y-2">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Available Packages (Click to Book)</p>
                                                {advisor.services.map(service => (
                                                    <div 
                                                        key={service.id} 
                                                        onClick={() => {
                                                            if (!loggedIn) {
                                                                navigate('/login');
                                                                return;
                                                            }
                                                            setSelectedService({
                                                                ...service,
                                                                advisor_name: advisor.first_name || advisor.username
                                                            });
                                                        }}
                                                        className="flex items-center justify-between p-3 bg-teal-50/50 rounded-xl border border-teal-100/50 group/service hover:bg-teal-50 hover:border-teal-400 cursor-pointer transition-colors"
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-gray-800">{service.title}</span>
                                                            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                                                <ClockIcon className="w-3 h-3" />
                                                                {service.duration} mins
                                                            </div>
                                                        </div>
                                                        <span className="text-sm font-black text-primary">${parseFloat(service.price).toFixed(0)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

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
            {selectedAdvisor && (
                <ReviewModal 
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    advisor={selectedAdvisor}
                    onReviewSubmitted={fetchAdvisors}
                />
            )}
            {selectedService && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2rem] max-w-md w-full p-6 border border-gray-100 shadow-2xl relative animate-in fade-in zoom-in duration-200 text-slate-800">
                        <button 
                            onClick={() => setSelectedService(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl p-1"
                        >
                            ✕
                        </button>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                            Confirm Booking
                        </span>
                        <h3 className="text-2xl font-black text-gray-900 mt-3 mb-1">
                            {selectedService.title}
                        </h3>
                        <p className="text-xs text-gray-500 mb-6">
                            Advisor: {selectedService.advisor_name}
                        </p>
                        
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Select Date
                                </label>
                                <input 
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    value={bookingDate}
                                    onChange={(e) => setBookingDate(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-sm font-semibold"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Select Time
                                </label>
                                <input 
                                    type="time"
                                    value={bookingTime}
                                    onChange={(e) => setBookingTime(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-sm font-semibold"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-teal-50/50 rounded-2xl mb-6">
                            <span className="text-sm font-semibold text-gray-600">Total Price:</span>
                            <span className="text-xl font-black text-teal-700">${parseFloat(selectedService.price).toFixed(2)}</span>
                        </div>

                        <button
                            onClick={handleBookingSubmit}
                            disabled={!bookingDate || !bookingTime || bookingLoading}
                            className="w-full bg-[#17717d] hover:bg-[#135f69] disabled:opacity-50 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-[#17717d]/20"
                        >
                            {bookingLoading ? 'Redirecting to Checkout...' : '💳 Pay with Stripe'}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default Advisors;
