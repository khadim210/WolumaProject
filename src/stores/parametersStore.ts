import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SystemParameters {
  // General
  siteName: string;
  siteDescription: string;
  adminEmail: string;
  defaultLanguage: string;
  timezone: string;

  // Security
  sessionTimeout: number;
  maxLoginAttempts: number;
  requireEmailVerification: boolean;
  enableTwoFactor: boolean;
  enablePasswordPolicy: boolean;

  // Notifications
  emailNotifications: boolean;
  notifyNewSubmissions: boolean;
  notifyStatusChanges: boolean;
  notifyDeadlines: boolean;
  smtpServer: string;
  smtpPort: number;
  smtpSecure: boolean;

  // Appearance
  defaultTheme: 'light' | 'dark' | 'auto';
  showBranding: boolean;
  primaryColor: string;
  secondaryColor: string;

  // System
  maxProjectsPerUser: number;
  evaluationDeadlineDays: number;
  autoApprovalThreshold: number;
  maxFileSize: number;
  enableMaintenanceMode: boolean;
  enableRegistration: boolean;
  enableBackups: boolean;

  // Database
  databaseType: 'mysql' | 'postgresql';
  databaseMode: 'demo' | 'production';
  databaseHost: string;
  databasePort: number;
  databaseName: string;
  databaseUsername: string;
  databasePassword: string;
  databaseSsl: boolean;

  // Supabase
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  enableSupabase: boolean;
}

interface ParametersState {
  parameters: SystemParameters;
  isLoading: boolean;
  error: string | null;
  updateParameters: (updates: Partial<SystemParameters>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  initializeDatabase: () => Promise<void>;
  resetDatabase: () => Promise<void>;
  testDatabaseConnection: () => Promise<boolean>;
}

const defaultParameters: SystemParameters = {
  // General
  siteName: 'Woluma-Flow',
  siteDescription: 'Plateforme d\'Évaluation et de Financement de Projets',
  adminEmail: 'admin@woluma.com',
  defaultLanguage: 'fr',
  timezone: 'UTC',

  // Security
  sessionTimeout: 480, // 8 hours
  maxLoginAttempts: 5,
  requireEmailVerification: false,
  enableTwoFactor: false,
  enablePasswordPolicy: true,

  // Notifications
  emailNotifications: true,
  notifyNewSubmissions: true,
  notifyStatusChanges: true,
  notifyDeadlines: true,
  smtpServer: '',
  smtpPort: 587,
  smtpSecure: true,

  // Appearance
  defaultTheme: 'light',
  showBranding: true,
  primaryColor: '#003366',
  secondaryColor: '#00BFFF',

  // System
  maxProjectsPerUser: 10,
  evaluationDeadlineDays: 30,
  autoApprovalThreshold: 85,
  maxFileSize: 10,
  enableMaintenanceMode: false,
  enableRegistration: true,
  enableBackups: true,

  // Database
  databaseType: 'postgresql',
  databaseMode: 'demo',
  databaseHost: 'localhost',
  databasePort: 5432,
  databaseName: 'woluma_flow',
  databaseUsername: 'postgres',
  databasePassword: '',
  databaseSsl: false,

  // Supabase
  supabaseUrl: '',
  supabaseAnonKey: '',
  supabaseServiceRoleKey: '',
  enableSupabase: false,
};

export const useParametersStore = create<ParametersState>()(
  persist(
    (set, get) => ({
      parameters: { ...defaultParameters },
      isLoading: false,
      error: null,

      updateParameters: async (updates) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          set(state => ({
            parameters: { ...state.parameters, ...updates },
            isLoading: false
          }));
        } catch (error) {
          console.error('Error updating parameters:', error);
          set({ error: 'Failed to update parameters', isLoading: false });
          throw error;
        }
      },

      resetToDefaults: async () => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          set({
            parameters: { ...defaultParameters },
            isLoading: false
          });
        } catch (error) {
          console.error('Error resetting parameters:', error);
          set({ error: 'Failed to reset parameters', isLoading: false });
          throw error;
        }
      },

      initializeDatabase: async () => {
        set({ isLoading: true, error: null });
        try {
          const { parameters } = get();
          
          // If in demo mode, just simulate success
          if (parameters.databaseMode === 'demo') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Demo mode: Database initialization simulated');
            set({ isLoading: false });
            return;
          }
          
          const dbManager = new DatabaseManager({
            type: parameters.databaseType,
            host: parameters.databaseHost,
            port: parameters.databasePort,
            database: parameters.databaseName,
            username: parameters.databaseUsername,
            password: parameters.databasePassword,
            ssl: parameters.databaseSsl
          });
          
          await dbManager.initializeDatabase();
          
          console.log('Database initialized successfully');
          
          set({ isLoading: false });
        } catch (error) {
          console.error('Error initializing database:', error);
          set({ error: 'Failed to initialize database', isLoading: false });
          throw error;
        }
      },

      resetDatabase: async () => {
        set({ isLoading: true, error: null });
        try {
          const { parameters } = get();
          
          // If in demo mode, just simulate success
          if (parameters.databaseMode === 'demo') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Demo mode: Database reset simulated');
            set({ isLoading: false });
            return;
          }
          
          const dbManager = new DatabaseManager({
            type: parameters.databaseType,
            host: parameters.databaseHost,
            port: parameters.databasePort,
            database: parameters.databaseName,
            username: parameters.databaseUsername,
            password: parameters.databasePassword,
            ssl: parameters.databaseSsl
          });
          
          await dbManager.resetDatabase();
          
          console.log('Database reset successfully');
          
          set({ isLoading: false });
        } catch (error) {
          console.error('Error resetting database:', error);
          set({ error: 'Failed to reset database', isLoading: false });
          throw error;
        }
      },

      testDatabaseConnection: async () => {
        set({ isLoading: true, error: null });
        try {
          const { parameters } = get();
          
          // If in demo mode, always return success
          if (parameters.databaseMode === 'demo') {
            set({ isLoading: false });
            return true;
          }
          
          const dbManager = new DatabaseManager({
            type: parameters.databaseType,
            host: parameters.databaseHost,
            port: parameters.databasePort,
            database: parameters.databaseName,
            username: parameters.databaseUsername,
            password: parameters.databasePassword,
            ssl: parameters.databaseSsl
          });
          
          const isConnected = await dbManager.testConnection();
          
          set({ isLoading: false });
          return isConnected;
        } catch (error) {
          console.error('Error testing database connection:', error);
          set({ error: 'Failed to test database connection', isLoading: false });
          return false;
        }
      },
    }),
    {
      name: 'parameters-storage',
    }
  )
);