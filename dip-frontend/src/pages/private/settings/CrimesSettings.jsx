import React, { useState, useEffect } from 'react';
import { Gavel, Plus, Trash2, Edit2, Save, X } from 'lucide-react';

const CrimesSettings = () => {
  const [crimes, setCrimes] = useState(() => {
    const saved = localStorage.getItem('dip_settings_crimes');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Homicídio Doloso', article: '121', penalty: '6 a 20 anos' },
      { id: 2, name: 'Roubo', article: '157', penalty: '4 a 10 anos' },
      { id: 3, name: 'Tráfico de Drogas', article: '33', penalty: '5 a 15 anos' },
    ];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', article: '', penalty: '' });

  useEffect(() => {
    localStorage.setItem('cerco_settings_crimes', JSON.stringify(crimes));
  }, [crimes]);

  const handleOpenModal = (crime = null) => {
    if (crime) {
      setEditingId(crime.id);
      setFormData(crime);
    } else {
      setEditingId(null);
      setFormData({ name: '', article: '', penalty: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      setCrimes(crimes.map(c => c.id === editingId ? { ...c, ...formData } : c));
    } else {
      setCrimes([...crimes, { id: Date.now(), ...formData }]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Remover este tipo de crime?')) {
      setCrimes(crimes.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Gavel className="text-federal-500" size={28} />
            Tipos de Crimes & Artigos
          </h2>
          <p className="text-slate-400 mt-1">Gerencie a tipificação penal e artigos associados.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-federal-600 hover:bg-federal-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
        >
          <Plus size={18} />
          Novo Crime
        </button>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-400 uppercase font-bold">
            <tr>
              <th className="px-6 py-4">Artigo</th>
              <th className="px-6 py-4">Nome do Crime</th>
              <th className="px-6 py-4">Pena Prevista</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {crimes.map(crime => (
              <tr key={crime.id} className="hover:bg-slate-900/50 transition-colors">
                <td className="px-6 py-4 font-mono text-federal-400 font-bold">Art. {crime.article}</td>
                <td className="px-6 py-4 text-white font-medium">{crime.name}</td>
                <td className="px-6 py-4 text-slate-400">{crime.penalty}</td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button onClick={() => handleOpenModal(crime)} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(crime.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">{editingId ? 'Editar Crime' : 'Novo Crime'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Artigo (Lei)</label>
                <input type="text" value={formData.article} onChange={e => setFormData({...formData, article: e.target.value})} className="w-full mt-1 px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-federal-500 outline-none" required placeholder="Ex: 121" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Nome do Crime</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full mt-1 px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-federal-500 outline-none" required placeholder="Ex: Homicídio" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Pena Prevista</label>
                <input type="text" value={formData.penalty} onChange={e => setFormData({...formData, penalty: e.target.value})} className="w-full mt-1 px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-federal-500 outline-none" placeholder="Ex: 6 a 20 anos" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-400 hover:text-white">Cancelar</button>
                <button type="submit" className="bg-federal-600 hover:bg-federal-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrimesSettings;
