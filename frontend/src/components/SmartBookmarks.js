import React, { useEffect, useState } from 'react';
import College from '../components/College';
import axios from 'axios';
import { baseUrl } from '../shared';
import { useNavigate, Link } from 'react-router-dom';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { AcademicCapIcon } from '@heroicons/react/24/solid';
import { cosineSimilarity } from '../helpers/cosineSimilartiy';

function calculateSimilarityScore(college1, college2) {
    const satScoreDiff = Math.abs(college1.sat_score - college2.sat_score);
    const admissionRateDiff = Math.abs(college1.admission_rate - college2.admission_rate);
    const costOfAttendanceDiff = Math.abs(college1.cost_of_attendance - college2.cost_of_attendance);

    const satScoreSimilarity = 1 - (satScoreDiff / 2400);
    const admissionRateSimilarity = 1 - admissionRateDiff;
    const costOfAttendanceSimilarity = 1 - (costOfAttendanceDiff / 40000);
    let stateMatch = 0;

    if (college1.state === college2.state) {
        stateMatch = 0.2;
    }
    return (satScoreSimilarity * 0.3 + admissionRateSimilarity * 0.3 + costOfAttendanceSimilarity * 0.2) + stateMatch;
}

const MIN_SIMILARITY_THRESHOLD = 0.3;

function SmartBookmarks() {
    const [bookmarkedColleges, setBookmarkedColleges] = useState([]);
    console.log(bookmarkedColleges);
    const [recommendedColleges, setRecommendedColleges] = useState([]);
    console.log("recommended colleges", recommendedColleges);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();


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
                const data = await response.data;
                console.log(data);
                setBookmarkedColleges(data.map((bookmark) => bookmark));
            } catch (error) {
                setError(error);
                console.error('Error fetching bookmarked colleges:', error);
            }
            finally {
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
                console.log("bookmarked states", bookmarkedStates);
                const response = await fetch(`${baseUrl}api/smart-colleges/filtered/?states=${bookmarkedStates.join(',')}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("access")}`,
                    },
                });
                console.log("RESPONSE!!!!!", response);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                const allColleges = data.colleges;
                const collegeScores = allColleges.map((otherCollege) => {
                    let scoreSum = 0;
                    let numScores = 0;
                    bookmarkedColleges.forEach((bookmarkedCollege) => {
                        const college1Vector = [
                            bookmarkedCollege.sat_score ? (bookmarkedCollege.sat_score / 2400) : 0,
                            bookmarkedCollege.admission_rate ? bookmarkedCollege.admission_rate : 0,
                            bookmarkedCollege.cost_of_attendance ? (bookmarkedCollege.cost_of_attendance / 40000) : 0,
                            bookmarkedCollege.CCBASIC ? parseInt(bookmarkedCollege.CCBASIC) : 0,
                            bookmarkedCollege.enrollment_all ? (bookmarkedCollege.enrollment_all / 40000) : 0,
                            bookmarkedCollege.HLOFFER ? parseInt(bookmarkedCollege.HLOFFER) : 0,
                        ];
                        const college2Vector = [
                            otherCollege.sat_score ? (otherCollege.sat_score / 2400) : 0,
                            otherCollege.admission_rate ? otherCollege.admission_rate : 0,
                            otherCollege.cost_of_attendance ? (otherCollege.cost_of_attendance / 40000) : 0,
                            otherCollege.CCBASIC ? parseInt(otherCollege.CCBASIC) : 0,
                            otherCollege.enrollment_all ? (otherCollege.enrollment_all / 40000) : 0,
                            otherCollege.HLOFFER ? parseInt(otherCollege.HLOFFER) : 0,
                        ];
                        const similarityScore = cosineSimilarity(college1Vector, college2Vector);
                        let stateMatchScore = 0;
                        if (bookmarkedCollege.state === otherCollege.state) {
                            stateMatchScore = 0.2;
                        }
                        scoreSum += similarityScore + stateMatchScore;
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
                }).filter(college => college !== null);
                collegeScores.sort((a, b) => b.score - a.score);
                setRecommendedColleges(collegeScores.slice(0, 5).map(score => score.college));
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
    // if (error) return <p>Error: {error.message}</p>;
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
            {bookmarkedColleges.length > 0 ? (
                <div className="flex flex-wrap justify-center">
                    {bookmarkedColleges.map((college) => {
                        const name = college.name;
                        const city = college.city;
                        const state = college.state;
                        const cost_of_attendance = college.cost_of_attendance
                        const admission_rate = college.admission_rate
                        const sat_score = college.sat_score
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
                                img={college.img}
                            />
                        );
                    })}
                </div>

            ) : (
                <p>No smart suggestions yet...</p>
            )}

            {recommendedColleges.length > 0 && (
                <div className="mt-8 w-full max-w-6xl">
                    <h2 className="text-xl font-semibold mb-4 text-white">Recommended Colleges (Smart)</h2>
                    <Slider {...settings}>
                        {recommendedColleges.map((recommendedCollege) => (
                            <div key={recommendedCollege.id} className="px-2">
                                <div className="bg-gray-100 p-4 rounded-lg h-full flex flex-col">
                                    <div className="flex items-center mb-2 gap-2">
                                        <AcademicCapIcon className="size-6 text-gray-700" />
                                        <h3 className="font-bold text-lg ">{recommendedCollege.name}</h3>
                                    </div>
                                    <p className="mb-1">
                                        {recommendedCollege.city}, {recommendedCollege.state}
                                    </p>
                                    <p className="mb-4">
                                        {(recommendedCollege.admission_rate * 100).toFixed(2)}% Admission Rate
                                    </p>
                                    <Link to={`/smart-colleges/${recommendedCollege.id}/details`}
                                        className="mt-auto block w-full select-none rounded-lg bg-gray-800 py-3.5 px-7 text-center align-middle font-sans text-sm font-bold uppercase text-white shadow-md shadow-gray-900/10 transition-all hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                                    >
                                        More
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </Slider>
                </div>
            )}
        </div >
    );
}

export default SmartBookmarks;