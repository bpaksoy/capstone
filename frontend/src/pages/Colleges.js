import '../index.css';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';
import { LoginContext } from '../App';
import College from '../components/College';
import NotFound from '../components/NotFound';
import { baseUrl } from '../shared';
import Search from '../components/Search';
import axios from "axios";


const Colleges = () => {
    const [loggedIn, setLoggedIn] = useContext(LoginContext);
    const [colleges, setColleges] = useState([
        {
            id: 1,
            name: 'Harvard',
            city: 'Cambridge, MA',
            img: 'https://www.harvard.edu/wp-content/uploads/2021/02/091520_Stock_KS_025.jpeg?resize=1200,630',
        },
        {
            id: 2,
            name: 'MIT',
            city: 'Cambridge, MA',
            img: 'https://news.mit.edu/sites/default/files/download/201810/MIT-Computer-Announce-01-PRESS.jpg',
        },
        {
            id: 3,
            name: 'Stanford',
            city: 'Stanford, CA',
            img: 'https://news.stanford.edu/__data/assets/image/0019/90118/Vision_hero-scaled.jpg.jpeg',
        },
        {
            id: 4,
            name: 'Yale',
            city: 'New Haven, CT',
            img: 'https://admissions.yale.edu/sites/default/files/styles/flexslider_full/public/2010_05_10_19_03_37_central_campus_1.jpg?itok=1hVNjje6',
        },
        {
            id: 5,
            name: 'Cornell',
            city: 'Ithaca, NY',
            img: 'https://www.cornell.edu/about/img/main-Tower1.Still001-720x.jpg',
        },
        {
            id: 6,
            name: 'Princeton',
            city: 'Princeton, NJ',
            img: 'https://assets.simpleviewinc.com/simpleview/image/upload/c_fill,h_768,q_50,w_1024/v1/clients/princetonnj/princeton_university_main_building_at_front_gate_geraldine_scull_209cbd93-c4fc-4485-a274-66b4076c71e0.jpg',
        },
    ]);
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

    const handleSearch = async () => {
        setLoading(true)
        setSearchResult([])

        try {

            const options = {
                method: "GET",
                url: url,
            }
            const response = await axios.request(options, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access')}`
                }
            });
            if (response.status === 404) {
                setNotFound(true);
            }
            else if (response.status === 401) {
                navigate("/login/", {
                    state: {
                        previousUrl: location.pathname
                    }
                });
            }
            setSearchResult(response.data.colleges);
            setSampleColleges(response.data.colleges);
            //console.log("RESPONSE", response.data);

        } catch (error) {
            setSearchError(error);
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleSearch()
    }, [])


    const showColleges = true;

    // if (loading) return <p>Loading...</p>;
    // if (error) return <p>Error here : {error.message}</p>;

    return (
        <>
            {loggedIn &&
                <div>
                    {notFound && <NotFound />}
                    <div className="bg-primary min-h-screen rounded">
                        <Search />
                        {showColleges ? (
                            <>
                                <div className="flex flex-wrap justify-center">

                                    {sampleColleges.map((college) => {
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
                                    })}
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