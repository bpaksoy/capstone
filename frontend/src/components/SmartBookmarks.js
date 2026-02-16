import React, { useEffect, useState } from 'react';
import College from '../components/College';
import axios from 'axios';
import { baseUrl } from '../shared';
import { useNavigate, Link } from 'react-router-dom';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { AcademicCapIcon } from '@heroicons/react/24/solid';
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
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
        const fetchRecommendations = async () => {
            if (bookmarkedColleges.length === 0) return;
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
            }
        };
        fetchRecommendations();
    }, [bookmarkedColleges]);


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="spinner border-4 border-t-4 border-primary rounded-full h-16 w-16 animate-spin"></div>
            </div>
        );
    }
    // if (error) return <p>Error: {error.message}</p>;
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
            {bookmarkedColleges.length > 0 ? (
                <div className="flex flex-wrap justify-center">
                    {bookmarkedColleges.map((college) => {
                        return (
                            <College
                                key={college.id}
                                {...college}
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