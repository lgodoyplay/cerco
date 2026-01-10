import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const DEFAULT_CORPORATION = {
  departments: ['DIP', 'DRE', 'DELEFAZ'],
  divisions: ['Narcóticos', 'Homicídios', 'Crimes Cibernéticos'],
  sectors: ['Inteligência', 'Operacional', 'Administrativo']
};

const DEFAULT_ROLES = [
  { id: 1, title: 'Diretor DIP', hierarchy: 1 },
  { id: 2, title: 'Coordenador DIP', hierarchy: 2 },
  { id: 3, title: 'Escrivão DIP', hierarchy: 3 },
  { id: 4, title: 'Agente DIP', hierarchy: 4 },
];

export const useSettings = () => {
  // Users State (from API)
  const [users, setUsers] = useState([]);
  
  // Corporation Structure State (Supabase)
  const [corporation, setCorporation] = useState(DEFAULT_CORPORATION);

  // Roles State (Supabase)
  const [roles, setRoles] = useState(DEFAULT_ROLES);

  // System Logs (Supabase)
  const [logs, setLogs] = useState([]);

  // Fetch Settings
  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');

      if (error && error.code !== 'PGRST116') { // Ignore if not found or other minor issue for now
         console.error('Error fetching settings:', error);
      }

      if (data) {
        const corpSetting = data.find(s => s.key === 'corporation');
        if (corpSetting) setCorporation(corpSetting.value);

        const rolesSetting = data.find(s => s.key === 'roles');
        if (rolesSetting) setRoles(rolesSetting.value);
      }
    } catch (error) {
       console.error('Error fetching settings:', error);
    }
  }, []);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;

      const mappedUsers = data.map(u => ({
        id: u.id,
        name: u.full_name,
        username: u.email, // Using email as username/login
        role: u.role,
        permissions: u.permissions || [], // Carrega permissões do banco
        active: true,
        patente: u.role // Mapping role to patente for now
      }));
      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  // Fetch Logs
  const fetchLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const mappedLogs = data.map(l => ({
        id: l.id,
        action: l.action,
        timestamp: l.created_at,
        user: 'Sistema'
      }));
      setLogs(mappedLogs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchLogs();
    fetchSettings();
  }, [fetchUsers, fetchLogs, fetchSettings]);

  // Remove local storage effects
  // useEffect(() => localStorage.setItem(STORAGE_KEYS.CORPORATION, JSON.stringify(corporation)), [corporation]);
  // useEffect(() => localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(roles)), [roles]);

  // --- Actions ---

  const logAction = async (action) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('system_logs').insert([{
        user_id: user?.id,
        action: action,
        details: action // Simple mapping
      }]);
      fetchLogs();
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  const saveSetting = async (key, value) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({ key, value });
      
      if (error) throw error;
      
      // Update local state based on key
      if (key === 'corporation') setCorporation(value);
      if (key === 'roles') setRoles(value);

      logAction(`Configuração atualizada: ${key}`);
    } catch (error) {
      console.error(`Error saving setting ${key}:`, error);
      alert('Erro ao salvar configuração.');
    }
  };

  const addUser = async (userData) => {
    alert('Para adicionar usuários, utilize o painel de Autenticação do Supabase (Authentication -> Add User).');
  };

  const updateUser = async (id, userData) => {
    try {
      // We can update the profile name/role
      const { error } = await supabase
        .from('profiles')
        .update({
            full_name: userData.name,
            role: userData.role,
            permissions: userData.permissions // Salva as permissões
        })
        .eq('id', id);

      if (error) throw error;

      await fetchUsers();
      logAction(`Usuário atualizado: ID ${id}`);
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar usuário. Verifique se você tem permissão.');
    }
  };

  const toggleUserStatus = async (id) => {
    alert('Desativar usuários deve ser feito no painel do Supabase (Ban/Delete User).');
  };

  const deleteUser = async (id) => {
    alert('Remover usuários deve ser feito no painel do Supabase.');
  };

  const updateCorporation = (type, list) => {
    const newCorporation = { ...corporation, [type]: list };
    saveSetting('corporation', newCorporation);
  };

  const updateRoles = (newRoles) => saveSetting('roles', newRoles);

  return {
    users,
    corporation,
    roles,
    logs,
    addUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
    updateCorporation,
    updateRoles,
    logAction
  };
};
