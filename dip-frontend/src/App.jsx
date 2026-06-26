import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import ThemeManager from './components/ThemeManager';
import PublicLayout from './components/PublicLayout';
import PrivateLayout from './components/PrivateLayout';
import ComingSoon from './components/ComingSoon';
import Home from './pages/public/Home';
import Landing from './pages/public/Landing';
import { routeLoaders } from './routes/routeLoaders';
import { lazyImport } from './utils/lazyImport';

// Public Pages
const Rules = React.lazy(() => lazyImport(routeLoaders.Rules));
const HowToJoin = React.lazy(() => lazyImport(routeLoaders.HowToJoin));
const Login = React.lazy(() => lazyImport(routeLoaders.Login));
const PenalCode = React.lazy(() => lazyImport(routeLoaders.PenalCode));
const SearchAndInvestigations = React.lazy(() => lazyImport(routeLoaders.SearchAndInvestigations));
const Corregedoria = React.lazy(() => lazyImport(routeLoaders.Corregedoria));
// const WeaponsLicense = React.lazy(() => lazyImport(routeLoaders.WeaponsLicense));

// Private Pages
const DashboardHome = React.lazy(() => lazyImport(routeLoaders.DashboardHome));
const CursoDPF = React.lazy(() => lazyImport(routeLoaders.CursoDPF));
const CursoPM = React.lazy(() => lazyImport(routeLoaders.CursoPM));
const ProfilePage = React.lazy(() => lazyImport(routeLoaders.ProfilePage));
const RegisterArrest = React.lazy(() => lazyImport(routeLoaders.RegisterArrest));
const RegisterBO = React.lazy(() => lazyImport(routeLoaders.RegisterBO));
const RegisterWanted = React.lazy(() => lazyImport(routeLoaders.RegisterWanted));
const WantedList = React.lazy(() => lazyImport(routeLoaders.WantedList));
const WantedDetail = React.lazy(() => lazyImport(routeLoaders.WantedDetail));
const ArrestList = React.lazy(() => lazyImport(routeLoaders.ArrestList));
const ArrestDetail = React.lazy(() => lazyImport(routeLoaders.ArrestDetail));
const BOList = React.lazy(() => lazyImport(routeLoaders.BOList));
const ReportList = React.lazy(() => lazyImport(routeLoaders.ReportList));
const CorregedoriaList = React.lazy(() => lazyImport(routeLoaders.CorregedoriaList));
const CorregedoriaDetail = React.lazy(() => lazyImport(routeLoaders.CorregedoriaDetail));

const InvestigationList = React.lazy(() => lazyImport(routeLoaders.InvestigationList));
const InvestigationCreate = React.lazy(() => lazyImport(routeLoaders.InvestigationCreate));
const InvestigationDetail = React.lazy(() => lazyImport(routeLoaders.InvestigationDetail));
const InvestigationProofDetail = React.lazy(() => lazyImport(routeLoaders.InvestigationProofDetail));
const SearchSeizureList = React.lazy(() => lazyImport(routeLoaders.SearchSeizureList));
const SearchSeizureCreate = React.lazy(() => lazyImport(routeLoaders.SearchSeizureCreate));
const SearchSeizureDetail = React.lazy(() => lazyImport(routeLoaders.SearchSeizureDetail));

// Alvarás Pages
const AlvaraList = React.lazy(() => lazyImport(routeLoaders.AlvaraList));
const AlvaraCreate = React.lazy(() => lazyImport(routeLoaders.AlvaraCreate));
const AlvaraDetail = React.lazy(() => lazyImport(routeLoaders.AlvaraDetail));

const LaudosList = React.lazy(() => lazyImport(routeLoaders.LaudosList));
const LaudoCreate = React.lazy(() => lazyImport(routeLoaders.LaudoCreate));
const LaudoDetail = React.lazy(() => lazyImport(routeLoaders.LaudoDetail));

const ForensicsList = React.lazy(() => lazyImport(routeLoaders.ForensicsList));
const RegisterForensics = React.lazy(() => lazyImport(routeLoaders.RegisterForensics));
const ForensicsDetail = React.lazy(() => lazyImport(routeLoaders.ForensicsDetail));

const RevenueList = React.lazy(() => lazyImport(routeLoaders.RevenueList));
const RevenueDetail = React.lazy(() => lazyImport(routeLoaders.RevenueDetail));

const WeaponsManager = React.lazy(() => lazyImport(routeLoaders.WeaponsManager));
const ProtectiveMeasuresManager = React.lazy(() => lazyImport(routeLoaders.ProtectiveMeasuresManager));
const ExonerationsManager = React.lazy(() => lazyImport(routeLoaders.ExonerationsManager));
const ExonerationCreate = React.lazy(() => lazyImport(routeLoaders.ExonerationCreate));
const IntegrationManager = React.lazy(() => lazyImport(routeLoaders.IntegrationManager));
const JudiciaryManager = React.lazy(() => lazyImport(routeLoaders.JudiciaryManager));
const PMIntegration = React.lazy(() => lazyImport(routeLoaders.PMIntegration));
const LawyerDashboard = React.lazy(() => lazyImport(routeLoaders.LawyerDashboard));
const LogisticsDashboard = React.lazy(() => lazyImport(routeLoaders.LogisticsDashboard));
const ANPStudentDashboard = React.lazy(() => lazyImport(routeLoaders.ANPStudentDashboard));
const CommunicationHub = React.lazy(() => lazyImport(routeLoaders.CommunicationHub));
const NewsManager = React.lazy(() => lazyImport(routeLoaders.NewsManager));

// Settings Pages - Eagerly loaded for better UX
import SecurityConfig from './pages/private/settings/SecurityConfig';

const SettingsLayout = React.lazy(() => lazyImport(routeLoaders.SettingsLayout));
const UsersSettings = React.lazy(() => lazyImport(routeLoaders.UsersSettings));
const WarningsSettings = React.lazy(() => lazyImport(routeLoaders.WarningsSettings));
const CoursesSettings = React.lazy(() => lazyImport(routeLoaders.CoursesSettings));
const WebhookSettings = React.lazy(() => lazyImport(routeLoaders.WebhookSettings));
const CorporationSettings = React.lazy(() => lazyImport(routeLoaders.CorporationSettings));
const SystemHealth = React.lazy(() => lazyImport(routeLoaders.SystemHealth));
const RolesSettings = React.lazy(() => lazyImport(routeLoaders.RolesSettings));
const CrimesSettings = React.lazy(() => lazyImport(routeLoaders.CrimesSettings));
const TemplatesSettings = React.lazy(() => lazyImport(routeLoaders.TemplatesSettings));
const AppearanceSettings = React.lazy(() => lazyImport(routeLoaders.AppearanceSettings));
// SecurityConfig is now eagerly loaded
const BackupSettings = React.lazy(() => lazyImport(routeLoaders.BackupSettings));
const SystemLogs = React.lazy(() => lazyImport(routeLoaders.SystemLogs));
const FormsSettings = React.lazy(() => lazyImport(routeLoaders.FormsSettings));
const ExamResultsSettings = React.lazy(() => lazyImport(routeLoaders.ExamResultsSettings));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-950">
    <div className="w-8 h-8 border-4 border-slate-800 border-t-federal-500 rounded-full animate-spin"></div>
  </div>
);

import PermissionGuard from './components/common/PermissionGuard';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // O AuthContext já exibe um loader global, mas por segurança mantemos um fallback
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="w-8 h-8 border-4 border-slate-800 border-t-yellow-500 rounded-full animate-spin"></div>
    </div>
  );

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  // Debug log to verify version
  console.log('App Version: 2026-01-21 v2 - Fixes');

  return (
    <AuthProvider>
      <SettingsProvider>
        <ThemeManager />
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
            {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/codigo-penal" element={<PenalCode />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/join" element={<HowToJoin />} />
            <Route path="/corregedoria" element={<Corregedoria />} />
            <Route path="/pesquisas-e-apuracoes" element={<SearchAndInvestigations />} />
            {/* <Route path="/porte-de-armas" element={<WeaponsLicense />} /> */}
          </Route>

          <Route path="/login" element={<Login />} />

          {/* Private Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <PrivateLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardHome />} />
            
            <Route path="arrest" element={
              <PermissionGuard permission="arrest_manage">
                <RegisterArrest />
              </PermissionGuard>
            } />
            
            <Route path="curso-dpf" element={<CursoDPF />} />
            <Route path="curso-pm" element={<CursoPM />} />

            <Route path="arrests" element={
              <PermissionGuard permission="arrest_view">
                <ArrestList />
              </PermissionGuard>
            } />
            <Route path="arrests/:id" element={
              <PermissionGuard permission="arrest_view">
                <ArrestDetail />
              </PermissionGuard>
            } />
            
            <Route path="bo" element={
              <PermissionGuard permission="bo_manage">
                <RegisterBO />
              </PermissionGuard>
            } />
            <Route path="bo/:id/edit" element={
              <PermissionGuard permission="bo_manage">
                <RegisterBO />
              </PermissionGuard>
            } />
            
            <Route path="bo-list" element={
              <PermissionGuard permission="bo_view">
                <BOList />
              </PermissionGuard>
            } />

            <Route path="protective-measures" element={
              <PermissionGuard permission="protective_measures_view">
                <ProtectiveMeasuresManager />
              </PermissionGuard>
            } />
            
            <Route path="reports" element={
              <PermissionGuard permission="reports_view">
                <ReportList />
              </PermissionGuard>
            } />
            
            <Route path="corregedoria" element={
              <CorregedoriaList />
            } />
            <Route path="corregedoria/:id" element={
              <CorregedoriaDetail />
            } />

            <Route path="exonerations" element={
              <PermissionGuard permission="exonerations_view">
                <ExonerationsManager />
              </PermissionGuard>
            } />
            <Route path="exonerations/new" element={
              <PermissionGuard permission="exonerations_manage">
                <ExonerationCreate />
              </PermissionGuard>
            } />
            <Route path="integration" element={
              <PermissionGuard permission="integration_view">
                <IntegrationManager />
              </PermissionGuard>
            } />
            
            <Route path="register-wanted" element={
               <PermissionGuard permission="wanted_manage">
                 <RegisterWanted />
               </PermissionGuard>
            } />

            <Route path="wanted" element={
              <PermissionGuard permission="wanted_view">
                <WantedList />
              </PermissionGuard>
            } />
            <Route path="wanted/:id" element={
              <PermissionGuard permission="wanted_view">
                <WantedDetail />
              </PermissionGuard>
            } />
            
            {/* Investigations Routes */}
            <Route path="investigations" element={
              <PermissionGuard permission="investigations_view">
                <InvestigationList />
              </PermissionGuard>
            } />
            <Route path="investigations/new" element={
              <PermissionGuard permission="investigations_manage">
                <InvestigationCreate />
              </PermissionGuard>
            } />
            <Route path="investigations/:id/edit" element={
              <PermissionGuard permission="investigations_manage">
                <InvestigationCreate />
              </PermissionGuard>
            } />
            <Route path="investigations/:id" element={
              <PermissionGuard permission="investigations_view">
                <InvestigationDetail />
              </PermissionGuard>
            } />
            <Route path="investigations/:id/proofs/:proofId" element={
              <PermissionGuard permission="investigations_view">
                <InvestigationProofDetail />
              </PermissionGuard>
            } />

            {/* Search and Seizure Routes */}
            <Route path="search-seizure" element={
              <PermissionGuard permission="investigations_view">
                <SearchSeizureList />
              </PermissionGuard>
            } />
            <Route path="search-seizure/new" element={
              <PermissionGuard permission="investigations_manage">
                <SearchSeizureCreate />
              </PermissionGuard>
            } />
            <Route path="search-seizure/:id/edit" element={
              <PermissionGuard permission="investigations_manage">
                <SearchSeizureCreate />
              </PermissionGuard>
            } />
            <Route path="search-seizure/:id" element={
              <PermissionGuard permission="investigations_view">
                <SearchSeizureDetail />
              </PermissionGuard>
            } />
            
            {/* Alvarás Routes */}
            <Route path="alvaras" element={<AlvaraList />} />
            <Route path="alvaras/new" element={<AlvaraCreate />} />
            <Route path="alvaras/:id" element={<AlvaraDetail />} />
            
            {/* Laudos Médicos Routes */}
            <Route path="laudos" element={
              <PermissionGuard permission="laudos_view">
                <LaudosList />
              </PermissionGuard>
            } />
            <Route path="laudos/new" element={
              <PermissionGuard permission="laudos_manage">
                <LaudoCreate />
              </PermissionGuard>
            } />
            <Route path="laudos/:id" element={
              <PermissionGuard permission="laudos_view">
                <LaudoDetail />
              </PermissionGuard>
            } />
            
            {/* Forensics Routes */}
            <Route path="forensics" element={
              <PermissionGuard permission="forensics_view">
                <ForensicsList />
              </PermissionGuard>
            } />
            <Route path="forensics/new" element={
              <PermissionGuard permission="forensics_manage">
                <RegisterForensics />
              </PermissionGuard>
            } />
            <Route path="forensics/:id" element={
              <PermissionGuard permission="forensics_view">
                <ForensicsDetail />
              </PermissionGuard>
            } />
            
            {/* Revenue Routes */}
            <Route path="revenue" element={
              <PermissionGuard permission="revenue_view">
                <RevenueList />
              </PermissionGuard>
            } />
            <Route path="revenue/investigations/new" element={
              <PermissionGuard permission="revenue_manage">
                <InvestigationCreate />
              </PermissionGuard>
            } />
            <Route path="revenue/investigations/:id/edit" element={
              <PermissionGuard permission="revenue_manage">
                <InvestigationCreate />
              </PermissionGuard>
            } />
            <Route path="revenue/investigations/:id" element={
              <PermissionGuard permission="revenue_view">
                <InvestigationDetail />
              </PermissionGuard>
            } />
            <Route path="revenue/investigations/:id/proofs/:proofId" element={
              <PermissionGuard permission="revenue_view">
                <InvestigationProofDetail />
              </PermissionGuard>
            } />
            <Route path="revenue/:id" element={
              <PermissionGuard permission="revenue_view">
                <RevenueDetail />
              </PermissionGuard>
            } />

            {/* Weapons Routes */}
            <Route path="weapons" element={
              <PermissionGuard permission="weapons_view">
                <WeaponsManager />
              </PermissionGuard>
            } />
            
            {/* Judiciary Routes */}
            <Route path="judiciary" element={
              <PermissionGuard permission="judiciary_view">
                <JudiciaryManager />
              </PermissionGuard>
            } />

            {/* PM Routes */}
            <Route path="pm" element={
              <PermissionGuard permission="pm_view">
                <PMIntegration />
              </PermissionGuard>
            } />
            <Route path="lawyers" element={
              <PermissionGuard permission="lawyer_view">
                <LawyerDashboard />
              </PermissionGuard>
            } />

            <Route path="logistics" element={
              <PermissionGuard permission="logistics_view">
                <LogisticsDashboard />
              </PermissionGuard>
            } />

            {/* ANP Student Route */}
            <Route path="anp-student" element={<ANPStudentDashboard />} />

            {/* Communication Hub */}
            <Route path="communication" element={
              <PermissionGuard permission="communication_view">
                <CommunicationHub />
              </PermissionGuard>
            } />
            
            <Route path="news" element={
              <PermissionGuard permission="news_manage">
                <NewsManager />
              </PermissionGuard>
            } />

            {/* Profile Route */}
            <Route path="profile" element={<ProfilePage />} />

            {/* Settings Routes */}
            <Route path="settings" element={
              <PermissionGuard permission="settings_view">
                <SettingsLayout />
              </PermissionGuard>
            }>
              <Route index element={<Navigate to="courses" replace />} />
              <Route path="health" element={
                <PermissionGuard permission="health_view">
                  <SystemHealth />
                </PermissionGuard>
              } />
              <Route path="users" element={
                <PermissionGuard permission="settings_manage">
                  <UsersSettings />
                </PermissionGuard>
              } />
              <Route path="warnings" element={
                <PermissionGuard permission="warnings_manage">
                  <WarningsSettings />
                </PermissionGuard>
              } />
              <Route path="courses" element={
                <PermissionGuard permission="courses_view">
                  <CoursesSettings />
                </PermissionGuard>
              } />
              <Route path="webhooks" element={
                <PermissionGuard permission="settings_manage">
                  <WebhookSettings />
                </PermissionGuard>
              } />
              <Route path="forms" element={
                <PermissionGuard permission="forms_view">
                  <FormsSettings />
                </PermissionGuard>
              } />
              <Route path="exams" element={
                <PermissionGuard permission="exams_view">
                  <ExamResultsSettings />
                </PermissionGuard>
              } />
              <Route path="corporation" element={
                <PermissionGuard permission="corporation_view">
                  <CorporationSettings />
                </PermissionGuard>
              } />
              <Route path="roles" element={
                <PermissionGuard permission="settings_manage">
                  <RolesSettings />
                </PermissionGuard>
              } />
              <Route path="crimes" element={
                <PermissionGuard permission="settings_manage">
                  <CrimesSettings />
                </PermissionGuard>
              } />
              <Route path="templates" element={
                <PermissionGuard permission="templates_view">
                  <TemplatesSettings />
                </PermissionGuard>
              } />
              <Route path="appearance" element={
                <PermissionGuard permission="appearance_view">
                  <AppearanceSettings />
                </PermissionGuard>
              } />
              <Route path="security" element={
                <PermissionGuard permission="security_view">
                  <SecurityConfig />
                </PermissionGuard>
              } />
              <Route path="backup" element={
                <PermissionGuard permission="backup_view">
                  <BackupSettings />
                </PermissionGuard>
              } />
              <Route path="logs" element={
                <PermissionGuard permission="logs_view">
                  <SystemLogs />
                </PermissionGuard>
              } />
            </Route>
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
    </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
