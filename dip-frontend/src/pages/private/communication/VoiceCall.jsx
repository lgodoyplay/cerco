import React, { useEffect, useRef, useState } from 'react';
import { Minimize2, Maximize2, X, Mic, MicOff, Video, VideoOff } from 'lucide-react';

const VoiceCall = ({ room, user, onClose, isMinimized, onToggleMinimize }) => {
    const jitsiContainerRef = useRef(null);
    const jitsiApiRef = useRef(null);

    useEffect(() => {
        // Load Jitsi script
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => {
            if (!jitsiContainerRef.current) return;

            const domain = 'meet.jit.si';
            const options = {
                roomName: `dip-policia-system-${room.id}`, // Unique prefix
                width: '100%',
                height: '100%',
                parentNode: jitsiContainerRef.current,
                userInfo: {
                    displayName: user.full_name,
                    email: user.email 
                },
                configOverwrite: {
                    startWithAudioMuted: true,
                    startWithVideoMuted: true,
                    prejoinPageEnabled: false,
                    disableDeepLinking: true // Prevent opening app on mobile
                },
                interfaceConfigOverwrite: {
                    TOOLBAR_BUTTONS: [
                        'microphone', 'camera', 'desktop', 'fullscreen',
                        'fodeviceselection', 'hangup', 'chat', 
                        'tileview', 'videoquality', 'filmstrip'
                    ],
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                    MOBILE_APP_PROMO: false
                }
            };

            // Initialize API
            if (window.JitsiMeetExternalAPI) {
                jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options);
                
                jitsiApiRef.current.addEventListeners({
                    videoConferenceLeft: () => {
                        onClose();
                    },
                    readyToClose: () => {
                        onClose();
                    }
                });
            }
        };

        document.body.appendChild(script);

        return () => {
            if (jitsiApiRef.current) {
                jitsiApiRef.current.dispose();
            }
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, [room.id]); // Re-run if room changes, though usually we close first

    return (
        <div 
            className={`
                fixed z-[60] transition-all duration-300 shadow-2xl overflow-hidden bg-slate-900 border border-slate-700
                ${isMinimized 
                    ? 'bottom-20 right-4 w-64 h-48 rounded-lg' 
                    : 'inset-0 md:inset-4 md:rounded-xl'
                }
            `}
        >
            {/* Custom Header for Drag/Minimize */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-slate-950/80 backdrop-blur flex items-center justify-between px-3 z-10 border-b border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    {isMinimized ? 'Voz Ativa' : `Conectado em: ${room.name}`}
                </div>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={onToggleMinimize}
                        className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                        title={isMinimized ? "Maximizar" : "Minimizar"}
                    >
                        {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                    </button>
                    {!isMinimized && (
                        <button 
                            onClick={onClose}
                            className="p-1.5 hover:bg-red-900/50 rounded text-red-400 hover:text-red-200"
                            title="Sair"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Jitsi Container */}
            <div ref={jitsiContainerRef} className="w-full h-full pt-10 bg-black" />
            
            {/* Overlay when minimized to prevent iframe stealing clicks but allow drag if implemented */}
            {isMinimized && (
                <div 
                    className="absolute inset-0 top-10 cursor-pointer bg-transparent"
                    onClick={onToggleMinimize}
                    title="Clique para expandir"
                />
            )}
        </div>
    );
};

export default VoiceCall;
