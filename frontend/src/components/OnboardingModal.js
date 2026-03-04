import React, { useState, useEffect } from 'react';
import { SparklesIcon as SparklesIconSolid } from '@heroicons/react/24/solid';
import { MagnifyingGlassIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

const OnboardingModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            title: "Welcome to Worm! 🎓",
            description: "Your AI-powered journey to finding the perfect college match starts here. Let's take a quick tour of what you can do.",
            icon: <SparklesIconSolid className="w-16 h-16 text-[#A855F7] drop-shadow-lg" />
        },
        {
            title: "Meet Wormie, Your AI Guide 🤖",
            description: "Have a question about tuition, acceptance rates, or campus life? Just ask Wormie! Our smart AI counselor is always ready to help you out on the right hand side.",
            icon: <img src="/wormie-logo.svg" alt="Wormie" className="w-[72px] h-[72px] drop-shadow-xl" />
        },
        {
            title: "Discover & Smart Match 🎯",
            description: "Search out of 7,000+ colleges using advanced filters. Bookmark your favorites, and our recommendation engine will find hidden gems tailored to your stats.",
            icon: <MagnifyingGlassIcon className="w-20 h-20 text-[#24adbf] drop-shadow-xl" />
        },
        {
            title: "Connect in College Hubs 💬",
            description: "Join the conversation! Every college has a dedicated hub where you can post questions, share thoughts, and DM other prospective students or verified staff.",
            icon: <ChatBubbleLeftRightIcon className="w-20 h-20 text-teal-300 drop-shadow-xl" />
        }
    ];

    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
        if (!hasSeenOnboarding) {
            setIsOpen(true);
        }
    }, []);

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
                    <p className="text-gray-600 text-base leading-relaxed">
                        {steps[currentStep].description}
                    </p>
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
                    <button
                        onClick={handleClose}
                        className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                    >
                        Skip
                    </button>
                    <button
                        onClick={handleNext}
                        className="px-6 py-2.5 bg-gray-900 hover:bg-primary text-white font-semibold rounded-xl shadow-md transition-all active:scale-95"
                    >
                        {currentStep === steps.length - 1 ? "Get Started" : "Next"}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default OnboardingModal;
