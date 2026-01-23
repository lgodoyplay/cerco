import React, { useState, useEffect } from 'react';
import { useSettings } from '../../../hooks/useSettings';
import { supabase } from '../../../lib/supabase';
import { Plus, Edit2, Trash2, Shield, User, Users, Power, Search, Check, X, BookOpen, GraduationCap, Mail, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import AvatarUpload from '../../../components/AvatarUpload';
import { getInitials } from '../../../utils/stringUtils';

const UsersSettings = () => {
  const { users, addUser, updateUser, toggleUserStatus, deleteUser, roles, refreshUsers } = useSettings();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('profile'); // profile, courses, anp
  
  // Dados do formulário
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    passport_id: '',
    role: 'Aluno ANP',
    permissions: [],
    avatar_url: null
  });

  // Novo Email
  const [newEmail, setNewEmail] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(false);

  // Dados de cursos
  const [userCourses, setUserCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [selectedCourseToAdd, setSelectedCourseToAdd] = useState('');

  // Dados ANP
  const [anpStages, setAnpStages] = useState([]);
  const [userANPProgress, setUserANPProgress] = useState({});
  const [loadingANP, setLoadingANP] = useState(false);

  const permissionModules = [
    { id: 'judiciary', label: 'Jurídico' },
    { id: 'arrest', label: 'Prisões' },
    { id: 'wanted', label: 'Procurados' },
    { id: 'bo', label: 'Boletins de Ocorrência' },
    { id: 'reports', label: 'Denúncias' },
    { id: 'investigations', label: 'Investigações' },
    { id: 'forensics', label: 'Perícias' },
    { id: 'weapons', label: 'Porte de Armas' },
    { id: 'logistics', label: 'Logística' },
    { id: 'communication', label: 'Comunicação' },
    { id: 'revenue', label: 'Receita' },
    { id: 'prf', label: 'Integração PRF' },
    { id: 'lawyer', label: 'Advogados' },
    { id: 'courses', label: 'Cursos/Ensino' },
    { id: 'anp', label: 'Gestão ANP' },
    { id: 'settings', label: 'Configurações' },
  ];

  // Carregar cursos disponíveis quando abrir modal
  useEffect(() => {
    if (isModalOpen) {
      fetchCourses();
    }
  }, [isModalOpen]);

  // Carregar dados específicos quando editar usuário
  useEffect(() => {
    if (editingUser) {
      fetchUserCourses(editingUser.id);
      if (activeTab === 'anp') {
        fetchANPData(editingUser.id);
      }
    }
  }, [editingUser, activeTab]);

  const fetchCourses = async () => {
    try {
      const { data } = await supabase.from('cursos').select('*').order('nome');
      setAllCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchUserCourses = async (userId) => {
    try {
      const { data } = await supabase
        .from('cursos_policiais')
        .select(`
          id,
          cursos (id, nome, descricao)
        `)
        .eq('policial_id', userId);
      setUserCourses(data || []);
    } catch (error) {
      console.error('Error fetching user courses:', error);
    }
  };

  const fetchANPData = async (userId) => {
    try {
      setLoadingANP(true);
      // Stages
      const { data: stages } = await supabase.from('anp_stages').select('*').order('order');
      setAnpStages(stages || []);

      // Progress
      const { data: progress } = await supabase.from('user_anp_progress').select('*').eq('user_id', userId);
      const progressMap = {};
      (progress || []).forEach(p => progressMap[p.stage_id] = p.status);
      setUserANPProgress(progressMap);
    } catch (error) {
      console.error('Error fetching ANP data:', error);
    } finally {
      setLoadingANP(false);
    }
  };

  const handleOpenModal = (user = null) => {
    setActiveTab('profile');
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        username: user.username,
        password: '',
        passport_id: user.passport_id || '', 
        role: user.role,
        permissions: user.permissions,
        avatar_url: user.avatar_url
      });
      setNewEmail(''); // Reset email field
      fetchProfileDetails(user.id);
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        username: '',
        password: '',
        passport_id: '',
        role: roles[0]?.title || '',
        permissions: [],
        avatar_url: null
      });
      setUserCourses([]);
    }
    setIsModalOpen(true);
  };

  const fetchProfileDetails = async (id) => {
    const { data } = await supabase.from('profiles').select('avatar_url, passport_id').eq('id', id).single();
    if (data) {
      setFormData(prev => ({ ...prev, avatar_url: data.avatar_url, passport_id: data.passport_id || '' }));
    }
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

  const handleEmailUpdate = async () => {
    if (!newEmail || !editingUser) return;
    if (!window.confirm(`Tem certeza que deseja alterar o email para ${newEmail}?`)) return;

    try {
      setUpdatingEmail(true);
      // Call RPC to update email
      const { error } = await supabase.rpc('admin_update_user_email', {
        target_user_id: editingUser.id,
        new_email: newEmail
      });

      if (error) throw error;
      
      alert('Email atualizado com sucesso!');
      setNewEmail('');
      refreshUsers();
    } catch (error) {
      console.error('Error updating email:', error);
      alert('Erro ao atualizar email: ' + error.message);
    } finally {
      setUpdatingEmail(false);
    }
  };

  const togglePermission = (permId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId) 
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const handleAddCourseToUser = async () => {
    if (!selectedCourseToAdd || !editingUser) return;

    try {
      const { error } = await supabase.from('cursos_policiais').insert({
        policial_id: editingUser.id,
        curso_id: selectedCourseToAdd,
        atribuido_por: (await supabase.auth.getUser()).data.user.id
      });

      if (error) throw error;
      
      fetchUserCourses(editingUser.id);
      setSelectedCourseToAdd('');
    } catch (error) {
      console.error(error);
      alert('Erro ao adicionar curso. Verifique se o usuário já possui este curso.');
    }
  };

  const handleRemoveCourseFromUser = async (assignmentId) => {
    if (!window.confirm('Remover este curso do usuário?')) return;
    
    try {
      await supabase.from('cursos_policiais').delete().eq('id', assignmentId);
      fetchUserCourses(editingUser.id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAvatarUpdate = async (url) => {
    setFormData(prev => ({ ...prev, avatar_url: url }));
    if (editingUser) {
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', editingUser.id);
      if (refreshUsers) refreshUsers();
    }
  };

  const handleToggleANPStage = async (stageId, currentStatus) => {
    if (!editingUser) return;
    
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    try {
      if (currentStatus === 'completed') {
        // Remove or set to pending
        await supabase.from('user_anp_progress')
          .update({ status: 'pending', completed_at: null, completed_by: null })
          .eq('user_id', editingUser.id)
          .eq('stage_id', stageId);
      } else {
        // Upsert to completed
        const { error } = await supabase.from('user_anp_progress').upsert({
          user_id: editingUser.id,
          stage_id: stageId,
          status: 'completed',
          completed_at: new Date(),
          completed_by: (await supabase.auth.getUser()).data.user.id
        }, { onConflict: 'user_id, stage_id' });
        
        if (error) throw error;
      }
      
      fetchANPData(editingUser.id);
    } catch (error) {
      console.error('Error toggling ANP stage:', error);
    }
  };

  const handlePromoteToAgent = async () => {
    if (!editingUser) return;
    if (!window.confirm('Deseja promover este usuário a Agente DPF? Isso dará acesso às funções básicas.')) return;

    try {
      await updateUser(editingUser.id, { ...formData, role: 'Agente DPF' });
      setFormData(prev => ({ ...prev, role: 'Agente DPF' }));
      alert('Usuário promovido com sucesso!');
    } catch (error) {
      console.error('Error promoting user:', error);
      alert('Erro ao promover usuário.');
    }
  };

  const filteredUsers = users.filter(user => 
    (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.passport_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.codigo_funcional || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="text-federal-500" size={28} />
            Gerenciamento de Perfis
          </h2>
          <p className="text-slate-400 mt-1">Gerencie usuários, permissões e especializações.</p>
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
          placeholder="Buscar usuário por nome, login ou funcional..."
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
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden">
                {user.avatar_url || user.avatar ? (
                   <img 
                     src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${user.avatar_url || user.avatar}`}
                     className="w-full h-full object-cover"
                     onError={(e) => e.target.style.display = 'none'}
                     alt={user.name}
                   />
                ) : (
                   <span className="font-bold text-lg text-slate-400">{getInitials(user.username)}</span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                  {user.name}
                  {user.passport_id && <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">#{user.passport_id}</span>}
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
                title="Editar Perfil Completo"
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

      {/* Modal Completo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">{editingUser ? 'Gerenciar Perfil' : 'Novo Usuário'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
            </div>

            {/* Tabs */}
            {editingUser && (
              <div className="flex border-b border-slate-800 px-6 overflow-x-auto flex-shrink-0">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={clsx(
                    "px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                    activeTab === 'profile' ? "border-federal-500 text-white" : "border-transparent text-slate-400 hover:text-slate-200"
                  )}
                >
                  Dados Pessoais
                </button>
                <button
                  onClick={() => setActiveTab('courses')}
                  className={clsx(
                    "px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                    activeTab === 'courses' ? "border-federal-500 text-white" : "border-transparent text-slate-400 hover:text-slate-200"
                  )}
                >
                  Cursos e Especializações
                </button>
                <button
                  onClick={() => setActiveTab('anp')}
                  className={clsx(
                    "px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                    activeTab === 'anp' ? "border-federal-500 text-white" : "border-transparent text-slate-400 hover:text-slate-200"
                  )}
                >
                  Gestão ANP
                </button>
              </div>
            )}
            
            <div className="overflow-y-auto p-6 flex-1 min-h-0">
              {activeTab === 'profile' ? (
                <form id="user-form" onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex justify-center mb-6">
                    <AvatarUpload 
                      url={formData.avatar_url} 
                      onUpload={handleAvatarUpdate}
                      size={100}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
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
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Funcional (Passaporte)</label>
                        <input 
                          type="text" 
                          value={formData.passport_id}
                          onChange={e => setFormData({...formData, passport_id: e.target.value})}
                          className="w-full mt-1 px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-federal-500 outline-none"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Login / Email</label>
                        <input 
                          type="text" 
                          value={formData.username}
                          onChange={e => setFormData({...formData, username: e.target.value})}
                          className="w-full mt-1 px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-federal-500 outline-none"
                          required
                          disabled={!!editingUser}
                        />
                      </div>
                      {!editingUser && (
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase">Senha Inicial</label>
                          <input 
                            type="password" 
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                            className="w-full mt-1 px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-federal-500 outline-none"
                            required
                            placeholder="Mínimo 6 caracteres"
                          />
                        </div>
                      )}
                    </div>

                    {/* Email Change Section for Admins */}
                    {editingUser && (
                      <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700">
                        <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 mb-2">
                          <Mail size={12} /> Alterar Email (Avançado)
                        </label>
                        <div className="flex gap-2">
                          <input 
                            type="email" 
                            value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                            placeholder="Novo email..."
                            className="flex-1 px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-federal-500 outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleEmailUpdate}
                            disabled={!newEmail || updatingEmail}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap"
                          >
                            {updatingEmail ? '...' : 'Alterar'}
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Atenção: Isso alterará o login de acesso do usuário.</p>
                      </div>
                    )}

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
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {permissionModules.map(module => (
                          <div key={module.id} className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                            <div className="text-sm font-bold text-slate-300 mb-2 border-b border-slate-800 pb-1">{module.label}</div>
                            <div className="grid grid-cols-2 gap-3">
                                {/* View Permission */}
                                <label className="flex items-center gap-2 cursor-pointer group select-none">
                                    <div className={clsx(
                                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                    formData.permissions.includes(`${module.id}_view`) ? "bg-federal-500 border-federal-500" : "border-slate-600 group-hover:border-slate-500"
                                    )}>
                                    {formData.permissions.includes(`${module.id}_view`) && <Check size={12} className="text-white" />}
                                    </div>
                                    <input 
                                    type="checkbox" 
                                    className="hidden"
                                    checked={formData.permissions.includes(`${module.id}_view`)}
                                    onChange={() => togglePermission(`${module.id}_view`)}
                                    />
                                    <span className="text-sm text-slate-400 group-hover:text-slate-300">Consultar</span>
                                </label>

                                {/* Manage Permission */}
                                <label className="flex items-center gap-2 cursor-pointer group select-none">
                                    <div className={clsx(
                                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                    formData.permissions.includes(`${module.id}_manage`) ? "bg-federal-500 border-federal-500" : "border-slate-600 group-hover:border-slate-500"
                                    )}>
                                    {formData.permissions.includes(`${module.id}_manage`) && <Check size={12} className="text-white" />}
                                    </div>
                                    <input 
                                    type="checkbox" 
                                    className="hidden"
                                    checked={formData.permissions.includes(`${module.id}_manage`)}
                                    onChange={() => togglePermission(`${module.id}_manage`)}
                                    />
                                    <span className="text-sm text-slate-400 group-hover:text-slate-300">Gerenciar</span>
                                </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                </form>
              ) : activeTab === 'courses' ? (
                <div className="space-y-6">
                  <div className="flex gap-2">
                    <select
                      value={selectedCourseToAdd}
                      onChange={(e) => setSelectedCourseToAdd(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-federal-500 outline-none"
                    >
                      <option value="">Selecione um curso para adicionar...</option>
                      {allCourses.map(course => (
                        <option key={course.id} value={course.id}>{course.nome}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddCourseToUser}
                      disabled={!selectedCourseToAdd}
                      className="bg-federal-600 hover:bg-federal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold"
                    >
                      Adicionar
                    </button>
                  </div>

                  <div className="space-y-2">
                    {userCourses.length === 0 ? (
                      <p className="text-center text-slate-500 py-8">Este usuário não possui cursos atribuídos.</p>
                    ) : (
                      userCourses.map(assignment => (
                        <div key={assignment.id} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg">
                          <div className="flex items-center gap-3">
                            <GraduationCap className="text-federal-500" size={20} />
                            <div>
                              <p className="font-bold text-white text-sm">{assignment.cursos?.nome}</p>
                              <p className="text-xs text-slate-500">{assignment.cursos?.descricao}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveCourseFromUser(assignment.id)}
                            className="text-slate-500 hover:text-red-400 p-2"
                            title="Remover Curso"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                // ANP TAB
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-slate-800/30 p-4 rounded-lg">
                    <div>
                      <h4 className="font-bold text-white">Progresso da Academia</h4>
                      <p className="text-sm text-slate-400">Marque os módulos concluídos pelo aluno.</p>
                    </div>
                    {formData.role !== 'Agente DPF' && (
                      <button
                        onClick={handlePromoteToAgent}
                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg"
                      >
                        <Shield size={16} />
                        Promover a Agente
                      </button>
                    )}
                  </div>

                  {loadingANP ? (
                     <div className="text-center py-8 text-slate-500">Carregando dados...</div>
                  ) : (
                    <div className="space-y-3">
                      {anpStages.map(stage => {
                        const isCompleted = userANPProgress[stage.id] === 'completed';
                        return (
                          <div 
                            key={stage.id}
                            onClick={() => handleToggleANPStage(stage.id, userANPProgress[stage.id])}
                            className={clsx(
                              "flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all",
                              isCompleted 
                                ? "bg-federal-900/20 border-federal-500/50" 
                                : "bg-slate-950 border-slate-800 hover:border-slate-600"
                            )}
                          >
                            <div>
                              <h5 className={clsx("font-bold", isCompleted ? "text-white" : "text-slate-300")}>{stage.title}</h5>
                              <p className="text-xs text-slate-500">{stage.description}</p>
                            </div>
                            <div className={clsx(
                              "w-6 h-6 rounded-full flex items-center justify-center border",
                              isCompleted ? "bg-federal-500 border-federal-500 text-white" : "border-slate-600"
                            )}>
                              {isCompleted && <Check size={14} />}
                            </div>
                          </div>
                        );
                      })}
                      {anpStages.length === 0 && (
                        <p className="text-center text-slate-500">Nenhuma etapa cadastrada no sistema.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900 rounded-b-2xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-400 hover:text-white">Cancelar</button>
              {activeTab === 'profile' && (
                <button type="submit" form="user-form" className="bg-federal-600 hover:bg-federal-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg">
                  Salvar Alterações
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersSettings;
