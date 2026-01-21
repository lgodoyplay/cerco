// Centralized route loaders for prefetching and lazy loading
export const routeLoaders = {
  // Public
  Login: () => import('../pages/public/Login'),
  PenalCode: () => import('../pages/public/PenalCode'),
  Rules: () => import('../pages/public/Rules'),
  HowToJoin: () => import('../pages/public/HowToJoin'),
  SearchAndInvestigations: () => import('../pages/public/SearchAndInvestigations'),
  WeaponsLicense: () => import('../pages/public/WeaponsLicense'),

  // Private
  DashboardHome: () => import('../pages/private/DashboardHome'),
  CursoDPF: () => import('../pages/private/CursoDPF'),
  CursoPRF: () => import('../pages/private/CursoPRF'),
  ProfilePage: () => import('../pages/private/ProfilePage'),
  RegisterArrest: () => import('../pages/private/RegisterArrest'),
  RegisterBO: () => import('../pages/private/RegisterBO'),
  RegisterWanted: () => import('../pages/private/RegisterWanted'),
  WantedList: () => import('../pages/private/WantedList'),
  ArrestList: () => import('../pages/private/ArrestList'),
  BOList: () => import('../pages/private/BOList'),
  ReportList: () => import('../pages/private/ReportList'),
  
  // Investigations
  InvestigationList: () => import('../pages/private/investigations/InvestigationList'),
  InvestigationCreate: () => import('../pages/private/investigations/InvestigationCreate'),
  InvestigationDetail: () => import('../pages/private/investigations/InvestigationDetail'),
  
  // Forensics
  ForensicsList: () => import('../pages/private/forensics/ForensicsList'),
  RegisterForensics: () => import('../pages/private/forensics/RegisterForensics'),
  ForensicsDetail: () => import('../pages/private/forensics/ForensicsDetail'),
  
  // Revenue
  RevenueList: () => import('../pages/private/revenue/RevenueList'),
  RevenueDetail: () => import('../pages/private/revenue/RevenueDetail'),

  // Specialized Managers
  WeaponsManager: () => import('../pages/private/weapons/WeaponsManager'),
  JudiciaryManager: () => import('../pages/private/judiciary/JudiciaryManager'),
  PRFIntegration: () => import('../pages/private/prf/PRFIntegration'),
  LawyerDashboard: () => import('../pages/private/lawyers/LawyerDashboard'),
  ANPStudentDashboard: () => import('../pages/private/anp/ANPStudentDashboard'),

  // Settings
  SettingsLayout: () => import('../pages/private/settings/SettingsLayout'),
  UsersSettings: () => import('../pages/private/settings/UsersSettings'),
  CoursesSettings: () => import('../pages/private/settings/CoursesSettings'),
  WebhookSettings: () => import('../pages/private/settings/WebhookSettings'),
  CorporationSettings: () => import('../pages/private/settings/CorporationSettings'),
  RolesSettings: () => import('../pages/private/settings/RolesSettings'),
  CrimesSettings: () => import('../pages/private/settings/CrimesSettings'),
  TemplatesSettings: () => import('../pages/private/settings/TemplatesSettings'),
  AppearanceSettings: () => import('../pages/private/settings/AppearanceSettings'),
  SecurityConfig: () => import('../pages/private/settings/SecurityConfig'),
  BackupSettings: () => import('../pages/private/settings/BackupSettings'),
  SystemLogs: () => import('../pages/private/settings/SystemLogs'),
  FormsSettings: () => import('../pages/private/settings/FormsSettings'),
  ExamResultsSettings: () => import('../pages/private/settings/ExamResultsSettings'),
};

export const prefetchRoute = (key) => {
  const loader = routeLoaders[key];
  if (loader) {
    // Inicia o carregamento em background
    loader().catch(() => {});
  }
};
