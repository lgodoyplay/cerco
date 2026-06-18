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
  CursoPM: () => import('../pages/private/CursoPM'),
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
  SearchSeizureList: () => import('../pages/private/investigations/SearchSeizureList'),
  SearchSeizureCreate: () => import('../pages/private/investigations/SearchSeizureCreate'),
  SearchSeizureDetail: () => import('../pages/private/investigations/SearchSeizureDetail'),
  
  // Forensics
  ForensicsList: () => import('../pages/private/forensics/ForensicsList'),
  RegisterForensics: () => import('../pages/private/forensics/RegisterForensics'),
  ForensicsDetail: () => import('../pages/private/forensics/ForensicsDetail'),
  
  // Revenue
  RevenueList: () => import('../pages/private/revenue/RevenueList'),
  RevenueDetail: () => import('../pages/private/revenue/RevenueDetail'),

  // Alvarás
  AlvaraList: () => import('../pages/private/alvaras/AlvaraList'),
  AlvaraCreate: () => import('../pages/private/alvaras/AlvaraCreate'),
  AlvaraDetail: () => import('../pages/private/alvaras/AlvaraDetail'),
  
  // Laudos Médicos
  LaudosList: () => import('../pages/private/laudos/LaudosList'),
  LaudoCreate: () => import('../pages/private/laudos/LaudoCreate'),
  LaudoDetail: () => import('../pages/private/laudos/LaudoDetail'),
  
  // Specialized Managers
  WeaponsManager: () => import('../pages/private/weapons/WeaponsManager'),
  RequestWeaponLicense: () => import('../pages/private/weapons/RequestWeaponLicense'),
  JudiciaryManager: () => import('../pages/private/judiciary/JudiciaryManager'),
  PMIntegration: () => import('../pages/private/pm/PMIntegration'),
  LawyerDashboard: () => import('../pages/private/lawyers/LawyerDashboard'),
  ANPStudentDashboard: () => import('../pages/private/anp/ANPStudentDashboard'),
  LogisticsDashboard: () => import('../pages/private/logistics/LogisticsDashboard'),
  CommunicationHub: () => import('../pages/private/communication/CommunicationHub'),
  NewsManager: () => import('../pages/private/news/NewsManager'),

  // Settings
  SettingsLayout: () => import('../pages/private/settings/SettingsLayout'),
  UsersSettings: () => import('../pages/private/settings/UsersSettings'),
  WarningsSettings: () => import('../pages/private/settings/WarningsSettings'),
  CoursesSettings: () => import('../pages/private/settings/CoursesSettings'),
  WebhookSettings: () => import('../pages/private/settings/WebhookSettings'),
  CorporationSettings: () => import('../pages/private/settings/CorporationSettings'),
  SystemHealth: () => import('../pages/private/settings/SystemHealth'),
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
