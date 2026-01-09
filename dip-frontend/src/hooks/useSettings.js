import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const STORAGE_KEYS = {
  CORPORATION: 'dip_settings_corporation',
  ROLES: 'dip_settings_roles',
  LOGS: 'dip_settings_logs',
  THEME: 'dip_settings_theme'
};

const DEFAULT_CORPORATION = {
  departments: ['CERCO', 'DRE', 'DELEFAZ'],
  divisions: ['Narcóticos', 'Homicídios', 'Crimes Cibernéticos'],
  sectors: ['Inteligência', 'Operacional', 'Administrativo']
};

const DEFAULT_ROLES = [
  { id: 1, title: 'Delegado Civil', hierarchy: 1 },
  { id: 2, title: 'Perito Criminal', hierarchy: 2 },
  { id: 3, title: 'Agente Civil', hierarchy: 3 },
  { id: 4, title: 'Escrivão', hierarchy: 3 },
];

export const useSettings = () => {
  // Users State (from API)
  const [users, setUsers] = useState([]);
  
  // Corporation Structure State (Local)
  const [corporation, setCorporation] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CORPORATION);
    return saved ? JSON.parse(saved) : DEFAULT_CORPORATION;
  });

  // Roles State (Local)
  const [roles, setRoles] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROLES);
    return saved ? JSON.parse(saved) : DEFAULT_ROLES;
  });

  // System Logs (Local)
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/users');
      const mappedUsers = response.data.map(u => ({
        id: u.id,
        name: u.nome,
        username: u.login,
        role: u.cargo,
        permissions: u.permissoes,
        active: u.ativo,
        patente: u.patente
      }));
      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Effects to save local changes
  useEffect(() => localStorage.setItem(STORAGE_KEYS.CORPORATION, JSON.stringify(corporation)), [corporation]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(roles)), [roles]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs)), [logs]);

  // --- Actions ---

  const logAction = (action) => {
    const newLog = {
      id: Date.now(),
      action,
      timestamp: new Date().toISOString(),
      user: 'Admin' // Mock current user
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const addUser = async (userData) => {
    try {
      const payload = {
        nome: userData.name,
        login: userData.username,
        senha: userData.password || '123456',
        cargo: userData.role,
        patente: 'Agente', // Default
        permissoes: userData.permissions
      };
      await api.post('/users', payload);
      await fetchUsers();
      logAction(`Novo usuário criado: ${userData.username}`);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const updateUser = async (id, userData) => {
    try {
      const payload = {
        nome: userData.name,
        login: userData.username,
        cargo: userData.role,
        permissoes: userData.permissions,
        ativo: userData.active,
        senha: userData.password
      };
      await api.put(`/users/${id}`, payload);
      await fetchUsers();
      logAction(`Usuário atualizado: ID ${id}`);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const toggleUserStatus = async (id) => {
    try {
      const user = users.find(u => u.id === id);
      if (user) {
        await api.put(`/users/${id}`, { ativo: !user.active });
        await fetchUsers();
        logAction(`Status de usuário alterado: ${user.username}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteUser = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      await fetchUsers();
      logAction(`Usuário removido: ID ${id}`);
    } catch (error) {
      console.error(error);
    }
  };

  const updateCorporation = (type, list) => {
    setCorporation(prev => ({ ...prev, [type]: list }));
    logAction(`Estrutura corporativa atualizada: ${type}`);
  };

  return {
    users,
    corporation,
    roles,
    logs,
    addUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
    updateCorporation
  };
};
