import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const SettingsContext = createContext();

const DEFAULT_CORPORATION = {
  departments: ['Departamento de Investigações', 'DRE', 'DELEFAZ'],
  divisions: ['Narcóticos', 'Homicídios', 'Crimes Cibernéticos'],
  sectors: ['Inteligência', 'Operacional', 'Administrativo']
};

const DEFAULT_ROLES = [
  { id: 1, title: 'Diretor Geral', hierarchy: 1 },
  { id: 2, title: 'Coordenador', hierarchy: 2 },
  { id: 3, title: 'Escrivão', hierarchy: 3 },
  { id: 4, title: 'Agente', hierarchy: 4 },
];

const DEFAULT_APPEARANCE = {
  theme: 'dark',
  primaryColor: 'blue',
  compactMode: false,
  logoUrl: null
};

const DEFAULT_SECURITY = {
  forcePasswordChange: true,
  sessionTimeout: '30',
  minPasswordStrength: 'strong',
  mfaEnabled: false,
  maxLoginAttempts: '3'
};

const DEFAULT_DISCORD_CONFIG = {
  webhookUrl: '', // Mantido para compatibilidade, mas o foco será nos específicos
  formsWebhook: '',
  arrestsWebhook: '',
  wantedWebhook: '',
  bulletinsWebhook: '',
  reportsWebhook: '',
  forensicsWebhook: ''
};

export const SettingsProvider = ({ children }) => {
  // Users State (from API)
  const [users, setUsers] = useState([]);
  
  // Corporation Structure State (Supabase)
  const [corporation, setCorporation] = useState(DEFAULT_CORPORATION);

  // Roles State (Supabase)
  const [roles, setRoles] = useState(DEFAULT_ROLES);

  // Templates State (Supabase)
  const [templates, setTemplates] = useState(null);

  // Appearance State (Supabase)
  const [appearance, setAppearance] = useState(DEFAULT_APPEARANCE);

  // Security State (Supabase)
  const [security, setSecurity] = useState(DEFAULT_SECURITY);

  // Discord Config State (Supabase)
  const [discordConfig, setDiscordConfig] = useState(DEFAULT_DISCORD_CONFIG);

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

        const templatesSetting = data.find(s => s.key === 'templates');
        if (templatesSetting) setTemplates(templatesSetting.value);

        const appearanceSetting = data.find(s => s.key === 'appearance');
        if (appearanceSetting) setAppearance(appearanceSetting.value);

        const securitySetting = data.find(s => s.key === 'security');
        if (securitySetting && securitySetting.value) {
          setSecurity(securitySetting.value);
        }

        const discordSetting = data.find(s => s.key === 'discord_config');
        if (discordSetting) {
          // Merge with default to ensure all keys exist
          setDiscordConfig({ ...DEFAULT_DISCORD_CONFIG, ...discordSetting.value });
        }
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
        avatar_url: u.avatar_url,
        passport_id: u.passport_id,
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
      if (key === 'templates') setTemplates(value);
      if (key === 'appearance') setAppearance(value);
      if (key === 'security') setSecurity(value);

      logAction(`Configuração atualizada: ${key}`);
    } catch (error) {
      console.error(`Error saving setting ${key}:`, error);
      alert('Erro ao salvar configuração.');
    }
  };

  const addUser = async (userData) => {
    try {
      const { data, error } = await supabase.rpc('create_user_command', {
        email: userData.username,
        password: userData.password,
        full_name: userData.name,
        passport_id: userData.passport_id,
        role: userData.role,
        permissions: userData.permissions
      });

      if (error) throw error;

      await fetchUsers();
      logAction(`Novo usuário criado: ${userData.name}`);
      alert('Usuário criado com sucesso!');
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Erro ao criar usuário: ' + error.message);
    }
  };

  const updateUser = async (id, userData) => {
    try {
      // We can update the profile name/role
      const { error } = await supabase
        .from('profiles')
        .update({
            full_name: userData.name,
            role: userData.role,
            permissions: userData.permissions, // Salva as permissões
            avatar_url: userData.avatar_url,
            passport_id: userData.passport_id
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
    try {
      const { error } = await supabase.rpc('delete_user_command', { target_user_id: id });
      
      if (error) throw error;
      
      await fetchUsers();
      logAction(`Usuário removido: ID ${id}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Erro ao remover usuário: ' + error.message);
    }
  };

  const updateCorporation = async (type, list) => {
    const newCorporation = { ...corporation, [type]: list };
    await saveSetting('corporation', newCorporation);
  };

  const updateRoles = (newRoles) => saveSetting('roles', newRoles);
  const updateTemplates = (newTemplates) => saveSetting('templates', newTemplates);
  const updateAppearance = (newAppearance) => saveSetting('appearance', newAppearance);
  const updateSecurity = (newSecurity) => saveSetting('security', newSecurity);
  const updateDiscordConfig = (newConfig) => saveSetting('discord_config', newConfig);

  const value = {
    users,
    corporation,
    roles,
    templates,
    appearance,
    security,
    discordConfig,
    logs,
    addUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
    updateCorporation,
    updateRoles,
    updateTemplates,
    updateAppearance,
    updateSecurity,
    updateDiscordConfig,
    logAction,
    refreshUsers: fetchUsers
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
};
