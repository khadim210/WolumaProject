import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { MigrationService } from './services/supabaseService';

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
import EditProjectPage from './pages/projects/EditProjectPage';
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
import PartnerManagementPage from './pages/admin/PartnerManagementPage';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  // Initialiser Supabase au démarrage de l'application
  React.useEffect(() => {
    const initializeSupabase = async () => {
      try {
        console.log('🚀 Initializing Supabase...');
        console.log('🚀 Environment check:', {
          hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
          hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
          hasServiceKey: !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
          demoMode: import.meta.env.VITE_DEMO_MODE
        });
        
        // Check if Supabase is properly configured
        const hasSupabaseConfig = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (hasSupabaseConfig) {
          console.log('✅ Supabase configuration found');
          console.log('🔗 Supabase URL:', import.meta.env.VITE_SUPABASE_URL?.substring(0, 30) + '...');
          // Créer les données de démonstration
          console.log('🌱 Starting seed data creation...');
          await MigrationService.seedData();
          console.log('✅ Supabase initialized successfully');
        } else {
          console.log('⚠️ Supabase not configured, running in demo mode');
          console.log('💡 Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to enable Supabase');
        }
      } catch (error) {
        console.error('❌ Supabase initialization error:', error);
        console.log('💡 The app will continue to work in demo mode');
      }
    };
    
    initializeSupabase();
  }, []);
  
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
          <Route path="projects/:id/edit" element={<EditProjectPage />} />
          <Route path="evaluation" element={<EvaluationPage />} />
          <Route path="formalization" element={<FormalizationPage />} />
          <Route path="monitoring" element={<MonitoringPage />} />
          <Route path="statistics" element={<StatisticsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="form-templates" element={<FormTemplatesPage />} />
          <Route path="form-templates/create" element={<FormBuilderPage />} />
          <Route path="form-templates/:id/edit" element={<FormBuilderPage />} />
          <Route path="programs" element={<ProgramManagementPage />} />
          <Route path="partners" element={<PartnerManagementPage />} />
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