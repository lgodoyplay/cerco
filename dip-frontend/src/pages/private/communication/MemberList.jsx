import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { UserMinus } from 'lucide-react';

const MemberList = ({ room }) => {
    const { user } = useAuth();
    const [members, setMembers] = useState([]);

    useEffect(() => {
        if (!room?.id) return;

        fetchMembers();

        const subscription = supabase
            .channel(`members:${room.id}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'communication_room_members',
                filter: `room_id=eq.${room.id}`
            }, () => {
                // Simplest strategy: refetch on any change
                fetchMembers();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [room.id]);

    const fetchMembers = async () => {
        const { data, error } = await supabase
            .from('communication_room_members')
            .select(`
                user_id,
                joined_at,
                profiles ( id, full_name, username, avatar_url, role, passport_id )
            `)
            .eq('room_id', room.id)
            .order('joined_at', { ascending: true });
        
        if (data) {
            setMembers(data);
        }
    };

    const handleKick = async (memberUserId) => {
        if(!confirm('Remover usuário da sala?')) return;
        await supabase.from('communication_room_members')
            .delete()
            .match({ room_id: room.id, user_id: memberUserId });
    };

    const isOwner = user?.id === room.owner_id;

    return (
        <div className="flex flex-col h-full bg-slate-950">
            <div className="p-4 border-b border-slate-800">
                <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider">
                    Disponíveis — {members.length}
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {members.map((member) => (
                    <div key={member.user_id} className="flex items-center gap-3 p-3 rounded hover:bg-slate-800 transition-colors cursor-pointer group opacity-90 hover:opacity-100">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-600 group-hover:border-slate-500 transition-colors">
                                {member.profiles?.avatar_url ? (
                                    <img src={member.profiles.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                                ) : (
                                    <span className="text-sm font-bold text-slate-300">{member.profiles?.full_name?.[0]}</span>
                                )}
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-950 rounded-full"></div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-slate-300 group-hover:text-white truncate">
                                {member.profiles?.full_name || 'Usuário'}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                                {member.profiles?.passport_id && <span>#{member.profiles.passport_id}</span>}
                                {member.profiles?.role && <span>• {member.profiles.role}</span>}
                            </div>
                        </div>
                        
                        {isOwner && member.user_id !== user?.id && (
                             <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleKick(member.user_id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded transition-all"
                                title="Remover da sala"
                             >
                                <UserMinus size={14} />
                             </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MemberList;
