import '../index.css';
import { useState } from 'react';
import InfiniteScrollScreen from '../components/InfiniteScroll';
import College from '../components/College';
import NotFound from '../components/NotFound';
import { baseUrl } from '../shared';
import Search from '../components/Search';
import { useCurrentUser } from '../UserProvider/UserProvider';

const Colleges = () => {
    const { user, loading, loggedIn } = useCurrentUser();
    // console.log("user", user);
    // console.log("loggedIn", loggedIn);

    const [notFound, setNotFound] = useState(false);

    const fetchColleges = async (page) => {
        // console.log("fetchColleges page", page);
        const response = await fetch(`${baseUrl}api/colleges/?page=${page}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access')}` }
        });
        const data = await response.json();
        return { colleges: data.colleges, hasMore: data.has_more };
    };

    const renderCollege = (college, index) => (
        <div key={college.id}>
            <College {...college} />
        </div>
    );

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