import React, { useState, useEffect, useRef } from 'react';
import Search from './Search';

const PromotionalHero = () => {
    const [currentVideo, setCurrentVideo] = useState(0);
    const videos = [
        {
            src: '/assets/videos/promo-chat.mp4',
            title: 'Connecting Student Communities',
            subtitle: 'Real-time messaging with friends, staff, and ambassadors.'
        },
        {
            src: '/assets/videos/promo-ai.mp4',
            title: 'Your AI College Partner',
            subtitle: 'Advanced research and personalized insights at your fingertips.'
        },
        {
            src: '/assets/videos/promo-search.mp4',
            title: 'Discover Your Future',
            subtitle: 'Search, bookmark, and match with the perfect university.'
        }
    ];

    // Cycle videos every 6 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentVideo((prev) => (prev + 1) % videos.length);
        }, 6500);
        return () => clearInterval(timer);
    }, [videos.length]);

    return (
        <div className="relative w-full h-[85vh] min-h-[600px] overflow-hidden bg-gray-900 border-b border-white/5">
            {/* Background Videos */}
            {videos.map((v, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentVideo ? 'opacity-60' : 'opacity-0'}`}
                >
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover scale-105"
                    >
                        <source src={v.src} type="video/mp4" />
                    </video>
                    {/* Gradient Overlay for legibility */}
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-900/60 via-transparent to-gray-900" />
                </div>
            ))}

            {/* Content Overlays */}
            <div className="relative h-full flex flex-col items-center justify-center text-center px-4 z-10 pt-16">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Animated Text Section */}
                    <div className="space-y-4">
                        <div className="overflow-hidden">
                            <h1 className="text-4xl md:text-7xl font-bold text-white tracking-tight animate-slideUp">
                                {videos[currentVideo].title}
                            </h1>
                        </div>
                        <p className="text-lg md:text-xl text-white/80 font-light max-w-2xl mx-auto animate-fadeIn">
                            {videos[currentVideo].subtitle}
                        </p>
                    </div>

                    {/* Search Component with Glassmorphism */}
                    <div className="w-full pt-4 animate-float">
                        <div className="w-full max-w-2xl mx-auto backdrop-blur-md bg-white/10 p-1 sm:p-2 rounded-2xl border border-white/20 shadow-2xl">
                            <Search />
                        </div>
                        <p className="mt-4 text-xs font-bold text-teal-400 uppercase tracking-[0.2em]">
                            Search over 6,000+ top-tier institutions
                        </p>
                    </div>
                </div>

                {/* Video Indicators */}
                <div className="absolute bottom-10 flex gap-3">
                    {videos.map((_, index) => (
                        <div
                            key={index}
                            className={`h-1.5 rounded-full transition-all duration-500 ${index === currentVideo ? 'w-12 bg-primary' : 'w-4 bg-white/20'}`}
                        />
                    ))}
                </div>
            </div>

            {/* Bottom Curve/Refinement */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none" />
        </div>
    );
};

export default PromotionalHero;
