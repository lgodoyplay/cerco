import React, { useState } from 'react';
import { useSettings } from '../../../hooks/useSettings';
import { BadgeCheck, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

const RolesSettings = () => {
  const { roles, setRoles, logAction } = useSettings();
  const [newRole, setNewRole] = useState('');

  const handleAddRole = (e) => {
    e.preventDefault();
    if (!newRole.trim()) return;
    const nextHierarchy = roles.length > 0 ? Math.max(...roles.map(r => r.hierarchy)) + 1 : 1;
    const newRoleObj = { id: Date.now(), title: newRole, hierarchy: nextHierarchy };
    setRoles([...roles, newRoleObj]);
    logAction(`Novo cargo criado: ${newRole}`);
    setNewRole('');
  };

  const handleRemoveRole = (id) => {
    setRoles(roles.filter(r => r.id !== id));
    logAction(`Cargo removido: ID ${id}`);
  };

  const moveRole = (index, direction) => {
    const newRoles = [...roles];
    const [movedRole] = newRoles.splice(index, 1);
    newRoles.splice(index + direction, 0, movedRole);
    // Recalculate hierarchy based on order
    const updatedRoles = newRoles.map((role, idx) => ({ ...role, hierarchy: idx + 1 }));
    setRoles(updatedRoles);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <BadgeCheck className="text-federal-500" size={28} />
          Cargos & Patentes
        </h2>
        <p className="text-slate-400 mt-1">Gerencie a hierarquia oficial e os cargos disponíveis.</p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
        <form onSubmit={handleAddRole} className="flex gap-4 mb-8">
          <input
            type="text"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 outline-none"
            placeholder="Nome do Cargo / Patente (ex: Agente Especial)"
          />
          <button 
            type="submit"
            className="bg-federal-600 hover:bg-federal-500 text-white px-6 rounded-xl font-bold flex items-center gap-2 transition-all"
          >
            <Plus size={20} />
            Adicionar
          </button>
        </form>

        <div className="space-y-3">
          {roles.sort((a,b) => a.hierarchy - b.hierarchy).map((role, index) => (
            <div key={role.id} className="flex items-center gap-4 p-4 bg-slate-900 rounded-xl border border-slate-800">
              <div className="flex flex-col gap-1">
                <button 
                  onClick={() => moveRole(index, -1)}
                  disabled={index === 0}
                  className="text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ArrowUp size={16} />
                </button>
                <button 
                  onClick={() => moveRole(index, 1)}
                  disabled={index === roles.length - 1}
                  className="text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ArrowDown size={16} />
                </button>
              </div>
              
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-400 border border-slate-700">
                {role.hierarchy}
              </div>

              <div className="flex-1">
                <h3 className="text-white font-bold">{role.title}</h3>
              </div>

              <button 
                onClick={() => handleRemoveRole(role.id)}
                className="text-slate-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RolesSettings;
