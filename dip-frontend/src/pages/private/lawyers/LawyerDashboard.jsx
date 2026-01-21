import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { User, FileText, Scale, Search, Gavel, FileSignature, Send, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const LawyerDashboard = () => {
  const { user } = useAuth();
  const { can } = usePermissions();
  const canManage = true; // Lawyers can always manage their own petitions in their dashboard
  const [activeTab, setActiveTab] = useState('clients'); // clients, processes, petitions
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [processes, setProcesses] = useState([]);
  
  // Petition State
  const [petitionLoading, setPetitionLoading] = useState(false);
  const [petitionStatus, setPetitionStatus] = useState({ type: null, message: null });
  const [petitionForm, setPetitionForm] = useState({
    type: 'Habeas Corpus',
    client_name: '',
    content: ''
  });

  const petitionTypes = [
    'Habeas Corpus',
    'Pedido de Relaxamento de Prisão',
    'Pedido de Visita',
    'Juntada de Procuração',
    'Pedido de Recesso',
    'Julgamento',
    'Liberdade Provisória',
    'Progressão de Regime',
    'Outros'
  ];


  // Mock search for clients (Prisoners)
  const searchClients = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('arrests')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('prisoner_name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock search for processes (BOs)
  const searchProcesses = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('boletins')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        // Search by ID or description
        query = query.or(`descricao.ilike.%${searchTerm}%, tipo.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Map boletins to process format
      const formattedData = data?.map(item => ({
        id: item.id,
        type: item.tipo,
        description: item.descricao,
        officer_name: item.created_by_name || 'Agente', // We might need to fetch this or it's in the view
        created_at: item.created_at
      })) || [];
      
      setProcesses(formattedData);
    } catch (error) {
      console.error('Error fetching processes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'clients') {
      searchClients();
    } else if (activeTab === 'processes') {
      searchProcesses();
    }
  }, [activeTab]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Scale className="text-yellow-500" />
            Área do Advogado
          </h1>
          <p className="text-slate-400 text-sm">Gestão de clientes, processos e petições</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-900/50 rounded-xl border border-slate-800 w-full md:w-fit overflow-x-auto">
        <button
          onClick={() => setActiveTab('clients')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 md:flex-none justify-center whitespace-nowrap ${
            activeTab === 'clients'
              ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-900/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <User size={18} />
          Clientes (Presos)
        </button>
        <button
          onClick={() => setActiveTab('processes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 md:flex-none justify-center whitespace-nowrap ${
            activeTab === 'processes'
              ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-900/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileText size={18} />
          Processos (BOs)
        </button>
        <button
          onClick={() => setActiveTab('petitions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 md:flex-none justify-center whitespace-nowrap ${
            activeTab === 'petitions'
              ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-900/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileSignature size={18} />
          Petições
        </button>
      </div>

      {/* Content */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 min-h-[500px]">
        
        {/* Search Bar (Shared for Clients/Processes) */}
        {activeTab !== 'petitions' && (
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input
                type="text"
                placeholder={activeTab === 'clients' ? "Buscar por nome do cliente..." : "Buscar por número do BO ou tipo..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (activeTab === 'clients' ? searchClients() : searchProcesses())}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-slate-100 focus:outline-none focus:border-yellow-500 transition-colors"
              />
            </div>
            <button
              onClick={activeTab === 'clients' ? searchClients : searchProcesses}
              className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Buscar
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-slate-800 border-t-yellow-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Clients List */}
            {activeTab === 'clients' && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {clients.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-slate-500">
                    Nenhum cliente encontrado.
                  </div>
                ) : (
                  clients.map((client) => (
                    <div key={client.id} className="bg-slate-950 border border-slate-800 rounded-lg p-4 hover:border-yellow-500/50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold">
                          {client.prisoner_name?.substring(0, 2).toUpperCase()}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          client.status === 'released' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {client.status === 'released' ? 'Liberado' : 'Detido'}
                        </span>
                      </div>
                      <h3 className="font-bold text-white mb-1">{client.prisoner_name}</h3>
                      <p className="text-sm text-slate-400 mb-2">RG/Passaporte: {client.prisoner_id || 'N/A'}</p>
                      <div className="text-xs text-slate-500 space-y-1">
                        <p>Artigos: {client.articles?.join(', ') || 'N/A'}</p>
                        <p>Data: {client.created_at ? format(new Date(client.created_at), 'dd/MM/yyyy HH:mm') : 'N/A'}</p>
                      </div>
                      <button className="w-full mt-4 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-sm transition-colors">
                        Ver Detalhes
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Processes List */}
            {activeTab === 'processes' && (
              <div className="space-y-4">
                {processes.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    Nenhum processo encontrado.
                  </div>
                ) : (
                  processes.map((process) => (
                    <div key={process.id} className="bg-slate-950 border border-slate-800 rounded-lg p-4 hover:border-yellow-500/50 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center">
                      <div className="p-3 rounded-lg bg-slate-900 text-yellow-500">
                        <FileText size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-white">BO #{process.id.substring(0, 8)}</h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                            {process.type}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 line-clamp-1">{process.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            Relator: {process.officer_name || 'Desconhecido'}
                          </span>
                          <span>
                            {process.created_at ? format(new Date(process.created_at), 'dd/MM/yyyy HH:mm') : 'N/A'}
                          </span>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors whitespace-nowrap">
                        Acessar Autos
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Petitions Form */}
            {canManage && activeTab === 'petitions' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <FileSignature size={20} className="text-yellow-500" />
                    Nova Petição / Protocolo
                  </h3>

                  {petitionStatus.message && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
                      petitionStatus.type === 'success' 
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    }`}>
                      {petitionStatus.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                      {petitionStatus.message}
                    </div>
                  )}

                  <form className="space-y-4" onSubmit={async (e) => {
                    e.preventDefault();
                    setPetitionLoading(true);
                    setPetitionStatus({ type: null, message: null });

                    try {
                      const { error } = await supabase.from('petitions').insert([{
                        type: petitionForm.type,
                        client_name: petitionForm.client_name,
                        content: petitionForm.content,
                        lawyer_id: user.id,
                        lawyer_name: user.full_name || 'Advogado', // Fallback
                        status: 'pending'
                      }]);

                      if (error) throw error;

                      setPetitionStatus({ type: 'success', message: 'Petição protocolada com sucesso! O setor jurídico foi notificado.' });
                      setPetitionForm({
                        type: 'Habeas Corpus',
                        client_name: '',
                        content: ''
                      });
                    } catch (err) {
                      console.error('Error sending petition:', err);
                      setPetitionStatus({ type: 'error', message: 'Erro ao protocolar petição. Verifique se o sistema está disponível.' });
                    } finally {
                      setPetitionLoading(false);
                    }
                  }}>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Tipo de Petição</label>
                      <select 
                        value={petitionForm.type}
                        onChange={e => setPetitionForm({...petitionForm, type: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-yellow-500"
                      >
                        {petitionTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Cliente (Nome ou Passaporte)</label>
                      <input 
                        type="text" 
                        value={petitionForm.client_name}
                        onChange={e => setPetitionForm({...petitionForm, client_name: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-yellow-500" 
                        placeholder="Ex: João da Silva" 
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Conteúdo da Petição</label>
                      <textarea 
                        value={petitionForm.content}
                        onChange={e => setPetitionForm({...petitionForm, content: e.target.value})}
                        rows={8}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-yellow-500"
                        placeholder="Escreva aqui os termos da petição..."
                        required
                      ></textarea>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <button 
                        type="button" 
                        onClick={() => setPetitionForm({ type: 'Habeas Corpus', client_name: '', content: '' })}
                        className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                      >
                        Limpar
                      </button>
                      <button 
                        type="submit" 
                        disabled={petitionLoading}
                        className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {petitionLoading ? 'Protocolando...' : 'Protocolar'}
                        {!petitionLoading && <Send size={18} />}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LawyerDashboard;
