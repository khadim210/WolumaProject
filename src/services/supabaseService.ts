import { createClient } from '@supabase/supabase-js';

// Check if we're in demo mode
const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' && !getSupabaseEnabled();

// Function to check if Supabase is enabled from parameters
function getSupabaseEnabled(): boolean {
  try {
    const stored = localStorage.getItem('parameters-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.state?.parameters?.enableSupabase === true;
    }
  } catch (error) {
    console.error('Error reading Supabase enabled state:', error);
  }
  return false;
}

// Function to get Supabase configuration from parameters
function getSupabaseConfig() {
  try {
    const stored = localStorage.getItem('parameters-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      const params = parsed.state?.parameters;
      if (params) {
        return {
          url: params.supabaseUrl,
          anonKey: params.supabaseAnonKey,
          serviceRoleKey: params.supabaseServiceRoleKey
        };
      }
    }
  } catch (error) {
    console.error('Error reading Supabase config:', error);
  }
  return null;
}

// Configuration Supabase
function getSupabaseCredentials() {
  // First try to get from parameters store (if Supabase is enabled)
  if (getSupabaseEnabled()) {
    const config = getSupabaseConfig();
    if (config && config.url && config.anonKey) {
      return {
        url: config.url,
        anonKey: config.anonKey,
        serviceRoleKey: config.serviceRoleKey
      };
    }
  }
  
  // Fallback to environment variables
  return {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  };
}

const credentials = getSupabaseCredentials();
const supabaseUrl = credentials.url;
const supabaseAnonKey = credentials.anonKey;
const supabaseServiceRoleKey = credentials.serviceRoleKey;

// Demo data for offline mode
const demoUsers: SupabaseUser[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@woluma.com',
    role: 'admin',
    organization: 'Woluma',
    is_active: true,
    created_at: new Date().toISOString(),
    auth_user_id: 'auth-1'
  },
  {
    id: '2',
    name: 'Partner User',
    email: 'partner@example.com',
    role: 'partner',
    organization: 'Example Partner',
    is_active: true,
    created_at: new Date().toISOString(),
    auth_user_id: 'auth-2'
  },
  {
    id: '3',
    name: 'Manager User',
    email: 'manager@example.com',
    role: 'manager',
    organization: 'Example Organization',
    is_active: true,
    created_at: new Date().toISOString(),
    auth_user_id: 'auth-3'
  },
  {
    id: '4',
    name: 'Submitter User',
    email: 'submitter@example.com',
    role: 'submitter',
    organization: 'Example Company',
    is_active: true,
    created_at: new Date().toISOString(),
    auth_user_id: 'auth-4'
  }
];

// Demo credentials
const demoCredentials = {
  'admin@woluma.com': 'password',
  'partner@example.com': 'password',
  'manager@example.com': 'password',
  'submitter@example.com': 'password'
};

// Demo session management
let currentDemoUser: SupabaseUser | null = null;

// Vérifier que les variables d'environnement sont définies (sauf en mode demo)
if (!isDemoMode && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  console.error('Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  console.log('💡 Tip: Set VITE_DEMO_MODE=true to use demo mode without Supabase');
}

if (!isDemoMode && !supabaseServiceRoleKey) {
  console.warn('⚠️ Missing VITE_SUPABASE_SERVICE_ROLE_KEY. Admin operations will be limited.');
}

export const supabase = isDemoMode ? null : createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = (!isDemoMode && supabaseServiceRoleKey) ? createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}) : null;

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
    if (isDemoMode) {
      console.log('🎭 Demo mode: Returning demo users');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      return [...demoUsers];
    }
    
    console.log('UserService.getUsers called');
    
    if (supabaseAdmin === null) {
      console.error('❌ Supabase admin client not available. Check SERVICE_ROLE_KEY.');
      throw new Error('Admin operations not available');
    }
    
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
    if (isDemoMode) {
      console.log('🎭 Demo mode: Creating demo user');
      await new Promise(resolve => setTimeout(resolve, 500));
      const newUser: SupabaseUser = {
        ...user,
        id: `demo-${Date.now()}`,
        created_at: new Date().toISOString()
      };
      demoUsers.push(newUser);
      return newUser;
    }
    
    if (supabaseAdmin === null) {
      throw new Error('Admin operations not available');
    }
    
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
    if (isDemoMode) {
      console.log('🎭 Demo mode: Updating demo user');
      await new Promise(resolve => setTimeout(resolve, 500));
      const userIndex = demoUsers.findIndex(u => u.id === id);
      if (userIndex === -1) throw new Error('User not found');
      demoUsers[userIndex] = { ...demoUsers[userIndex], ...updates };
      return demoUsers[userIndex];
    }
    
    if (supabaseAdmin === null) {
      throw new Error('Admin operations not available');
    }
    
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
    if (isDemoMode) {
      console.log('🎭 Demo mode: Deleting demo user');
      await new Promise(resolve => setTimeout(resolve, 500));
      const userIndex = demoUsers.findIndex(u => u.id === id);
      if (userIndex === -1) throw new Error('User not found');
      demoUsers.splice(userIndex, 1);
      return;
    }
    
    if (supabaseAdmin === null) {
      throw new Error('Admin operations not available');
    }
    
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
    const isDemo = import.meta.env.VITE_DEMO_MODE === 'true' && !getSupabaseEnabled();
    
    if (isDemo) {
      console.log('🎭 Demo mode: Returning demo partners list');
      await new Promise(resolve => setTimeout(resolve, 300));
      return [
        {
          id: 'demo-partner-1',
          name: 'Partenaire Démonstration',
          description: 'Partenaire de démonstration pour les tests',
          contact_email: 'demo@partner.com',
          contact_phone: '+33 1 23 45 67 89',
          address: '123 Rue de la Démo, 75001 Paris',
          is_active: true,
          created_at: new Date().toISOString(),
          assigned_manager_id: '3'
        }
      ];
    }
    
    if (!supabase) {
      throw new Error('Supabase not available');
    }
    
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createPartner(partner: Omit<SupabasePartner, 'id' | 'created_at'>): Promise<SupabasePartner> {
    const isDemo = import.meta.env.VITE_DEMO_MODE === 'true' && !getSupabaseEnabled();
    
    if (isDemo) {
      console.log('🎭 Demo mode: Creating demo partner');
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        ...partner,
        id: `demo-partner-${Date.now()}`,
        created_at: new Date().toISOString()
      };
    }
    
    if (!supabase) {
      throw new Error('Supabase not available');
    }
    
    const { data, error } = await supabase
      .from('partners')
      .insert([partner])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updatePartner(id: string, updates: Partial<SupabasePartner>): Promise<SupabasePartner> {
    const isDemo = import.meta.env.VITE_DEMO_MODE === 'true' && !getSupabaseEnabled();
    
    if (isDemo) {
      console.log('🎭 Demo mode: Updating demo partner');
      await new Promise(resolve => setTimeout(resolve, 500));
      // In a real implementation, you'd update the demo data
      return {
        id,
        name: updates.name || 'Updated Partner',
        description: updates.description || 'Updated description',
        contact_email: updates.contact_email || 'updated@partner.com',
        contact_phone: updates.contact_phone,
        address: updates.address,
        is_active: updates.is_active !== undefined ? updates.is_active : true,
        created_at: new Date().toISOString(),
        assigned_manager_id: updates.assigned_manager_id
      };
    }
    
    if (!supabase) {
      throw new Error('Supabase not available');
    }
    
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
    const isDemo = import.meta.env.VITE_DEMO_MODE === 'true' && !getSupabaseEnabled();
    
    if (isDemo) {
      console.log('🎭 Demo mode: Deleting demo partner');
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }
    
    if (!supabase) {
      throw new Error('Supabase not available');
    }
    
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
    const isDemo = import.meta.env.VITE_DEMO_MODE === 'true' && !getSupabaseEnabled();
    
    if (isDemo) {
      console.log('🎭 Demo mode: Returning demo programs list');
      await new Promise(resolve => setTimeout(resolve, 300));
      return [
        {
          id: 'demo-program-1',
          name: 'Programme Innovation 2025',
          description: 'Programme de démonstration pour l\'innovation technologique',
          partner_id: 'demo-partner-1',
          form_template_id: null,
          budget: 1000000,
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          is_active: true,
          created_at: new Date().toISOString(),
          manager_id: '3',
          selection_criteria: [
            {
              id: 'innovation',
              name: 'Niveau d\'innovation',
              description: 'Évaluation du caractère innovant du projet',
              type: 'number',
              required: true,
              minValue: 1,
              maxValue: 10
            }
          ],
          evaluation_criteria: [
            {
              id: 'innovation',
              name: 'Innovation',
              description: 'Caractère innovant et originalité',
              weight: 30,
              maxScore: 20
            },
            {
              id: 'feasibility',
              name: 'Faisabilité',
              description: 'Faisabilité technique et économique',
              weight: 25,
              maxScore: 20
            },
            {
              id: 'impact',
              name: 'Impact',
              description: 'Impact potentiel sur le marché',
              weight: 25,
              maxScore: 20
            },
            {
              id: 'team',
              name: 'Équipe',
              description: 'Compétences et expérience de l\'équipe',
              weight: 20,
              maxScore: 20
            }
          ],
          custom_ai_prompt: 'Évaluez ce projet en tenant compte de son potentiel d\'innovation et de son impact sur le marché français.'
        }
      ];
    }
    
    if (!supabase) {
      throw new Error('Supabase not available');
    }
    
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createProgram(program: Omit<SupabaseProgram, 'id' | 'created_at'>): Promise<SupabaseProgram> {
    const isDemo = import.meta.env.VITE_DEMO_MODE === 'true' && !getSupabaseEnabled();
    
    if (isDemo) {
      console.log('🎭 Demo mode: Creating demo program');
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        ...program,
        id: `demo-program-${Date.now()}`,
        created_at: new Date().toISOString()
      };
    }
    
    if (!supabase) {
      throw new Error('Supabase not available');
    }
    
    const { data, error } = await supabase
      .from('programs')
      .insert([program])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateProgram(id: string, updates: Partial<SupabaseProgram>): Promise<SupabaseProgram> {
    const isDemo = import.meta.env.VITE_DEMO_MODE === 'true' && !getSupabaseEnabled();
    
    if (isDemo) {
      console.log('🎭 Demo mode: Updating demo program');
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        id,
        name: updates.name || 'Updated Program',
        description: updates.description || 'Updated description',
        partner_id: updates.partner_id || 'demo-partner-1',
        form_template_id: updates.form_template_id || null,
        budget: updates.budget || 1000000,
        start_date: updates.start_date || '2025-01-01',
        end_date: updates.end_date || '2025-12-31',
        is_active: updates.is_active !== undefined ? updates.is_active : true,
        created_at: new Date().toISOString(),
        manager_id: updates.manager_id || '3',
        selection_criteria: updates.selection_criteria || [],
        evaluation_criteria: updates.evaluation_criteria || [],
        custom_ai_prompt: updates.custom_ai_prompt
      };
    }
    
    if (!supabase) {
      throw new Error('Supabase not available');
    }
    
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
    const isDemo = import.meta.env.VITE_DEMO_MODE === 'true' && !getSupabaseEnabled();
    
    if (isDemo) {
      console.log('🎭 Demo mode: Deleting demo program');
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }
    
    if (!supabase) {
      throw new Error('Supabase not available');
    }
    
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
    const isDemo = import.meta.env.VITE_DEMO_MODE === 'true' && !getSupabaseEnabled();
    
    if (isDemo) {
      console.log('🎭 Demo mode: Returning demo projects list');
      await new Promise(resolve => setTimeout(resolve, 300));
      return [
        {
          id: 'demo-project-1',
          title: 'Application Mobile Innovante',
          description: 'Développement d\'une application mobile révolutionnaire utilisant l\'IA pour améliorer l\'expérience utilisateur.',
          status: 'submitted',
          budget: 150000,
          timeline: '18 mois',
          submitter_id: '4',
          program_id: 'demo-program-1',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          submission_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          evaluation_scores: null,
          evaluation_comments: null,
          total_evaluation_score: null,
          evaluation_notes: null,
          evaluated_by: null,
          evaluation_date: null,
          formalization_completed: false,
          nda_signed: false,
          tags: ['mobile', 'ia', 'innovation', 'ux'],
          form_data: null,
          recommended_status: null,
          manually_submitted: false
        }
      ];
    }
    
    if (!supabase) {
      throw new Error('Supabase not available');
    }
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createProject(project: Omit<SupabaseProject, 'id' | 'created_at' | 'updated_at'>): Promise<SupabaseProject> {
    const isDemo = import.meta.env.VITE_DEMO_MODE === 'true' && !getSupabaseEnabled();
    
    if (isDemo) {
      console.log('🎭 Demo mode: Creating demo project');
      await new Promise(resolve => setTimeout(resolve, 500));
      const now = new Date().toISOString();
      return {
        ...project,
        id: `demo-project-${Date.now()}`,
        created_at: now,
        updated_at: now
      };
    }
    
    if (!supabase) {
      throw new Error('Supabase not available');
    }
    
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateProject(id: string, updates: Partial<SupabaseProject>): Promise<SupabaseProject> {
    const isDemo = import.meta.env.VITE_DEMO_MODE === 'true' && !getSupabaseEnabled();
    
    if (isDemo) {
      console.log('🎭 Demo mode: Updating demo project');
      await new Promise(resolve => setTimeout(resolve, 500));
      const now = new Date().toISOString();
      return {
        id,
        title: updates.title || 'Updated Project',
        description: updates.description || 'Updated description',
        status: updates.status || 'draft',
        budget: updates.budget || 100000,
        timeline: updates.timeline || '12 mois',
        submitter_id: updates.submitter_id || '4',
        program_id: updates.program_id || 'demo-program-1',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: now,
        submission_date: updates.submission_date,
        evaluation_scores: updates.evaluation_scores || null,
        evaluation_comments: updates.evaluation_comments || null,
        total_evaluation_score: updates.total_evaluation_score || null,
        evaluation_notes: updates.evaluation_notes || null,
        evaluated_by: updates.evaluated_by || null,
        evaluation_date: updates.evaluation_date,
        formalization_completed: updates.formalization_completed || false,
        nda_signed: updates.nda_signed || false,
        tags: updates.tags || [],
        form_data: updates.form_data || null,
        recommended_status: updates.recommended_status || null,
        manually_submitted: updates.manually_submitted || false
      };
    }
    
    if (!supabase) {
      throw new Error('Supabase not available');
    }
    
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
    const isDemo = import.meta.env.VITE_DEMO_MODE === 'true' && !getSupabaseEnabled();
    
    if (isDemo) {
      console.log('🎭 Demo mode: Deleting demo project');
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }
    
    if (!supabase) {
      throw new Error('Supabase not available');
    }
    
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
    if (isDemoMode) {
      console.log('🎭 Demo mode: Returning empty form templates list');
      await new Promise(resolve => setTimeout(resolve, 300));
      return [];
    }
    
    if (!supabase) {
      throw new Error('Supabase not available');
    }
    
    const { data, error } = await supabase
      .from('form_templates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createFormTemplate(template: Omit<SupabaseFormTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<SupabaseFormTemplate> {
    if (isDemoMode) {
      throw new Error('Demo mode: Form template creation not implemented');
    }
    
    if (!supabase) {
      throw new Error('Supabase not available');
    }
    
    const { data, error } = await supabase
      .from('form_templates')
      .insert([template])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateFormTemplate(id: string, updates: Partial<SupabaseFormTemplate>): Promise<SupabaseFormTemplate> {
    if (isDemoMode) {
      throw new Error('Demo mode: Form template update not implemented');
    }
    
    if (!supabase) {
      throw new Error('Supabase not available');
    }
    
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
    if (isDemoMode) {
      throw new Error('Demo mode: Form template deletion not implemented');
    }
    
    if (!supabase) {
      throw new Error('Supabase not available');
    }
    
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
    if (isDemoMode) {
      throw new Error('Demo mode: Sign up not available. Use existing demo accounts.');
    }
    
    if (!supabase) {
      throw new Error('Supabase not available');
    }
    
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
    if (isDemoMode) {
      console.log('🎭 Demo mode: Simulating sign in');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check demo credentials
      if (demoCredentials[email as keyof typeof demoCredentials] === password) {
        const user = demoUsers.find(u => u.email === email);
        if (user) {
          // Store the demo user profile for getCurrentUserProfile
          currentDemoUser = user;
          
          return {
            user: {
              id: user.auth_user_id,
              email: user.email,
              user_metadata: {
                name: user.name,
                role: user.role,
                organization: user.organization
              }
            },
            session: {
              access_token: `demo-token-${user.id}`,
              refresh_token: 'demo-refresh-token'
            }
          };
        }
      }
      
      throw new Error('Invalid login credentials');
    }
    
    if (!supabase) {
      throw new Error('Supabase not available');
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  }

  static async signOut() {
    if (isDemoMode) {
      console.log('🎭 Demo mode: Simulating sign out');
      currentDemoUser = null;
      return;
    }
    
    if (!supabase) {
      throw new Error('Supabase not available');
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  static async getCurrentUser() {
    if (isDemoMode) {
      return null; // Demo mode doesn't maintain auth state
    }
    
    if (!supabase) {
      return null;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  static async getCurrentUserProfile(): Promise<SupabaseUser | null> {
    if (isDemoMode) {
      return currentDemoUser;
    }
    
    const user = await this.getCurrentUser();
    if (!user) return null;
    
    if (!supabaseAdmin) {
      console.warn('⚠️ Using regular client for user profile (limited access)');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();
      
      if (error) return null;
      return data;
    }

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
    if (isDemoMode) {
      console.log('🎭 Demo mode: Skipping migrations');
      return true;
    }
    
    try {
      console.log('🚀 Starting Supabase migration...');
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('❌ Missing Supabase configuration');
        return false;
      }
      
      if (!supabaseAdmin) {
        console.warn('⚠️ Running in limited mode without admin access');
        return true; // Continue without admin operations
      }
      
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
    if (isDemoMode) {
      console.log('🎭 Demo mode: Demo users already available');
      return true;
    }
    
    try {
      console.log('🌱 Seeding data...');
      
      if (!supabaseAdmin) {
        console.warn('⚠️ Cannot seed data without admin access');
        return false;
      }
      
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
      // First check if user profile already exists in our users table
      const { data: existingProfile } = await supabaseAdmin
        .from('users')
        .select('id, auth_user_id')
        .eq('email', email)
        .maybeSingle();

      if (existingProfile) {
        console.log(`User profile already exists for ${email}`);
        return;
      }

      let authUserId: string | null = null;

      // Try to create the authentication user
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

      if (authError && (authError.message.includes('already registered') || authError.message.includes('already exists'))) {
        // User already exists in auth, get the existing user
        console.log(`Auth user already exists for ${email}, retrieving...`);
        const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers();
        const authUser = existingAuthUsers.users.find(u => u.email === email);
        
        if (authUser) {
          authUserId = authUser.id;
          console.log(`Found existing auth user ${email} with ID: ${authUserId}`);
        } else {
          console.error(`Could not find existing auth user for ${email}`);
          return;
        }
      } else if (authError) {
        console.error(`Error creating auth user ${email}:`, authError);
        return;
      } else if (authData.user) {
        authUserId = authData.user.id;
        console.log(`Created new auth user ${email} with ID: ${authUserId}`);
      }

      // Create user profile if we have an auth user ID
      if (authUserId) {
        const { error: profileError } = await supabaseAdmin
          .from('users')
          .insert([{
            name: userData.name,
            email: email,
            role: userData.role as any,
            organization: userData.organization || null,
            auth_user_id: authUserId,
            is_active: true
          }]);

        if (profileError) {
          console.error(`Error creating profile for ${email}:`, profileError);
        } else {
          console.log(`Successfully created profile for ${email}`);
        }
      }
    } catch (error) {
      console.error(`Error in createDemoUser for ${email}:`, error);
    }
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