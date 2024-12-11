import '../index.css';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';
import InfiniteScrollScreen from '../components/InfiniteScroll';
import College from '../components/College';
import NotFound from '../components/NotFound';
import { baseUrl } from '../shared';
import Search from '../components/Search';
import axios from "axios";
import { useCurrentUser } from '../UserProvider/UserProvider';

const Colleges = () => {
    const { user, loading, loggedIn } = useCurrentUser();
    // console.log("user", user);
    // console.log("loggedIn", loggedIn)

    const [sampleColleges, setSampleColleges] = useState([]);
    //console.log("sampleColleges here", sampleColleges);
    const { search } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [searchResult, setSearchResult] = useState([]);
    const [isLoading, setLoading] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const url = baseUrl + 'api/colleges/';

    const fetchColleges = async (page) => {
        console.log("fetchColleges page", page);
        const response = await fetch(`${baseUrl}api/colleges/?page=${page}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access')}` }
        });
        const data = await response.json();
        console.log("data!!!!!!", data);
        return { colleges: data.colleges, hasMore: data.has_more };
    };

    const renderCollege = (college, index) => (
        <div key={college.id} >
            <College {...college} />
        </div>
    );

    // const handleSearch = async () => {
    //     setLoading(true)
    //     setSearchResult([])

    //     try {

    //         const options = {
    //             method: "GET",
    //             url: url,
    //         }
    //         const response = await axios.request(options, {
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'Authorization': `Bearer ${localStorage.getItem('access')}`
    //             }
    //         });
    //         if (response.status === 404) {
    //             setNotFound(true);
    //         }
    //         else if (response.status === 401) {
    //             navigate("/login/", {
    //                 state: {
    //                     previousUrl: location.pathname
    //                 }
    //             });
    //         }
    //         setSearchResult(response.data.colleges);
    //         setSampleColleges(response.data.colleges);
    //         //console.log("RESPONSE", response.data);

    //     } catch (error) {
    //         setSearchError(error);
    //         console.log(error);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // useEffect(() => {
    //     handleSearch()
    // }, [])


    const showColleges = true;

    // if (loading) return <p>Loading...</p>;
    // if (error) return <p>Error here : {error.message}</p>;

    return (
        <>
            {loggedIn &&
                <div>
                    {notFound && <NotFound />}
                    <div className="bg-primary min-h-screen">
                        <Search />
                        {showColleges ? (
                            <>
                                <div className="flex flex-wrap justify-center">
                                    <InfiniteScrollScreen
                                        renderItem={renderCollege}
                                        fetchColleges={fetchColleges}
                                        keyExtractor={college => college.id} />
                                    {/* {sampleColleges.map((college) => {
                                        const name = college["name"];
                                        const city = college["city"];
                                        const state = college["state"];
                                        const cost_of_attendance = college["cost_of_attendance"]
                                        const acceptance_rate = college["admission_rate"]
                                        const average_sat = college["sat_score"]

                                        return (
                                            <College
                                                key={college.id}
                                                id={college.id}
                                                name={name}
                                                city={city}
                                                state={state}
                                                acceptance_rate={acceptance_rate}
                                                average_sat={average_sat}
                                                cost_of_attendance={cost_of_attendance}
                                                img={college.img}
                                            />
                                        );
                                    })} */}
                                </div>
                            </>
                        ) : null}

                    </div>
                </div>
            }
        </>
    );
}

export default Colleges;