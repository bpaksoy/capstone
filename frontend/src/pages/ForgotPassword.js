import { useState } from 'react';
import { useSignIn } from "@clerk/clerk-react";
import { useNavigate, Link } from 'react-router-dom';
import graduation from "../assets/images/graduation.jpg";
import { EyeIcon, EyeSlashIcon, ArrowLeftIcon, KeyIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import Loader from '../components/Loader';

export default function ForgotPassword() {
    const { isLoaded, signIn, setActive } = useSignIn();
    const navigate = useNavigate();

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [successfulCreation, setSuccessfulCreation] = useState(false);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isLoaded) {
        return <Loader text="Loading..." />;
    }

    // Phase 1: Request reset code
    const handleRequestReset = async (e) => {
        e.preventDefault();
        setIsProcessing(true);
        setError(null);

        try {
            // First, identify the user
            const si = await signIn.create({
                identifier: identifier.trim(),
            });

            // Find the reset_password_email_code factor
            const factor = si.supportedFirstFactors.find(
                (f) => f.strategy === "reset_password_email_code"
            );

            if (factor) {
                await si.prepareFirstFactor({
                    strategy: "reset_password_email_code",
                    emailAddressId: factor.emailAddressId,
                });
                setSuccessfulCreation(true);
            } else {
                setError("No password reset method available for this account. Please contact support.");
            }
        } catch (err) {
            console.error("Forgot password error:", err);
            setError(err.errors?.[0]?.message || "Something went wrong. Please check your email/username.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Phase 2: Reset password with code
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setIsProcessing(true);
        setError(null);

        try {
            const result = await signIn.attemptFirstFactor({
                strategy: "reset_password_email_code",
                code,
                password,
            });

            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId });
                navigate("/");
            } else {
                console.error("Reset password status incomplete:", result);
                setError("Incomplete reset. Please contact support.");
            }
        } catch (err) {
            console.error("Reset password error:", err);
            setError(err.errors?.[0]?.message || "Failed to reset password. Check the code and try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="py-16">
            <div className="flex bg-white rounded-3xl shadow-2xl mx-auto max-w-sm lg:max-w-4xl min-h-[500px] overflow-hidden">
                <div
                    className="hidden lg:block lg:w-1/2 bg-cover bg-center"
                    style={{ backgroundImage: `url(${graduation})` }}
                />

                <div className="w-full p-8 lg:w-1/2 flex flex-col justify-center">
                    <div className="mb-8">
                        <Link to="/login" className="text-secondary hover:text-primary transition-colors flex items-center gap-2 text-sm font-bold mb-6">
                            <ArrowLeftIcon className="w-4 h-4" />
                            Back to login
                        </Link>
                        <h2 className="text-3xl font-extrabold text-gray-900">
                            {!successfulCreation ? "Forgot Password?" : "Reset Password"}
                        </h2>
                        <p className="mt-2 text-gray-500 font-medium">
                            {!successfulCreation
                                ? "Enter your email or username and we'll send you a verification code."
                                : `We've sent a code to your registered email.`}
                        </p>
                    </div>

                    {error && (
                        <div className="p-4 mb-6 text-sm text-red-800 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3 animate-shake" role="alert">
                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {!successfulCreation ? (
                        <form onSubmit={handleRequestReset} className="space-y-6">
                            <div>
                                <label htmlFor="identifier" className="block text-gray-700 text-sm font-bold mb-2 ml-1">
                                    Email or Username
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="identifier"
                                        className="bg-gray-50 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary border border-gray-200 rounded-2xl py-3 pl-11 pr-4 block w-full transition-all text-sm font-medium"
                                        type="text"
                                        placeholder="your@email.com or username"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="bg-primary text-white font-bold py-4 px-4 w-full rounded-2xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 disabled:opacity-50 flex items-center justify-center gap-2"
                                disabled={isProcessing}
                            >
                                {isProcessing ? "Processing..." : (
                                    <>
                                        Send Code
                                        <ArrowLeftIcon className="w-4 h-4 rotate-180" />
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">Verification Code</label>
                                <input
                                    className="bg-gray-50 text-gray-900 border border-gray-200 rounded-2xl py-4 block w-full text-center tracking-widest text-2xl font-black focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    type="text"
                                    value={code}
                                    placeholder="######"
                                    onChange={(e) => setCode(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">New Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <KeyIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        className="bg-gray-50 text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary border border-gray-200 rounded-2xl py-3 pl-11 pr-12 block w-full transition-all text-sm font-medium"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your new password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeSlashIcon className="h-5 w-5" />
                                        ) : (
                                            <EyeIcon className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="bg-primary text-white font-bold py-4 px-4 w-full rounded-2xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 disabled:opacity-50"
                                disabled={isProcessing}
                            >
                                {isProcessing ? "Resetting..." : "Reset Password"}
                            </button>

                            <button
                                type="button"
                                onClick={() => setSuccessfulCreation(false)}
                                className="w-full text-sm text-secondary hover:text-primary font-bold transition-colors"
                            >
                                Didn't receive a code? Try again
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
