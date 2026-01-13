import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import ThemeManager from './components/ThemeManager';
import SessionMonitorComponent from './components/SessionMonitor';
import PublicLayout from './components/PublicLayout';
import PrivateLayout from './components/PrivateLayout';
import ComingSoon from './components/ComingSoon';

// Public Pages
import Home from './pages/public/Home';
import Rules from './pages/public/Rules';
import HowToJoin from './pages/public/HowToJoin';
import Login from './pages/public/Login';

// Private Pages
import DashboardHome from './pages/private/DashboardHome';
import ProfilePage from './pages/private/ProfilePage';
import RegisterArrest from './pages/private/RegisterArrest';
import RegisterBO from './pages/private/RegisterBO';
import RegisterWanted from './pages/private/RegisterWanted';
import WantedList from './pages/private/WantedList';
import ArrestList from './pages/private/ArrestList';
import BOList from './pages/private/BOList';
import InvestigationList from './pages/private/investigations/InvestigationList';
import InvestigationCreate from './pages/private/investigations/InvestigationCreate';
import InvestigationDetail from './pages/private/investigations/InvestigationDetail';

// Settings Pages
import SettingsLayout from './pages/private/settings/SettingsLayout';
import UsersSettings from './pages/private/settings/UsersSettings';
import CoursesSettings from './pages/private/settings/CoursesSettings';
import CorporationSettings from './pages/private/settings/CorporationSettings';
import RolesSettings from './pages/private/settings/RolesSettings';
import CrimesSettings from './pages/private/settings/CrimesSettings';
import TemplatesSettings from './pages/private/settings/TemplatesSettings';
import AppearanceSettings from './pages/private/settings/AppearanceSettings';
import SecuritySettings from './pages/private/settings/SecuritySettings';
import BackupSettings from './pages/private/settings/BackupSettings';
import SystemLogs from './pages/private/settings/SystemLogs';
import FormsSettings from './pages/private/settings/FormsSettings';

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
            <Route path="arrest" element={<RegisterArrest />} />
            <Route path="arrests" element={<ArrestList />} />
            <Route path="bo" element={<RegisterBO />} />
            <Route path="bo-list" element={<BOList />} />
            <Route path="register-wanted" element={<RegisterWanted />} />
            <Route path="wanted" element={<WantedList />} />
            
            {/* Investigations Routes */}
            <Route path="investigations" element={<InvestigationList />} />
            <Route path="investigations/new" element={<InvestigationCreate />} />
            <Route path="investigations/:id" element={<InvestigationDetail />} />
            
            {/* Profile Route */}
            <Route path="profile" element={<ProfilePage />} />

            {/* Settings Routes */}
            <Route path="settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="courses" replace />} />
              <Route path="users" element={<UsersSettings />} />
              <Route path="courses" element={<CoursesSettings />} />
              <Route path="forms" element={<FormsSettings />} />
              <Route path="corporation" element={<CorporationSettings />} />
              <Route path="roles" element={<RolesSettings />} />
              <Route path="crimes" element={<CrimesSettings />} />
              <Route path="templates" element={<TemplatesSettings />} />
              <Route path="appearance" element={<AppearanceSettings />} />
              <Route path="security" element={<SecuritySettings />} />
              <Route path="backup" element={<BackupSettings />} />
              <Route path="logs" element={<SystemLogs />} />
            </Route>
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
