import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import RoomList from './RoomList';
import ChatArea from './ChatArea';
import MemberList from './MemberList';
import CreateRoomModal from './CreateRoomModal';

const CommunicationHub = () => {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-full bg-slate-900 text-white overflow-hidden -m-4 md:-m-8">
      {/* Mobile Toggle for Room List */}
      <div className="md:hidden fixed top-20 left-4 z-40">
        <button 
            onClick={() => setShowMobileSidebar(!showMobileSidebar)} 
            className="p-2 bg-slate-800 rounded-md shadow-lg text-slate-200"
        >
           <Menu size={20} />
        </button>
      </div>

      {/* Left Sidebar - Rooms */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-64 md:inset-auto
        ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}
      `}>
          <RoomList 
            selectedRoom={selectedRoom} 
            onSelectRoom={(room) => {
                setSelectedRoom(room);
                setShowMobileSidebar(false);
            }}
            onCreateRoom={() => setIsCreateModalOpen(true)}
          />
      </div>

      {/* Center - Chat */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-800/50 relative">
        {selectedRoom ? (
            <ChatArea room={selectedRoom} />
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Menu size={48} className="opacity-20" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Bem-vindo ao Centro de Comunicação</h3>
                <p className="max-w-md text-slate-400">
                    Selecione uma sala no menu à esquerda para entrar na frequência ou crie uma nova sala para sua equipe.
                </p>
            </div>
        )}
      </div>

      {/* Right Sidebar - Members */}
      {selectedRoom && (
          <div className="hidden lg:flex w-60 border-l border-slate-800 bg-slate-950 flex-col">
              <MemberList room={selectedRoom} />
          </div>
      )}

      {/* Overlay for mobile sidebar */}
      {showMobileSidebar && (
        <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setShowMobileSidebar(false)}
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
    </div>
  );
};

export default CommunicationHub;
