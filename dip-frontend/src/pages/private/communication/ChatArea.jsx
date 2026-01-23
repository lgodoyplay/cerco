import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { Send, Hash, Phone, Menu, Users, Mic } from 'lucide-react';

const ChatArea = ({ room, onOpenRooms, onOpenMembers, onJoinVoice }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!room?.id || !user?.id) return;

        let subscription;

        const joinRoom = async () => {
            setLoading(true);
            setMessages([]);

            // 1. Join (add member) - Upsert to avoid error if already there
            try {
                await supabase.from('communication_room_members').upsert({
                    room_id: room.id,
                    user_id: user.id,
                    joined_at: new Date().toISOString()
                }, { onConflict: 'room_id, user_id' });
            } catch (err) {
                console.error("Error joining room:", err);
            }

            // 2. Fetch Messages
            const { data: messagesData, error: messagesError } = await supabase
                .from('communication_messages')
                .select('*')
                .eq('room_id', room.id)
                .order('created_at', { ascending: true });
            
            if (messagesData) {
                // Fetch profiles for these messages
                const userIds = [...new Set(messagesData.map(m => m.user_id))];
                
                if (userIds.length > 0) {
                    const { data: profilesData } = await supabase
                        .from('profiles')
                        .select('id, full_name, username, avatar_url')
                        .in('id', userIds);
                    
                    if (profilesData) {
                        const profilesMap = profilesData.reduce((acc, p) => {
                            acc[p.id] = p;
                            return acc;
                        }, {});

                        const messagesWithProfiles = messagesData.map(msg => ({
                            ...msg,
                            profiles: profilesMap[msg.user_id]
                        }));
                        
                        setMessages(messagesWithProfiles);
                    } else {
                        setMessages(messagesData);
                    }
                } else {
                    setMessages(messagesData);
                }
            }
            
            setLoading(false);
            scrollToBottom();

            // 3. Subscribe
            subscription = supabase
                .channel(`room:${room.id}`)
                .on('postgres_changes', { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'communication_messages',
                    filter: `room_id=eq.${room.id}`
                }, async (payload) => {
                    // Fetch the user details for the new message
                    const { data: userData } = await supabase
                        .from('profiles')
                        .select('full_name, username, avatar_url')
                        .eq('id', payload.new.user_id)
                        .single();

                    const newMsg = { ...payload.new, profiles: userData };
                    setMessages(prev => [...prev, newMsg]);
                    scrollToBottom();
                })
                .subscribe();
        };

        joinRoom();

        return () => {
            // Leave room logic - wrapped in async but cleanup can't be async directly
            // We fire and forget
            supabase.from('communication_room_members')
                .delete()
                .match({ room_id: room.id, user_id: user.id })
                .then(() => {});

            if (subscription) subscription.unsubscribe();
        };
    }, [room.id, user.id]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const content = newMessage.trim();
        setNewMessage('');

        await supabase.from('communication_messages').insert({
            room_id: room.id,
            user_id: user.id,
            content: content
        });
    };

    const handleCall = () => {
        if (room.discord_call_link) {
            window.open(room.discord_call_link, '_blank');
        } else {
            alert('Nenhum link de call configurado para esta sala.');
        }
    };

    const formatTime = (isoString) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="h-14 border-b border-slate-700 flex items-center justify-between px-4 bg-slate-800 shadow-sm z-10">
                <div className="flex items-center gap-2">
                    {/* Mobile Menu Button */}
                    <button 
                        onClick={onOpenRooms}
                        className="md:hidden mr-1 text-slate-400 hover:text-white"
                    >
                        <Menu size={20} />
                    </button>
                    
                    <Hash className="text-slate-400" size={24} />
                    <div>
                        <h3 className="font-bold text-white">{room.name}</h3>
                        <p className="text-xs text-slate-400">Canal de Texto</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={onJoinVoice}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
                    >
                        <Mic size={16} />
                        <span className="hidden sm:inline">Entrar na Voz</span>
                    </button>

                    {room.discord_call_link && (
                        <button 
                            onClick={handleCall}
                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
                            title="Abrir Discord Externo"
                        >
                            <Phone size={16} />
                            <span className="hidden sm:inline">Discord</span>
                        </button>
                    )}
                    
                    {/* Mobile Members Toggle */}
                    <button 
                        onClick={onOpenMembers}
                        className="lg:hidden p-2 text-slate-400 hover:text-white"
                    >
                        <Users size={20} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-800/50">
                {loading ? (
                    <div className="flex justify-center pt-10 text-slate-500">
                        Carregando mensagens...
                    </div>
                ) : (
                    <>
                        <div className="text-center text-slate-600 my-4 text-xs">
                            <span className="bg-slate-800 px-2 py-1 rounded-full">Início da conversa em #{room.name}</span>
                        </div>
                        
                        {messages.map((msg, index) => {
                            const showHeader = index === 0 || messages[index - 1].user_id !== msg.user_id || (new Date(msg.created_at) - new Date(messages[index - 1].created_at) > 60000 * 5);

                            return (
                                <div key={msg.id} className={`flex gap-3 ${showHeader ? 'mt-4' : 'mt-0.5'} group hover:bg-slate-800/30 -mx-4 px-4 py-0.5`}>
                                    {showHeader ? (
                                        <div className="w-10 h-10 rounded-full bg-slate-700 flex-shrink-0 overflow-hidden mt-0.5">
                                             {msg.profiles?.avatar_url ? (
                                                 <img src={msg.profiles.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                                             ) : (
                                                 <div className="w-full h-full flex items-center justify-center font-bold text-slate-300">
                                                     {msg.profiles?.full_name?.[0] || '?'}
                                                 </div>
                                             )}
                                        </div>
                                    ) : (
                                        <div className="w-10 flex-shrink-0 text-[10px] text-slate-600 text-right opacity-0 group-hover:opacity-100 select-none flex items-center justify-end h-6">
                                            {formatTime(msg.created_at)}
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        {showHeader && (
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-medium text-white hover:underline cursor-pointer">
                                                    {msg.profiles?.full_name || 'Usuário Desconhecido'}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    {new Date(msg.created_at).toLocaleDateString()} {formatTime(msg.created_at)}
                                                </span>
                                            </div>
                                        )}
                                        <p className="text-slate-300 whitespace-pre-wrap break-words leading-relaxed">
                                            {msg.content}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <div className="p-4 bg-slate-800 border-t border-slate-700">
                <form onSubmit={handleSendMessage} className="relative">
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Conversar em #${room.name}`}
                        className="w-full bg-slate-700/50 text-slate-200 rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-federal-500/50 placeholder-slate-500"
                    />
                    <button 
                        type="submit" 
                        disabled={!newMessage.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:hover:text-slate-400 transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatArea;
