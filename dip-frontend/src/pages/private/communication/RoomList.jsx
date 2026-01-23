import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Hash, Trash2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const RoomList = ({ selectedRoom, onSelectRoom, onCreateRoom }) => {
    const [rooms, setRooms] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        fetchRooms();
        const subscription = supabase
            .channel('public:communication_rooms')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'communication_rooms' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setRooms(prev => [payload.new, ...prev]);
                } else if (payload.eventType === 'DELETE') {
                    setRooms(prev => prev.filter(r => r.id !== payload.old.id));
                    if (selectedRoom?.id === payload.old.id) {
                        onSelectRoom(null);
                    }
                }
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [selectedRoom, onSelectRoom]);

    const fetchRooms = async () => {
        const { data, error } = await supabase
            .from('communication_rooms')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setRooms(data);
    };

    const handleDelete = async (e, roomId) => {
        e.stopPropagation();
        if(!confirm('Tem certeza que deseja fechar esta frequência?')) return;
        
        await supabase.from('communication_rooms').delete().eq('id', roomId);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h2 className="font-bold text-slate-200 uppercase tracking-wider text-xs">Frequências</h2>
                <button onClick={onCreateRoom} className="p-1.5 hover:bg-slate-800 rounded-md transition-colors text-federal-400" title="Nova Frequência">
                    <Plus size={18} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {rooms.map(room => (
                    <div 
                        key={room.id}
                        onClick={() => onSelectRoom(room)}
                        className={`
                            group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors
                            ${selectedRoom?.id === room.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}
                        `}
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <Hash size={18} className={selectedRoom?.id === room.id ? 'text-federal-400' : 'text-slate-600'} />
                            <span className="truncate font-medium text-sm">{room.name}</span>
                        </div>
                        
                        {room.owner_id === user?.id && (
                             <button 
                                onClick={(e) => handleDelete(e, room.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
                                title="Fechar Sala"
                             >
                                <Trash2 size={14} />
                             </button>
                        )}
                    </div>
                ))}
                
                {rooms.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-600">
                        Nenhuma frequência ativa.
                    </div>
                )}
            </div>
            
            {/* User Mini Profile */}
            <div className="p-3 bg-slate-950/50 border-t border-slate-800 flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-federal-600 flex items-center justify-center text-xs font-bold text-white">
                    {user?.full_name?.charAt(0)}
                 </div>
                 <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">{user?.full_name}</div>
                    <div className="text-[10px] text-slate-500 truncate">#{user?.passport_id}</div>
                 </div>
            </div>
        </div>
    );
};

export default RoomList;
