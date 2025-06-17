import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'admin' | 'partner' | 'manager' | 'submitter';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: UserRole, organization?: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User) => void;
}

// Mock users for demonstration
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@woluma.com',
    role: 'admin'
  },
  {
    id: '2',
    name: 'Partner User',
    email: 'partner@example.com',
    role: 'partner',
    organization: 'Partner Organization'
  },
  {
    id: '3',
    name: 'Portfolio Manager',
    email: 'manager@example.com',
    role: 'manager'
  },
  {
    id: '4',
    name: 'Project Submitter',
    email: 'submitter@example.com',
    role: 'submitter',
    organization: 'Submitter Organization'
  }
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      
      login: async (email, password) => {
        // Mock login - in a real app this would be an API call
        try {
          // For demo purposes, accept any non-empty password
          if (!password) {
            throw new Error('Password is required');
          }
          
          const user = mockUsers.find(u => u.email === email);
          if (!user) {
            throw new Error('User not found');
          }
          
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Generate a fake token
          const token = `token-${user.id}-${Date.now()}`;
          
          set({ user, isAuthenticated: true, token });
          return true;
        } catch (error) {
          console.error('Login failed:', error);
          return false;
        }
      },
      
      register: async (name, email, password, role, organization) => {
        // Mock registration - in a real app this would be an API call
        try {
          if (!name || !email || !password || !role) {
            throw new Error('Missing required fields');
          }
          
          // Check if user already exists
          if (mockUsers.some(u => u.email === email)) {
            throw new Error('User already exists');
          }
          
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Create new user
          const id = `${mockUsers.length + 1}`;
          const newUser: User = { id, name, email, role, organization };
          mockUsers.push(newUser);
          
          // Generate a fake token
          const token = `token-${id}-${Date.now()}`;
          
          set({ user: newUser, isAuthenticated: true, token });
          return true;
        } catch (error) {
          console.error('Registration failed:', error);
          return false;
        }
      },
      
      logout: () => {
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