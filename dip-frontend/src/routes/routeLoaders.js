// Centralized route loaders for prefetching and lazy loading
export const routeLoaders = {
  // Public
  Rules: () => import('../pages/public/Rules'),
  HowToJoin: () => import('../pages/public/HowToJoin'),
  Login: () => import('../pages/public/Login'),
  SearchAndInvestigations: () => import('../pages/public/SearchAndInvestigations'),
  WeaponsLicense: () => import('../pages/public/WeaponsLicense'),

  // Private - Dashboard
  DashboardHome: () => import('../pages/private/DashboardHome'),
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

  // Weapons
  WeaponsManager: () => import('../pages/private/weapons/WeaponsManager'),

  // Judiciary
  JudiciaryManager: () => import('../pages/private/judiciary/JudiciaryManager'),

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
