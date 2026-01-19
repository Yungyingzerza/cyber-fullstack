import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import Layout from '@/components/layout/Layout';
import PrivateRoute from '@/components/common/PrivateRoute';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import EventsPage from '@/pages/EventsPage';
import IngestPage from '@/pages/IngestPage';
import AlertsPage from '@/pages/AlertsPage';
import AlertRulesPage from '@/pages/AlertRulesPage';
import SettingsPage from '@/pages/SettingsPage';
import NotFoundPage from '@/pages/NotFoundPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route
              path="/ingest"
              element={
                <PrivateRoute requiredRole="admin">
                  <IngestPage />
                </PrivateRoute>
              }
            />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route
              path="/alerts/rules"
              element={
                <PrivateRoute requiredRole="admin">
                  <AlertRulesPage />
                </PrivateRoute>
              }
            />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Catch all */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

export default App;
