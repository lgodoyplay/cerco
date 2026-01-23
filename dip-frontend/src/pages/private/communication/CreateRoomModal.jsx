import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { X, Hash, Lock, Radio } from 'lucide-react';

const CreateRoomModal = ({ onClose, onCreated }) => {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !password.trim()) return;

        let finalName = name.trim().toUpperCase();
        if (!finalName.startsWith('FIVEM-')) {
            finalName = `FIVEM-${finalName}`;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.from('communication_rooms').insert({
                name: finalName,
                owner_id: user.id,
                password: password.trim(),
                is_locked: true,
                discord_call_link: null // Deprecated/Unused for Jitsi
            }).select().single();

            if (error) {
                console.error("Error creating room:", error);
                alert('Erro ao criar sala: ' + error.message);
            } else {
                onCreated(data);
            }
        } catch (err) {
            console.error("Exception creating room:", err);
            alert('Erro inesperado ao criar sala.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-md rounded-xl border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
                    <h2 className="font-bold text-white text-lg flex items-center gap-2">
                        <Radio className="text-federal-500" size={20} />
                        Nova Frequência de Rádio
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="bg-blue-900/20 border border-blue-900/50 p-3 rounded-lg">
                        <p className="text-xs text-blue-200 leading-relaxed">
                            O nome da sala receberá automaticamente o prefixo <strong>FIVEM-</strong>.
                            Ex: "VTR-01" vira "FIVEM-VTR-01".
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Nome da Frequência (Sufixo)</label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">FIVEM-</div>
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="VTR-01"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-16 pr-4 py-2 text-white focus:outline-none focus:border-federal-500 transition-colors placeholder-slate-600 uppercase"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Senha de Acesso (Obrigatória)</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input 
                                type="text" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Senha numérica ou texto"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-federal-500 transition-colors placeholder-slate-600"
                                required
                            />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">A senha será exigida para todos que tentarem entrar.</p>
                    </div>

                    <div className="pt-2 flex justify-end gap-2 border-t border-slate-800/50 mt-4">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="px-4 py-2 bg-federal-600 hover:bg-federal-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-lg shadow-federal-900/20"
                        >
                            {loading ? 'Criando Rádio...' : 'Criar Frequência'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateRoomModal;
