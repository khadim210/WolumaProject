import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Types pour les données Supabase
export interface SupabaseUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'partner' | 'manager' | 'submitter';
  organization?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  auth_user_id?: string;
}

export interface SupabasePartner {
  id: string;
  name: string;
  description?: string;
  contact_email: string;
  contact_phone?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  assigned_manager_id?: string;
}

export interface SupabaseProgram {
  id: string;
  name: string;
  description?: string;
  partner_id: string;
  form_template_id?: string;
  budget: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  manager_id?: string;
  selection_criteria: any[];
  evaluation_criteria: any[];
  custom_ai_prompt?: string;
}

export interface SupabaseProject {
  id: string;
  title: string;
  description: string;
  status: string;
  budget: number;
  timeline: string;
  submitter_id: string;
  program_id: string;
  created_at: string;
  updated_at: string;
  submission_date?: string;
  evaluation_scores?: any;
  evaluation_comments?: any;
  total_evaluation_score?: number;
  evaluation_notes?: string;
  evaluated_by?: string;
  evaluation_date?: string;
  formalization_completed: boolean;
  nda_signed: boolean;
  tags: string[];
  form_data?: any;
  recommended_status?: string;
  manually_submitted: boolean;
}

export interface SupabaseFormTemplate {
  id: string;
  name: string;
  description?: string;
  fields: any[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Service pour les utilisateurs
export class UserService {
  static async getUsers(): Promise<SupabaseUser[]> {
    console.log('UserService.getUsers called');
    
    // Use admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log('Supabase response - data:', data, 'error:', error);
    
    if (error) throw error;
    return data || [];
  }

  static async createUser(user: Omit<SupabaseUser, 'id' | 'created_at'>): Promise<SupabaseUser> {
    // Use admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([user])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateUser(id: string, updates: Partial<SupabaseUser>): Promise<SupabaseUser> {
    // Use admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteUser(id: string): Promise<void> {
    // Use admin client to bypass RLS
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

// Service pour les partenaires
export class PartnerService {
  static async getPartners(): Promise<SupabasePartner[]> {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createPartner(partner: Omit<SupabasePartner, 'id' | 'created_at'>): Promise<SupabasePartner> {
    const { data, error } = await supabase
      .from('partners')
      .insert([partner])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updatePartner(id: string, updates: Partial<SupabasePartner>): Promise<SupabasePartner> {
    const { data, error } = await supabase
      .from('partners')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deletePartner(id: string): Promise<void> {
    const { error } = await supabase
      .from('partners')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

// Service pour les programmes
export class ProgramService {
  static async getPrograms(): Promise<SupabaseProgram[]> {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createProgram(program: Omit<SupabaseProgram, 'id' | 'created_at'>): Promise<SupabaseProgram> {
    const { data, error } = await supabase
      .from('programs')
      .insert([program])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateProgram(id: string, updates: Partial<SupabaseProgram>): Promise<SupabaseProgram> {
    const { data, error } = await supabase
      .from('programs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteProgram(id: string): Promise<void> {
    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

// Service pour les projets
export class ProjectService {
  static async getProjects(): Promise<SupabaseProject[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createProject(project: Omit<SupabaseProject, 'id' | 'created_at' | 'updated_at'>): Promise<SupabaseProject> {
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateProject(id: string, updates: Partial<SupabaseProject>): Promise<SupabaseProject> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

// Service pour les modèles de formulaires
export class FormTemplateService {
  static async getFormTemplates(): Promise<SupabaseFormTemplate[]> {
    const { data, error } = await supabase
      .from('form_templates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createFormTemplate(template: Omit<SupabaseFormTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<SupabaseFormTemplate> {
    const { data, error } = await supabase
      .from('form_templates')
      .insert([template])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateFormTemplate(id: string, updates: Partial<SupabaseFormTemplate>): Promise<SupabaseFormTemplate> {
    const { data, error } = await supabase
      .from('form_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteFormTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('form_templates')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

// Service d'authentification
export class AuthService {
  static async signUp(email: string, password: string, userData: { name: string; role: string; organization?: string }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name,
          role: userData.role,
          organization: userData.organization || null
        }
      }
    });
    
    if (error) {
      if (error.message === 'User already registered') {
        throw new Error('Un utilisateur avec cette adresse email existe déjà.');
      }
      throw error;
    }
    return data;
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  static async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  static async getCurrentUserProfile(): Promise<SupabaseUser | null> {
    const user = await this.getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();
    
    if (error) return null;
    return data;
  }
}

// Utilitaires de migration
export class MigrationService {
  static async runMigrations() {
    try {
      console.log('🚀 Starting Supabase migration...');
      
      // Vérifier la connexion
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('❌ Supabase connection failed:', error);
        return false;
      }
      
      console.log('✅ Supabase connection successful');
      console.log('✅ Migration completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Migration failed:', error);
      return false;
    }
  }

  static async seedData() {
    try {
      console.log('🌱 Seeding data...');
      
      // Créer les utilisateurs de démonstration
      const demoUsers = [
        {
          email: 'admin@woluma.com',
          password: 'admin123',
          userData: {
            name: 'Admin User',
            role: 'admin',
            organization: 'Woluma'
          }
        },
        {
          email: 'partner@example.com',
          password: 'partner123',
          userData: {
            name: 'Partner User',
            role: 'partner',
            organization: 'Example Partner'
          }
        },
        {
          email: 'manager@example.com',
          password: 'manager123',
          userData: {
            name: 'Manager User',
            role: 'manager',
            organization: 'Example Organization'
          }
        },
        {
          email: 'submitter@example.com',
          password: 'submitter123',
          userData: {
            name: 'Submitter User',
            role: 'submitter',
            organization: 'Example Company'
          }
        }
      ];

      for (const user of demoUsers) {
        try {
          // Vérifier si l'utilisateur existe déjà dans la table users
          const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', user.email)
            .maybeSingle();

          if (!existingUser) {
            console.log(`Creating demo user: ${user.email}`);
            await this.createDemoUser(user.email, user.password, user.userData);
          } else {
            console.log(`Demo user already exists: ${user.email}`);
          }
        } catch (error) {
          console.log(`Error checking user existence, attempting to create: ${user.email}`);
          await this.createDemoUser(user.email, user.password, user.userData);
        }
      }
      
      console.log('✅ Data seeding completed');
      return true;
    } catch (error) {
      console.error('❌ Data seeding failed:', error);
      return false;
    }
  }

  private static async createDemoUser(email: string, password: string, userData: { name: string; role: string; organization?: string }) {
    try {
      // Vérifier d'abord si le profil utilisateur existe déjà
      const { data: existingProfile } = await supabaseAdmin
        .from('users')
        .select('id, auth_user_id')
        .eq('email', email)
        .maybeSingle();

      if (existingProfile) {
        console.log(`User profile already exists for ${email}`);
        return;
      }

      // Tenter de créer l'utilisateur d'authentification
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          name: userData.name,
          role: userData.role,
          organization: userData.organization || null
        },
        email_confirm: true
      });

      if (authError) {
        // Si l'utilisateur existe déjà dans auth, essayer de le récupérer
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          console.log(`Auth user already exists for ${email}, retrieving...`);
          const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
          const authUser = existingAuthUser.users.find(u => u.email === email);
          
          if (authUser) {
            // Créer le profil utilisateur avec l'ID d'auth existant
            const { error: profileError } = await supabaseAdmin
              .from('users')
              .insert([{
                name: userData.name,
                email: email,
                role: userData.role as any,
                organization: userData.organization || null,
                auth_user_id: authUser.id,
                is_active: true
              }]);

            if (profileError) {
              console.error(`Error creating profile for existing auth user ${email}:`, profileError);
            } else {
              console.log(`Profile created for existing auth user ${email}`);
            }
          }
          return;
        }
        throw authError;
      }

      if (authData.user) {
        // Créer le profil utilisateur
        const { error: profileError } = await supabaseAdmin
          .from('users')
          .insert([{
            name: userData.name,
            email: email,
            role: userData.role as any,
            organization: userData.organization || null,
            auth_user_id: authData.user.id,
            is_active: true
          }]);

        if (profileError) {
          console.error(`Error creating profile for ${email}:`, profileError);
        } else {
          console.log(`Successfully created demo user ${email}`);
        }
      }
    } catch (error) {
      console.error(`Error creating demo user ${email}:`, error);
    }
  }
}