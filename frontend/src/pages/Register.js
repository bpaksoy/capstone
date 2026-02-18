import { useState } from 'react';
import { useSignUp } from "@clerk/clerk-react";
import { useNavigate, Link, Navigate } from 'react-router-dom';
import graduation from "../assets/images/graduation.jpg";
import { useCurrentUser } from '../UserProvider/UserProvider';
import Loader from '../components/Loader';

export default function Register() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const { loggedIn, appLoading } = useCurrentUser();
    const navigate = useNavigate();

    const [emailAddress, setEmailAddress] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [code, setCode] = useState("");
    const [error, setError] = useState(null);
    const [isSigningUp, setIsSigningUp] = useState(false);

    // If already logged in, redirect
    if (loggedIn) {
        return <Navigate to="/" replace />;
    }

    if (appLoading || !isLoaded) {
        return <Loader text="Loading..." />;
    }

    const handleGoogleSignUp = async () => {
        try {
            await signUp.authenticateWithRedirect({
                strategy: "oauth_google",
                redirectUrl: "/sso-callback",
                redirectUrlComplete: "/"
            });
        } catch (err) {
            console.error("Google sign up error:", err);
            setError("Failed to initiate Google sign up. Please try again.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isLoaded) return;
        setIsSigningUp(true);
        setError(null);

        try {
            await signUp.create({
                emailAddress,
                password,
                unsafeMetadata: {
                    username: username
                }
            });

            // Start email verification
            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            setVerifying(true);
        } catch (err) {
            console.error("Sign up error:", err);
            // Handle specific Clerk errors
            if (err.errors?.[0]?.code === "form_captcha_invalid") {
                setError("Please complete the human verification below.");
            } else {
                setError(err.errors?.[0]?.message || "Registration failed. Please try again.");
            }
        } finally {
            setIsSigningUp(false);
        }
    };

    const handleVerification = async (e) => {
        e.preventDefault();
        if (!isLoaded) return;
        setIsSigningUp(true);
        setError(null);

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code,
            });

            if (completeSignUp.status === "complete") {
                await setActive({ session: completeSignUp.createdSessionId });
                navigate('/');
            } else {
                setError("Verification incomplete. Please follow the instructions.");
            }
        } catch (err) {
            console.error("Verification error:", err);
            setError(err.errors?.[0]?.message || "Verification failed. Please check the code.");
        } finally {
            setIsSigningUp(false);
        }
    };

    return (
        <div className="py-16">
            <div className="flex bg-white rounded-lg shadow-lg mx-auto max-w-sm lg:max-w-4xl min-h-[600px]">
                <div
                    className="hidden lg:block lg:w-1/2 bg-cover bg-center rounded-l-lg"
                    style={{ backgroundImage: `url(${graduation})` }}
                />

                <div className="w-full p-8 lg:w-1/2">
                    <h2 className="text-2xl font-bold text-gray-800 text-center">Worm</h2>
                    <p className="text-xl text-gray-600 text-center">
                        {verifying ? "Verify your email" : "Join Our Community"}
                    </p>

                    {error && (
                        <div className="p-4 mt-4 text-sm text-red-800 rounded-lg bg-red-50 border border-red-200" role="alert">
                            {error}
                        </div>
                    )}

                    {!verifying ? (
                        <>
                            <button
                                onClick={handleGoogleSignUp}
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
                                <span className="px-4 py-3 text-gray-600 font-bold">Sign up with Google</span>
                            </button>

                            <div className="mt-4 flex items-center justify-between">
                                <span className="border-b w-1/5 lg:w-1/4"></span>
                                <span className="text-xs text-center text-gray-500 uppercase">or sign up with email</span>
                                <span className="border-b w-1/5 lg:w-1/4"></span>
                            </div>

                            <form className="mt-4" onSubmit={handleSubmit}>
                                <div className="mt-4">
                                    <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email Address</label>
                                    <input
                                        id="email"
                                        className="bg-gray-200 text-gray-700 focus:outline-none focus:shadow-outline border border-gray-300 rounded py-2 px-4 block w-full appearance-none transition-all"
                                        type="email"
                                        name="email"
                                        autoComplete="email"
                                        value={emailAddress}
                                        onChange={(e) => setEmailAddress(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="mt-4">
                                    <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">Username</label>
                                    <input
                                        id="username"
                                        className="bg-gray-200 text-gray-700 focus:outline-none focus:shadow-outline border border-gray-300 rounded py-2 px-4 block w-full appearance-none transition-all"
                                        type="text"
                                        name="username"
                                        autoComplete="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="mt-4">
                                    <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                                    <input
                                        id="password"
                                        className="bg-gray-200 text-gray-700 focus:outline-none focus:shadow-outline border border-gray-300 rounded py-2 px-4 block w-full appearance-none transition-all"
                                        type="password"
                                        name="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="new-password"
                                    />
                                </div>
                                <div className="mt-8">
                                    <button
                                        type="submit"
                                        className="bg-[#17717d] text-white font-bold py-2 px-4 w-full rounded hover:bg-[#135f69] transition duration-150 shadow-md"
                                        disabled={isSigningUp}
                                    >
                                        {isSigningUp ? "Processing..." : "Sign Up"}
                                    </button>
                                </div>
                                <div id="clerk-captcha" className="mt-4 flex justify-center min-h-[65px]"></div>
                            </form>
                            <div className="mt-4 flex items-center justify-between">
                                <span className="border-b w-1/5 md:w-1/4"></span>
                                <Link to="/login" className="text-xs text-[#17717d] hover:text-[#135f69] font-semibold uppercase">or login</Link>
                                <span className="border-b w-1/5 md:w-1/4"></span>
                            </div>
                        </>
                    ) : (
                        <form className="mt-6" onSubmit={handleVerification}>
                            <p className="mb-4 text-sm text-gray-600">
                                We've sent a verification code to <strong>{emailAddress}</strong>. Please enter it below.
                            </p>
                            <div className="mt-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Verification Code</label>
                                <input
                                    className="bg-gray-200 text-gray-700 focus:outline-none focus:shadow-outline border border-gray-300 rounded py-2 px-4 block w-full appearance-none text-center tracking-widest text-lg font-mono"
                                    type="text"
                                    value={code}
                                    placeholder="######"
                                    onChange={(e) => setCode(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mt-8">
                                <button
                                    type="submit"
                                    className="bg-[#17717d] text-white font-bold py-2 px-4 w-full rounded hover:bg-[#135f69] transition duration-150"
                                    disabled={isSigningUp}
                                >
                                    {isSigningUp ? "Verifying..." : "Verify & Login"}
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => setVerifying(false)}
                                className="mt-4 w-full text-sm text-[#17717d] hover:text-[#135f69] text-center font-medium"
                            >
                                Back to sign up
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}