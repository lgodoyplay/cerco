import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { 
  Package, 
  Plus, 
  History, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  Shield, 
  Crosshair, 
  Briefcase 
} from 'lucide-react';
import { format } from 'date-fns';

const ITEM_TYPES = [
  { id: 'weapon', label: 'Armamento', icon: Crosshair },
  { id: 'ammo', label: 'Munição', icon: Package },
  { id: 'vest', label: 'Colete Balístico', icon: Shield },
  { id: 'kit', label: 'Kit Tático', icon: Briefcase },
  { id: 'replacement', label: 'Substituição', icon: ArrowRight },
];

const RequisitionPanel = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [requisitions, setRequisitions] = useState([]);
  const [formData, setFormData] = useState({
    item_type: 'weapon',
    item_name: '',
    quantity: 1,
    reason: ''
  });
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchRequisitions();
  }, [user]);

  const fetchRequisitions = async () => {
    try {
      const { data, error } = await supabase
        .from('logistics_requisitions')
        .select(`
          *,
          user:user_id(full_name, passport_id)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setRequisitions(data || []);
    } catch (error) {
      console.error('Erro ao buscar requisições:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');

    try {
      const { error } = await supabase
        .from('logistics_requisitions')
        .insert([{
          user_id: user.id,
          item_type: formData.item_type,
          item_name: formData.item_name,
          quantity: formData.quantity,
          reason: formData.reason,
          status: 'active'
        }]);

      if (error) throw error;

      setSuccessMsg('Item requisitado com sucesso!');
      setFormData({
        item_type: 'weapon',
        item_name: '',
        quantity: 1,
        reason: ''
      });
      fetchRequisitions();
    } catch (error) {
      console.error('Erro ao requisitar item:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Formulário de Requisição */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Plus className="text-federal-500" />
            Nova Requisição
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Tipo de Item</label>
              <div className="grid grid-cols-2 gap-2">
                {ITEM_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, item_type: type.id })}
                    className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border transition-colors ${
                      formData.item_type === type.id
                        ? 'bg-federal-600/20 border-federal-500 text-federal-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    <type.icon size={14} />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Nome do Item</label>
              <input
                type="text"
                required
                placeholder="Ex: Glock G17, Colete Nível III..."
                value={formData.item_name}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-federal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Quantidade</label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-federal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Motivo / Observação</label>
              <textarea
                rows="2"
                placeholder="Ex: Patrulhamento ostensivo, Substituição por defeito..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-federal-500"
              />
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-400 text-sm">
                <CheckCircle size={16} />
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-federal-600 hover:bg-federal-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-federal-900/20 disabled:opacity-50"
            >
              {loading ? 'Processando...' : 'Confirmar Requisição'}
            </button>
          </form>
        </div>
      </div>

      {/* Histórico de Requisições */}
      <div className="lg:col-span-2">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-full">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <History className="text-federal-500" />
            Histórico Recente de Movimentação
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 pl-4">Agente</th>
                  <th className="pb-3">Item</th>
                  <th className="pb-3">Qtd</th>
                  <th className="pb-3">Motivo</th>
                  <th className="pb-3">Data</th>
                  <th className="pb-3 pr-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {requisitions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">
                      Nenhuma requisição registrada recentemente.
                    </td>
                  </tr>
                ) : (
                  requisitions.map((req) => (
                    <tr key={req.id} className="group hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 pl-4">
                        <div className="font-medium text-white">{req.user?.full_name || 'Desconhecido'}</div>
                        <div className="text-xs text-slate-500">#{req.user?.passport_id || 'N/A'}</div>
                      </td>
                      <td className="py-3 text-slate-300">
                        <div className="flex items-center gap-2">
                          {ITEM_TYPES.find(t => t.id === req.item_type)?.icon && React.createElement(ITEM_TYPES.find(t => t.id === req.item_type).icon, { size: 14, className: 'text-federal-400' })}
                          {req.item_name}
                        </div>
                      </td>
                      <td className="py-3 text-slate-400">{req.quantity}</td>
                      <td className="py-3 text-slate-400 max-w-[150px] truncate" title={req.reason}>
                        {req.reason || '-'}
                      </td>
                      <td className="py-3 text-slate-400">
                        {req.created_at ? format(new Date(req.created_at), 'dd/MM HH:mm') : '-'}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {req.status === 'active' ? 'Em Uso' : req.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequisitionPanel;
