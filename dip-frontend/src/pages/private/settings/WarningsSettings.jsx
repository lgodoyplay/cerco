import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { AlertTriangle, Plus, Search, User, Trash2, Shield, Calendar } from 'lucide-react';
import clsx from 'clsx';

const WarningsSettings = () => {
  const { user } = useAuth();
  const [warnings, setWarnings] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWarning, setNewWarning] = useState({
    user_id: '',
    reason: '',
    details: '',
    severity: 'low' // low, medium, high, critical
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch warnings
      const { data: warningsData, error: warningsError } = await supabase
        .from('warnings')
        .select(`
          *,
          target:user_id(full_name, username, role, passport_id),
          issuer:issued_by(full_name, username)
        `)
        .order('created_at', { ascending: false });

      if (warningsError && warningsError.code !== '42P01') throw warningsError;

      // Fetch profiles for the dropdown
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username, passport_id, role')
        .order('full_name');

      if (profilesError) throw profilesError;

      setWarnings(warningsData || []);
      setProfiles(profilesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWarning = async (e) => {
    e.preventDefault();
    if (!newWarning.user_id || !newWarning.reason) return;

    try {
      const { error } = await supabase
        .from('warnings')
        .insert([{
          ...newWarning,
          issued_by: user.id
        }]);

      if (error) throw error;

      setIsModalOpen(false);
      setNewWarning({ user_id: '', reason: '', details: '', severity: 'low' });
      fetchData();
      alert('Advertência aplicada com sucesso.');
    } catch (error) {
      console.error('Error creating warning:', error);
      alert('Erro ao aplicar advertência.');
    }
  };

  const handleDeleteWarning = async (id) => {
    if (!confirm('Tem certeza que deseja remover esta advertência?')) return;

    try {
      const { error } = await supabase
        .from('warnings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting warning:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      case 'medium': return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'critical': return 'bg-red-900/40 text-red-500 border-red-500/60 font-bold';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'low': return 'Leve';
      case 'medium': return 'Média';
      case 'high': return 'Grave';
      case 'critical': return 'Gravíssima';
      default: return severity;
    }
  };

  const filteredWarnings = warnings.filter(w => 
    w.target?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.target?.passport_id?.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="text-federal-500" />
            Gestão de Advertências
          </h2>
          <p className="text-slate-400">Aplique e gerencie advertências disciplinares.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-red-900/20"
        >
          <Plus size={18} />
          Nova Advertência
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nome ou passaporte..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-federal-500 focus:outline-none transition-colors"
        />
      </div>

      {/* List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
           <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : filteredWarnings.length === 0 ? (
           <div className="p-8 text-center text-slate-500">Nenhuma advertência registrada.</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredWarnings.map((warning) => (
              <div key={warning.id} className="p-4 hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 flex-shrink-0">
                    <User className="text-slate-400" size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold flex items-center gap-2">
                      {warning.target?.full_name || 'Usuário Desconhecido'}
                      <span className="text-xs font-normal text-slate-500">#{warning.target?.passport_id}</span>
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className={clsx("px-2 py-0.5 rounded text-xs border", getSeverityColor(warning.severity))}>
                        {getSeverityLabel(warning.severity)}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(warning.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-slate-500">
                        Por: {warning.issuer?.full_name || 'Sistema'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mt-2 font-medium">{warning.reason}</p>
                    {warning.details && (
                      <p className="text-xs text-slate-400 mt-1">{warning.details}</p>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={() => handleDeleteWarning(warning.id)}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                  title="Remover Advertência"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-scale-in">
            <h3 className="text-xl font-bold text-white mb-4">Nova Advertência</h3>
            
            <form onSubmit={handleCreateWarning} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Policial</label>
                <select 
                  value={newWarning.user_id}
                  onChange={(e) => setNewWarning({...newWarning, user_id: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-federal-500 focus:outline-none"
                  required
                >
                  <option value="">Selecione o policial...</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name} | {p.role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Gravidade</label>
                <div className="grid grid-cols-4 gap-2">
                  {['low', 'medium', 'high', 'critical'].map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setNewWarning({...newWarning, severity: sev})}
                      className={clsx(
                        "px-2 py-2 rounded-lg text-xs font-bold border transition-all",
                        newWarning.severity === sev 
                          ? getSeverityColor(sev) + " ring-2 ring-offset-2 ring-offset-slate-900 ring-slate-500"
                          : "bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-800"
                      )}
                    >
                      {getSeverityLabel(sev)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Motivo</label>
                <input 
                  type="text"
                  value={newWarning.reason}
                  onChange={(e) => setNewWarning({...newWarning, reason: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-federal-500 focus:outline-none"
                  placeholder="Ex: Insubordinação, Atraso..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Detalhes (Opcional)</label>
                <textarea 
                  value={newWarning.details}
                  onChange={(e) => setNewWarning({...newWarning, details: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-federal-500 focus:outline-none h-24 resize-none"
                  placeholder="Descreva o ocorrido..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-bold"
                >
                  Aplicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarningsSettings;
