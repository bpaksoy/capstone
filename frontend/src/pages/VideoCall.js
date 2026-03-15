import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../UserProvider/UserProvider';

const VideoCall = () => {
    const { roomName } = useParams();
    const { user } = useCurrentUser();
    const navigate = useNavigate();

    useEffect(() => {
        // Load Jitsi script
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
            const domain = 'meet.jit.si';
            const options = {
                roomName: roomName,
                width: '100%',
                height: '100%',
                parentNode: document.querySelector('#jitsi-container'),
                userInfo: {
                    displayName: user ? `${user.first_name} ${user.last_name || ''}` : 'Guest'
                },
                configOverwrite: {
                    startWithAudioMuted: false,
                    startWithVideoMuted: false,
                    prejoinPageEnabled: false
                },
                interfaceConfigOverwrite: {
                    TILE_VIEW_MAX_COLUMNS: 2,
                    SHOW_JITSI_WATERMARK: false,
                    GENERATE_ROOMNAMES_ON_WELCOME_PAGE: false,
                    DISPLAY_WELCOME_PAGE_CONTENT: false
                }
            };
            const api = new window.JitsiMeetExternalAPI(domain, options);

            api.addEventListener('videoConferenceLeft', () => {
                navigate('/messages');
            });
        };

        return () => {
            document.body.removeChild(script);
        };
    }, [roomName, user, navigate]);

    return (
        <div className="flex flex-col h-screen bg-gray-900 pt-16">
            <div className="flex-1 overflow-hidden" id="jitsi-container">
                {/* Jitsi IFrame will mount here */}
            </div>
            <div className="p-4 bg-gray-800 text-center flex items-center justify-between px-8">
                <div className="flex items-center gap-4">
                    <img src="/logo192.png" className="w-8 h-8 rounded-full bg-white p-1" alt="Wormie" />
                    <span className="text-white font-bold tracking-tight">Wormie Virtual Consultation</span>
                </div>
                <button 
                    onClick={() => navigate('/messages')}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl font-bold transition-all"
                >
                    Leave Call
                </button>
            </div>
        </div>
    );
};

export default VideoCall;
