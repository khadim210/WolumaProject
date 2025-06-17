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
}

interface ParametersState {
  parameters: SystemParameters;
  isLoading: boolean;
  error: string | null;
  updateParameters: (updates: Partial<SystemParameters>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
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
    }),
    {
      name: 'parameters-storage',
    }
  )
);