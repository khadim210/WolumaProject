import { create } from 'zustand';
import { UserService, AuthService } from '../services/supabaseService';
import type { SupabaseUser } from '../services/supabaseService';

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

// Fonction utilitaire pour convertir SupabaseUser vers User
const convertSupabaseUser = (supabaseUser: SupabaseUser): User => ({
  id: supabaseUser.id,
  name: supabaseUser.name,
  email: supabaseUser.email,
  role: supabaseUser.role,
  organization: supabaseUser.organization,
  isActive: supabaseUser.is_active,
  createdAt: new Date(supabaseUser.created_at),
  lastLogin: supabaseUser.last_login ? new Date(supabaseUser.last_login) : undefined
});

interface UserManagementState {
  users: User[];
  isLoading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  getUser: (id: string) => User | undefined;
  addUser: (user: Omit<User, 'id' | 'createdAt'> & { password: string }) => Promise<User>;
  updateUser: (id: string, updates: Partial<User>) => Promise<User | null>;
  deleteUser: (id: string) => Promise<boolean>;
  toggleUserStatus: (id: string) => Promise<boolean>;
}

export const useUserManagementStore = create<UserManagementState>((set, get) => ({
  users: [],
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log('Fetching users from Supabase...');
      const supabaseUsers = await UserService.getUsers();
      console.log('Supabase users received:', supabaseUsers);
      const users = supabaseUsers.map(convertSupabaseUser);
      console.log('Converted users:', users);
      set({ users, isLoading: false });
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
      // First create the auth user
      const authUser = await AuthService.signUp(userData.email, userData.password);
      
      // Then create the profile user with the auth_user_id
      const supabaseUser = await UserService.createUser({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        organization: userData.organization,
        is_active: userData.isActive,
        auth_user_id: authUser.user?.id
      });
      
      const newUser = convertSupabaseUser(supabaseUser);

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
      const supabaseUpdates: Partial<SupabaseUser> = {};
      if (updates.name) supabaseUpdates.name = updates.name;
      if (updates.email) supabaseUpdates.email = updates.email;
      if (updates.role) supabaseUpdates.role = updates.role;
      if (updates.organization) supabaseUpdates.organization = updates.organization;
      if (updates.isActive !== undefined) supabaseUpdates.is_active = updates.isActive;
      
      const supabaseUser = await UserService.updateUser(id, supabaseUpdates);
      const updatedUser = convertSupabaseUser(supabaseUser);
      
      set(state => ({
        users: state.users.map(u => u.id === id ? updatedUser : u),
        isLoading: false
      }));

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
      await UserService.deleteUser(id);
      
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
      const user = get().users.find(u => u.id === id);
      if (!user) {
        set({ error: 'User not found', isLoading: false });
        return false;
      }
      
      const supabaseUser = await UserService.updateUser(id, {
        is_active: !user.isActive
      });
      
      const updatedUser = convertSupabaseUser(supabaseUser);
      
      set(state => ({
        users: state.users.map(u => u.id === id ? updatedUser : u),
        isLoading: false
      }));

      return true;
    } catch (error) {
      console.error('Error toggling user status:', error);
      set({ error: 'Failed to toggle user status', isLoading: false });
      return false;
    }
  },
}));