import React, { useState } from 'react';
import { useSettings } from '../../../hooks/useSettings';
import { Plus, Edit2, Trash2, Shield, User, Users, Power, Search, Check, X } from 'lucide-react';
import clsx from 'clsx';

const UsersSettings = () => {
  const { users, addUser, updateUser, toggleUserStatus, deleteUser, roles } = useSettings();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    role: '',
    permissions: []
  });

  const availablePermissions = [
    { id: 'arrest', label: 'Registrar Prisão' },
    { id: 'investigation', label: 'Abrir Investigação' },
    { id: 'reports', label: 'Gerar Relatórios' },
    { id: 'settings', label: 'Acessar Configurações' },
    { id: 'bo', label: 'Registrar BO' },
  ];

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        username: user.username,
        role: user.role,
        permissions: user.permissions
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        username: '',
        role: roles[0]?.title || '',
        permissions: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
      updateUser(editingUser.id, formData);
    } else {
      addUser(formData);
    }
    setIsModalOpen(false);
  };

  const togglePermission = (permId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId) 
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const filteredUsers = users.filter(user => 
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="text-federal-500" size={28} />
            Usuários & Permissões
          </h2>
          <p className="text-slate-400 mt-1">Gerencie o acesso e as credenciais dos agentes.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-federal-600 hover:bg-federal-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
        >
          <Plus size={18} />
          Novo Usuário
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-3 text-slate-500" size={20} />
        <input
          type="text"
          placeholder="Buscar usuário..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-federal-500 outline-none"
        />
      </div>

      {/* Users List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredUsers.map(user => (
          <div key={user.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 group hover:border-federal-500/30 transition-all">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                <span className="font-bold text-lg text-slate-400">{user.username.substring(0,2).toUpperCase()}</span>
              </div>
              <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                  {user.name}
                  {!user.active && <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 border border-red-500/20">INATIVO</span>}
                </h3>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <span className="flex items-center gap-1"><User size={12} /> {user.username}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Shield size={12} /> {user.role}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button 
                onClick={() => toggleUserStatus(user.id)}
                className={clsx(
                  "p-2 rounded-lg transition-colors",
                  user.active ? "text-emerald-400 hover:bg-emerald-500/10" : "text-slate-500 hover:bg-slate-800"
                )}
                title={user.active ? "Desativar" : "Ativar"}
              >
                <Power size={18} />
              </button>
              <button 
                onClick={() => handleOpenModal(user)}
                className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors"
                title="Editar"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => { if(window.confirm('Excluir usuário?')) deleteUser(user.id) }}
                className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                title="Excluir"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Nome Completo</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full mt-1 px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-federal-500 outline-none"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Login / Username</label>
                  <input 
                    type="text" 
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    className="w-full mt-1 px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-federal-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Cargo / Patente</label>
                  <select 
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    className="w-full mt-1 px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-federal-500 outline-none"
                  >
                    {roles.map(r => <option key={r.id} value={r.title}>{r.title}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Permissões de Acesso</label>
                <div className="grid grid-cols-2 gap-2">
                  {availablePermissions.map(perm => (
                    <label key={perm.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-federal-500/50">
                      <div className={clsx(
                        "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                        formData.permissions.includes(perm.id) ? "bg-federal-500 border-federal-500" : "border-slate-600"
                      )}>
                        {formData.permissions.includes(perm.id) && <Check size={12} className="text-white" />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={formData.permissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                      />
                      <span className="text-sm text-slate-300">{perm.label}</span>
                    </label>
                  ))}
                </div>
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

export default UsersSettings;
