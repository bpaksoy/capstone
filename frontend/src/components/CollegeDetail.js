import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { baseUrl } from '../shared';
import { images } from '../constants';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
})

const CollegeDetail = () => {
    const { id: collegeId } = useParams();
    //console.log("collegeId", collegeId);
    const [college, setCollege] = useState(null);
    console.log("College", college);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const position = ["", ""];

    useEffect(() => {
        const fetchCollegeDetails = async () => {
            setIsLoading(true);
            setError(null);

            try {
                if (!collegeId) {
                    throw new Error('College ID is missing');
                }

                const response = await fetch(`${baseUrl}api/colleges/${collegeId}/`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('access')}` },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log("College Details", data);
                setCollege(data.college);
            } catch (error) {
                setError(error);
                console.error("Error fetching college details:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCollegeDetails();
    }, []);


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="spinner border-4 border-t-4 border-primary rounded-full h-16 w-16 animate-spin"></div>
            </div>)
    }
    if (error) return <p>Error: {error.message}</p>;
    if (!college) return <p>College not found</p>;

    return (
        <>
            <div className="bg-primary min-h-screen">
                <div className="container mx-auto px-4 py-8">
                    <div className="bg-white rounded-lg shadow-md p-6"> {/* Main container */}
                        <div className="flex flex-col md:flex-row items-center gap-8"> {/* Image and details */}
                            <img src={images.collegeImg} alt={college.name} className="w-64 h-64 rounded-lg object-cover shadow-md md:w-auto md:max-w-[300px]" />
                            <div>
                                <h1 className="text-3xl font-bold mb-2">{college.name}</h1>
                                <p className="text-gray-600 text-lg mb-4">{college.city}, {college.state}</p>
                                <div className="flex flex-wrap gap-4 mb-4"> {/* Stats */}
                                    <div className="bg-blue-100 p-3 rounded-lg flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                                        </svg>

                                        <p className="font-medium">Acceptance Rate: {(college.admission_rate * 100).toFixed(2)}%</p>
                                    </div>
                                    <div className="bg-blue-100 p-3 rounded-lg flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                                        </svg>

                                        <p className="font-medium">Average SAT: {college.sat_score}</p>
                                    </div>
                                    <div className="bg-blue-100 p-3 rounded-lg flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                        </svg>

                                        <p className="font-medium">Cost: {formatter.format(college.cost_of_attendance).replace(/(\.|,)00$/g, '')}</p>
                                    </div>
                                </div>
                                <p className="text-gray-700 mb-4">Lorem ipsum.....</p>

                                <a href={college.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{college.website}</a>

                            </div>
                        </div>


                    </div>
                </div>

                {/* <div className="bg-primary min-h-screen">
            <div className="flex flex-wrap justify-center">
                <div className="relative flex max-w-[70%] flex-col rounded-xl bg-white bg-clip-border text-gray-700 shadow-lg m-3">
                    <div
                        className="relative mx-4 mt-4 overflow-hidden text-white shadow-lg rounded-xl bg-blue-gray-500 bg-clip-border shadow-blue-gray-500/40 ">
                        <img
                            src={images.toss}
                            alt="college" />
                        <div
                            className="absolute inset-0 w-full h-full to-bg-black-10 bg-gradient-to-tr from-transparent via-transparent to-black/60">
                        </div>

                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                            <h5 className="block font-sans text-xl antialiased font-medium leading-snug tracking-normal text-blue-gray-900">
                                {college?.name}, {college?.city}, {college?.state}
                            </h5>
                            <p
                            className="flex items-center gap-1.5 font-sans text-base font-normal leading-relaxed text-blue-gray-900 antialiased">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                                className="-mt-0.5 h-5 w-5 text-yellow-700">
                                <path fillRule="evenodd"
                                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                                    clipRule="evenodd"></path>
                            </svg>
                            5.0
                        </p>
                        </div>
                        <p className="block font-sans text-base antialiased font-light leading-relaxed text-gray-700">

                            {`Acceptance Rate : \n ${(college?.admission_rate * 100).toFixed(2)}%`}
                        </p>
                        <p className="block font-sans text-base antialiased font-light leading-relaxed text-gray-700">
                            {`Average SAT score: ${college?.sat_score}`}
                        </p>
                        <p className="block font-sans text-base antialiased font-light leading-relaxed text-gray-700">
                            Average Cost of Attendance per Academic Year:<br />
                            {college?.cost_of_attendance > 0 ? (
                                <span>{formatter.format(college?.cost_of_attendance).replace(/(\.|,)00$/g, '')}</span>
                            ) : (
                                <span>N/A</span>
                            )}
                        </p>
                        <div className="inline-flex flex-wrap items-center gap-3 mt-8 group">
                            <span
                                className="cursor-pointer rounded-full border border-gray-900/5 bg-gray-900/5 p-3 text-gray-900 transition-colors hover:border-gray-900/10 hover:bg-gray-900/10 hover:!opacity-100 group-hover:opacity-70">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                                    className="w-5 h-5">
                                    <path d="M12 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z"></path>
                                    <path fillRule="evenodd"
                                        d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM18.75 9a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75V9.75a.75.75 0 00-.75-.75h-.008zM4.5 9.75A.75.75 0 015.25 9h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V9.75z"
                                        clipRule="evenodd"></path>
                                    <path
                                        d="M2.25 18a.75.75 0 000 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 00-.75-.75H2.25z">
                                    </path>
                                </svg>
                            </span>
                            <span
                                className="cursor-pointer rounded-full border border-gray-900/5 bg-gray-900/5 p-3 text-gray-900 transition-colors hover:border-gray-900/10 hover:bg-gray-900/10 hover:!opacity-100 group-hover:opacity-70">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                                    className="w-5 h-5">
                                    <path fillRule="evenodd"
                                        d="M1.371 8.143c5.858-5.857 15.356-5.857 21.213 0a.75.75 0 010 1.061l-.53.53a.75.75 0 01-1.06 0c-4.98-4.979-13.053-4.979-18.032 0a.75.75 0 01-1.06 0l-.53-.53a.75.75 0 010-1.06zm3.182 3.182c4.1-4.1 10.749-4.1 14.85 0a.75.75 0 010 1.061l-.53.53a.75.75 0 01-1.062 0 8.25 8.25 0 00-11.667 0 .75.75 0 01-1.06 0l-.53-.53a.75.75 0 010-1.06zm3.204 3.182a6 6 0 018.486 0 .75.75 0 010 1.061l-.53.53a.75.75 0 01-1.061 0 3.75 3.75 0 00-5.304 0 .75.75 0 01-1.06 0l-.53-.53a.75.75 0 010-1.06zm3.182 3.182a1.5 1.5 0 012.122 0 .75.75 0 010 1.061l-.53.53a.75.75 0 01-1.061 0l-.53-.53a.75.75 0 010-1.06z"
                                        clipRule="evenodd"></path>
                                </svg>
                            </span>
                            <span
                                className="cursor-pointer rounded-full border border-gray-900/5 bg-gray-900/5 p-3 text-gray-900 transition-colors hover:border-gray-900/10 hover:bg-gray-900/10 hover:!opacity-100 group-hover:opacity-70">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                                    className="w-5 h-5">
                                    <path
                                        d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z">
                                    </path>
                                    <path
                                        d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z">
                                    </path>
                                </svg>
                            </span>
                            <span
                                className="cursor-pointer rounded-full border border-gray-900/5 bg-gray-900/5 p-3 text-gray-900 transition-colors hover:border-gray-900/10 hover:bg-gray-900/10 hover:!opacity-100 group-hover:opacity-70">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                                    className="w-5 h-5">
                                    <path d="M19.5 6h-15v9h15V6z"></path>
                                    <path fillRule="evenodd"
                                        d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v11.25C1.5 17.16 2.34 18 3.375 18H9.75v1.5H6A.75.75 0 006 21h12a.75.75 0 000-1.5h-3.75V18h6.375c1.035 0 1.875-.84 1.875-1.875V4.875C22.5 3.839 21.66 3 20.625 3H3.375zm0 13.5h17.25a.375.375 0 00.375-.375V4.875a.375.375 0 00-.375-.375H3.375A.375.375 0 003 4.875v11.25c0 .207.168.375.375.375z"
                                        clipRule="evenodd"></path>
                                </svg>
                            </span>
                            <span
                                className="cursor-pointer rounded-full border border-gray-900/5 bg-gray-900/5 p-3 text-gray-900 transition-colors hover:border-gray-900/10 hover:bg-gray-900/10 hover:!opacity-100 group-hover:opacity-70">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                                    className="w-5 h-5">
                                    <path fillRule="evenodd"
                                        d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z"
                                        clipRule="evenodd"></path>
                                </svg>
                            </span>
                            <span
                                className="cursor-pointer rounded-full border border-gray-900/5 bg-gray-900/5 p-3 text-gray-900 transition-colors hover:border-gray-900/10 hover:bg-gray-900/10 hover:!opacity-100 group-hover:opacity-70">
                                +20
                            </span>
                        </div>
                    </div>
                    <div className="p-6 pt-3">
                        <button
                            className="block w-full select-none rounded-lg bg-gray-800 py-3.5 px-7 text-center align-middle font-sans text-sm font-bold uppercase text-white shadow-md shadow-gray-900/10 transition-all hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                            type="button">
                            Follow
                        </button>
                    </div>
                </div>
            </div>
        </div> */}
            </div>
        </>
    );
};

export default CollegeDetail;