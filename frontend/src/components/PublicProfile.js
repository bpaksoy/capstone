import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { baseUrl } from '../shared';
import { images } from '../constants';

const PublicProfile = () => {
    const location = useLocation();
    const otherUser = location.state?.otherUser;
    const { userId } = useParams();
    const [isFriend, setIsFriend] = useState(false);
    const [isPending, setIsPending] = useState(false);
    console.log("isFriend", isFriend);
    const [pendingRequests, setPendingRequests] = useState([]);
    // console.log("pendingRequests", pendingRequests);

    useEffect(() => {
        const checkFriendship = async () => {
            try {
                const response = await axios.get(`${baseUrl}api/users/${userId}/friends/`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('access')}`,
                    },
                });
                setIsFriend(response.data.is_friend);
                setIsPending(response.data.is_pending);
            } catch (error) {
                console.error("Error fetching friends:", error);
            }
        };

        checkFriendship();
    }, [userId]);


    const handleFriendRequest = async (friendId) => {
        try {
            const response = await axios({
                method: isFriend ? 'delete' : 'post',
                url: `${baseUrl}api/users/${friendId}/${isFriend ? 'unfriend/' : 'friend-request/'}`,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access')}`,
                },
            });
            console.log("Friend request response", response);
            alert(isFriend ? 'User unfriended successfully!' : 'Friend request sent!');
            // setIsFriend(!isFriend);
        } catch (error) {
            console.error('Error handling friend request:', error);
            alert('Error handling friend request.');
        }
    };

    if (!otherUser) {
        return <p>Loading...</p>;
    }

    return (
        <>
            <section className="relative block h-500-px">
                <div className="w-full h-full bg-center bg-cover bg-primary" style={{
                    backgroundImage: ``,
                    backgroundSize: 'cover',
                    height: '200px',
                    borderRadius: '5px',
                }}>

                </div>
                <div className="top-auto bottom-0 left-0 right-0 w-full absolute pointer-events-none overflow-hidden h-70-px" style={{ transform: 'translateZ(0px)' }}>
                    <svg className="absolute bottom-0 overflow-hidden" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" version="1.1" viewBox="0 0 2560 100" x="0" y="0">
                        <polygon className="text-blueGray-200 fill-current" points="2560 0 2560 100 0 100"></polygon>
                    </svg>
                </div>
            </section>
            <section>
            </section>
            <section className="relative py-48 bg-blueGray-200">
                <div className="container mx-auto px-4">
                    <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-xl rounded-lg -mt-64">
                        <div className="px-6">
                            <div className="flex flex-wrap justify-center">
                                <div className="w-full lg:w-3/12 px-4 lg:order-2 flex justify-center">
                                    <div className="relative">
                                        {otherUser && (
                                            <img
                                                alt="..."
                                                src={otherUser.image ? baseUrl + otherUser.image : images.avatar}
                                                className="shadow-xl rounded-full h-auto align-middle border-none relative -m-16 -ml-2 lg:-ml-0 max-w-150-px absolute inset-0"
                                            />
                                        )}
                                    </div>
                                </div>
                                {otherUser ? (
                                    <div className="w-full lg:w-4/12 px-4 lg:order-3 lg:text-right lg:self-center">
                                        <div className="py-6 px-3 mt-20 sm:mt-0 flex justify-center">
                                            <button className="bg-pink-500 active:bg-pink-600 uppercase text-white font-bold hover:shadow-md shadow text-xs px-4 py-2 rounded outline-none focus:outline-none mb-1 ease-linear transition-all duration-150" type="button" onClick={() => handleFriendRequest(otherUser.id)}>
                                                {isFriend ? "Disconnect" : isPending ? "Pending" : "Connect"}
                                            </button>
                                        </div>
                                    </div>) : (
                                    <div className="w-full lg:w-4/12 px-4 lg:order-3 lg:text-right lg:self-center">

                                    </div>)}
                                <div className="w-full lg:w-4/12 px-4 lg:order-1">
                                    <div className="flex justify-center py-4 lg:pt-4 pt-8">
                                        <div className="mr-4 p-3 text-center">
                                            <span className="text-xl font-bold block uppercase tracking-wide text-blueGray-600">{otherUser?.friends.length}</span><span className="text-sm text-blueGray-400">Friends</span>
                                        </div>
                                        <div className="lg:mr-4 p-3 text-center">
                                            <span className="text-xl font-bold block uppercase tracking-wide text-blueGray-600">
                                            </span>
                                            <span className="text-sm text-blueGray-400"></span>
                                        </div>
                                        <div className="lg:mr-4 p-3 text-center">
                                            <span className="text-xl font-bold block uppercase tracking-wide text-blueGray-600">
                                            </span>
                                            {/* <span className="text-sm text-blueGray-400">Comments</span> */}
                                        </div>

                                    </div>
                                </div>
                            </div>
                            <div className="text-center mt-16">
                                <h3 className="text-4xl font-semibold leading-normal mb-2 text-blueGray-700 mb-2">
                                    {otherUser?.username}
                                </h3>
                                <div className="text-sm leading-normal mt-0 mb-2 text-blueGray-400 font-bold uppercase">
                                    <i className="fas fa-map-marker-alt mr-2 text-lg text-blueGray-400"></i>
                                    {otherUser?.city || otherUser?.state || otherUser?.country ? (
                                        [otherUser?.city, otherUser?.state, otherUser?.country]
                                            .filter(item => item) // Remove empty strings
                                            .join(', ')
                                    ) : (
                                        "Add more info"
                                    )}
                                </div>
                                <div className="mb-2 text-blueGray-600 mt-6">
                                    <i className="fas fa-briefcase mr-2 text-lg text-blueGray-400"></i>{otherUser?.major}
                                </div>
                                <div className="mb-2 text-blueGray-600">
                                    <i className="fas fa-university mr-2 text-lg text-blueGray-400"></i>{otherUser?.education}
                                </div>
                            </div>
                            <div className="mt-10 py-10 border-t border-blueGray-200 text-center">
                                <div className="flex flex-wrap justify-center">
                                    <div className="w-full lg:w-9/12 px-4">
                                        <p className="mb-4 text-lg leading-relaxed text-blueGray-700">
                                            {otherUser?.bio}
                                        </p>
                                        <a href="#pablo" className="font-normal text-pink-500">Show more</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

export default PublicProfile;