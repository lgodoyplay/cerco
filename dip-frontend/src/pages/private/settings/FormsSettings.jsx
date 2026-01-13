import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useSettings } from '../../../hooks/useSettings';
import { 
  Inbox, 
  Search, 
  Trash2, 
  Calendar, 
  Mail, 
  Phone, 
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  Save
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const FormsSettings = () => {
  const { discordConfig, updateDiscordConfig } = useSettings();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    if (discordConfig) {
      setWebhookUrl(discordConfig.webhookUrl || '');
    }
  }, [discordConfig]);

  const handleSaveDiscord = () => {
    updateDiscordConfig({ ...discordConfig, webhookUrl });
    alert('Configuração do Discord salva com sucesso!');
  };

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('candidatos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCandidates(data || []);
    } catch (error) {
      console.error('Erro ao buscar candidatos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este formulário?')) return;

    try {
      const { error } = await supabase
        .from('candidatos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCandidates(candidates.filter(c => c.id !== id));
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir formulário');
    }
  };

  const filteredCandidates = candidates.filter(candidate => 
    (candidate.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (candidate.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Inbox className="text-federal-500" />
            Formulários Recebidos
          </h2>
          <p className="text-slate-400">Gerencie as inscrições e contatos recebidos pelo site.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-federal-500 w-full md:w-64"
          />
        </div>
      </div>

      {/* Discord Configuration */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <MessageSquare className="text-federal-500" />
          Configuração de Notificações (Discord)
        </h3>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Cole aqui o Webhook URL do Discord (https://discord.com/api/webhooks/...)"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="flex-1 px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-federal-500"
          />
          <button
            onClick={handleSaveDiscord}
            className="px-6 py-2 bg-federal-600 hover:bg-federal-500 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Save size={18} />
            Salvar Configuração
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          As notificações de novos formulários serão enviadas para este canal automaticamente.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">
          Carregando formulários...
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCandidates.map((candidate) => (
            <div 
              key={candidate.id} 
              className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-federal-500/50 transition-all group"
            >
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold text-white">{candidate.nome}</h3>
                      <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded-md border border-slate-800 flex items-center gap-1">
                        <Clock size={12} />
                        {candidate.created_at && !isNaN(new Date(candidate.created_at).getTime()) ? format(new Date(candidate.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR }) : 'Data N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail size={16} className="text-federal-500" />
                      {candidate.email}
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone size={16} className="text-federal-500" />
                      {candidate.telefone}
                    </div>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800/50">
                    <div className="flex items-start gap-2">
                      <MessageSquare size={16} className="text-federal-500 mt-1 shrink-0" />
                      <p className="text-slate-300 text-sm whitespace-pre-wrap">{candidate.mensagem}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-slate-700 pt-4 md:pt-0 md:pl-6">
                  <button 
                    onClick={() => handleDelete(candidate.id)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
                    title="Excluir"
                  >
                    <Trash2 size={20} />
                    <span className="md:hidden">Excluir</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredCandidates.length === 0 && (
            <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-800 border-dashed">
              <Inbox size={48} className="mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400">Nenhum formulário encontrado.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FormsSettings;
