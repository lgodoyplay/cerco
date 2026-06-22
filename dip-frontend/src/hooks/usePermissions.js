import { useAuth } from '../context/AuthContext';

const PERMISSIONS = {
  // BO (Boletim de Ocorrência)
  BO_VIEW: 'bo_view',
  BO_MANAGE: 'bo_manage', // Create, Edit, Delete

  // Arrests (Prisões)
  ARREST_VIEW: 'arrest_view',
  ARREST_MANAGE: 'arrest_manage',

  // Wanted (Procurados)
  WANTED_VIEW: 'wanted_view',
  WANTED_MANAGE: 'wanted_manage',

  // Reports (Denúncias)
  REPORTS_VIEW: 'reports_view',
  REPORTS_MANAGE: 'reports_manage', // Also covers 'report_manage' alias if needed

  // Judiciary (Judiciário)
  JUDICIARY_VIEW: 'judiciary_view',
  JUDICIARY_MANAGE: 'judiciary_manage',

  // Revenue (Receita/Financeiro)
  REVENUE_VIEW: 'revenue_view',
  REVENUE_MANAGE: 'revenue_manage',

  // Investigations (Investigações)
  INVESTIGATIONS_VIEW: 'investigations_view',
  INVESTIGATIONS_MANAGE: 'investigations_manage',

  // Forensics (Perícia)
  FORENSICS_VIEW: 'forensics_view',
  FORENSICS_MANAGE: 'forensics_manage',

  // Admin/Settings
  ADMIN_ACCESS: 'admin_access',

  // Weapons (Porte de Armas)
  WEAPONS_VIEW: 'weapons_view',
  WEAPONS_MANAGE: 'weapons_manage',

  // Medidas Protetivas
  PROTECTIVE_MEASURES_VIEW: 'protective_measures_view',
  PROTECTIVE_MEASURES_MANAGE: 'protective_measures_manage',

  // Logistics
  LOGISTICS_VIEW: 'logistics_view',
  LOGISTICS_MANAGE: 'logistics_manage',

  // Communication
  COMMUNICATION_VIEW: 'communication_view',
  COMMUNICATION_MANAGE: 'communication_manage',

  // PM Integration
  PM_VIEW: 'pm_view',
  PM_MANAGE: 'pm_manage',

  // Laudos Médicos
  LAUDOS_VIEW: 'laudos_view',
  LAUDOS_MANAGE: 'laudos_manage',

  // Lawyers
  LAWYER_VIEW: 'lawyer_view',
  LAWYER_MANAGE: 'lawyer_manage',

  // Courses
  COURSES_VIEW: 'courses_view',
  COURSES_MANAGE: 'courses_manage',

  // ANP
  ANP_VIEW: 'anp_view',
  ANP_MANAGE: 'anp_manage',

  // Settings
  SETTINGS_VIEW: 'settings_view',
  SETTINGS_MANAGE: 'settings_manage',

  // Warnings (Advertências)
  WARNINGS_VIEW: 'warnings_view',
  WARNINGS_MANAGE: 'warnings_manage',

  // News (Notícias)
  NEWS_VIEW: 'news_view',
  NEWS_MANAGE: 'news_manage',

  // Logs
  LOGS_VIEW: 'logs_view',

  // Other settings permissions
  CORPORATION_VIEW: 'corporation_view',
  APPEARANCE_VIEW: 'appearance_view',
  SECURITY_VIEW: 'security_view',
  BACKUP_VIEW: 'backup_view',
  HEALTH_VIEW: 'health_view',
  TEMPLATES_VIEW: 'templates_view',
  FORMS_VIEW: 'forms_view',
  EXAMS_VIEW: 'exams_view',
};

// Role to Permission Mapping
// This could be moved to a database or separate config file
const ROLE_PERMISSIONS = {
  'Comandante Geral': Object.values(PERMISSIONS),
  'Diretor': Object.values(PERMISSIONS),
  'Coronel': Object.values(PERMISSIONS),
  'Major': Object.values(PERMISSIONS),
  'Capitão': Object.values(PERMISSIONS),
  'Tenente': Object.values(PERMISSIONS),
  
  'Aluno': [
    PERMISSIONS.COMMUNICATION_VIEW,
    PERMISSIONS.LOGISTICS_VIEW,
    // Aluno has limited access
  ],
  
  'Sargento': [
    PERMISSIONS.BO_VIEW, PERMISSIONS.BO_MANAGE,
    PERMISSIONS.ARREST_VIEW, PERMISSIONS.ARREST_MANAGE,
    PERMISSIONS.WANTED_VIEW, PERMISSIONS.WANTED_MANAGE,
    PERMISSIONS.PROTECTIVE_MEASURES_VIEW, PERMISSIONS.PROTECTIVE_MEASURES_MANAGE,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_MANAGE,
    PERMISSIONS.INVESTIGATIONS_VIEW, PERMISSIONS.INVESTIGATIONS_MANAGE,
    PERMISSIONS.FORENSICS_VIEW,
    PERMISSIONS.REVENUE_VIEW,
    PERMISSIONS.NEWS_VIEW, PERMISSIONS.NEWS_MANAGE,
    PERMISSIONS.LOGS_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.COURSES_VIEW,
    PERMISSIONS.CORPORATION_VIEW,
    PERMISSIONS.APPEARANCE_VIEW,
  ],
  
  'Cabo': [
    PERMISSIONS.BO_VIEW, PERMISSIONS.BO_MANAGE,
    PERMISSIONS.ARREST_VIEW, PERMISSIONS.ARREST_MANAGE,
    PERMISSIONS.WANTED_VIEW,
    PERMISSIONS.PROTECTIVE_MEASURES_VIEW, PERMISSIONS.PROTECTIVE_MEASURES_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.INVESTIGATIONS_VIEW,
    PERMISSIONS.NEWS_VIEW, PERMISSIONS.NEWS_MANAGE,
    PERMISSIONS.LOGS_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.COURSES_VIEW,
  ],
  
  'Agente': [
    PERMISSIONS.BO_VIEW, PERMISSIONS.BO_MANAGE,
    PERMISSIONS.ARREST_VIEW, PERMISSIONS.ARREST_MANAGE,
    PERMISSIONS.WANTED_VIEW,
    PERMISSIONS.PROTECTIVE_MEASURES_VIEW, PERMISSIONS.PROTECTIVE_MEASURES_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.NEWS_VIEW, PERMISSIONS.NEWS_MANAGE,
    PERMISSIONS.LOGS_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
  ],
  
  'Recruta': [
    PERMISSIONS.BO_VIEW,
    PERMISSIONS.ARREST_VIEW,
    PERMISSIONS.PROTECTIVE_MEASURES_VIEW,
  ],

  // Special Roles
  'Juiz': [
    PERMISSIONS.JUDICIARY_VIEW, PERMISSIONS.JUDICIARY_MANAGE,
    PERMISSIONS.BO_VIEW,
    PERMISSIONS.ARREST_VIEW,
    PERMISSIONS.WANTED_VIEW,
    PERMISSIONS.INVESTIGATIONS_VIEW,
  ],
  
  'Advogado': [
    PERMISSIONS.JUDICIARY_VIEW, // Can view petitions status
    PERMISSIONS.ARREST_VIEW, // Limited view usually
  ]
};

export const usePermissions = () => {
  const { user } = useAuth();

  const can = (permission) => {
    if (!user || !user.role) return false;
    
    // Super admin bypass
    if (user.role === 'Comandante Geral' || user.role === 'Developer') return true;

    // Handle aliases/typos from existing code
    if (permission === 'report_manage') permission = PERMISSIONS.REPORTS_MANAGE;

    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    const dynamicPermissions = user.permissions || [];
    
    return rolePermissions.includes(permission) || dynamicPermissions.includes(permission);
  };

  const hasRole = (roleName) => {
    return user?.role === roleName;
  };

  return { can, hasRole, user };
};
