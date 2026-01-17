import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { HabitFixerPage } from '@/pages/HabitFixerPage';
import { Analytics } from '@/pages/Analytics';
import { Profile } from '@/pages/Profile';
import { HabitFixerLanding } from '@/pages/HabitFixerLanding';
import { LevelDetails } from '@/pages/LevelDetails';
import { Layout } from '@/components/Layout';
import { NotificationManager } from '@/components/NotificationManager';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-text-primary">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationManager />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/fixer/:habitId" element={
            <ProtectedRoute>
              <Layout>
                <HabitFixerPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/fixer" element={
            <ProtectedRoute>
              <Layout>
                <HabitFixerLanding />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <Layout>
                <Analytics />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/levels" element={
            <ProtectedRoute>
              <Layout>
                <LevelDetails />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <ToastContainer theme="dark" position="bottom-right" />
      </AuthProvider>
    </Router>
  );
}

export default App;
