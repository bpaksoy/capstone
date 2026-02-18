import { useState } from 'react';
import { useSignIn } from "@clerk/clerk-react";
import { useNavigate, Link, Navigate } from 'react-router-dom';
import graduation from "../assets/images/graduation.jpg";
import { useCurrentUser } from '../UserProvider/UserProvider';
import Loader from '../components/Loader';

export default function Login() {
    const { isLoaded, signIn, setActive } = useSignIn();
    const { loggedIn, appLoading } = useCurrentUser();
    const navigate = useNavigate();

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // If already logged in, redirect
    if (loggedIn) {
        return <Navigate to="/" replace />;
    }

    if (appLoading || !isLoaded) {
        return <Loader text="Loading..." />;
    }

    const handleGoogleSignIn = async () => {
        try {
            await signIn.authenticateWithRedirect({
                strategy: "oauth_google",
                redirectUrl: "/sso-callback",
                redirectUrlComplete: "/"
            });
        } catch (err) {
            console.error("Google sign in error:", err);
            setError("Failed to start Google sign in");
        }
    };

    const login = async (e) => {
        e.preventDefault();
        if (!isLoaded) return;

        setIsLoggingIn(true);
        setError(null);

        try {
            const result = await signIn.create({
                identifier,
                password,
            });

            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId });
                navigate('/');
            } else {
                console.log(result);
                setError("Login incomplete. Please verify your account.");
            }
        } catch (err) {
            console.error("Login error:", err);
            setError(err.errors?.[0]?.message || "Invalid email or password.");
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="py-16">
            <div className="flex bg-white rounded-lg shadow-lg overflow-hidden mx-auto max-w-sm lg:max-w-4xl">
                <img className="hidden lg:block lg:w-1/2 bg-cover"
                    src={graduation} alt="graduation" />

                <div className="w-full p-8 lg:w-1/2">
                    <h2 className="text-2xl font-semibold text-gray-700 text-center">Worm</h2>
                    <p className="text-xl text-gray-600 text-center">Welcome back!</p>

                    {/* Custom Google Button */}
                    <button
                        onClick={handleGoogleSignIn}
                        className="flex items-center justify-center mt-4 w-full bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
                        type="button"
                    >
                        <div className="px-4 py-3">
                            <svg className="h-6 w-6" viewBox="0 0 40 40">
                                <path d="M36.3425 16.7358H35V16.6667H20V23.3333H29.4192C28.045 27.2142 24.3525 30 20 30C14.4775 30 10 25.5225 10 20C10 14.4775 14.4775 9.99999 20 9.99999C22.5492 9.99999 24.8683 10.9617 26.6342 12.5325L31.3483 7.81833C28.3717 5.04416 24.39 3.33333 20 3.33333C10.7958 3.33333 3.33335 10.7958 3.33335 20C3.33335 29.2042 10.7958 36.6667 20 36.6667C29.2042 36.6667 36.6667 29.2042 36.6667 20C36.6667 18.8825 36.5517 17.7917 36.3425 16.7358Z" fill="#FFC107" />
                                <path d="M5.25497 12.2425L10.7308 16.2583C12.2125 12.59 15.8008 9.99999 20 9.99999C22.5491 9.99999 24.8683 10.9617 26.6341 12.5325L31.3483 7.81833C28.3716 5.04416 24.39 3.33333 20 3.33333C13.5983 3.33333 8.04663 6.94749 5.25497 12.2425Z" fill="#FF3D00" />
                                <path d="M20 36.6667C24.305 36.6667 28.2167 35.0192 31.1742 32.34L26.0159 27.975C24.3425 29.2425 22.2625 30 20 30C15.665 30 11.9842 27.2359 10.5975 23.3784L5.16254 27.5659C7.92087 32.9634 13.5225 36.6667 20 36.6667Z" fill="#4CAF50" />
                                <path d="M36.3425 16.7358H35V16.6667H20V23.3333H29.4192C28.7592 25.1975 27.56 26.805 26.0133 27.9758C26.0142 27.975 26.015 27.975 26.0158 27.9742L31.1742 32.3392C30.8092 32.6708 36.6667 28.3333 36.6667 20C36.6667 18.8825 36.5517 17.7917 36.3425 16.7358Z" fill="#1976D2" />
                            </svg>
                        </div>
                        <span className="px-4 py-3 text-gray-600 font-bold">Sign in with Google</span>
                    </button>

                    <div className="mt-4 flex items-center justify-between">
                        <span className="border-b w-1/5 lg:w-1/4"></span>
                        <span className="text-xs text-center text-gray-500 uppercase">or login with email</span>
                        <span className="border-b w-1/5 lg:w-1/4"></span>
                    </div>

                    {error && <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">{error}</div>}

                    <form className="mt-4" onSubmit={login}>
                        <div className="mt-4">
                            <label htmlFor="identifier" className="block text-gray-700 text-sm font-bold mb-2">Email or Username</label>
                            <input
                                id="identifier"
                                className="bg-gray-200 text-gray-700 focus:outline-none focus:shadow-outline border border-gray-300 rounded py-2 px-4 block w-full appearance-none"
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mt-4">
                            <div className="flex justify-between">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                            </div>
                            <input
                                id="password"
                                value={password}
                                className="bg-gray-200 text-gray-700 focus:outline-none focus:shadow-outline border border-gray-300 rounded py-2 px-4 block w-full appearance-none"
                                type="password"
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mt-8" >
                            <button className="bg-[#17717d] text-white font-bold py-2 px-4 w-full rounded hover:bg-[#135f69] transition duration-150" disabled={isLoggingIn}>
                                {isLoggingIn ? "Logging in..." : "Login"}
                            </button>
                        </div>
                    </form>
                    <div className="mt-4 flex items-center justify-between">
                        <span className="border-b w-1/5 md:w-1/4"></span>
                        <Link to="/register" className="text-xs text-gray-500 uppercase">or sign up</Link>
                        <span className="border-b w-1/5 md:w-1/4"></span>
                    </div>
                </div>
            </div>
        </div>
    );
}