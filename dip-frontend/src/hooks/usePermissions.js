import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettingsContext } from '../context/SettingsContext';

export const PERMISSIONS = {
  BO_VIEW: 'bo_view', BO_MANAGE: 'bo_manage',
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
  { id: 'admin', label: 'Acesso administrativo', permissions: [{ id: PERMISSIONS.ADMIN_ACCESS, label: 'Permissão total do sistema' }] },
  { id: 'bo', label: 'Boletins', permissions: [{ id: PERMISSIONS.BO_VIEW, label: 'Visualizar' }, { id: PERMISSIONS.BO_MANAGE, label: 'Gerenciar' }] },
  { id: 'arrest', label: 'Prisões', permissions: [{ id: PERMISSIONS.ARREST_VIEW, label: 'Visualizar' }, { id: PERMISSIONS.ARREST_MANAGE, label: 'Gerenciar' }] },
  { id: 'wanted', label: 'Procurados', permissions: [{ id: PERMISSIONS.WANTED_VIEW, label: 'Visualizar' }, { id: PERMISSIONS.WANTED_MANAGE, label: 'Gerenciar' }] },
  { id: 'judiciary', label: 'Jurídico', permissions: [
    { id: PERMISSIONS.JUDICIARY_VIEW, label: 'Visualizar jurídico' },
    { id: PERMISSIONS.JUDICIARY_MANAGE, label: 'Gerenciar jurídico' },
    { id: PERMISSIONS.ALVARAS_VIEW, label: 'Visualizar Alvarás' },
    { id: PERMISSIONS.ALVARAS_MANAGE, label: 'Gerenciar Alvarás' },
  ] },
  { id: 'reports', label: 'Denúncias', permissions: [{ id: PERMISSIONS.REPORTS_VIEW, label: 'Visualizar' }, { id: PERMISSIONS.REPORTS_MANAGE, label: 'Gerenciar' }] },
  { id: 'investigations', label: 'Investigações', permissions: [{ id: PERMISSIONS.INVESTIGATIONS_VIEW, label: 'Visualizar' }, { id: PERMISSIONS.INVESTIGATIONS_MANAGE, label: 'Gerenciar' }] },
  { id: 'forensics', label: 'Perícias', permissions: [{ id: PERMISSIONS.FORENSICS_VIEW, label: 'Visualizar' }, { id: PERMISSIONS.FORENSICS_MANAGE, label: 'Gerenciar' }] },
  { id: 'informants', label: 'Informantes', permissions: [{ id: PERMISSIONS.INFORMANTES_VIEW, label: 'Visualizar' }, { id: PERMISSIONS.INFORMANTES_MANAGE, label: 'Gerenciar' }] },
  { id: 'revenue', label: 'Receita', permissions: [{ id: PERMISSIONS.REVENUE_VIEW, label: 'Visualizar' }, { id: PERMISSIONS.REVENUE_MANAGE, label: 'Gerenciar' }] },
  { id: 'weapons', label: 'Armas', permissions: [{ id: PERMISSIONS.WEAPONS_VIEW, label: 'Visualizar' }, { id: PERMISSIONS.WEAPONS_MANAGE, label: 'Gerenciar' }] },
  { id: 'exonerations', label: 'Exonerações', permissions: [{ id: PERMISSIONS.EXONERATIONS_VIEW, label: 'Visualizar' }, { id: PERMISSIONS.EXONERATIONS_MANAGE, label: 'Gerenciar' }] },
  { id: 'integration', label: 'Integração', permissions: [{ id: PERMISSIONS.INTEGRATION_VIEW, label: 'Visualizar' }, { id: PERMISSIONS.INTEGRATION_MANAGE, label: 'Gerenciar' }] },
  { id: 'logistics', label: 'Logística', permissions: [{ id: PERMISSIONS.LOGISTICS_VIEW, label: 'Visualizar' }, { id: PERMISSIONS.LOGISTICS_MANAGE, label: 'Gerenciar' }] },
  { id: 'communication', label: 'Comunicação', permissions: [{ id: PERMISSIONS.COMMUNICATION_VIEW, label: 'Visualizar' }, { id: PERMISSIONS.COMMUNICATION_MANAGE, label: 'Gerenciar' }] },
  { id: 'pm', label: 'PM', permissions: [{ id: PERMISSIONS.PM_VIEW, label: 'Visualizar' }, { id: PERMISSIONS.PM_MANAGE, label: 'Gerenciar' }] },
  { id: 'laudos', label: 'Laudos', permissions: [{ id: PERMISSIONS.LAUDOS_VIEW, label: 'Visualizar' }, { id: PERMISSIONS.LAUDOS_MANAGE, label: 'Gerenciar' }] },
  { id: 'lawyer', label: 'Advogados', permissions: [{ id: PERMISSIONS.LAWYER_VIEW, label: 'Visualizar' }, { id: PERMISSIONS.LAWYER_MANAGE, label: 'Gerenciar' }] },
  { id: 'courses', label: 'Cursos', permissions: [{ id: PERMISSIONS.COURSES_VIEW, label: 'Visualizar' }, { id: PERMISSIONS.COURSES_MANAGE, label: 'Gerenciar' }] },
  { id: 'anp', label: 'ANP', permissions: [{ id: PERMISSIONS.ANP_VIEW, label: 'Visualizar' }, { id: PERMISSIONS.ANP_MANAGE, label: 'Gerenciar' }] },
  { id: 'news', label: 'Notícias', permissions: [{ id: PERMISSIONS.NEWS_VIEW, label: 'Visualizar' }, { id: PERMISSIONS.NEWS_MANAGE, label: 'Gerenciar' }] },
  { id: 'others', label: 'Outros', permissions: [
    { id: PERMISSIONS.CORREGEDORIA_VIEW, label: 'Visualizar Corregedoria' },
    { id: PERMISSIONS.CORREGEDORIA_MANAGE, label: 'Gerenciar Corregedoria' },
  ] },
  { id: 'settings', label: 'Configurações', permissions: [{ id: PERMISSIONS.SETTINGS_VIEW, label: 'Visualizar' }, { id: PERMISSIONS.SETTINGS_MANAGE, label: 'Gerenciar' }] },
  { id: 'warnings', label: 'Advertências', permissions: [{ id: PERMISSIONS.WARNINGS_VIEW, label: 'Visualizar' }, { id: PERMISSIONS.WARNINGS_MANAGE, label: 'Gerenciar' }] },
  { id: 'forms', label: 'Formulários', permissions: [{ id: PERMISSIONS.FORMS_VIEW, label: 'Visualizar' }, { id: PERMISSIONS.EXAMS_VIEW, label: 'Acesso a provas' }] },
  { id: 'templates', label: 'Templates', permissions: [{ id: PERMISSIONS.TEMPLATES_VIEW, label: 'Visualizar' }, { id: PERMISSIONS.TEMPLATES_VIEW, label: 'Gerenciar' }] },
  { id: 'corporation', label: 'Estrutura', permissions: [{ id: PERMISSIONS.CORPORATION_VIEW, label: 'Visualizar' }, { id: PERMISSIONS.CORPORATION_VIEW, label: 'Gerenciar' }] },
  { id: 'appearance', label: 'Aparência', permissions: [{ id: PERMISSIONS.APPEARANCE_VIEW, label: 'Visualizar' }, { id: PERMISSIONS.APPEARANCE_VIEW, label: 'Gerenciar' }] },
  { id: 'security', label: 'Segurança', permissions: [{ id: PERMISSIONS.SECURITY_VIEW, label: 'Visualizar' }, { id: PERMISSIONS.SECURITY_VIEW, label: 'Gerenciar' }] },
  { id: 'backup', label: 'Backup', permissions: [{ id: PERMISSIONS.BACKUP_VIEW, label: 'Visualizar' }, { id: PERMISSIONS.BACKUP_VIEW, label: 'Gerenciar' }] },
  { id: 'health', label: 'Diagnóstico', permissions: [{ id: PERMISSIONS.HEALTH_VIEW, label: 'Visualizar' }, { id: PERMISSIONS.HEALTH_VIEW, label: 'Gerenciar' }] },
  { id: 'logs', label: 'Logs', permissions: [{ id: PERMISSIONS.LOGS_VIEW, label: 'Visualizar' }] },
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
    PERMISSIONS.BO_VIEW, PERMISSIONS.BO_MANAGE,
    PERMISSIONS.ARREST_VIEW, PERMISSIONS.ARREST_MANAGE,
    PERMISSIONS.WANTED_VIEW, PERMISSIONS.WANTED_MANAGE,
    PERMISSIONS.PROTECTIVE_MEASURES_VIEW, PERMISSIONS.PROTECTIVE_MEASURES_MANAGE,
    PERMISSIONS.EXONERATIONS_VIEW, PERMISSIONS.EXONERATIONS_MANAGE,
    PERMISSIONS.INTEGRATION_VIEW, PERMISSIONS.INTEGRATION_MANAGE,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_MANAGE,
    PERMISSIONS.INVESTIGATIONS_VIEW, PERMISSIONS.INVESTIGATIONS_MANAGE,
    PERMISSIONS.INFORMANTES_VIEW, PERMISSIONS.INFORMANTES_MANAGE,
    PERMISSIONS.FORENSICS_VIEW,
    PERMISSIONS.REVENUE_VIEW,
    PERMISSIONS.NEWS_VIEW, PERMISSIONS.NEWS_MANAGE,
    PERMISSIONS.LOGS_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.COURSES_VIEW,
    PERMISSIONS.CORPORATION_VIEW,
    PERMISSIONS.APPEARANCE_VIEW,
  ],
  Cabo: [
    PERMISSIONS.BO_VIEW, PERMISSIONS.BO_MANAGE,
    PERMISSIONS.ARREST_VIEW, PERMISSIONS.ARREST_MANAGE,
    PERMISSIONS.WANTED_VIEW,
    PERMISSIONS.PROTECTIVE_MEASURES_VIEW, PERMISSIONS.PROTECTIVE_MEASURES_MANAGE,
    PERMISSIONS.EXONERATIONS_VIEW, PERMISSIONS.EXONERATIONS_MANAGE,
    PERMISSIONS.INTEGRATION_VIEW, PERMISSIONS.INTEGRATION_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.INVESTIGATIONS_VIEW,
    PERMISSIONS.INFORMANTES_VIEW,
    PERMISSIONS.NEWS_VIEW, PERMISSIONS.NEWS_MANAGE,
    PERMISSIONS.LOGS_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.COURSES_VIEW,
  ],
  Agente: [
    PERMISSIONS.BO_VIEW, PERMISSIONS.BO_MANAGE,
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
  Recruta: [PERMISSIONS.BO_VIEW, PERMISSIONS.ARREST_VIEW, PERMISSIONS.PROTECTIVE_MEASURES_VIEW, PERMISSIONS.EXONERATIONS_VIEW, PERMISSIONS.INTEGRATION_VIEW],
  Juiz: [PERMISSIONS.JUDICIARY_VIEW, PERMISSIONS.JUDICIARY_MANAGE, PERMISSIONS.ALVARAS_VIEW, PERMISSIONS.ALVARAS_MANAGE, PERMISSIONS.BO_VIEW, PERMISSIONS.ARREST_VIEW, PERMISSIONS.WANTED_VIEW, PERMISSIONS.INVESTIGATIONS_VIEW, PERMISSIONS.INFORMANTES_VIEW],
  Advogado: [PERMISSIONS.JUDICIARY_VIEW, PERMISSIONS.ALVARAS_VIEW, PERMISSIONS.ARREST_VIEW],
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
