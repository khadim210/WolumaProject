import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Dashboard Pages
import DashboardPage from './pages/dashboard/DashboardPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import CreateProjectPage from './pages/projects/CreateProjectPage';
import EvaluationPage from './pages/evaluation/EvaluationPage';
import FormalizationPage from './pages/formalization/FormalizationPage';
import MonitoringPage from './pages/monitoring/MonitoringPage';
import StatisticsPage from './pages/statistics/StatisticsPage';
import ProfilePage from './pages/profile/ProfilePage';
import FormBuilderPage from './pages/manager/FormBuilderPage';
import FormTemplatesPage from './pages/manager/FormTemplatesPage';

// Admin Pages
import UserManagementPage from './pages/admin/UserManagementPage';
import ParametersPage from './pages/admin/ParametersPage';
import ProgramManagementPage from './pages/admin/ProgramManagementPage';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<AuthLayout />}>
          <Route index element={<Navigate to="/login" replace />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>
        
        {/* Dashboard Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/create" element={<CreateProjectPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="evaluation" element={<EvaluationPage />} />
          <Route path="formalization" element={<FormalizationPage />} />
          <Route path="monitoring" element={<MonitoringPage />} />
          <Route path="statistics" element={<StatisticsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="form-templates" element={<FormTemplatesPage />} />
          <Route path="form-templates/create" element={<FormBuilderPage />} />
          <Route path="programs" element={<ProgramManagementPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="parameters" element={<ParametersPage />} />
        </Route>
        
        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;