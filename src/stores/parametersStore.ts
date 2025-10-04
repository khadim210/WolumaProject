import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DatabaseManager } from '../utils/database';

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
  testDatabaseConnection: () => Promise<{ success: boolean; message: string }>;
  initializeDatabase: () => Promise<void>;
  resetDatabase: () => Promise<void>;
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
  enableSupabase: true,
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

      testDatabaseConnection: async () => {
        const { parameters } = get();
        
        if (!parameters.enableSupabase) {
          return { success: false, message: 'Supabase n\'est pas activé' };
        }

        if (!parameters.supabaseUrl || !parameters.supabaseAnonKey) {
          return { success: false, message: 'URL Supabase et clé anonyme requis' };
        }

        try {
          // Test basic connection with a simple query
          const response = await fetch(`${parameters.supabaseUrl}/rest/v1/`, {
            method: 'GET',
            headers: {
              'apikey': parameters.supabaseAnonKey,
              'Authorization': `Bearer ${parameters.supabaseAnonKey}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            return { success: true, message: 'Connexion Supabase réussie' };
          } else {
            const errorText = await response.text();
            return { success: false, message: `Erreur de connexion: ${response.status} - ${errorText}` };
          }
        } catch (error) {
          return { success: false, message: `Erreur réseau: ${error instanceof Error ? error.message : 'Erreur inconnue'}` };
        }
      },

      initializeDatabase: async () => {
        // Placeholder for database initialization
        await new Promise(resolve => setTimeout(resolve, 1000));
      },

      resetDatabase: async () => {
        // Placeholder for database reset
        await new Promise(resolve => setTimeout(resolve, 1000));
      },
    }),
    {
      name: 'parameters-storage',
    }
  )
);