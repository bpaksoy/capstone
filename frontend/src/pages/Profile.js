import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AddInfoModal from '../utils/AddInfoModal';
import AddBioModal from '../utils/AddBioModal';
import { useCurrentUser } from '../UserProvider/UserProvider';
import { icons, images } from '../constants';
import { baseUrl } from '../shared';
import useFetch from '../hooks/FetchData';


const Profile = () => {

    const { user, fetchUser } = useCurrentUser();
    const token = localStorage.getItem('access');

    useEffect(() => {
        fetchUser();
    }, [])

    const [userData, setUserData] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [profileImage, setProfileImage] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        console.log("file", file);
        setIsEditing(true);
        setProfileImage(file);
    };

    useEffect(() => {
        if (profileImage) {
            handleImageSave();
        }
    }, [profileImage]);


    const handleImageSave = async () => {
        const formData = new FormData();

        if (profileImage) {
            formData.append('image', profileImage);
        } else {
            alert("Please select an image to upload.");
            return;
        }

        try {
            await axios.patch(
                'http://127.0.0.1:8000/api/user/update/',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${localStorage.getItem('access')}`,
                    },
                }
            );
            setIsEditing(false);
            console.log('User image saved successfully!');
            fetchUser();
        } catch (error) {
            console.error('Error saving user image:', error);
            alert('Error saving user image. Please try again.');
        }
    };

    const { data: commentsData, loading: commentsLoading, error: commentsError, fetchData } = useFetch({}, token);
    const { data: postsData, loading: postsLoading, error: postsError, fetchData: fetchPostsData } = useFetch({}, token);


    useEffect(() => {
        const fetchComments = async () => {
            if (user?.id) {
                const url = baseUrl + `api/users/${user.id}/comments/`;
                await fetchData(url);
            }
        };
        fetchComments();
        const fetchPosts = async () => {
            if (user?.id) {
                const url = baseUrl + `api/users/${user.id}/posts/`;
                await fetchPostsData(url);
            }
        };
        fetchComments();
        fetchPosts();

    }, [user?.id]);


    const handleSave = async () => {
        try {
            await axios.put(
                'http://127.0.0.1:8000/api/user/',
                userData
            );
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving user data:', error);
        }
    };

    const handleChange = (e) => {
        setUserData({
            ...userData,
            [e.target.name]: e.target.value,
        });
    };

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
            <section className="relative py-48 bg-blueGray-200">
                <div className="container mx-auto px-4">
                    <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-xl rounded-lg -mt-64">
                        <div className="px-6">
                            <div className="flex flex-wrap justify-center">
                                <div className="w-full lg:w-3/12 px-4 lg:order-2 flex justify-center">
                                    <div className="relative">
                                        {user && (
                                            <img
                                                alt="..."
                                                src={user.image ? baseUrl + user.image : images.profile}
                                                className="shadow-xl rounded-full h-auto align-middle border-none relative -m-16 -ml-2 lg:-ml-0 max-w-150-px absolute inset-0"
                                            />
                                        )}
                                        <div className="absolute bg-white hover:bg-gray-200 rounded top-34 right-8 m-2">
                                            <button>
                                                <input type="file" style={{ display: 'none' }} onChange={handleImageChange} id="profile-upload-input" className="text-white font-bold py-2 px-4 rounded flex items-center mt-12" />
                                                <label htmlFor="profile-upload-input" className="mt-2 flex items-center justify-center cursor-pointer">
                                                    <img className="size-8" src={icons.upload} alt="upload" />
                                                </label>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full lg:w-4/12 px-4 lg:order-3 lg:text-right lg:self-center">
                                    <div className="py-6 px-3 mt-20 sm:mt-0 flex justify-center">
                                        <button className="bg-pink-500 active:bg-pink-600 uppercase text-white font-bold hover:shadow-md shadow text-xs px-4 py-2 rounded outline-none focus:outline-none mb-1 ease-linear transition-all duration-150" type="button">
                                            Connect
                                        </button>
                                    </div>
                                </div>
                                <div className="w-full lg:w-4/12 px-4 lg:order-1">
                                    <div className="flex justify-center py-4 lg:pt-4 pt-8">
                                        <div className="mr-4 p-3 text-center">
                                            <span className="text-xl font-bold block uppercase tracking-wide text-blueGray-600">22</span><span className="text-sm text-blueGray-400">Friends</span>
                                        </div>
                                        {postsLoading ? (
                                            <div>Loading...</div>
                                        ) : postsError ? (
                                            <div>Error: {postsError.message}</div>
                                        ) : (
                                            <div className="lg:mr-4 p-3 text-center">
                                                <span className="text-xl font-bold block uppercase tracking-wide text-blueGray-600">
                                                    {postsData.length}
                                                </span>
                                                <span className="text-sm text-blueGray-400">Posts</span>
                                            </div>
                                        )}
                                        {commentsLoading ? (
                                            <div>Loading...</div>
                                        ) : commentsError ? (
                                            <div>Error: {commentsError.message}</div>
                                        ) : (
                                            <div className="lg:mr-4 p-3 text-center">
                                                <span className="text-xl font-bold block uppercase tracking-wide text-blueGray-600">
                                                    {commentsData.length}
                                                </span>
                                                <span className="text-sm text-blueGray-400">Comments</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-center mt-16">
                                <h3 className="text-4xl font-semibold leading-normal mb-2 text-blueGray-700 mb-2">
                                    {user?.username}
                                </h3>
                                <AddInfoModal />
                                <div className="text-sm leading-normal mt-0 mb-2 text-blueGray-400 font-bold uppercase">
                                    <i className="fas fa-map-marker-alt mr-2 text-lg text-blueGray-400"></i>
                                    {user?.city}, {user?.state}, {user?.country}
                                </div>
                                <div className="mb-2 text-blueGray-600 mt-6">
                                    <i className="fas fa-briefcase mr-2 text-lg text-blueGray-400"></i>{user?.major}
                                </div>
                                <div className="mb-2 text-blueGray-600">
                                    <i className="fas fa-university mr-2 text-lg text-blueGray-400"></i>{user?.education}
                                </div>
                            </div>
                            <div className="mt-10 py-10 border-t border-blueGray-200 text-center">
                                <div className="flex flex-wrap justify-center">
                                    <div className="w-full lg:w-9/12 px-4">
                                        <p className="mb-4 text-lg leading-relaxed text-blueGray-700">
                                            {user?.bio}
                                        </p>

                                        <AddBioModal initialValues={{ bio: user?.bio }} />
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
};

export default Profile;

