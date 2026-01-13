import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import ThemeManager from './components/ThemeManager';
import SessionMonitorComponent from './components/SessionMonitor';
import PublicLayout from './components/PublicLayout';
import PrivateLayout from './components/PrivateLayout';
import ComingSoon from './components/ComingSoon';
import Home from './pages/public/Home'; // Eager load Home for faster initial render

import { lazyImport } from './utils/lazyImport';
import { routeLoaders } from './routes/routeLoaders';

// Public Pages
const Rules = React.lazy(() => lazyImport(routeLoaders.Rules));
const HowToJoin = React.lazy(() => lazyImport(routeLoaders.HowToJoin));
const Login = React.lazy(() => lazyImport(routeLoaders.Login));

// Private Pages
const DashboardHome = React.lazy(() => lazyImport(routeLoaders.DashboardHome));
const ProfilePage = React.lazy(() => lazyImport(routeLoaders.ProfilePage));
const RegisterArrest = React.lazy(() => lazyImport(routeLoaders.RegisterArrest));
const RegisterBO = React.lazy(() => lazyImport(routeLoaders.RegisterBO));
const RegisterWanted = React.lazy(() => lazyImport(routeLoaders.RegisterWanted));
const WantedList = React.lazy(() => lazyImport(routeLoaders.WantedList));
const ArrestList = React.lazy(() => lazyImport(routeLoaders.ArrestList));
const BOList = React.lazy(() => lazyImport(routeLoaders.BOList));
const ReportList = React.lazy(() => lazyImport(routeLoaders.ReportList));

const InvestigationList = React.lazy(() => lazyImport(routeLoaders.InvestigationList));
const InvestigationCreate = React.lazy(() => lazyImport(routeLoaders.InvestigationCreate));
const InvestigationDetail = React.lazy(() => lazyImport(routeLoaders.InvestigationDetail));
const RevenueList = React.lazy(() => lazyImport(routeLoaders.RevenueList));
const RevenueDetail = React.lazy(() => lazyImport(routeLoaders.RevenueDetail));

// Settings Pages - Eagerly loaded for better UX
import SecurityConfig from './pages/private/settings/SecurityConfig';

const SettingsLayout = React.lazy(() => lazyImport(routeLoaders.SettingsLayout));
const UsersSettings = React.lazy(() => lazyImport(routeLoaders.UsersSettings));
const CoursesSettings = React.lazy(() => lazyImport(routeLoaders.CoursesSettings));
const WebhookSettings = React.lazy(() => lazyImport(routeLoaders.WebhookSettings));
const CorporationSettings = React.lazy(() => lazyImport(routeLoaders.CorporationSettings));
const RolesSettings = React.lazy(() => lazyImport(routeLoaders.RolesSettings));
const CrimesSettings = React.lazy(() => lazyImport(routeLoaders.CrimesSettings));
const TemplatesSettings = React.lazy(() => lazyImport(routeLoaders.TemplatesSettings));
const AppearanceSettings = React.lazy(() => lazyImport(routeLoaders.AppearanceSettings));
// SecurityConfig is now eagerly loaded
const BackupSettings = React.lazy(() => lazyImport(routeLoaders.BackupSettings));
const SystemLogs = React.lazy(() => lazyImport(routeLoaders.SystemLogs));
const FormsSettings = React.lazy(() => lazyImport(routeLoaders.FormsSettings));

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
  console.log('App Version: 2026-01-13 v2 - SessionMonitor Fix');

  return (
    <AuthProvider>
      <SettingsProvider>
        <ThemeManager />
        <SessionMonitorComponent />
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
            {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/join" element={<HowToJoin />} />
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
              <PermissionGuard permission="arrest">
                <RegisterArrest />
              </PermissionGuard>
            } />
            
            <Route path="arrests" element={<ArrestList />} />
            
            <Route path="bo" element={
              <PermissionGuard permission="bo">
                <RegisterBO />
              </PermissionGuard>
            } />
            
            <Route path="bo-list" element={<BOList />} />
            
            <Route path="reports" element={
              <PermissionGuard permission="reports">
                <ReportList />
              </PermissionGuard>
            } />
            
            <Route path="register-wanted" element={
               <PermissionGuard permission="arrest">
                 <RegisterWanted />
               </PermissionGuard>
            } />

            <Route path="wanted" element={<WantedList />} />
            
            {/* Investigations Routes */}
            <Route path="investigations" element={<InvestigationList />} />
            <Route path="investigations/new" element={
              <PermissionGuard permission="investigation">
                <InvestigationCreate />
              </PermissionGuard>
            } />
            <Route path="investigations/:id" element={<InvestigationDetail />} />
            
            {/* Revenue Routes */}
            <Route path="revenue" element={<RevenueList />} />
            <Route path="revenue/:id" element={<RevenueDetail />} />
            
            {/* Profile Route */}
            <Route path="profile" element={<ProfilePage />} />

            {/* Settings Routes */}
            <Route path="settings" element={
              <PermissionGuard permission="settings">
                <SettingsLayout />
              </PermissionGuard>
            }>
              <Route index element={<Navigate to="courses" replace />} />
              <Route path="users" element={<UsersSettings />} />
              <Route path="courses" element={<CoursesSettings />} />
              <Route path="webhooks" element={<WebhookSettings />} />
              <Route path="forms" element={<FormsSettings />} />
              <Route path="corporation" element={<CorporationSettings />} />
              <Route path="roles" element={<RolesSettings />} />
              <Route path="crimes" element={<CrimesSettings />} />
              <Route path="templates" element={<TemplatesSettings />} />
              <Route path="appearance" element={<AppearanceSettings />} />
              <Route path="security" element={<SecurityConfig />} />
              <Route path="backup" element={<BackupSettings />} />
              <Route path="logs" element={<SystemLogs />} />
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
