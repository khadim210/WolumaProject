import { create } from 'zustand';

export type UserRole = 'admin' | 'partner' | 'manager' | 'submitter';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization?: string;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

interface UserManagementState {
  users: User[];
  isLoading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  getUser: (id: string) => User | undefined;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<User>;
  updateUser: (id: string, updates: Partial<User>) => Promise<User | null>;
  deleteUser: (id: string) => Promise<boolean>;
  toggleUserStatus: (id: string) => Promise<boolean>;
}

// Mock users data
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@woluma.com',
    role: 'admin',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date('2025-01-15'),
  },
  {
    id: '2',
    name: 'Portfolio Manager',
    email: 'manager@example.com',
    role: 'manager',
    isActive: true,
    createdAt: new Date('2024-02-01'),
    lastLogin: new Date('2025-01-14'),
  },
  {
    id: '3',
    name: 'Project Submitter',
    email: 'submitter@example.com',
    role: 'submitter',
    organization: 'Tech Startup Inc.',
    isActive: true,
    createdAt: new Date('2024-03-01'),
    lastLogin: new Date('2025-01-13'),
  },
  {
    id: '4',
    name: 'Partner User',
    email: 'partner@example.com',
    role: 'partner',
    organization: 'Investment Fund Ltd.',
    isActive: true,
    createdAt: new Date('2024-04-01'),
    lastLogin: new Date('2025-01-12'),
  },
  {
    id: '5',
    name: 'Inactive User',
    email: 'inactive@example.com',
    role: 'submitter',
    organization: 'Old Company',
    isActive: false,
    createdAt: new Date('2024-05-01'),
  },
];

export const useUserManagementStore = create<UserManagementState>((set, get) => ({
  users: [...mockUsers],
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      set({ users: [...mockUsers], isLoading: false });
    } catch (error) {
      console.error('Error fetching users:', error);
      set({ error: 'Failed to fetch users', isLoading: false });
    }
  },

  getUser: (id) => {
    return get().users.find(user => user.id === id);
  },

  addUser: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newUser: User = {
        ...userData,
        id: `${get().users.length + 1}`,
        createdAt: new Date(),
      };

      set(state => ({
        users: [...state.users, newUser],
        isLoading: false
      }));

      return newUser;
    } catch (error) {
      console.error('Error adding user:', error);
      set({ error: 'Failed to add user', isLoading: false });
      throw error;
    }
  },

  updateUser: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const userIndex = get().users.findIndex(u => u.id === id);
      if (userIndex === -1) {
        set({ error: 'User not found', isLoading: false });
        return null;
      }

      const updatedUser = {
        ...get().users[userIndex],
        ...updates,
      };

      const updatedUsers = [...get().users];
      updatedUsers[userIndex] = updatedUser;

      set({ users: updatedUsers, isLoading: false });
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      set({ error: 'Failed to update user', isLoading: false });
      throw error;
    }
  },

  deleteUser: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      set(state => ({
        users: state.users.filter(u => u.id !== id),
        isLoading: false
      }));

      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      set({ error: 'Failed to delete user', isLoading: false });
      return false;
    }
  },

  toggleUserStatus: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const userIndex = get().users.findIndex(u => u.id === id);
      if (userIndex === -1) {
        set({ error: 'User not found', isLoading: false });
        return false;
      }

      const updatedUsers = [...get().users];
      updatedUsers[userIndex] = {
        ...updatedUsers[userIndex],
        isActive: !updatedUsers[userIndex].isActive,
      };

      set({ users: updatedUsers, isLoading: false });
      return true;
    } catch (error) {
      console.error('Error toggling user status:', error);
      set({ error: 'Failed to toggle user status', isLoading: false });
      return false;
    }
  },
}));