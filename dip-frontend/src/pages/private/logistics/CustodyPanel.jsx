import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { useInvestigations } from '../../../hooks/useInvestigations';
import { 
  Box, 
  Archive, 
  Search, 
  MapPin, 
  FileText, 
  Lock, 
  Unlock, 
  Trash2,
  CheckCircle,
  AlertTriangle 
} from 'lucide-react';
import { format } from 'date-fns';

const CATEGORIES = [
  { id: 'weapon', label: 'Arma Apreendida' },
  { id: 'drug', label: 'Entorpecentes' },
  { id: 'money', label: 'Dinheiro' },
  { id: 'evidence', label: 'Evidência / Prova' },
  { id: 'other', label: 'Outros' },
];

const CustodyPanel = () => {
  const { user } = useAuth();
  const { investigations, addProof } = useInvestigations();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    item_description: '',
    quantity: 1,
    category: 'evidence',
    case_reference: '',
    location: ''
  });
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvestigationId, setSelectedInvestigationId] = useState('');
  const [selectedProofFile, setSelectedProofFile] = useState(null);

  const openInvestigations = (investigations || []).filter((inv) => {
    const status = String(inv?.status || '').trim().toLowerCase();
    return status !== 'finalizada' && status !== 'arquivada' && status !== 'encerrada';
  });

  const selectedInvestigation = openInvestigations.find((inv) => inv.id === selectedInvestigationId);
  const selectedInvestigationLabel = selectedInvestigation?.title || selectedInvestigation?.titulo || '';

  useEffect(() => {
    fetchItems();
  }, [user]);

  const fetchItems = async () => {
    try {
      let query = supabase
        .from('logistics_custody')
        .select(`
          *,
          officer:officer_id(full_name, passport_id)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (searchTerm) {
        query = query.ilike('item_description', `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Erro ao buscar custódia:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    if (formData.category === 'evidence' && !selectedInvestigationId) {
      setErrorMsg('Selecione uma investigação aberta para vincular a prova.');
      setLoading(false);
      return;
    }

    if (formData.category === 'evidence' && selectedInvestigationId && !selectedProofFile) {
      setErrorMsg('Selecione um arquivo para enviar a prova para a investigação aberta.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('logistics_custody')
        .insert([{
          officer_id: user.id,
          item_description: formData.item_description,
          quantity: formData.quantity,
          category: formData.category,
          case_reference: formData.case_reference,
          location: formData.location,
          status: 'in_custody',
          related_investigation_id: formData.category === 'evidence' ? selectedInvestigationId || null : null,
          related_investigation_title: formData.category === 'evidence' ? selectedInvestigationLabel || null : null
        }]);

      if (error) throw error;

      if (formData.category === 'evidence' && selectedInvestigationId && selectedProofFile) {
        const proofType = selectedProofFile.type?.startsWith('image/')
          ? 'image'
          : selectedProofFile.type?.startsWith('video/')
            ? 'video'
            : 'file';

        await addProof(selectedInvestigationId, {
          file: selectedProofFile,
          type: proofType,
          title: formData.item_description,
          description: `Custódia • ${formData.case_reference || 'Sem referência'} • ${formData.location || 'Sem local'}`,
          authorId: user.id
        });
      }

      setSuccessMsg('Item depositado em custódia com sucesso!');
      setFormData({
        item_description: '',
        quantity: 1,
        category: 'evidence',
        case_reference: '',
        location: ''
      });
      setSelectedInvestigationId('');
      setSelectedProofFile(null);
      fetchItems();
    } catch (error) {
      console.error('Erro ao depositar item:', error);
      setErrorMsg('Não foi possível concluir o depósito. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('logistics_custody')
        .update({ status: newStatus, updated_at: new Date() })
        .eq('id', id);
      
      if (error) throw error;
      fetchItems();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Formulário de Custódia */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Archive className="text-yellow-500" />
            Depositar Item em Custódia
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Categoria</label>
              <select
                value={formData.category}
                onChange={(e) => {
                  const nextCategory = e.target.value;
                  setFormData({ ...formData, category: nextCategory });
                  if (nextCategory !== 'evidence') {
                    setSelectedInvestigationId('');
                    setSelectedProofFile(null);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Descrição do Item</label>
              <input
                type="text"
                required
                placeholder="Ex: Pacote suspeito, Arma com numeração raspada..."
                value={formData.item_description}
                onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
              />
            </div>

            {formData.category === 'evidence' && (
              <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Investigações abertas</label>
                  <select
                    value={selectedInvestigationId}
                    onChange={(e) => setSelectedInvestigationId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  >
                    <option value="">Selecione uma investigação</option>
                    {openInvestigations.map((investigation) => (
                      <option key={investigation.id} value={investigation.id}>
                        {investigation.title || investigation.titulo || investigation.id}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    Ao selecionar uma investigação, a prova anexada será encaminhada para a pasta correspondente.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Arquivo da prova</label>
                  <input
                    type="file"
                    onChange={(e) => setSelectedProofFile(e.target.files?.[0] || null)}
                    required={formData.category === 'evidence'}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300 file:mr-3 file:rounded file:border-0 file:bg-yellow-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-black"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Ref. Caso (BO)</label>
                <input
                  type="text"
                  placeholder="Ex: BO-2024-001"
                  value={formData.case_reference}
                  onChange={(e) => setFormData({ ...formData, case_reference: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Local de Armazenamento</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Ex: Sala de Evidências, Prateleira B2"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                />
              </div>
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-400 text-sm">
                <CheckCircle size={16} />
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                <AlertTriangle size={16} />
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-xl transition-all shadow-lg shadow-yellow-900/20 disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Confirmar Depósito'}
            </button>
          </form>
        </div>
      </div>

      {/* Lista de Custódia */}
      <div className="lg:col-span-2">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Box className="text-yellow-500" />
              Itens em Custódia
            </h3>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar itens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchItems()}
                className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-yellow-500 w-full sm:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 pl-4">Item / Descrição</th>
                  <th className="pb-3">Ref. Caso</th>
                  <th className="pb-3">Local</th>
                  <th className="pb-3">Depositado Por</th>
                  <th className="pb-3">Data</th>
                  <th className="pb-3 pr-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">
                      Nenhum item encontrado em custódia.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="group hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 pl-4">
                        <div className="font-medium text-white">{item.item_description}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                          {CATEGORIES.find(c => c.id === item.category)?.label} • Qtd: {item.quantity}
                        </div>
                        {(item.related_investigation_title || item.related_investigation_id) && (
                          <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-[11px] text-yellow-300">
                            <FileText size={12} />
                            {item.related_investigation_title || 'Investigação vinculada'}
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-slate-400 font-mono text-xs">
                        {item.case_reference || '-'}
                      </td>
                      <td className="py-3 text-slate-400">
                        {item.location || '-'}
                      </td>
                      <td className="py-3 text-slate-400 text-xs">
                        {item.officer?.full_name || `ID: ${item.officer_id?.slice(0, 8)}...`}
                      </td>
                      <td className="py-3 text-slate-500 text-xs">
                        {item.created_at ? format(new Date(item.created_at), 'dd/MM/yy') : '-'}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        {item.status === 'in_custody' ? (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleStatusChange(item.id, 'released')}
                              title="Liberar / Devolver"
                              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            >
                              <Unlock size={16} />
                            </button>
                            <button 
                              onClick={() => handleStatusChange(item.id, 'destroyed')}
                              title="Destruir / Descartar"
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : (
                          <span className={`text-xs font-bold px-2 py-1 rounded border ${
                            item.status === 'released' 
                              ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' 
                              : 'text-red-400 border-red-500/20 bg-red-500/10'
                          }`}>
                            {item.status === 'released' ? 'LIBERADO' : 'DESTRUÍDO'}
                          </span>
                        )}
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

export default CustodyPanel;
