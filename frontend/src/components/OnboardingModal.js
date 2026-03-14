import React, { useState, useEffect } from 'react';
import { SparklesIcon as SparklesIconSolid } from '@heroicons/react/24/solid';
import { MagnifyingGlassIcon, ChatBubbleLeftRightIcon, AcademicCapIcon, BriefcaseIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline';
import { useCurrentUser } from '../UserProvider/UserProvider';
import axios from 'axios';
import { baseUrl } from '../shared';

const OnboardingModal = () => {
    const { user, fetchUser, loggedIn } = useCurrentUser();
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedRole, setSelectedRole] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const baseSteps = [
        {
            id: 'welcome',
            title: "Welcome to Worm! 🎓",
            description: "Your AI-powered journey to finding the perfect college match starts here. Let's take a quick tour of what you can do.",
            icon: <SparklesIconSolid className="w-16 h-16 text-[#A855F7] drop-shadow-lg" />
        },
        {
            id: 'wormie',
            title: "Meet Wormie, Your AI Guide 🤖",
            description: "Have a question about tuition, acceptance rates, or campus life? Just ask Wormie! Our smart AI counselor is always ready to help you out on the right hand side.",
            icon: <img src="/wormie-logo.svg" alt="Wormie" className="w-[72px] h-[72px] drop-shadow-xl" />
        },
        {
            id: 'discover',
            title: "Discover & Smart Match 🎯",
            description: "Search out of 7,000+ colleges using advanced filters. Bookmark your favorites, and our recommendation engine will find hidden gems tailored to your stats.",
            icon: <MagnifyingGlassIcon className="w-20 h-20 text-[#24adbf] drop-shadow-xl" />
        },
        {
            id: 'connect',
            title: "Connect in College Hubs 💬",
            description: "Join the conversation! Every college has a dedicated hub where you can post questions, share thoughts, and DM other prospective students or verified staff.",
            icon: <ChatBubbleLeftRightIcon className="w-20 h-20 text-teal-300 drop-shadow-xl" />
        }
    ];

    const [steps, setSteps] = useState(baseSteps);

    useEffect(() => {
        if (loggedIn && user && !user.has_selected_role) {
            const roleStep = {
                id: 'role',
                title: "Complete Your Profile",
                description: "Tell us who you are so we can tailor your experience.",
                icon: <BuildingLibraryIcon className="w-20 h-20 text-amber-500 drop-shadow-xl" />,
                isRoleSelection: true
            };
            setSteps([roleStep, ...baseSteps]);
            setIsOpen(true);
        } else {
            setSteps(baseSteps);
            const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
            if (!hasSeenOnboarding && loggedIn) {
                setIsOpen(true);
            }
        }
    }, [user, loggedIn]);

    const handleRoleSelection = async (role) => {
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('access');
            await axios.patch(`${baseUrl}api/user/update/`, {
                role: role,
                has_selected_role: true
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchUser();
            handleNext();
        } catch (error) {
            console.error("Error saving role:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleClose();
        }
    };

    const handleClose = () => {
        localStorage.setItem('hasSeenOnboarding', 'true');
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 transition-opacity">
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col transform transition-all animate-slideUp">

                {/* Header Graphic */}
                <div className="h-40 w-full bg-[#17717d] flex items-center justify-center transition-colors duration-500">
                    <span className="text-6xl filter drop-shadow-md animate-bounce-slow">
                        {steps[currentStep].icon}
                    </span>
                </div>

                {/* Content */}
                <div className="p-8 text-center flex-1 flex flex-col justify-center min-h-[200px]">
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-4 tracking-tight">
                        {steps[currentStep].title}
                    </h2>
                    
                    {steps[currentStep].isRoleSelection ? (
                        <div className="space-y-4 mt-2">
                             <div className="grid grid-cols-1 gap-3">
                                <button 
                                    onClick={() => handleRoleSelection('student')}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-purple hover:bg-purple/5 transition-all text-left group"
                                >
                                    <div className="bg-purple/10 p-3 rounded-xl group-hover:scale-110 transition-transform">
                                        <AcademicCapIcon className="w-6 h-6 text-purple" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">I am a Student</p>
                                        <p className="text-xs text-gray-500">I'm looking for my dream college</p>
                                    </div>
                                </button>
                                <button 
                                    onClick={() => handleRoleSelection('advisor')}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-[#17717d] hover:bg-[#17717d]/5 transition-all text-left group"
                                >
                                    <div className="bg-[#17717d]/10 p-3 rounded-xl group-hover:scale-110 transition-transform">
                                        <BriefcaseIcon className="w-6 h-6 text-[#17717d]" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">I am an Advisor</p>
                                        <p className="text-xs text-gray-500">I want to help students succeed</p>
                                    </div>
                                </button>
                                <button 
                                    onClick={() => handleRoleSelection('college_staff')}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-amber-500 hover:bg-amber-50 transition-all text-left group"
                                >
                                    <div className="bg-amber-100 p-3 rounded-xl group-hover:scale-110 transition-transform">
                                        <BuildingLibraryIcon className="w-6 h-6 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">College Representative</p>
                                        <p className="text-xs text-gray-500">I represent an institution</p>
                                    </div>
                                </button>
                             </div>
                        </div>
                    ) : (
                        <p className="text-gray-600 text-base leading-relaxed">
                            {steps[currentStep].description}
                        </p>
                    )}
                </div>

                {/* Progress Indicators */}
                <div className="flex justify-center gap-2 mb-6">
                    {steps.map((_, idx) => (
                        <div
                            key={idx}
                            onClick={() => setCurrentStep(idx)}
                            className={`h-2 rounded-full transition-all duration-300 cursor-pointer hover:opacity-80 ${idx === currentStep ? 'w-8 bg-[#17717d]' : 'w-2 bg-gray-200'}`}
                        />
                    ))}
                </div>

                {/* Footer Controls */}
                <div className="px-8 pb-8 flex items-center justify-between">
                    {!steps[currentStep].isRoleSelection && (
                        <button
                            onClick={handleClose}
                            className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                        >
                            Skip
                        </button>
                    )}
                    {!steps[currentStep].isRoleSelection && (
                        <button
                            onClick={handleNext}
                            className="px-6 py-2.5 bg-gray-900 hover:bg-primary text-white font-semibold rounded-xl shadow-md transition-all active:scale-95 ml-auto"
                        >
                            {currentStep === steps.length - 1 ? "Get Started" : "Next"}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default OnboardingModal;
