import React, { useEffect, useState } from 'react';
import College from '../components/College';
import ScrollToTop from '../components/ScrollToTop';
import axios from 'axios';
import { baseUrl } from '../shared';
import { Link, useNavigate } from 'react-router-dom';
import { images } from '../constants';
import { useCurrentUser } from '../UserProvider/UserProvider';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Loader from '../components/Loader';
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';


const Bookmarks = () => {
  const navigate = useNavigate();
  const { loggedIn, appLoading: authLoading } = useCurrentUser();
  const [bookmarkedColleges, setBookmarkedColleges] = useState([]);
  const [recommendedColleges, setRecommendedColleges] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecommending, setIsRecommending] = useState(false);
  const [loadingStep, setLoadingStep] = useState("Initializing...");
  const [sliderRef, setSliderRef] = useState(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  // Check URL parameters for booking checkout redirection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const sessionId = params.get('session_id');
    const scheduledAt = params.get('scheduled_at');

    if (success === 'true' && sessionId) {
      verifyPayment(sessionId, scheduledAt);
    }
  }, []);

  const verifyPayment = async (sessionId, scheduledAt) => {
    setIsVerifyingPayment(true);
    const token = localStorage.getItem('access');
    try {
      const response = await fetch(`${baseUrl}api/payments/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          session_id: sessionId,
          scheduled_at: scheduledAt
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'completed') {
          setVerificationResult({
            success: true,
            advisorName: data.advisor_name,
            scheduledAt: data.scheduled_at
          });
          // Dispatch custom event for Wormie to handle
          window.dispatchEvent(new CustomEvent('wormie-booking-success', {
            detail: {
              advisorName: data.advisor_name,
              scheduledAt: data.scheduled_at
            }
          }));
        } else {
          setVerificationResult({ success: false, error: data.error || 'Payment not verified' });
        }
      } else {
        setVerificationResult({ success: false, error: 'Verification request failed' });
      }
    } catch (err) {
      console.error('Error verifying payment:', err);
      setVerificationResult({ success: false, error: 'Network error during verification' });
    } finally {
      setIsVerifyingPayment(false);
      // Clean up URL query parameters from history
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };


  // Immediate redirect if explicitly logged out
  useEffect(() => {
    if (!authLoading && !loggedIn && !localStorage.getItem('access')) {
      navigate('/login');
    }
  }, [loggedIn, authLoading, navigate]);


  useEffect(() => {
    const fetchBookmarkedColleges = async () => {
      setLoadingStep("Connecting to vault...");
      const token = localStorage.getItem('access');
      if (!token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${baseUrl}api/bookmarks/`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        setBookmarkedColleges(response.data);
      } catch (error) {
        setError(error);
        console.error('Error fetching colleges:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookmarkedColleges();
  }, []);


  useEffect(() => {
    const fetchRecommendations = async () => {
      if (bookmarkedColleges.length === 0) {
        setIsRecommending(false);
        return;
      }
      setIsRecommending(true);
      setLoadingStep("Curating your matches...");
      try {
        const response = await fetch(`${baseUrl}api/colleges/recommendations/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setRecommendedColleges(data.colleges);
      }
      catch (error) {
        setError(error);
        console.error("Error fetching recommendations", error);
      } finally {
        setIsRecommending(false);
      }
    };
    fetchRecommendations();
  }, [bookmarkedColleges]);

  if (authLoading || isLoading) {
    let loaderText = loadingStep;
    if (authLoading) loaderText = "Verifying access...";

    return <Loader text={loaderText} />;
  }

  if (error) return <p>Error: {error.message}</p>;

  function CustomNextArrow(props) {
    const { onClick, disabled } = props;
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`p-2 rounded-xl transition-all ${disabled ? 'text-white/20 bg-white/5 cursor-not-allowed' : 'text-white bg-white/10 hover:bg-white/20'}`}
      >
        <ChevronRightIcon className="w-5 h-5" />
      </button>
    );
  }

  function CustomPrevArrow(props) {
    const { onClick, disabled } = props;
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`p-2 rounded-xl transition-all ${disabled ? 'text-white/20 bg-white/5 cursor-not-allowed' : 'text-white bg-white/10 hover:bg-white/20'}`}
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>
    );
  }

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: false,
    className: "h-full items-stretch",
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false // Better for small screens
        }
      }
    ]
  };

  return (
    <div className="bg-primary min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Recommendation Section - Non-Blocking */}
      <div className="mt-8 w-full max-w-6xl">
        {isRecommending ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center animate-pulse mb-8">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-white font-semibold">{loadingStep}</h3>
            <p className="text-gray-400 text-sm mt-2">Personalizing your recommendations...</p>
          </div>
        ) : (
          recommendedColleges.length > 0 && (
            <>
              <div className="flex items-center gap-6 mb-8">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className="w-2 h-8 bg-purple-500 rounded-full"></span>
                  Perfect Matches For You
                </h2>
                <div className="hidden sm:flex items-center gap-2">
                  <CustomPrevArrow onClick={() => sliderRef?.slickPrev()} />
                  <CustomNextArrow onClick={() => sliderRef?.slickNext()} />
                </div>
              </div>
              <Slider {...settings} className="recommendations-slider h-full" ref={setSliderRef}>
                {recommendedColleges.map((recommendedCollege) => (
                  <div key={recommendedCollege.id} className="px-5 pb-12 h-full">
                    <div className="h-full flex flex-col">
                      <College {...recommendedCollege} />
                    </div>
                  </div>
                ))}
              </Slider>
            </>
          )
        )}
      </div>

      {bookmarkedColleges.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center mt-20 max-w-2xl mx-auto space-y-6">
          <div className="p-8 rounded-3xl bg-gray-900/40 border border-white/10 backdrop-blur-xl shadow-2xl animate-fade-in-up">
            <div className="w-20 h-20 mx-auto mb-6 bg-purple-500/20 rounded-2xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-purple-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">No bookmarks yet</h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              Start building your dream college list! Search for colleges and tap the heart icon to save them here.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-all hover:scale-105 shadow-lg shadow-purple-500/25 group"
            >
              Explore Colleges
              <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-8 w-full max-w-7xl mx-auto place-items-center mt-8">
          {bookmarkedColleges.map((college) => (
            <div key={college.id} className="w-full flex justify-center">
              <College
                id={college.id}
                name={college.name}
                city={college.city}
                state={college.state}
                admission_rate={college.admission_rate}
                sat_score={college.sat_score}
                cost_of_attendance={college.cost_of_attendance}
                img={images.collegeImg}
              />
            </div>
          ))}
        </div>
      )}
      <ScrollToTop />

      {/* Booking Verification Overlay */}
      {isVerifyingPayment && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white/10 border border-white/20 rounded-[2.5rem] p-10 max-w-md w-full text-center shadow-2xl backdrop-blur-xl text-white">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-2xl font-black mb-2">Verifying Consultation Booking</h3>
            <p className="text-gray-300 text-sm">Please wait while we confirm your Stripe checkout transaction with our database...</p>
          </div>
        </div>
      )}

      {verificationResult && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full text-center shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in duration-200 text-slate-800">
            <button 
              onClick={() => setVerificationResult(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl p-1"
            >
              ✕
            </button>
            {verificationResult.success ? (
              <>
                <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-teal-100 shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-10 h-10 text-teal-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                  Booking Confirmed
                </span>
                <h3 className="text-3xl font-black text-gray-900 mt-4 mb-2">
                  Session Scheduled!
                </h3>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  Your appointment with <span className="font-extrabold text-[#17717d]">Advisor {verificationResult.advisorName}</span> has been successfully booked for:
                  <br />
                  <span className="font-bold text-gray-900 block mt-2 text-base">
                    {new Date(verificationResult.scheduledAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    <br />
                    at {new Date(verificationResult.scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </p>
                <div className="bg-purple-50/50 border border-purple-200/50 p-4 rounded-2xl mb-6 text-left">
                  <div className="flex gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#A855F7] shrink-0 mt-0.5 animate-pulse">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6.75 6.75 0 100-13.5 6.75 6.75 0 000 13.5zM12 7.5v4.5l3 1.5" />
                    </svg>
                    <div>
                      <p className="text-xs font-black text-[#A855F7] uppercase tracking-wider">Message from Wormie</p>
                      <p className="text-xs text-purple/80 mt-0.5 leading-relaxed font-medium">Check your chat! I have loaded your appointment info and am ready to help you prepare.</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setVerificationResult(null)}
                  className="w-full bg-[#17717d] hover:bg-[#135f69] text-white py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-[#17717d]/20"
                >
                  Awesome, thank you!
                </button>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-10 h-10 text-red-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-3 py-1 rounded-full">
                  Verification Failed
                </span>
                <h3 className="text-2xl font-black text-gray-900 mt-4 mb-2">
                  Couldn't Verify Payment
                </h3>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  We ran into an issue confirming your checkout:
                  <br />
                  <span className="font-bold text-red-500 block mt-1">{verificationResult.error}</span>
                </p>
                <button
                  onClick={() => setVerificationResult(null)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Bookmarks;