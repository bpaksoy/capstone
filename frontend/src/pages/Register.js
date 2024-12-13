import { useState, useEffect, useContext } from 'react';
import { baseUrl } from '../shared';
import { useLocation, useNavigate } from 'react-router-dom';
import graduation from '../assets/images/graduation.jpg';
import { useCurrentUser } from '../UserProvider/UserProvider';
import { Link } from 'react-router-dom';

export default function Register() {
    const { user, loading, loggedIn, updateLoggedInStatus } = useCurrentUser();

    const [person, setPerson] = useState({
        firstName: '',
        lastName: '',
    });
    const [firstName, setFirstName] = useState();
    const [lastName, setLastName] = useState();
    const [username, setUsername] = useState();
    const [password, setPassword] = useState();
    const [email, setEmail] = useState();

    const location = useLocation();
    const navigate = useNavigate();

    function handleFirstNameChange(e) {
        setPerson({
            ...person, // Copy the old fields
            firstName: e.target.value // But override this one
        });
        setFirstName(e.target.value)
    }

    function handleLastNameChange(e) {
        setPerson({
            ...person, // Copy the old fields
            lastName: e.target.value // But override this one
        });
        setLastName(e.target.value)
    }

    useEffect(() => {
        localStorage.clear();
        updateLoggedInStatus(false);
    }, []);



    const register = (e) => {
        e.preventDefault();

        if (!firstName || !lastName || !username || !email || !password) {
            return alert('Name, Username, email, and password are required.');
        }
        const url = baseUrl + 'api/register/';
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                email: email,
                username: username,
                password: password,
            }),
        })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then((errorData) => {
                        throw new Error(errorData.detail || 'Registration failed.');
                    });
                }
                return response.json();
            })
            .then((data) => {

                localStorage.setItem('access', data.access);
                localStorage.setItem('refresh', data.refresh);
                updateLoggedInStatus(true);
                navigate(
                    location?.state?.previousUrl
                        ? location.state.previousUrl
                        : '/'
                );
            })
            .catch((error) => {
                console.error('Registration error:', error);
                alert('Registration failed. Please try again later.');
            });
    }

    return (
        <div className="py-16">
            <div className="flex bg-white rounded-lg shadow-lg overflow-hidden mx-auto max-d-md lg:max-w-6xl">
                <div className="flex justify-center px-6 py-12">

                    <div className="w-full xl:w-3/4 lg:w-11/12 flex">

                        <img className="hidden lg:block lg:w-1/2 bg-cover rounded-lg"
                            src={graduation} alt="graduation" />

                        <div className="w-full lg:w-7/12 bg-white dark:bg-gray-700 p-5 rounded-lg lg:rounded-l-none">
                            <h3 className="py-4 text-2xl text-center text-gray-800 dark:text-white">Create an Account!</h3>
                            <form className="px-8 pt-6 pb-8 mb-4 bg-white dark:bg-gray-800 rounded" id="user" onSubmit={register}>
                                <div className="mb-4 md:flex md:justify-between">
                                    <div className="mb-4 md:mr-2 md:mb-0">
                                        <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-white" for="firstName">
                                            First Name
                                        </label>
                                        <input
                                            className="w-full px-3 py-2 text-sm leading-tight text-gray-700 dark:text-white border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                                            id="firstName"
                                            type="text"
                                            placeholder="First Name"
                                            value={person.firstName}
                                            onChange={handleFirstNameChange}
                                        />
                                    </div>
                                    <div className="md:ml-2">
                                        <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-white" for="lastName">
                                            Last Name
                                        </label>
                                        <input
                                            className="w-full px-3 py-2 text-sm leading-tight text-gray-700 dark:text-white border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                                            id="lastName"
                                            type="text"
                                            placeholder="Last Name"
                                            value={person.lastName}
                                            onChange={handleLastNameChange}
                                        />
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-white" for="email">
                                        Email
                                    </label>
                                    <input
                                        className="w-full px-3 py-2 mb-3 text-sm leading-tight text-gray-700 dark:text-white border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                                        id="email"
                                        type="email"
                                        placeholder="Email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                        }}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-white" for="email">
                                        Username
                                    </label>
                                    <input
                                        className="w-full px-3 py-2 mb-3 text-sm leading-tight text-gray-700 dark:text-white border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                                        id="username"
                                        placeholder="Username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => {
                                            setUsername(e.target.value);
                                        }}
                                    />
                                </div>
                                <div className="mb-4 md:flex md:justify-between">
                                    <div className="mb-4">
                                        <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-white" for="password">
                                            Password
                                        </label>
                                        <input
                                            className="w-full px-3 py-2 mb-3 text-sm leading-tight text-gray-700 dark:text-white border  rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                                            id="password"
                                            type="password"
                                            placeholder="******************"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                            }}
                                        />
                                        <p className="text-xs italic text-red-500">Please choose a password.</p>
                                    </div>
                                </div>
                                <div className="mb-6 text-center">
                                    <button
                                        className="bg-gray-700 text-white font-bold py-2 px-4 w-full rounded-lg hover:bg-gray-600"
                                    >
                                        Register Account
                                    </button>
                                </div>
                                <hr className="mb-6 border-t" />
                                <div className="text-center">
                                    {/* <a className="inline-block text-sm text-blue-500 dark:text-blue-500 align-baseline hover:text-blue-800"
                                        href="#">
                                        Forgot Password?
                                    </a> */}
                                </div>
                                <div className="text-center">
                                    <Link to="login" className="inline-block text-sm text-blue-500 dark:text-blue-500 align-baseline hover:text-blue-800"
                                        href="./index.html">
                                        Already have an account? Login!
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}