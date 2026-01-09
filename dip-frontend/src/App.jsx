import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import RegisterArrest from './pages/private/RegisterArrest';
import RegisterBO from './pages/private/RegisterBO';
import RegisterWanted from './pages/private/RegisterWanted';
import WantedList from './pages/private/WantedList';
import ArrestList from './pages/private/ArrestList';
import InvestigationList from './pages/private/investigations/InvestigationList';
import InvestigationCreate from './pages/private/investigations/InvestigationCreate';
import InvestigationDetail from './pages/private/investigations/InvestigationDetail';

// Settings Pages
import SettingsLayout from './pages/private/settings/SettingsLayout';
import UsersSettings from './pages/private/settings/UsersSettings';
import CorporationSettings from './pages/private/settings/CorporationSettings';
import RolesSettings from './pages/private/settings/RolesSettings';
import CrimesSettings from './pages/private/settings/CrimesSettings';
import TemplatesSettings from './pages/private/settings/TemplatesSettings';
import AppearanceSettings from './pages/private/settings/AppearanceSettings';
import SecuritySettings from './pages/private/settings/SecuritySettings';
import BackupSettings from './pages/private/settings/BackupSettings';
import SystemLogs from './pages/private/settings/SystemLogs';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // Or a spinner

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
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
            <Route path="register-wanted" element={<RegisterWanted />} />
            <Route path="wanted" element={<WantedList />} />
            
            {/* Investigations Routes */}
            <Route path="investigations" element={<InvestigationList />} />
            <Route path="investigations/new" element={<InvestigationCreate />} />
            <Route path="investigations/:id" element={<InvestigationDetail />} />
            
            {/* Settings Routes */}
            <Route path="settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="users" replace />} />
              <Route path="users" element={<UsersSettings />} />
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
    </AuthProvider>
  );
}

export default App;
