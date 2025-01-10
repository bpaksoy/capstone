import React, { useEffect, useState } from 'react';
import College from '../components/College';
import axios from 'axios';
import { baseUrl } from '../shared';
import { Link } from 'react-router-dom';
import { images } from '../constants';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";


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
  const [bookmarkedColleges, setBookmarkedColleges] = useState([]);
  //console.log("Bookmarked Colleges", bookmarkedColleges);
  const [recommendedColleges, setRecommendedColleges] = useState([]);
  // console.log("Recommended Colleges", recommendedColleges);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const fetchBookmarkedColleges = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${baseUrl}api/bookmarks/`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access')}`,
          },
        });
        //console.log("response", response)
        // if (!response.ok) {
        //   throw new Error(`HTTP error! status: ${response.status}`);
        // }
        const data = await response.data;
        //console.log("Bookmarked Colleges", data);
        setBookmarkedColleges(data);
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
      if (bookmarkedColleges.length === 0) return;
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
      }
    };
    recommendColleges();
  }, [bookmarkedColleges]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="spinner border-4 border-t-4 border-primary rounded-full h-16 w-16 animate-spin"></div>
      </div>
    );
  }

  if (error) return <p>Error: {error.message}</p>;

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
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
              <div key={recommendedCollege.id} className="px-2">
                <div className="bg-white p-4 rounded-lg h-full flex flex-col">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                  </svg>
                  <h5 className="block font-sans text-xl antialiased font-medium leading-snug tracking-normal text-blue-gray-900 mb-2">{recommendedCollege.name}</h5>
                  <p className="mb-4">
                    {recommendedCollege.city}, {recommendedCollege.state}
                  </p>
                  <p className="mb-4">
                    Acceptance Rate: {(recommendedCollege.admission_rate * 100).toFixed(2)}%
                  </p>
                  <Link to={`/colleges/${recommendedCollege.id}/details`}
                    className="mt-auto block w-full select-none rounded-lg bg-gray-800 hover:bg-gray-700 py-3.5 px-7 text-center align-middle font-sans text-sm font-bold uppercase text-white shadow-md shadow-gray-900/10 transition-all hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                  >
                    More
                  </Link>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      )}
      <div className="flex flex-wrap justify-center mt-6">

        {bookmarkedColleges.map((college) => {
          const name = college["name"];
          const city = college["city"];
          const state = college["state"];
          const cost_of_attendance = college["cost_of_attendance"]
          const admission_rate = college["admission_rate"]
          const sat_score = college["sat_score"]

          return (
            <College
              key={college.id}
              id={college.id}
              name={name}
              city={city}
              state={state}
              admission_rate={admission_rate}
              sat_score={sat_score}
              cost_of_attendance={cost_of_attendance}
              img={images.college}
            />
          );
        })}
      </div>

    </div>
  )
}

export default Bookmarks;