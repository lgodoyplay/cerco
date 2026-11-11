import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getRoleTitles, normalizeRoleAssignment, normalizeRoleDisplay } from '../utils/roleUtils';

const SettingsContext = createContext();

const DEFAULT_CORPORATION = {
  departments: ['Departamento de Investigações', 'DRE', 'DELEFAZ'],
  divisions: ['Narcóticos', 'Homicídios', 'Crimes Cibernéticos'],
  sectors: ['Inteligência', 'Operacional', 'Administrativo']
};

const DEFAULT_ROLES = [
  { id: 1, title: 'Diretor Geral', hierarchy: 1, kind: 'main', category: 'main', isThirdParty: false, color: '#f59e0b', permissions: [] },
  { id: 2, title: 'Coordenador', hierarchy: 2, kind: 'main', category: 'main', isThirdParty: false, color: '#8b5cf6', permissions: [] },
  { id: 3, title: 'Escrivão', hierarchy: 3, kind: 'main', category: 'main', isThirdParty: false, color: '#3b82f6', permissions: [] },
  { id: 4, title: 'Agente', hierarchy: 4, kind: 'main', category: 'main', isThirdParty: false, color: '#10b981', permissions: [] },
  { id: 5, title: 'Aluno', hierarchy: 5, kind: 'main', category: 'main', isThirdParty: false, color: '#f97316', permissions: [] },
];

const ROLE_STORAGE_KEY = 'cerco_roles_settings';

const getPersistedRoles = () => {
  try {
    const rawValue = localStorage.getItem(ROLE_STORAGE_KEY);
    if (!rawValue) return DEFAULT_ROLES;

    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.warn('Não foi possível ler cargos persistidos no navegador:', error);
  }

  return DEFAULT_ROLES;
};

const DEFAULT_APPEARANCE = {
  theme: 'dark',
  primaryColor: 'blue',
  compactMode: false,
  logoUrl: null,
  discordInviteUrl: 'https://discord.gg/PWUENE7MJh'
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
  forensicsWebhook: '',
  weaponsWebhook: '',
  corregedoriaWebhook: '',
  exonerationsWebhook: '',
  laudosWebhook: '',
  searchSeizureWebhook: '',
  protectiveMeasuresWebhook: ''
};

export const SettingsProvider = ({ children }) => {
  // Users State (from API)
  const [users, setUsers] = useState([]);
  
  // Corporation Structure State (Supabase)
  const [corporation, setCorporation] = useState(DEFAULT_CORPORATION);

  // Roles State (Supabase + local fallback to avoid losing permissions on redeploy)
  const [roles, setRoles] = useState(() => getPersistedRoles());

  // Templates State (Supabase)
  const [templates, setTemplates] = useState(null);

  // Appearance State (Supabase)
  const [appearance, setAppearance] = useState(DEFAULT_APPEARANCE);

  // Security State (Supabase)
  const [security, setSecurity] = useState(DEFAULT_SECURITY);

  // Discord Config State (Supabase)
  const [discordConfig, setDiscordConfig] = useState(DEFAULT_DISCORD_CONFIG);

  // Crimes State (Supabase)
  const [crimes, setCrimes] = useState([]);

  // System Logs (Supabase)
  const [logs, setLogs] = useState([]);
  const [unreadLogsCount, setUnreadLogsCount] = useState(0);

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
        const persistedRoles = getPersistedRoles();
        if (rolesSetting && Array.isArray(rolesSetting.value)) {
          setRoles(rolesSetting.value);
        } else if (Array.isArray(persistedRoles)) {
          setRoles(persistedRoles);
        }

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

  // Fetch Crimes
  const fetchCrimes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('crimes')
        .select('*');
      
      if (error) throw error;
      // Ordena os crimes pelo número do artigo (convertendo para número)
      const sortedCrimes = (data || []).sort((a, b) => {
        const numA = parseInt(a.article, 10);
        const numB = parseInt(b.article, 10);
        return numA - numB;
      });
      setCrimes(sortedCrimes);
    } catch (error) {
      console.error('Error fetching crimes:', error);
    }
  }, []);

  // Add Crime
  const addCrime = useCallback(async (crime) => {
    try {
      const { data, error } = await supabase
        .from('crimes')
        .insert([{
          article: crime.article,
          name: crime.name,
          penalty: crime.penalty
        }])
        .select('*');
      
      if (error) throw error;
      const newCrime = data[0];
      setCrimes(prev => [...prev, newCrime]);
      await logAction('CREATE_CRIME', 'crimes', newCrime.id, null, newCrime);
      return newCrime;
    } catch (error) {
      console.error('Error adding crime:', error);
      throw error;
    }
  }, []);

  // Update Crime
  const updateCrime = useCallback(async (id, crime) => {
    try {
      // Busca dados antigos para log
      const { data: oldData } = await supabase.from('crimes').select('*').eq('id', id).single();
      
      const { data, error } = await supabase
        .from('crimes')
        .update({
          article: crime.article,
          name: crime.name,
          penalty: crime.penalty,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*');
      
      if (error) throw error;
      const updatedCrime = data[0];
      setCrimes(prev => prev.map(c => c.id === id ? updatedCrime : c));
      await logAction('UPDATE_CRIME', 'crimes', id, oldData, updatedCrime);
      return updatedCrime;
    } catch (error) {
      console.error('Error updating crime:', error);
      throw error;
    }
  }, []);

  // Delete Crime
  const deleteCrime = useCallback(async (id) => {
    try {
      // Busca dados antigos para log
      const { data: oldData } = await supabase.from('crimes').select('*').eq('id', id).single();
      
      const { error } = await supabase
        .from('crimes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setCrimes(prev => prev.filter(c => c.id !== id));
      await logAction('DELETE_CRIME', 'crimes', id, oldData, null);
    } catch (error) {
      console.error('Error deleting crime:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    if (Array.isArray(roles)) {
      localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(roles));
    } else {
      localStorage.removeItem(ROLE_STORAGE_KEY);
    }
  }, [roles]);

  const syncProfilesWithRoles = useCallback(async (nextRoles) => {
    const validRoleTitles = getRoleTitles(nextRoles);

    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, role');

      if (error) throw error;

      const staleProfileIds = (profiles || [])
        .filter((profile) => {
          const currentRole = normalizeRoleDisplay(profile?.role);
          return Boolean(currentRole) && !validRoleTitles.has(currentRole);
        })
        .map((profile) => profile.id);

      if (staleProfileIds.length > 0) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: '' })
          .in('id', staleProfileIds);

        if (updateError) throw updateError;
      }

      await fetchUsers();
    } catch (error) {
      console.error('Error syncing roles with profiles:', error);
    }
  }, [fetchUsers]);

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
        role: normalizeRoleDisplay(u.role),
        permissions: u.permissions || [], // Carrega permissões do banco
        avatar_url: u.avatar_url,
        passport_id: u.passport_id,
        active: true,
        patente: normalizeRoleDisplay(u.role) // Mapping role to patente for now
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
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);

      // Conta logs não lidos
      const unreadCount = (data || []).filter(log => !log.is_read).length;
      setUnreadLogsCount(unreadCount);
    } catch (error) {
      console.error('Error fetching logs:', error);
      // Se a tabela não existir, usamos array vazio
      setLogs([]);
      setUnreadLogsCount(0);
    }
  }, []);

  // Marcar logs como lidos
  const markLogsAsRead = useCallback(async () => {
    try {
      await supabase.from('audit_logs').update({ is_read: true }).eq('is_read', false);
      setUnreadLogsCount(0);
    } catch (error) {
      console.error('Error marking logs as read:', error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchLogs();
    fetchSettings();
    fetchCrimes();

    // Inscreve-se para mudanças em tempo real nos logs
    let logsSubscription;
    try {
      logsSubscription = supabase
        .channel('audit_logs_changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, () => {
          fetchLogs();
        })
        .subscribe();
    } catch (realtimeError) {
      console.warn('SettingsContext: inscrição Realtime indisponível no momento.', realtimeError);
    }

    return () => {
      if (logsSubscription) {
        logsSubscription.unsubscribe();
      }
    };
  }, [fetchUsers, fetchLogs, fetchSettings, fetchCrimes]);

  // --- Actions ---

  const updateCrimes = (newCrimes) => {
    setCrimes(newCrimes);
  };

  const logAction = async (action, tableName = null, recordId = null, oldData = null, newData = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Busca perfil do usuário para obter nome
      let userName = 'Sistema';
      if (user?.id) {
        const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single();
        if (profile) {
          userName = `${profile.full_name} (${profile.role})`;
        }
      }

      await supabase.from('audit_logs').insert([{
        user_id: user?.id,
        user_name: userName,
        action: action,
        table_name: tableName,
        record_id: recordId,
        old_data: oldData,
        new_data: newData,
        is_read: false
      }]);
      
      await fetchLogs();
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  const saveSetting = async (key, value) => {
    try {
      if (key === 'roles' && Array.isArray(value)) {
        localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(value));
      }

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
      return true;
    } catch (error) {
      console.error(`Error saving setting ${key}:`, error);
      if (error.code === '42P01' || error.message?.includes('system_settings')) {
        alert('ERRO CRÍTICO: Tabela de configurações não encontrada. Vá em "Diagnóstico do Sistema" e execute o script de correção.');
      } else {
        alert('Erro ao salvar configuração.');
      }
      return false;
    }
  };

  const addUser = async (userData) => {
    try {
      console.log('Adding user with data:', userData);
      
      const permissionsToSave = [];
      const safeRole = normalizeRoleAssignment(userData.role, roles);

      const payload = {
        p_email: userData.username,
        p_password: userData.password,
        p_full_name: userData.name,
        p_passport_id: userData.passport_id || '',
        p_role: safeRole,
        p_permissions: permissionsToSave
      };

      const { data, error } = await supabase.rpc('create_user_command', payload);

      if (error) {
        console.error('RPC Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      await fetchUsers();
      logAction(`Novo usuário criado: ${userData.name}`);
      alert('Usuário criado com sucesso!');
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Erro ao criar usuário: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const updateUser = async (id, userData) => {
    try {
      const safeRole = normalizeRoleAssignment(userData.role, roles);

      const { error } = await supabase
        .from('profiles')
        .update({
            full_name: userData.name,
            role: safeRole,
            permissions: [],
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

  const updateRoles = async (newRoles) => {
    await saveSetting('roles', newRoles);
    await syncProfilesWithRoles(newRoles);
  };
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
    crimes,
    updateCrimes,
    addCrime,
    updateCrime,
    deleteCrime,
    fetchCrimes,
    logs,
    unreadLogsCount,
    markLogsAsRead,
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
