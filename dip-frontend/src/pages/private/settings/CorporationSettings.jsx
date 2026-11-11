import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../../hooks/useSettings';
import { normalizeCorporationList, createCorporationItem } from '../../../utils/corporationUtils';
import { Building, Plus, Trash2, UserCog, Users } from 'lucide-react';

const CorporationSettings = () => {
  const navigate = useNavigate();
  const { corporation, updateCorporation, users } = useSettings();
  const [activeTab, setActiveTab] = useState('departments'); // departments | divisions | sectors
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(false);

  const currentList = normalizeCorporationList(corporation?.[activeTab] || [], activeTab);

  const handleAddItem = async (e) => {
    e.preventDefault();
    const name = newItem.trim();
    if (!name) return;

    setLoading(true);
    try {
      const newEntry = createCorporationItem(name, activeTab);
      const nextList = [...currentList, newEntry];
      await updateCorporation(activeTab, nextList);
      setNewItem('');
      navigate(`/dashboard/settings/corporation/${activeTab}/${newEntry.id}`);
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (item) => {
    try {
      const nextList = currentList.filter((entry) => entry.id !== item.id);
      await updateCorporation(activeTab, nextList);
    } catch (error) {
      console.error('Erro ao remover item:', error);
    }
  };

  const tabs = [
    { id: 'departments', label: 'Departamentos' },
    { id: 'divisions', label: 'Divisões' },
    { id: 'sectors', label: 'Setores' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Building className="text-federal-500" size={28} />
          Estrutura da Corporação
        </h2>
        <p className="text-slate-400 mt-1">Defina a hierarquia organizacional, departamentos e setores.</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? "bg-federal-600 text-white shadow-lg" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
        <form onSubmit={handleAddItem} className="flex gap-4 mb-8">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 outline-none"
            placeholder={`Adicionar novo em ${tabs.find(t => t.id === activeTab).label}...`}
          />
          <button 
            type="submit"
            disabled={loading}
            className="bg-federal-600 hover:bg-federal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 rounded-xl font-bold flex items-center gap-2 transition-all"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={20} />}
            {loading ? 'Salvando...' : 'Adicionar'}
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentList.map((item) => {
            const chief = users.find((user) => user.id === item.chiefId);
            const memberCount = item.members?.length || 0;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(`/dashboard/settings/corporation/${activeTab}/${item.id}`)}
                className="group flex flex-col items-start justify-between gap-3 p-4 bg-slate-900 rounded-xl border border-slate-800 text-left hover:border-federal-500/40 transition-all"
              >
                <div className="flex items-start justify-between w-full gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <UserCog size={14} className="text-federal-400" />
                      {chief ? chief.name : 'Chefe não definido'}
                    </p>
                  </div>
                  <span
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRemoveItem(item);
                    }}
                    className="text-slate-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                    aria-label={`Remover ${item.name}`}
                  >
                    <Trash2 size={18} />
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Users size={14} className="text-slate-500" />
                  {memberCount} membro{memberCount === 1 ? '' : 's'}
                </div>
              </button>
            );
          })}
          {currentList.length === 0 && (
            <div className="col-span-full text-center py-8 text-slate-500">
              Nenhum item cadastrado nesta categoria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CorporationSettings;
