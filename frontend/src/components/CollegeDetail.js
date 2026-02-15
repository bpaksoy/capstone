import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { baseUrl } from '../shared';
import { images } from '../constants';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);


const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

const CollegeDetail = () => {
    const { id: collegeId } = useParams();
    //console.log("collegeId", collegeId);
    const [college, setCollege] = useState(null);
    // console.log("College", college);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [programs, setPrograms] = useState([]);
    console.log("programs", programs);


    useEffect(() => {
        const fetchCollegeDetails = async () => {
            setIsLoading(true);
            setError(null);

            try {
                if (!collegeId) {
                    throw new Error('College ID is missing');
                }

                const token = localStorage.getItem('access');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const response = await fetch(`${baseUrl}api/colleges/${collegeId}/`, {
                    headers: headers,
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
        const fetchCollegePrograms = async () => {

            try {
                const token = localStorage.getItem('access');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const response = await fetch(`${baseUrl}api/colleges/${collegeId}/programs/`, {
                    headers: headers,
                }
                );
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setPrograms(data.programs);
            }
            catch (error) {
                setError(error);
                console.error("Error fetching college programs:", error);
            }
        }

        fetchCollegeDetails();
        fetchCollegePrograms();

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

    const mapCenter = [college.latitude, college.longitude];

    return (
        <>
            <div className="bg-primary min-h-screen">
                <div className="container mx-auto px-4 py-8">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex flex-col md:flex-row items-start gap-8">
                            <img src={images.collegeImg} alt={college.name} className="w-64 h-64 rounded-lg object-cover shadow-md md:w-auto md:max-w-[300px]" />
                            <div>
                                <h1 className="text-3xl font-bold mb-2">{college.name}</h1>
                                <p className="text-gray-600 text-lg mb-4">{college.city}, {college.state}</p>
                                <div className="flex flex-wrap gap-4 mb-4">
                                    <div className="bg-blue-100 p-3 rounded-lg flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                                        </svg>
                                        <p className="font-medium">Acceptance Rate: {(college.admission_rate * 100).toFixed(2)}%</p>
                                    </div>
                                    <div className="bg-blue-100 p-3 rounded-lg flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                                        </svg>
                                        <p className="font-medium">Average SAT: {college.sat_score}</p>
                                    </div>
                                    <div className="bg-blue-100 p-3 rounded-lg flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                        </svg>
                                        <p className="font-medium">Cost: {formatter.format(college.cost_of_attendance).replace(/(\.|,)00$/g, '')}</p>
                                    </div>
                                    <div className="bg-blue-100 p-3 rounded-lg flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                        </svg>
                                        <p className="font-medium">Tuition in state: {formatter.format(college.tuition_in_state).replace(/(\.|,)00$/g, '')}</p>
                                    </div>
                                    <div className="bg-blue-100 p-3 rounded-lg flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                        </svg>
                                        <p className="font-medium">Tuition out of state: {formatter.format(college.tuition_out_state).replace(/(\.|,)00$/g, '')}</p>
                                    </div>
                                    <div className="bg-blue-100 p-3 rounded-lg flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
                                        </svg>
                                        <p className="font-medium">Full-time faculty rate: {(college.ft_faculty_rate * 100).toFixed(2)}%</p>
                                    </div>
                                </div>


                                <p className="text-gray-700 mb-4">Lorem ipsum.....</p>
                                {programs && programs.length > 0 && (
                                    <div className="mt-8">
                                        <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Programs Offered</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {programs.map(program => (
                                                <div key={program.id} className="bg-gray-50 hover:bg-white border border-gray-100 p-4 rounded-xl transition-all duration-300 hover:shadow-md hover:border-blue-100 group flex items-start gap-3">
                                                    <div className="bg-white p-2 rounded-lg text-blue-500 group-hover:text-blue-600 transition-colors shadow-sm">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800 leading-tight group-hover:text-blue-800 transition-colors">
                                                            {program.cipdesc}
                                                        </p>
                                                        {program.creddesc && (
                                                            <p className="text-sm text-gray-500 mt-1 font-medium">
                                                                {program.creddesc}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}


                                <a href={college.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{college.website}</a>
                                {college.latitude && college.longitude &&
                                    <div className="mt-8 h-[300px] w-full md:w-[600px]">
                                        <div className="mt-8 rounded-lg shadow-md overflow-hidden">
                                            <MapContainer
                                                center={mapCenter}
                                                zoom={13}
                                                style={{ height: '300px', width: '100%' }}
                                                className="rounded-lg" // Applying border-radius to MapContainer
                                            >
                                                <TileLayer
                                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                />
                                                <Marker position={mapCenter}>
                                                    <Popup>{college.name}</Popup>
                                                </Marker>
                                            </MapContainer>
                                        </div>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CollegeDetail;