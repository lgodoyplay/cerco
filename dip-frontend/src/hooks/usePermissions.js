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

  // Logistics
  LOGISTICS_VIEW: 'logistics_view',
  LOGISTICS_MANAGE: 'logistics_manage',

  // Communication
  COMMUNICATION_VIEW: 'communication_view',
  COMMUNICATION_MANAGE: 'communication_manage',

  // PRF Integration
  PRF_VIEW: 'prf_view',
  PRF_MANAGE: 'prf_manage',

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
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_MANAGE,
    PERMISSIONS.INVESTIGATIONS_VIEW, PERMISSIONS.INVESTIGATIONS_MANAGE,
    PERMISSIONS.FORENSICS_VIEW,
    PERMISSIONS.REVENUE_VIEW,
  ],
  
  'Cabo': [
    PERMISSIONS.BO_VIEW, PERMISSIONS.BO_MANAGE,
    PERMISSIONS.ARREST_VIEW, PERMISSIONS.ARREST_MANAGE,
    PERMISSIONS.WANTED_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.INVESTIGATIONS_VIEW,
  ],
  
  'Agente': [
    PERMISSIONS.BO_VIEW, PERMISSIONS.BO_MANAGE,
    PERMISSIONS.ARREST_VIEW, PERMISSIONS.ARREST_MANAGE,
    PERMISSIONS.WANTED_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
  
  'Recruta': [
    PERMISSIONS.BO_VIEW,
    PERMISSIONS.ARREST_VIEW,
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

    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return userPermissions.includes(permission);
  };

  const hasRole = (roleName) => {
    return user?.role === roleName;
  };

  return { can, hasRole, user };
};
