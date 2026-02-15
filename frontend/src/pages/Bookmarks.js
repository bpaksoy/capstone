import React, { useEffect, useState } from 'react';
import College from '../components/College';
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


function calculateSimilarityScore(college1, college2) {
  const satScoreDiff = Math.abs(college1.sat_score - college2.sat_score);
  const admissionRateDiff = Math.abs(college1.admission_rate - college2.admission_rate);
  const costOfAttendanceDiff = Math.abs(college1.cost_of_attendance - college2.cost_of_attendance);

  const satScoreSimilarity = 1 - (satScoreDiff / 2400);
  const admissionRateSimilarity = 1 - admissionRateDiff;
  const costOfAttendanceSimilarity = 1 - (costOfAttendanceDiff / 40000);

  return (satScoreSimilarity * 0.4 + admissionRateSimilarity * 0.4 + costOfAttendanceSimilarity * 0.2);
}


const MIN_SIMILARITY_THRESHOLD = 0.3;


const Bookmarks = () => {
  const navigate = useNavigate();
  const { loggedIn, appLoading: authLoading } = useCurrentUser();
  const [bookmarkedColleges, setBookmarkedColleges] = useState([]);
  const [recommendedColleges, setRecommendedColleges] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecommending, setIsRecommending] = useState(false);
  const [loadingStep, setLoadingStep] = useState("Initializing...");

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
    const recommendColleges = async () => {
      if (bookmarkedColleges.length === 0) {
        setIsRecommending(false);
        return;
      }
      setIsRecommending(true);
      setLoadingStep("Scanning regional data...");
      try {
        const bookmarkedStates = [...new Set(bookmarkedColleges.map(college => college.state))];

        const response = await fetch(`${baseUrl}api/colleges/filtered/?states=${bookmarkedStates.join(',')}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const filteredColleges = await response.json();
        setLoadingStep(`Analyzing ${filteredColleges.length} potential matches...`);
        // console.log("Filtered Colleges", filteredColleges);
        let collegeScores = filteredColleges.map((otherCollege) => {
          let scoreSum = 0;
          let numScores = 0;
          bookmarkedColleges.forEach((bookmarkedCollege) => {
            let similarityScore = calculateSimilarityScore(bookmarkedCollege, otherCollege);
            if (bookmarkedCollege.state === otherCollege.state) {
              similarityScore += 0.2;
            }
            scoreSum += similarityScore;
            numScores += 1;
          });
          if (numScores > 0) {
            const score = scoreSum / numScores;
            if (score > MIN_SIMILARITY_THRESHOLD) {
              return {
                college: otherCollege,
                score: score,
              };
            }
            else {
              return null;
            }
          }
          else {
            return null;
          }
        }).filter(college => college !== null)
        collegeScores.sort((a, b) => b.score - a.score);
        setRecommendedColleges(collegeScores.slice(0, 10).map(score => score.college));
      }
      catch (error) {
        setError(error);
        console.error("Error fetching filtered colleges", error);
      } finally {
        setIsRecommending(false);
      }
    };
    recommendColleges();
  }, [bookmarkedColleges]);

  if (authLoading || isLoading || isRecommending) {
    let loaderText = loadingStep;
    if (authLoading) loaderText = "Checking whether the user is authenticated...";

    return <Loader text={loaderText} />;
  }

  if (error) return <p>Error: {error.message}</p>;

  function CustomNextArrow(props) {
    const { style, onClick } = props;
    return (
      <div
        className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center bg-gray-900/40 hover:bg-gray-900/60 backdrop-blur-sm rounded-full shadow-xl transition-all border border-white/10 z-10 cursor-pointer group"
        style={{ ...style, display: "flex", right: "-50px", width: "48px", height: "48px" }}
        onClick={onClick}
      >
        <ChevronRightIcon className="w-7 h-7 text-white transition-transform group-hover:scale-110" />
      </div>
    );
  }

  function CustomPrevArrow(props) {
    const { style, onClick } = props;
    return (
      <div
        className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center bg-gray-900/40 hover:bg-gray-900/60 backdrop-blur-sm rounded-full shadow-xl transition-all border border-white/10 z-10 cursor-pointer group"
        style={{ ...style, display: "flex", left: "-50px", width: "48px", height: "48px" }}
        onClick={onClick}
      >
        <ChevronLeftIcon className="w-7 h-7 text-white transition-transform group-hover:scale-110" />
      </div>
    );
  }

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    nextArrow: <CustomNextArrow />,
    prevArrow: <CustomPrevArrow />,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          infinite: true,
          dots: true
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          initialSlide: 1
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  };

  return (
    <div className="bg-primary min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {recommendedColleges.length > 0 && (
        <div className="mt-8 w-full max-w-6xl">
          <h2 className="text-xl font-semibold mb-4 text-white">Recommended Colleges</h2>
          <Slider {...settings}>
            {recommendedColleges.map((recommendedCollege) => (
              <div key={recommendedCollege.id} className="px-2 pb-4">
                <div className="flex justify-center h-full">
                  <College {...recommendedCollege} />
                </div>
              </div>
            ))}
          </Slider>
        </div>
      )}
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
              img={images.college}
            />
          </div>
        ))}
      </div>

    </div>
  )
}

export default Bookmarks;