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
      { id: PERMISSIONS.DASHBOARD_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.ANP_STUDENT_VIEW, label: 'Visualizar / Pesquisar' },
    ],
  },
  {
    id: 'work',
    label: 'Trabalho operacional',
    permissions: [
      { id: PERMISSIONS.ARREST_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.ARREST_MANAGE, label: 'Registrar / Gerenciar' },
      { id: PERMISSIONS.WANTED_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.WANTED_MANAGE, label: 'Registrar / Gerenciar' },
      { id: PERMISSIONS.BO_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.BO_MANAGE, label: 'Registrar / Gerenciar' },
      { id: PERMISSIONS.BO_INTERNO_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.BO_INTERNO_MANAGE, label: 'Registrar / Gerenciar' },
      { id: PERMISSIONS.PROTECTIVE_MEASURES_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.PROTECTIVE_MEASURES_MANAGE, label: 'Registrar / Gerenciar' },
      { id: PERMISSIONS.REPORTS_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.REPORTS_MANAGE, label: 'Registrar / Gerenciar' },
    ],
  },
  {
    id: 'investigative',
    label: 'Investigativo',
    permissions: [
      { id: PERMISSIONS.INVESTIGATIONS_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.INVESTIGATIONS_MANAGE, label: 'Registrar / Gerenciar' },
      { id: PERMISSIONS.INFORMANTES_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.INFORMANTES_MANAGE, label: 'Registrar / Gerenciar' },
      { id: PERMISSIONS.SEARCH_SEIZURE_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.SEARCH_SEIZURE_MANAGE, label: 'Registrar / Gerenciar' },
      { id: PERMISSIONS.FORENSICS_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.FORENSICS_MANAGE, label: 'Registrar / Gerenciar' },
      { id: PERMISSIONS.REVENUE_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.REVENUE_MANAGE, label: 'Registrar / Gerenciar' },
    ],
  },
  {
    id: 'legal',
    label: 'Jurídico e administrativo legal',
    permissions: [
      { id: PERMISSIONS.ALVARAS_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.ALVARAS_MANAGE, label: 'Registrar / Gerenciar' },
      { id: PERMISSIONS.WEAPONS_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.WEAPONS_MANAGE, label: 'Registrar / Gerenciar' },
      { id: PERMISSIONS.LAWYER_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.LAWYER_MANAGE, label: 'Registrar / Gerenciar' },
      { id: PERMISSIONS.JUDICIARY_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.JUDICIARY_MANAGE, label: 'Registrar / Gerenciar' },
    ],
  },
  {
    id: 'health',
    label: 'Laudos e exames',
    permissions: [
      { id: PERMISSIONS.LAUDOS_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.LAUDOS_MANAGE, label: 'Registrar / Gerenciar' },
    ],
  },
  {
    id: 'communication',
    label: 'Comunicação e organização',
    permissions: [
      { id: PERMISSIONS.CORREGEDORIA_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.CORREGEDORIA_MANAGE, label: 'Registrar / Gerenciar' },
      { id: PERMISSIONS.EXONERATIONS_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.EXONERATIONS_MANAGE, label: 'Registrar / Gerenciar' },
      { id: PERMISSIONS.INTEGRATION_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.INTEGRATION_MANAGE, label: 'Registrar / Gerenciar' },
      { id: PERMISSIONS.PM_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.PM_MANAGE, label: 'Registrar / Gerenciar' },
      { id: PERMISSIONS.NEWS_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.NEWS_MANAGE, label: 'Registrar / Gerenciar' },
      { id: PERMISSIONS.COMMUNICATION_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.COMMUNICATION_MANAGE, label: 'Registrar / Gerenciar' },
      { id: PERMISSIONS.LOGISTICS_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.LOGISTICS_MANAGE, label: 'Registrar / Gerenciar' },
    ],
  },
  {
    id: 'settings',
    label: 'Configurações do sistema',
    permissions: [
      { id: PERMISSIONS.SETTINGS_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.SETTINGS_MANAGE, label: 'Registrar / Gerenciar' },
      { id: PERMISSIONS.CORPORATION_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.APPEARANCE_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.SECURITY_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.BACKUP_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.HEALTH_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.TEMPLATES_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.FORMS_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.EXAMS_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.WARNINGS_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.WARNINGS_MANAGE, label: 'Registrar / Gerenciar' },
    ],
  },
  {
    id: 'training',
    label: 'Cursos e formação',
    permissions: [
      { id: PERMISSIONS.COURSES_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.COURSES_MANAGE, label: 'Registrar / Gerenciar' },
      { id: PERMISSIONS.ANP_VIEW, label: 'Visualizar / Pesquisar' },
      { id: PERMISSIONS.ANP_MANAGE, label: 'Registrar / Gerenciar' },
    ],
  },
  {
    id: 'logs',
    label: 'Logs e auditoria',
    permissions: [{ id: PERMISSIONS.LOGS_VIEW, label: 'Visualizar / Pesquisar' }],
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
