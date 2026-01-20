import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Folder, DollarSign, Calendar, ChevronRight } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

const RevenueList = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const { user } = useAuth();

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_records')
        .select(`
          *,
          financial_assets (
            value
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processed = data.map(record => ({
        ...record,
        totalValue: record.financial_assets?.reduce((sum, asset) => sum + Number(asset.value), 0) || 0,
        itemCount: record.financial_assets?.length || 0
      }));

      setRecords(processed);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('financial_records')
        .insert([{ 
          player_name: newPlayerName,
          created_by: user.id 
        }])
        .select()
        .single();

      if (error) throw error;

      setRecords([{ ...data, totalValue: 0, itemCount: 0 }, ...records]);
      setIsModalOpen(false);
      setNewPlayerName('');
    } catch (error) {
      console.error('Error creating record:', error);
      alert('Erro ao criar pasta. Verifique se as tabelas foram criadas no Supabase.');
    }
  };

  const filteredRecords = records.filter(r => 
    r.player_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="text-emerald-500" />
            Controle de Receita
          </h1>
          <p className="text-slate-400 mt-1">Gerencie o patrimônio dos cidadãos para fins fiscais.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-lg shadow-emerald-900/20"
        >
          <Plus size={20} />
          Nova Pasta
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nome do jogador..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Carregando...</div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
          <Folder size={48} className="mx-auto text-slate-600 mb-3" />
          <h3 className="text-lg font-medium text-slate-300">Nenhuma pasta encontrada</h3>
          <p className="text-slate-500">Crie uma nova pasta para começar a monitorar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map(record => (
            <Link 
              key={record.id} 
              to={`/dashboard/revenue/${record.id}`}
              className="group bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-5 transition-all hover:bg-slate-800/80 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Folder size={80} />
              </div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                    <Folder size={24} />
                  </div>
                  <span className="text-xs font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                    {new Date(record.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors truncate">
                  {record.player_name}
                </h3>
                
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-sm text-slate-500">Patrimônio:</span>
                  <span className="text-xl font-bold text-emerald-400">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(record.totalValue)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-800 pt-3">
                  <span>{record.itemCount} itens registrados</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-emerald-500/80">
                    Abrir <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Nova Pasta de Jogador</h3>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-400 mb-1">Nome do Jogador</label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newPlayerName}
                  onChange={e => setNewPlayerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Ex: João da Silva"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Criar Pasta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueList;
