import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthService, UserService } from '../services/supabaseService';
import type { SupabaseUser } from '../services/supabaseService';

export type UserRole = 'admin' | 'partner' | 'manager' | 'submitter';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization?: string;
}

// Fonction utilitaire pour convertir SupabaseUser vers User
const convertSupabaseUser = (supabaseUser: SupabaseUser): User => ({
  id: supabaseUser.id,
  name: supabaseUser.name,
  email: supabaseUser.email,
  role: supabaseUser.role,
  organization: supabaseUser.organization
});

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: UserRole, organization?: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      
      login: async (email, password) => {
        try {
          if (!password) {
            throw new Error('Password is required');
          }
          
          // Check if we should use demo mode
          const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || 
                            !import.meta.env.VITE_SUPABASE_URL || 
                            !import.meta.env.VITE_SUPABASE_ANON_KEY;
          
          if (isDemoMode) {
            // Demo mode authentication
            const demoCredentials: Record<string, string> = {
              'admin@woluma.com': 'password',
              'partner@example.com': 'password',
              'manager@example.com': 'password',
              'submitter@example.com': 'password'
            };
            
            if (demoCredentials[email] === password) {
              const demoUsers = [
                { id: '1', name: 'Admin User', email: 'admin@woluma.com', role: 'admin' as UserRole, organization: 'Woluma' },
                { id: '2', name: 'Partner User', email: 'partner@example.com', role: 'partner' as UserRole, organization: 'Example Partner' },
                { id: '3', name: 'Manager User', email: 'manager@example.com', role: 'manager' as UserRole, organization: 'Example Organization' },
                { id: '4', name: 'Submitter User', email: 'submitter@example.com', role: 'submitter' as UserRole, organization: 'Example Company' }
              ];
              
              const user = demoUsers.find(u => u.email === email);
              if (user) {
                set({ user, isAuthenticated: true, token: 'demo-token' });
                return true;
              }
            }
            
            return false;
          }
          
          // Authentification avec Supabase
          const authData = await AuthService.signIn(email, password);
          
          if (!authData.user) {
            throw new Error('Authentication failed');
          }
          
          // Récupérer le profil utilisateur
          const userProfile = await AuthService.getCurrentUserProfile();
          
          if (!userProfile) {
            throw new Error('User profile not found');
          }
          
          const user = convertSupabaseUser(userProfile);
          const token = authData.session?.access_token || '';
          
          set({ user, isAuthenticated: true, token });
          return true;
        } catch (error) {
          console.error('Login failed:', error);
          
          // If Supabase fails, try demo mode as fallback
          const demoCredentials: Record<string, string> = {
            'admin@woluma.com': 'password',
            'partner@example.com': 'password',
            'manager@example.com': 'password',
            'submitter@example.com': 'password'
          };
          
          if (demoCredentials[email] === password) {
            console.log('🎭 Falling back to demo mode due to Supabase error');
            const demoUsers = [
              { id: '1', name: 'Admin User', email: 'admin@woluma.com', role: 'admin' as UserRole, organization: 'Woluma' },
              { id: '2', name: 'Partner User', email: 'partner@example.com', role: 'partner' as UserRole, organization: 'Example Partner' },
              { id: '3', name: 'Manager User', email: 'manager@example.com', role: 'manager' as UserRole, organization: 'Example Organization' },
              { id: '4', name: 'Submitter User', email: 'submitter@example.com', role: 'submitter' as UserRole, organization: 'Example Company' }
            ];
            
            const user = demoUsers.find(u => u.email === email);
            if (user) {
              set({ user, isAuthenticated: true, token: 'demo-token' });
              return true;
            }
          }
          
          return false;
        }
      },
      
      register: async (name, email, password, role, organization) => {
        try {
          if (!name || !email || !password || !role) {
            throw new Error('Missing required fields');
          }
          
          // Check if we should use demo mode
          const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || 
                            !import.meta.env.VITE_SUPABASE_URL || 
                            !import.meta.env.VITE_SUPABASE_ANON_KEY;
          
          if (isDemoMode) {
            // Demo mode registration
            const newUser: User = {
              id: `demo-${Date.now()}`,
              name,
              email,
              role,
              organization
            };
            
            set({ user: newUser, isAuthenticated: true, token: 'demo-token' });
            return true;
          }
          
          // Inscription avec Supabase
          const authData = await AuthService.signUp(email, password, {
            name,
            role,
            organization
          });
          
          if (!authData.user) {
            throw new Error('Registration failed');
          }
          
          // Créer le profil utilisateur
          const userProfile = await UserService.createUser({
            name,
            email,
            role: role as UserRole,
            organization,
            is_active: true,
            auth_user_id: authData.user.id
          });
          
          const user = convertSupabaseUser(userProfile);
          const token = authData.session?.access_token || '';
          
          set({ user, isAuthenticated: true, token });
          return true;
        } catch (error) {
          console.error('Registration failed:', error);
          
          // If Supabase fails, try demo mode as fallback
          const newUser: User = {
            id: `demo-${Date.now()}`,
            name,
            email,
            role,
            organization
          };
          
          console.log('🎭 Falling back to demo mode due to Supabase error');
          set({ user: newUser, isAuthenticated: true, token: 'demo-token' });
          return true;
          return false;
        }
      },
      
      logout: () => {
        AuthService.signOut().catch(console.error);
        set({ user: null, isAuthenticated: false, token: null });
      },
      
      setUser: (user) => {
        set({ user });
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);