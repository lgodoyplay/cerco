import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettingsContext } from '../context/SettingsContext';

export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard_view',
  ANP_STUDENT_VIEW: 'anp_student_view',
  BO_VIEW: 'bo_view', BO_MANAGE: 'bo_manage',
  BO_INTERNO_VIEW: 'bo_interno_view', BO_INTERNO_MANAGE: 'bo_interno_manage',
  ARREST_VIEW: 'arrest_view', ARREST_MANAGE: 'arrest_manage',
  WANTED_VIEW: 'wanted_view', WANTED_MANAGE: 'wanted_manage',
  REPORTS_VIEW: 'reports_view', REPORTS_MANAGE: 'reports_manage',
  JUDICIARY_VIEW: 'judiciary_view', JUDICIARY_MANAGE: 'judiciary_manage',
  ALVARAS_VIEW: 'alvaras_view', ALVARAS_MANAGE: 'alvaras_manage',
  CORREGEDORIA_VIEW: 'corregedoria_view', CORREGEDORIA_MANAGE: 'corregedoria_manage',
  REVENUE_VIEW: 'revenue_view', REVENUE_MANAGE: 'revenue_manage',
  INVESTIGATIONS_VIEW: 'investigations_view', INVESTIGATIONS_MANAGE: 'investigations_manage',
  INFORMANTES_VIEW: 'informantes_view', INFORMANTES_MANAGE: 'informantes_manage',
  FORENSICS_VIEW: 'forensics_view', FORENSICS_MANAGE: 'forensics_manage',
  SEARCH_SEIZURE_VIEW: 'search_seizure_view', SEARCH_SEIZURE_MANAGE: 'search_seizure_manage',
  ADMIN_ACCESS: 'admin_access',
  WEAPONS_VIEW: 'weapons_view', WEAPONS_MANAGE: 'weapons_manage',
  PROTECTIVE_MEASURES_VIEW: 'protective_measures_view', PROTECTIVE_MEASURES_MANAGE: 'protective_measures_manage',
  EXONERATIONS_VIEW: 'exonerations_view', EXONERATIONS_MANAGE: 'exonerations_manage',
  INTEGRATION_VIEW: 'integration_view', INTEGRATION_MANAGE: 'integration_manage',
  LOGISTICS_VIEW: 'logistics_view', LOGISTICS_MANAGE: 'logistics_manage',
  COMMUNICATION_VIEW: 'communication_view', COMMUNICATION_MANAGE: 'communication_manage',
  PM_VIEW: 'pm_view', PM_MANAGE: 'pm_manage',
  LAUDOS_VIEW: 'laudos_view', LAUDOS_MANAGE: 'laudos_manage',
  LAWYER_VIEW: 'lawyer_view', LAWYER_MANAGE: 'lawyer_manage',
  COURSES_VIEW: 'courses_view', COURSES_MANAGE: 'courses_manage',
  ANP_VIEW: 'anp_view', ANP_MANAGE: 'anp_manage',
  SETTINGS_VIEW: 'settings_view', SETTINGS_MANAGE: 'settings_manage',
  WARNINGS_VIEW: 'warnings_view', WARNINGS_MANAGE: 'warnings_manage',
  NEWS_VIEW: 'news_view', NEWS_MANAGE: 'news_manage',
  LOGS_VIEW: 'logs_view',
  CORPORATION_VIEW: 'corporation_view', APPEARANCE_VIEW: 'appearance_view',
  SECURITY_VIEW: 'security_view', BACKUP_VIEW: 'backup_view',
  HEALTH_VIEW: 'health_view', TEMPLATES_VIEW: 'templates_view',
  FORMS_VIEW: 'forms_view', EXAMS_VIEW: 'exams_view',
};

export const PERMISSION_GROUPS = [
  {
    id: 'admin',
    label: 'Acesso administrativo',
    permissions: [{ id: PERMISSIONS.ADMIN_ACCESS, label: 'Acesso total do sistema' }],
  },
  {
    id: 'dashboard',
    label: 'Painel principal',
    permissions: [
      { id: PERMISSIONS.DASHBOARD_VIEW, label: 'Painel geral: visualizar / pesquisar' },
      { id: PERMISSIONS.ANP_STUDENT_VIEW, label: 'Área do aluno: visualizar / pesquisar' },
    ],
  },
  {
    id: 'bo',
    label: 'Boletins',
    permissions: [
      { id: PERMISSIONS.BO_VIEW, label: 'Boletins: visualizar / pesquisar' },
      { id: PERMISSIONS.BO_MANAGE, label: 'Boletins: registrar / gerenciar' },
      { id: PERMISSIONS.BO_INTERNO_VIEW, label: 'Boletins internos: visualizar / pesquisar' },
      { id: PERMISSIONS.BO_INTERNO_MANAGE, label: 'Boletins internos: registrar / gerenciar' },
    ],
  },
  {
    id: 'operations',
    label: 'Operações e ocorrências',
    permissions: [
      { id: PERMISSIONS.ARREST_VIEW, label: 'Prisões: visualizar / pesquisar' },
      { id: PERMISSIONS.ARREST_MANAGE, label: 'Prisões: registrar / gerenciar' },
      { id: PERMISSIONS.WANTED_VIEW, label: 'Procurados: visualizar / pesquisar' },
      { id: PERMISSIONS.WANTED_MANAGE, label: 'Procurados: registrar / gerenciar' },
      { id: PERMISSIONS.PROTECTIVE_MEASURES_VIEW, label: 'Medidas protetivas: visualizar / pesquisar' },
      { id: PERMISSIONS.PROTECTIVE_MEASURES_MANAGE, label: 'Medidas protetivas: registrar / gerenciar' },
      { id: PERMISSIONS.REPORTS_VIEW, label: 'Denúncias: visualizar / pesquisar' },
      { id: PERMISSIONS.REPORTS_MANAGE, label: 'Denúncias: registrar / gerenciar' },
    ],
  },
  {
    id: 'investigative',
    label: 'Investigativo',
    permissions: [
      { id: PERMISSIONS.INVESTIGATIONS_VIEW, label: 'Investigações: visualizar / pesquisar' },
      { id: PERMISSIONS.INVESTIGATIONS_MANAGE, label: 'Investigações: registrar / gerenciar' },
      { id: PERMISSIONS.INFORMANTES_VIEW, label: 'Informantes: visualizar / pesquisar' },
      { id: PERMISSIONS.INFORMANTES_MANAGE, label: 'Informantes: registrar / gerenciar' },
      { id: PERMISSIONS.SEARCH_SEIZURE_VIEW, label: 'Busca e apreensão: visualizar / pesquisar' },
      { id: PERMISSIONS.SEARCH_SEIZURE_MANAGE, label: 'Busca e apreensão: registrar / gerenciar' },
      { id: PERMISSIONS.FORENSICS_VIEW, label: 'Perícias: visualizar / pesquisar' },
      { id: PERMISSIONS.FORENSICS_MANAGE, label: 'Perícias: registrar / gerenciar' },
      { id: PERMISSIONS.REVENUE_VIEW, label: 'Receita: visualizar / pesquisar' },
      { id: PERMISSIONS.REVENUE_MANAGE, label: 'Receita: registrar / gerenciar' },
    ],
  },
  {
    id: 'legal',
    label: 'Jurídico e administrativo legal',
    permissions: [
      { id: PERMISSIONS.ALVARAS_VIEW, label: 'Alvarás: visualizar / pesquisar' },
      { id: PERMISSIONS.ALVARAS_MANAGE, label: 'Alvarás: registrar / gerenciar' },
      { id: PERMISSIONS.WEAPONS_VIEW, label: 'Porte de armas: visualizar / pesquisar' },
      { id: PERMISSIONS.WEAPONS_MANAGE, label: 'Porte de armas: registrar / gerenciar' },
      { id: PERMISSIONS.LAWYER_VIEW, label: 'Advogados: visualizar / pesquisar' },
      { id: PERMISSIONS.LAWYER_MANAGE, label: 'Advogados: registrar / gerenciar' },
      { id: PERMISSIONS.JUDICIARY_VIEW, label: 'Jurídico: visualizar / pesquisar' },
      { id: PERMISSIONS.JUDICIARY_MANAGE, label: 'Jurídico: registrar / gerenciar' },
    ],
  },
  {
    id: 'health',
    label: 'Laudos e exames',
    permissions: [
      { id: PERMISSIONS.LAUDOS_VIEW, label: 'Laudos: visualizar / pesquisar' },
      { id: PERMISSIONS.LAUDOS_MANAGE, label: 'Laudos: registrar / gerenciar' },
    ],
  },
  {
    id: 'communication',
    label: 'Comunicação e organização',
    permissions: [
      { id: PERMISSIONS.CORREGEDORIA_VIEW, label: 'Corregedoria: visualizar / pesquisar' },
      { id: PERMISSIONS.CORREGEDORIA_MANAGE, label: 'Corregedoria: registrar / gerenciar' },
      { id: PERMISSIONS.EXONERATIONS_VIEW, label: 'Exonerações: visualizar / pesquisar' },
      { id: PERMISSIONS.EXONERATIONS_MANAGE, label: 'Exonerações: registrar / gerenciar' },
      { id: PERMISSIONS.INTEGRATION_VIEW, label: 'Integração: visualizar / pesquisar' },
      { id: PERMISSIONS.INTEGRATION_MANAGE, label: 'Integração: registrar / gerenciar' },
      { id: PERMISSIONS.PM_VIEW, label: 'PM: visualizar / pesquisar' },
      { id: PERMISSIONS.PM_MANAGE, label: 'PM: registrar / gerenciar' },
      { id: PERMISSIONS.NEWS_VIEW, label: 'Notícias: visualizar / pesquisar' },
      { id: PERMISSIONS.NEWS_MANAGE, label: 'Notícias: registrar / gerenciar' },
      { id: PERMISSIONS.COMMUNICATION_VIEW, label: 'Comunicação: visualizar / pesquisar' },
      { id: PERMISSIONS.COMMUNICATION_MANAGE, label: 'Comunicação: registrar / gerenciar' },
      { id: PERMISSIONS.LOGISTICS_VIEW, label: 'Logística: visualizar / pesquisar' },
      { id: PERMISSIONS.LOGISTICS_MANAGE, label: 'Logística: registrar / gerenciar' },
    ],
  },
  {
    id: 'settings',
    label: 'Configurações do sistema',
    permissions: [
      { id: PERMISSIONS.SETTINGS_VIEW, label: 'Configurações: visualizar / pesquisar' },
      { id: PERMISSIONS.SETTINGS_MANAGE, label: 'Configurações: registrar / gerenciar' },
      { id: PERMISSIONS.CORPORATION_VIEW, label: 'Estrutura: visualizar / pesquisar' },
      { id: PERMISSIONS.APPEARANCE_VIEW, label: 'Aparência: visualizar / pesquisar' },
      { id: PERMISSIONS.SECURITY_VIEW, label: 'Segurança: visualizar / pesquisar' },
      { id: PERMISSIONS.BACKUP_VIEW, label: 'Backup: visualizar / pesquisar' },
      { id: PERMISSIONS.HEALTH_VIEW, label: 'Diagnóstico: visualizar / pesquisar' },
      { id: PERMISSIONS.TEMPLATES_VIEW, label: 'Templates: visualizar / pesquisar' },
      { id: PERMISSIONS.FORMS_VIEW, label: 'Formulários: visualizar / pesquisar' },
      { id: PERMISSIONS.EXAMS_VIEW, label: 'Provas: visualizar / pesquisar' },
      { id: PERMISSIONS.WARNINGS_VIEW, label: 'Advertências: visualizar / pesquisar' },
      { id: PERMISSIONS.WARNINGS_MANAGE, label: 'Advertências: registrar / gerenciar' },
    ],
  },
  {
    id: 'training',
    label: 'Cursos e formação',
    permissions: [
      { id: PERMISSIONS.COURSES_VIEW, label: 'Cursos: visualizar / pesquisar' },
      { id: PERMISSIONS.COURSES_MANAGE, label: 'Cursos: registrar / gerenciar' },
      { id: PERMISSIONS.ANP_VIEW, label: 'ANP: visualizar / pesquisar' },
      { id: PERMISSIONS.ANP_MANAGE, label: 'ANP: registrar / gerenciar' },
    ],
  },
  {
    id: 'logs',
    label: 'Logs e auditoria',
    permissions: [{ id: PERMISSIONS.LOGS_VIEW, label: 'Logs: visualizar / pesquisar' }],
  },
];

export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((group) => group.permissions.map((permission) => permission.id));

const LEGACY_ROLE_PERMISSIONS = {
  'Comandante Geral': ALL_PERMISSIONS,
  Diretor: ALL_PERMISSIONS,
  Coronel: ALL_PERMISSIONS,
  Major: ALL_PERMISSIONS,
  Capitão: ALL_PERMISSIONS,
  Tenente: ALL_PERMISSIONS,
  Aluno: [PERMISSIONS.COMMUNICATION_VIEW, PERMISSIONS.LOGISTICS_VIEW],
  Sargento: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.BO_VIEW, PERMISSIONS.BO_MANAGE,
    PERMISSIONS.BO_INTERNO_VIEW, PERMISSIONS.BO_INTERNO_MANAGE,
    PERMISSIONS.ARREST_VIEW, PERMISSIONS.ARREST_MANAGE,
    PERMISSIONS.WANTED_VIEW, PERMISSIONS.WANTED_MANAGE,
    PERMISSIONS.PROTECTIVE_MEASURES_VIEW, PERMISSIONS.PROTECTIVE_MEASURES_MANAGE,
    PERMISSIONS.EXONERATIONS_VIEW, PERMISSIONS.EXONERATIONS_MANAGE,
    PERMISSIONS.INTEGRATION_VIEW, PERMISSIONS.INTEGRATION_MANAGE,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_MANAGE,
    PERMISSIONS.INVESTIGATIONS_VIEW, PERMISSIONS.INVESTIGATIONS_MANAGE,
    PERMISSIONS.INFORMANTES_VIEW, PERMISSIONS.INFORMANTES_MANAGE,
    PERMISSIONS.SEARCH_SEIZURE_VIEW, PERMISSIONS.SEARCH_SEIZURE_MANAGE,
    PERMISSIONS.FORENSICS_VIEW,
    PERMISSIONS.REVENUE_VIEW,
    PERMISSIONS.NEWS_VIEW, PERMISSIONS.NEWS_MANAGE,
    PERMISSIONS.LOGS_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.COURSES_VIEW,
    PERMISSIONS.CORPORATION_VIEW,
    PERMISSIONS.APPEARANCE_VIEW,
    PERMISSIONS.COMMUNICATION_VIEW,
  ],
  Cabo: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.BO_VIEW, PERMISSIONS.BO_MANAGE,
    PERMISSIONS.BO_INTERNO_VIEW,
    PERMISSIONS.ARREST_VIEW, PERMISSIONS.ARREST_MANAGE,
    PERMISSIONS.WANTED_VIEW,
    PERMISSIONS.PROTECTIVE_MEASURES_VIEW, PERMISSIONS.PROTECTIVE_MEASURES_MANAGE,
    PERMISSIONS.EXONERATIONS_VIEW, PERMISSIONS.EXONERATIONS_MANAGE,
    PERMISSIONS.INTEGRATION_VIEW, PERMISSIONS.INTEGRATION_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.INVESTIGATIONS_VIEW,
    PERMISSIONS.INFORMANTES_VIEW,
    PERMISSIONS.SEARCH_SEIZURE_VIEW,
    PERMISSIONS.NEWS_VIEW, PERMISSIONS.NEWS_MANAGE,
    PERMISSIONS.LOGS_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.COURSES_VIEW,
  ],
  Agente: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.BO_VIEW, PERMISSIONS.BO_MANAGE,
    PERMISSIONS.BO_INTERNO_VIEW,
    PERMISSIONS.ARREST_VIEW, PERMISSIONS.ARREST_MANAGE,
    PERMISSIONS.WANTED_VIEW,
    PERMISSIONS.PROTECTIVE_MEASURES_VIEW, PERMISSIONS.PROTECTIVE_MEASURES_MANAGE,
    PERMISSIONS.EXONERATIONS_VIEW, PERMISSIONS.EXONERATIONS_MANAGE,
    PERMISSIONS.INTEGRATION_VIEW, PERMISSIONS.INTEGRATION_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.NEWS_VIEW, PERMISSIONS.NEWS_MANAGE,
    PERMISSIONS.LOGS_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
  ],
  Recruta: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.BO_VIEW, PERMISSIONS.ARREST_VIEW, PERMISSIONS.PROTECTIVE_MEASURES_VIEW, PERMISSIONS.EXONERATIONS_VIEW, PERMISSIONS.INTEGRATION_VIEW],
  Juiz: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.JUDICIARY_VIEW, PERMISSIONS.JUDICIARY_MANAGE, PERMISSIONS.ALVARAS_VIEW, PERMISSIONS.ALVARAS_MANAGE, PERMISSIONS.BO_VIEW, PERMISSIONS.ARREST_VIEW, PERMISSIONS.WANTED_VIEW, PERMISSIONS.INVESTIGATIONS_VIEW, PERMISSIONS.INFORMANTES_VIEW],
  Advogado: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.JUDICIARY_VIEW, PERMISSIONS.ALVARAS_VIEW, PERMISSIONS.ARREST_VIEW],
};

export const normalizeRoleName = (value) => String(value || '').trim().toLowerCase();

export const getRolePermissionSet = (role) => {
  if (!role) return new Set();

  const permissions = new Set();
  const permitted = Array.isArray(role.permissions) ? role.permissions : [];
  permitted.forEach((item) => item && permissions.add(item));

  const groupPermissions = Array.isArray(role.permissionGroups) ? role.permissionGroups : [];
  groupPermissions.forEach((group) => {
    if (!group) return;
    if (Array.isArray(group)) {
      group.forEach((item) => item && permissions.add(item));
      return;
    }
    if (Array.isArray(group.permissions)) {
      group.permissions.forEach((item) => item && permissions.add(item));
    }
    if (Array.isArray(group.items)) {
      group.items.forEach((item) => item && permissions.add(item));
    }
  });

  return permissions;
};

export const usePermissions = () => {
  const { user } = useAuth();
  const { roles = [] } = useSettingsContext();

  const can = useCallback((permission) => {
    if (!user?.role) return false;
    if (user.role === 'Comandante Geral' || user.role === 'Developer') return true;

    const normalizedPermission = permission === 'report_manage' ? PERMISSIONS.REPORTS_MANAGE : permission;
    const normalizedUserRole = normalizeRoleName(user.role);
    const roleConfig = roles.find((role) => {
      const title = normalizeRoleName(role.title || role.name);
      return title === normalizedUserRole;
    });

    const rolePermissionSet = getRolePermissionSet(roleConfig);
    const legacyRolePermissions = LEGACY_ROLE_PERMISSIONS[user.role] || LEGACY_ROLE_PERMISSIONS[Object.keys(LEGACY_ROLE_PERMISSIONS).find((roleName) => normalizeRoleName(roleName) === normalizedUserRole)] || [];
    const userPermissions = Array.isArray(user.permissions) ? user.permissions : [];

    const roleHasExplicitConfig = Boolean(roleConfig && (
      Array.isArray(roleConfig.permissions) ||
      Array.isArray(roleConfig.permissionGroups)
    ));

    const hasAdminPermission =
      rolePermissionSet.has(PERMISSIONS.ADMIN_ACCESS) ||
      (!roleHasExplicitConfig && (userPermissions.includes(PERMISSIONS.ADMIN_ACCESS) || legacyRolePermissions.includes(PERMISSIONS.ADMIN_ACCESS)));

    if (hasAdminPermission) return true;

    if (roleHasExplicitConfig) {
      return rolePermissionSet.has(normalizedPermission);
    }

    return (
      legacyRolePermissions.includes(normalizedPermission) ||
      userPermissions.includes(normalizedPermission)
    );
  }, [roles, user?.role, user?.permissions]);

  const hasRole = useCallback((roleName) => user?.role === roleName, [user?.role]);

  return { can, hasRole, user };
};
