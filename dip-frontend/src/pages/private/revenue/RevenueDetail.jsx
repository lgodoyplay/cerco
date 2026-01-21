import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, DollarSign, Calendar, Save, ImageIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { usePermissions } from '../../../hooks/usePermissions';
import ImageUploadArea from '../../../components/ImageUploadArea';

const RevenueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { can } = usePermissions();
  
  const canManage = can('revenue_manage');
  
  const [record, setRecord] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({ description: '', value: '' });
  const [newItemImage, setNewItemImage] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch record info
      const { data: recordData, error: recordError } = await supabase
        .from('financial_records')
        .select('*')
        .eq('id', id)
        .single();
        
      if (recordError) throw recordError;
      setRecord(recordData);

      // Fetch items
      const { data: itemsData, error: itemsError } = await supabase
        .from('financial_assets')
        .select('*')
        .eq('record_id', id)
        .order('added_at', { ascending: false });

      if (itemsError) throw itemsError;
      setItems(itemsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      navigate('/dashboard/revenue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleImageUpload = (fieldId, preview, file) => {
    setNewItemImage({ preview, file });
  };

  const handleImageRemove = () => {
    setNewItemImage(null);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.description || !newItem.value) return;

    try {
      let imageUrl = null;

      if (newItemImage?.file) {
        const fileExt = newItemImage.file.name.split('.').pop();
        const fileName = `${id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('revenue-assets')
          .upload(fileName, newItemImage.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('revenue-assets')
          .getPublicUrl(fileName);
          
        imageUrl = publicUrl;
      }

      const { data, error } = await supabase
        .from('financial_assets')
        .insert([{
          record_id: id,
          description: newItem.description,
          value: parseFloat(newItem.value),
          image_url: imageUrl,
          added_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setItems([data, ...items]);
      setNewItem({ description: '', value: '' });
      setNewItemImage(null);
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Erro ao adicionar item: ' + error.message);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Tem certeza que deseja remover este item?')) return;
    
    try {
      const { error } = await supabase
        .from('financial_assets')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(items.filter(i => i.id !== itemId));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const totalValue = items.reduce((sum, item) => sum + Number(item.value), 0);

  if (loading) return <div className="p-6 text-slate-500">Carregando...</div>;
  if (!record) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <button 
        onClick={() => navigate('/dashboard/revenue')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-2"
      >
        <ArrowLeft size={18} /> Voltar para lista
      </button>

      {/* Header Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{record.player_name}</h1>
          <p className="text-slate-400 flex items-center gap-2">
            <Calendar size={14} /> 
            Pasta criada em {new Date(record.created_at).toLocaleDateString()}
          </p>
        </div>
        
        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 min-w-[200px]">
          <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Patrimônio Total</p>
          <p className="text-3xl font-bold text-emerald-400">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
          </p>
        </div>
      </div>

      {/* Add Item Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        {isAdding ? (
          <form onSubmit={handleAddItem} className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="flex-1 w-full space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Descrição do Item / Bem</label>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Ex: Carro Esportivo, Mansão, Dinheiro em Mãos..."
                    value={newItem.description}
                    onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Valor Estimado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={newItem.value}
                    onChange={e => setNewItem({ ...newItem, value: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="w-full md:w-64">
                <ImageUploadArea
                  label="Foto do Bem / Prova (Opcional)"
                  id="item-image"
                  image={newItemImage?.preview}
                  onUpload={handleImageUpload}
                  onRemove={handleImageRemove}
                  aspect={4/3}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors bg-slate-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} /> Salvar Item
              </button>
            </div>
          </form>
        ) : (
          canManage && (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-3 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 text-slate-500 hover:text-emerald-400 rounded-lg transition-all flex items-center justify-center gap-2 font-medium"
            >
              <Plus size={20} /> Adicionar Novo Item / Receita
            </button>
          )
        )}
      </div>

      {/* Items List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h3 className="font-bold text-white">Histórico de Itens</h3>
        </div>
        {items.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Nenhum item registrado nesta pasta ainda.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {items.map(item => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors group">
                <div className="flex items-start gap-3">
                  {item.image_url ? (
                    <div className="w-12 h-12 rounded-lg bg-slate-800 overflow-hidden border border-slate-700 flex-shrink-0 cursor-pointer hover:scale-110 transition-transform" onClick={() => window.open(item.image_url, '_blank')}>
                      <img src={item.image_url} alt="Bem" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 mt-1">
                      <DollarSign size={16} />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-slate-200">{item.description}</p>
                    <p className="text-xs text-slate-500">
                      Adicionado em {new Date(item.added_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-emerald-400">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.value)}
                  </span>
                  {canManage && (
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Remover item"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueDetail;
