import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Minimize2, Maximize2, X, Mic, MicOff, Video, VideoOff } from 'lucide-react';

const VoiceCall = ({ room, user, onClose, isMinimized, onToggleMinimize, className }) => {
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
            // Use room ID for unique, safe room names, or sanitize name robustly
            // Prefixing with 'DPF_' to avoid collisions with common names on public Jitsi
            const safeRoomName = `DPF_${room.id.replace(/-/g, '')}`; 
            
            const options = {
                roomName: safeRoomName,
                width: '100%',
                height: '100%',
                parentNode: jitsiContainerRef.current,
                userInfo: {
                    displayName: user.full_name,
                    email: user.email,
                    avatarUrl: user.avatar_url?.startsWith('http') 
                        ? user.avatar_url 
                        : supabase.storage.from('avatars').getPublicUrl(user.avatar_url).data.publicUrl
                },
                configOverwrite: {
                    startWithAudioMuted: false,
                    startWithVideoMuted: true,
                    prejoinPageEnabled: false,
                    disableDeepLinking: true,
                    enableWelcomePage: false,
                    enableClosePage: false,
                    enableNoAudioDetection: true,
                    enableNoisyMicDetection: true,
                    // Force new implementation might help or disable features causing issues
                },
                interfaceConfigOverwrite: {
                    TOOLBAR_BUTTONS: [
                        'microphone', 'hangup', 'tileview', 
                        'settings', 'raisehand', 'fullscreen', 'videoquality'
                    ],
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                    MOBILE_APP_PROMO: false,
                    DEFAULT_BACKGROUND: '#0f172a',
                    showBrandWatermark: false,
                    brandWatermarkLink: '',
                    appname: 'DPF System'
                }
            };

            // Initialize API
            if (window.JitsiMeetExternalAPI) {
                // Suppress specific Jitsi warning about speaker-selection
                const originalError = console.error;
                console.error = (...args) => {
                    if (args[0] && typeof args[0] === 'string' && args[0].includes("Unrecognized feature: 'speaker-selection'")) {
                        return;
                    }
                    originalError.apply(console, args);
                };

                try {
                    jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options);
                    
                    // Add listeners to debug connection state
                    jitsiApiRef.current.addEventListeners({
                        videoConferenceLeft: () => onClose(),
                        readyToClose: () => onClose(),
                        videoConferenceJoined: (e) => console.log('Joined conference:', e),
                        videoConferenceFailed: (e) => console.error('Conference failed:', e),
                        errorOccurred: (e) => console.error('Jitsi Error:', e)
                    });
                } catch (err) {
                    console.error("Failed to initialize Jitsi:", err);
                } finally {
                    console.error = originalError;
                }
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
                transition-all duration-300 overflow-hidden bg-slate-900 
                ${isMinimized 
                    ? 'rounded-lg border border-slate-700 shadow-2xl' 
                    : ''
                }
                ${className || (isMinimized 
                    ? 'fixed bottom-20 right-4 w-64 h-48 z-[60]' 
                    : 'fixed inset-0 z-[60] md:inset-4 md:rounded-xl md:border md:border-slate-700 md:shadow-2xl'
                )}
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
                    className="absolute inset-0 top-8 cursor-pointer bg-transparent"
                    onClick={onToggleMinimize}
                    title="Clique para expandir"
                />
            )}
        </div>
    );
};

export default VoiceCall;
