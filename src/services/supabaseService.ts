import { createClient } from '@supabase/supabase-js';

// Function to check if Supabase is enabled from parameters
export function getSupabaseEnabled(): boolean {
  if (typeof window === 'undefined') return false;
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
  if (typeof window === 'undefined') return null;
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
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // Return null if required credentials are missing
  if (!envUrl || !envAnonKey) {
    return null;
  }
  
  return {
    url: envUrl,
    anonKey: envAnonKey,
    serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  };
}

const credentials = getSupabaseCredentials();
const supabaseUrl = credentials?.url;
const supabaseAnonKey = credentials?.anonKey;
const supabaseServiceRoleKey = credentials?.serviceRoleKey;

// Vérifier que les variables d'environnement sont définies
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  console.error('Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
}

if (!supabaseServiceRoleKey) {
  console.warn('⚠️ Missing VITE_SUPABASE_SERVICE_ROLE_KEY. Admin operations will be limited.');
}

export const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;
export const supabaseAdmin = (supabaseUrl && supabaseServiceRoleKey) ? createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}) : null;

// Types pour les données Supabase
export interface SupabaseUser {
  id?: string;
  name: string;
  email: string;
  role: 'admin' | 'partner' | 'manager' | 'submitter';
  organization?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  auth_user_id: string;
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
  currency: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  manager_id?: string;
  selection_criteria: any[];
  eligibility_criteria?: string;
  field_eligibility_criteria?: any[];
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
    console.log('🏢 PartnerService.getPartners called');
    console.log('🏢 Supabase enabled:', getSupabaseEnabled());
    console.log('🏢 Supabase client available:', !!supabase);
    console.log('🏢 Environment variables:', {
      url: !!import.meta.env.VITE_SUPABASE_URL,
      anonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
    });
    
    if (!supabase) {
      console.error('❌ Supabase client not available');
      throw new Error('Supabase not available');
    }
    
    console.log('🏢 Querying Supabase partners table...');
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log('🏢 Supabase query result:', { data: data?.length, error });
    if (data) {
      console.log('🏢 Partners from Supabase:', data);
    }
    
    if (error) throw error;
    return data || [];
  }

  static async createPartner(partner: Omit<SupabasePartner, 'id' | 'created_at'>): Promise<SupabasePartner> {
    if (supabaseAdmin === null) {
      throw new Error('Admin operations not available');
    }
    
    // Use admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('partners')
      .insert([partner])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updatePartner(id: string, updates: Partial<SupabasePartner>): Promise<SupabasePartner> {
    if (supabaseAdmin === null) {
      throw new Error('Admin operations not available');
    }
    
    // Use admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('partners')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deletePartner(id: string): Promise<void> {
    if (supabaseAdmin === null) {
      throw new Error('Admin operations not available');
    }
    
    // Use admin client to bypass RLS
    const { error } = await supabaseAdmin
      .from('partners')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

// Service pour les programmes
export class ProgramService {
  static async getPrograms(): Promise<SupabaseProgram[]> {
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
    if (supabaseAdmin === null) {
      throw new Error('Admin operations not available');
    }
    
    const { data, error } = await supabaseAdmin
      .from('programs')
      .insert([program])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateProgram(id: string, updates: Partial<SupabaseProgram>): Promise<SupabaseProgram> {
    if (supabaseAdmin === null) {
      throw new Error('Admin operations not available');
    }
    
    const { data, error } = await supabaseAdmin
      .from('programs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteProgram(id: string): Promise<void> {
    if (supabaseAdmin === null) {
      throw new Error('Admin operations not available');
    }
    
    const { error } = await supabaseAdmin
      .from('programs')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

// Service pour les projets
export class ProjectService {
  static async getProjects(): Promise<SupabaseProject[]> {
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
    console.log('🔄 FormTemplateService.getFormTemplates called');
    console.log('🔄 Supabase enabled:', getSupabaseEnabled());
    
    if (!supabase) {
      console.error('❌ Supabase not available for form templates');
      throw new Error('Supabase not available');
    }
    
    console.log('🔄 Fetching from Supabase...');
    const { data, error } = await supabase
      .from('form_templates')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log('🔄 Supabase response - data:', data?.length, 'error:', error);
    
    if (error) throw error;
    return data || [];
  }

  static async createFormTemplate(template: Omit<SupabaseFormTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<SupabaseFormTemplate> {
    if (supabaseAdmin === null) {
      throw new Error('Admin operations not available');
    }
    
    const { data, error } = await supabaseAdmin
      .from('form_templates')
      .insert([template])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateFormTemplate(id: string, updates: Partial<SupabaseFormTemplate>): Promise<SupabaseFormTemplate> {
    if (supabaseAdmin === null) {
      throw new Error('Admin operations not available');
    }
    
    const { data, error } = await supabaseAdmin
      .from('form_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteFormTemplate(id: string): Promise<void> {
    if (supabaseAdmin === null) {
      throw new Error('Admin operations not available');
    }
    
    const { error } = await supabaseAdmin
      .from('form_templates')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

// Service d'authentification
export class AuthService {
  static async signIn(email: string, password: string): Promise<{ user: any; session: any }> {
    if (supabase === null) {
      throw new Error('Supabase not available');
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  }

  static async signUp(email: string, password: string, userData: { name: string; organization?: string }): Promise<{ user: any; session: any }> {
    if (supabase === null) {
      throw new Error('Supabase not available');
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  }

  static async signOut(): Promise<void> {
    if (supabase === null) {
      throw new Error('Supabase not available');
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  static async getCurrentUser(): Promise<any> {
    if (supabase === null) {
      throw new Error('Supabase not available');
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  static async getCurrentUserProfile(): Promise<SupabaseUser | null> {
    if (supabase === null) {
      throw new Error('Supabase not available');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    return data || null;
  }

  static async updatePassword(newPassword: string): Promise<void> {
    if (supabase === null) {
      throw new Error('Supabase not available');
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
  }

  static async updateProfile(updates: { name?: string; organization?: string }): Promise<void> {
    if (supabase === null) {
      throw new Error('Supabase not available');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('auth_user_id', user.id);

    if (error) throw error;
  }

  static async updateUserPassword(authUserId: string, newPassword: string): Promise<void> {
    if (supabaseAdmin === null) {
      throw new Error('Admin operations not available');
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      authUserId,
      { password: newPassword }
    );

    if (error) throw error;
  }
}

// Service de migration et seeding
export class MigrationService {
  static async seedData(): Promise<void> {
    console.log('🌱 Starting data seeding...');
    
    try {
      // Verify Supabase configuration before proceeding
      if (!supabase || !supabaseAdmin) {
        console.log('⚠️ Supabase not properly configured, skipping data seeding');
        return;
      }

      // Test basic connectivity
      try {
        const { data: testData, error: testError } = await supabase
          .from('users')
          .select('count')
          .limit(1);
        
        if (testError) {
          console.log('⚠️ Supabase connectivity test failed:', testError.message);
          console.log('💡 Please check your Supabase URL and keys in the configuration');
          return;
        }
      } catch (fetchError) {
        console.log('⚠️ Network error connecting to Supabase:', fetchError);
        console.log('💡 Please verify your Supabase URL is correct and accessible');
        return;
      }

      // Create default partners and programs
      await this.createDefaultPartners();
      await this.createDefaultPrograms();
      
      // Check if we should use demo mode or Supabase for users
      const isDemo = import.meta.env.VITE_DEMO_MODE === 'true' && !getSupabaseEnabled();
      
      if (supabaseAdmin === null) {
        console.log('⚠️ Admin client not available (missing SERVICE_ROLE_KEY), skipping user seeding');
        console.log('💡 Add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env file to enable user seeding');
        return;
      }
      
      console.log('✅ Data seeding completed successfully');
    } catch (error) {
      console.error('❌ Error during data seeding:', error);
      // Don't throw error to prevent app crash, just log it
      console.log('💡 Tip: Ensure your Supabase project has the correct configuration and SERVICE_ROLE_KEY');
    }
  }

  private static async createDefaultPartners(): Promise<void> {
    if (supabaseAdmin === null) {
      console.log('⚠️ Admin client not available, skipping partners creation');
      return;
    }
    
    console.log('🏢 Creating default partners...');
    
    try {
      // Test admin client connectivity first
      try {
        const { data: testData, error: testError } = await supabaseAdmin
          .from('partners')
          .select('count')
          .limit(1);
        
        if (testError) {
          console.log('⚠️ Admin client test failed:', testError.message);
          return;
        }
      } catch (fetchError) {
        console.log('⚠️ Network error with admin client:', fetchError);
        console.log('💡 Please verify your Supabase Service Role Key is correct');
        return;
      }

      const defaultPartners = [
        {
          name: 'Woluma Innovation Fund',
          description: 'Fonds d\'investissement spécialisé dans l\'innovation technologique et l\'impact social',
          contact_email: 'contact@woluma.com',
          contact_phone: '+33 1 23 45 67 89',
          address: '123 Avenue de l\'Innovation, 75001 Paris, France',
          is_active: true,
          assigned_manager_id: null
        },
        {
          name: 'Green Tech Partners',
          description: 'Partenaire spécialisé dans le financement de projets de transition énergétique et environnementale',
          contact_email: 'contact@greentech-partners.com',
          contact_phone: '+33 1 98 76 54 32',
          address: '456 Rue de l\'Écologie, 69000 Lyon, France',
          is_active: true,
          assigned_manager_id: null
        },
        {
          name: 'Health Innovation Lab',
          description: 'Laboratoire d\'innovation dédié aux projets de santé, biotechnologies et dispositifs médicaux',
          contact_email: 'lab@health-innovation.com',
          contact_phone: '+33 4 56 78 90 12',
          address: '789 Boulevard de la Santé, 13000 Marseille, France',
          is_active: true,
          assigned_manager_id: null
        }
      ];
      
      for (const partner of defaultPartners) {
        // Check if partner already exists
        const { data: existingPartner } = await supabaseAdmin
          .from('partners')
          .select('id')
          .eq('name', partner.name)
          .maybeSingle();
        
        if (existingPartner) {
          console.log(`✅ Partner already exists: ${partner.name}`);
          continue;
        }
        
        // Create the partner
        const { error } = await supabaseAdmin
          .from('partners')
          .insert([partner]);
        
        if (error) {
          console.error(`❌ Error creating partner ${partner.name}:`, error);
          continue;
        }
        
        console.log(`✅ Created partner: ${partner.name}`);
      }
      
      console.log('🏢 Partners creation completed');
    } catch (error) {
      console.error('❌ Error creating default partners:', error);
      console.log('💡 Tip: Verify your Supabase URL and Service Role Key are correct');
      console.log('💡 Check that your Supabase project is accessible and the partners table exists');
    }
  }

  private static async createDefaultPrograms(): Promise<void> {
    if (supabaseAdmin === null) {
      console.log('⚠️ Admin client not available, skipping programs creation');
      return;
    }
    
    console.log('🎯 Creating default programs...');
    
    try {
      // First get the created partners
      const { data: partners } = await supabaseAdmin
        .from('partners')
        .select('id, name');
      
      if (!partners || partners.length === 0) {
        console.log('⚠️ No partners found, skipping programs creation');
        return;
      }
      
      // Get form templates
      const { data: templates } = await supabaseAdmin
        .from('form_templates')
        .select('id, name');
      
      const defaultPrograms = [
        {
          name: 'Innovation Technologique 2025',
          description: 'Programme de financement pour les projets d\'innovation technologique avec un fort potentiel de marché',
          partner_id: partners.find(p => p.name === 'Woluma Innovation Fund')?.id || partners[0].id,
          form_template_id: templates?.find(t => t.name.includes('Numérique'))?.id || null,
          budget: 2000000,
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          is_active: true,
          manager_id: null,
          selection_criteria: [
            {
              id: 'innovation_level',
              name: 'Niveau d\'innovation',
              description: 'Le projet présente-t-il un caractère innovant significatif ?',
              type: 'number',
              required: true,
              minValue: 1,
              maxValue: 10
            },
            {
              id: 'market_potential',
              name: 'Potentiel de marché',
              description: 'Le projet vise-t-il un marché avec un potentiel de croissance ?',
              type: 'boolean',
              required: true
            }
          ],
          evaluation_criteria: [
            {
              id: 'innovation',
              name: 'Innovation et originalité',
              description: 'Caractère innovant et originalité de la solution proposée',
              weight: 30,
              maxScore: 20
            },
            {
              id: 'feasibility',
              name: 'Faisabilité technique',
              description: 'Faisabilité technique et économique du projet',
              weight: 25,
              maxScore: 20
            },
            {
              id: 'market_impact',
              name: 'Impact marché',
              description: 'Potentiel d\'impact sur le marché et la société',
              weight: 25,
              maxScore: 20
            },
            {
              id: 'team_expertise',
              name: 'Expertise de l\'équipe',
              description: 'Compétences et expérience de l\'équipe projet',
              weight: 20,
              maxScore: 20
            }
          ],
          custom_ai_prompt: 'Évaluez ce projet technologique en tenant compte de son potentiel d\'innovation, de sa faisabilité technique et de son impact sur le marché français. Privilégiez les projets avec une forte composante technologique et un modèle économique viable.'
        },
        {
          name: 'Transition Énergétique Durable',
          description: 'Programme dédié au financement de projets d\'énergie renouvelable et d\'efficacité énergétique',
          partner_id: partners.find(p => p.name === 'Green Tech Partners')?.id || partners[1]?.id || partners[0].id,
          form_template_id: templates?.find(t => t.name.includes('Énergétique'))?.id || null,
          budget: 3000000,
          start_date: '2025-02-01',
          end_date: '2026-01-31',
          is_active: true,
          manager_id: null,
          selection_criteria: [
            {
              id: 'environmental_impact',
              name: 'Impact environnemental',
              description: 'Le projet contribue-t-il significativement à la réduction des émissions de CO2 ?',
              type: 'boolean',
              required: true
            },
            {
              id: 'energy_production',
              name: 'Production énergétique',
              description: 'Capacité de production énergétique annuelle (MWh)',
              type: 'number',
              required: false,
              minValue: 0
            }
          ],
          evaluation_criteria: [
            {
              id: 'environmental_benefit',
              name: 'Bénéfice environnemental',
              description: 'Impact positif sur l\'environnement et réduction des émissions',
              weight: 35,
              maxScore: 20
            },
            {
              id: 'technical_maturity',
              name: 'Maturité technique',
              description: 'Niveau de maturité technologique (TRL) et faisabilité',
              weight: 25,
              maxScore: 20
            },
            {
              id: 'scalability',
              name: 'Potentiel de déploiement',
              description: 'Capacité de déploiement à grande échelle',
              weight: 25,
              maxScore: 20
            },
            {
              id: 'economic_viability',
              name: 'Viabilité économique',
              description: 'Modèle économique et rentabilité du projet',
              weight: 15,
              maxScore: 20
            }
          ],
          custom_ai_prompt: 'Évaluez ce projet de transition énergétique en privilégiant l\'impact environnemental et le potentiel de réduction des émissions de CO2. Analysez la maturité technologique et le potentiel de déploiement à grande échelle.'
        }
      ];
      
      for (const program of defaultPrograms) {
        // Check if program already exists
        const { data: existingProgram } = await supabaseAdmin
          .from('programs')
          .select('id')
          .eq('name', program.name)
          .maybeSingle();
        
        if (existingProgram) {
          console.log(`✅ Program already exists: ${program.name}`);
          continue;
        }
        
        // Create the program
        const { error } = await supabaseAdmin
          .from('programs')
          .insert([program]);
        
        if (error) {
          console.error(`❌ Error creating program ${program.name}:`, error);
          continue;
        }
        
        console.log(`✅ Created program: ${program.name}`);
      }
      
      console.log('🎯 Programs creation completed');
    } catch (error) {
      console.error('❌ Error creating default programs:', error);
    }
  }

}