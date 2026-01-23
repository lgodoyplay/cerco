import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import RoomList from './RoomList';
import ChatArea from './ChatArea';
import MemberList from './MemberList';
import CreateRoomModal from './CreateRoomModal';
import RoomPasswordModal from './RoomPasswordModal';
import VoiceCall from './VoiceCall';
import { useAuth } from '../../../context/AuthContext';

const CommunicationHub = () => {
  const { user } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [passwordRoom, setPasswordRoom] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMobileMembers, setShowMobileMembers] = useState(false);
  
  // Voice State
  const [isInCall, setIsInCall] = useState(false);
  const [isCallMinimized, setIsCallMinimized] = useState(false);

  const handleSelectRoom = (room) => {
    // Se for o dono, entra direto
    if (room.owner_id === user.id) {
        setSelectedRoom(room);
        setShowMobileSidebar(false);
        return;
    }

    // Se tiver senha, pede
    if (room.password) {
        setPasswordRoom(room);
    } else {
        // Sem senha (não deve acontecer com a nova regra, mas ok)
        setSelectedRoom(room);
        setShowMobileSidebar(false);
    }
  };

  const handlePasswordSuccess = () => {
      setSelectedRoom(passwordRoom);
      setPasswordRoom(null);
      setShowMobileSidebar(false);
  };

  return (
    <div className="flex h-full bg-slate-900 text-white overflow-hidden rounded-xl shadow-2xl border border-slate-800">
      {/* Mobile Toggle for Room List is now in ChatArea Header or handled below */}

      {/* Left Sidebar - Rooms */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-64 md:inset-auto
        ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}
      `}>
          <RoomList 
            selectedRoom={selectedRoom} 
            onSelectRoom={handleSelectRoom}
            onCreateRoom={() => setIsCreateModalOpen(true)}
          />
      </div>

      {/* Center - Chat */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-800/50 relative">
        {selectedRoom ? (
            <ChatArea 
                room={selectedRoom} 
                onOpenRooms={() => setShowMobileSidebar(true)}
                onOpenMembers={() => setShowMobileMembers(true)}
                onJoinVoice={() => {
                    setIsInCall(true);
                    setIsCallMinimized(true); // Start minimized so it doesn't cover chat
                }}
            />
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                <div className="md:hidden absolute top-4 left-4">
                     <button 
                        onClick={() => setShowMobileSidebar(true)}
                        className="p-2 bg-slate-800 rounded-md text-white"
                     >
                        <Menu size={20} />
                     </button>
                </div>

                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Menu size={48} className="opacity-20" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Bem-vindo ao Centro de Comunicação</h3>
                <p className="max-w-md text-slate-400">
                    Selecione uma sala no menu à esquerda para entrar na frequência ou crie uma nova sala para sua equipe.
                </p>
            </div>
        )}

        {/* Voice Call Overlay - Now Inside Center Column */}
        {isInCall && selectedRoom && (
            <VoiceCall 
                room={selectedRoom} 
                user={user}
                onClose={() => setIsInCall(false)}
                isMinimized={isCallMinimized}
                onToggleMinimize={() => setIsCallMinimized(!isCallMinimized)}
                className={isCallMinimized 
                    ? 'absolute top-16 right-4 w-64 h-48 z-40' // Minimized: Top-Right (below header) to avoid input
                    : 'absolute inset-0 z-40' // Maximized: Full Chat Area
                }
            />
        )}
      </div>

      {/* Right Sidebar - Members (Desktop) */}
      {selectedRoom && (
          <div className="hidden lg:flex w-60 border-l border-slate-800 bg-slate-950 flex-col">
              <MemberList room={selectedRoom} />
          </div>
      )}

      {/* Right Sidebar - Members (Mobile/Tablet Drawer) */}
      {selectedRoom && (
        <div className={`
            fixed inset-y-0 right-0 z-50 w-72 bg-slate-950 border-l border-slate-800 transform transition-transform duration-300 ease-in-out lg:hidden
            ${showMobileMembers ? 'translate-x-0' : 'translate-x-full'}
        `}>
            <MemberList room={selectedRoom} />
        </div>
      )}

      {/* Overlay for mobile sidebars */}
      {(showMobileSidebar || showMobileMembers) && (
        <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden lg:hidden"
            onClick={() => {
                setShowMobileSidebar(false);
                setShowMobileMembers(false);
            }}
        />
      )}

      {isCreateModalOpen && (
          <CreateRoomModal 
              onClose={() => setIsCreateModalOpen(false)} 
              onCreated={(room) => {
                  setSelectedRoom(room);
                  setIsCreateModalOpen(false);
              }} 
          />
      )}

      {passwordRoom && (
          <RoomPasswordModal
              room={passwordRoom}
              onClose={() => setPasswordRoom(null)}
              onSuccess={handlePasswordSuccess}
          />
      )}
    </div>
  );
};

export default CommunicationHub;
