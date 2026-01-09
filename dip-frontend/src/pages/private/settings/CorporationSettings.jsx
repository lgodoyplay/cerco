import React, { useState } from 'react';
import { useSettings } from '../../../hooks/useSettings';
import { Building, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

const CorporationSettings = () => {
  const { corporation, updateCorporation } = useSettings();
  const [activeTab, setActiveTab] = useState('departments'); // departments | divisions | sectors
  const [newItem, setNewItem] = useState('');

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    const currentList = corporation[activeTab] || [];
    updateCorporation(activeTab, [...currentList, newItem]);
    setNewItem('');
  };

  const handleRemoveItem = (item) => {
    const currentList = corporation[activeTab] || [];
    updateCorporation(activeTab, currentList.filter(i => i !== item));
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
            className="bg-federal-600 hover:bg-federal-500 text-white px-6 rounded-xl font-bold flex items-center gap-2 transition-all"
          >
            <Plus size={20} />
            Adicionar
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {corporation[activeTab]?.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-800 group hover:border-federal-500/30 transition-all">
              <span className="text-white font-medium">{item}</span>
              <button 
                onClick={() => handleRemoveItem(item)}
                className="text-slate-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {(!corporation[activeTab] || corporation[activeTab].length === 0) && (
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
