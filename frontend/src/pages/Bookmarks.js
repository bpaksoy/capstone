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
    </div>
  )
}

export default Bookmarks;