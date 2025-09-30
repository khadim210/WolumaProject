import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PartnerService, ProgramService, getSupabaseEnabled } from '../services/supabaseService';
import type { SupabasePartner, SupabaseProgram } from '../services/supabaseService';

export type CriterionType = 'number' | 'text' | 'select' | 'boolean' | 'date' | 'range';

export interface EvaluationCriterion {
  id: string;
  name: string;
  description: string;
  weight: number; // Poids en pourcentage (0-100)
  maxScore: number; // Score maximum possible
}

export interface SelectionCriterion {
  id: string;
  name: string;
  description: string;
  type: CriterionType;
  required: boolean;
  // For number and range types
  minValue?: number;
  maxValue?: number;
  // For text type
  maxLength?: number;
  // For select type
  options?: string[];
  // For boolean type
  defaultValue?: boolean;
}

export interface Partner {
  id: string;
  name: string;
  description: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  assignedManagerId?: string; // Manager assigné par l'admin
}

export interface Program {
  id: string;
  name: string;
  description: string;
  partnerId: string; // Programme exécuté pour un partenaire
  formTemplateId?: string; // Modèle de formulaire associé
  budget: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  managerId?: string; // Manager responsable du programme
  selectionCriteria: SelectionCriterion[];
  evaluationCriteria: EvaluationCriterion[];
  customAiPrompt?: string; // Prompt personnalisé pour l'évaluation IA
}

// Fonctions utilitaires pour convertir les données Supabase
const convertSupabasePartner = (supabasePartner: SupabasePartner): Partner => ({
  id: supabasePartner.id,
  name: supabasePartner.name,
  description: supabasePartner.description || '',
  contactEmail: supabasePartner.contact_email,
  contactPhone: supabasePartner.contact_phone,
  address: supabasePartner.address,
  isActive: supabasePartner.is_active,
  createdAt: new Date(supabasePartner.created_at),
  assignedManagerId: supabasePartner.assigned_manager_id
});

const convertSupabaseProgram = (supabaseProgram: SupabaseProgram): Program => ({
  id: supabaseProgram.id,
  name: supabaseProgram.name,
  description: supabaseProgram.description || '',
  partnerId: supabaseProgram.partner_id,
  formTemplateId: supabaseProgram.form_template_id,
  budget: supabaseProgram.budget,
  startDate: new Date(supabaseProgram.start_date),
  endDate: new Date(supabaseProgram.end_date),
  isActive: supabaseProgram.is_active,
  createdAt: new Date(supabaseProgram.created_at),
  managerId: supabaseProgram.manager_id,
  selectionCriteria: supabaseProgram.selection_criteria || [],
  evaluationCriteria: supabaseProgram.evaluation_criteria || [],
  customAiPrompt: supabaseProgram.custom_ai_prompt
});

interface ProgramState {
  partners: Partner[];
  programs: Program[];
  isLoading: boolean;
  error: string | null;
  
  // Partners
  fetchPartners: () => Promise<void>;
  addPartner: (partner: Omit<Partner, 'id' | 'createdAt'>) => Promise<Partner>;
  updatePartner: (id: string, updates: Partial<Partner>) => Promise<Partner | null>;
  deletePartner: (id: string) => Promise<boolean>;
  assignPartnerToManager: (partnerId: string, managerId: string) => Promise<boolean>;
  
  // Programs
  fetchPrograms: () => Promise<void>;
  addProgram: (program: Omit<Program, 'id' | 'createdAt'>) => Promise<Program>;
  updateProgram: (id: string, updates: Partial<Program>) => Promise<Program | null>;
  deleteProgram: (id: string) => Promise<boolean>;
  
  // Getters
  getPartner: (id: string) => Partner | undefined;
  getProgram: (id: string) => Program | undefined;
  getProgramsByPartner: (partnerId: string) => Program[];
  getPartnersByManager: (managerId: string) => Partner[];
  getProgramsByManager: (managerId: string) => Program[];
}

export const useProgramStore = create<ProgramState>()(
  persist(
    (set, get) => ({
      partners: [],
      programs: [],
      isLoading: false,
      error: null,

      // Partners
      fetchPartners: async () => {
        set({ isLoading: true, error: null });
        try {
          console.log('🏢 Store: Fetching partners...');
          console.log('🏢 Store: Supabase enabled:', getSupabaseEnabled());
          console.log('🏢 Fetching partners from Supabase...');
          const supabasePartners = await PartnerService.getPartners();
          console.log('🏢 Partners received:', supabasePartners.length);
          console.log('🏢 Raw partners data:', supabasePartners);
          const partners = supabasePartners.map(convertSupabasePartner);
          console.log('🏢 Converted partners:', partners.length);
          console.log('🏢 Final partners:', partners);
          set({ partners, isLoading: false });
        } catch (error) {
          console.error('Error fetching partners:', error);
          set({ error: 'Failed to fetch partners', isLoading: false });
        }
      },

      addPartner: async (partnerData) => {
        set({ isLoading: true, error: null });
        try {
          const supabasePartner = await PartnerService.createPartner({
            name: partnerData.name,
            description: partnerData.description,
            contact_email: partnerData.contactEmail,
            contact_phone: partnerData.contactPhone,
            address: partnerData.address,
            is_active: partnerData.isActive,
            assigned_manager_id: partnerData.assignedManagerId
          });
          
          const newPartner = convertSupabasePartner(supabasePartner);

          set(state => ({
            partners: [...state.partners, newPartner],
            isLoading: false
          }));

          return newPartner;
        } catch (error) {
          console.error('Error adding partner:', error);
          set({ error: 'Failed to add partner', isLoading: false });
          throw error;
        }
      },

      updatePartner: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
          const supabaseUpdates: Partial<SupabasePartner> = {};
          if (updates.name) supabaseUpdates.name = updates.name;
          if (updates.description) supabaseUpdates.description = updates.description;
          if (updates.contactEmail) supabaseUpdates.contact_email = updates.contactEmail;
          if (updates.contactPhone) supabaseUpdates.contact_phone = updates.contactPhone;
          if (updates.address) supabaseUpdates.address = updates.address;
          if (updates.isActive !== undefined) supabaseUpdates.is_active = updates.isActive;
          if (updates.assignedManagerId) supabaseUpdates.assigned_manager_id = updates.assignedManagerId;
          
          const supabasePartner = await PartnerService.updatePartner(id, supabaseUpdates);
          const updatedPartner = convertSupabasePartner(supabasePartner);
          
          set(state => ({
            partners: state.partners.map(p => p.id === id ? updatedPartner : p),
            isLoading: false
          }));

          return updatedPartner;
        } catch (error) {
          console.error('Error updating partner:', error);
          set({ error: 'Failed to update partner', isLoading: false });
          throw error;
        }
      },

      deletePartner: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await PartnerService.deletePartner(id);
          
          set(state => ({
            partners: state.partners.filter(p => p.id !== id),
            isLoading: false
          }));

          return true;
        } catch (error) {
          console.error('Error deleting partner:', error);
          set({ error: 'Failed to delete partner', isLoading: false });
          return false;
        }
      },

      assignPartnerToManager: async (partnerId, managerId) => {
        try {
          await get().updatePartner(partnerId, { assignedManagerId: managerId });
          return true;
        } catch (error) {
          console.error('Error assigning partner to manager:', error);
          return false;
        }
      },

      // Programs
      fetchPrograms: async () => {
        set({ isLoading: true, error: null });
        try {
          const supabasePrograms = await ProgramService.getPrograms();
          const programs = supabasePrograms.map(convertSupabaseProgram);
          set({ programs, isLoading: false });
        } catch (error) {
          console.error('Error fetching programs:', error);
          set({ error: 'Failed to fetch programs', isLoading: false });
        }
      },

      addProgram: async (programData) => {
        set({ isLoading: true, error: null });
        try {
          const supabaseProgram = await ProgramService.createProgram({
            name: programData.name,
            description: programData.description,
            partner_id: programData.partnerId,
            form_template_id: programData.formTemplateId,
            budget: programData.budget,
            start_date: programData.startDate.toISOString().split('T')[0],
            end_date: programData.endDate.toISOString().split('T')[0],
            is_active: programData.isActive,
            manager_id: programData.managerId,
            selection_criteria: programData.selectionCriteria,
            evaluation_criteria: programData.evaluationCriteria,
            custom_ai_prompt: programData.customAiPrompt
          });
          
          const newProgram = convertSupabaseProgram(supabaseProgram);

          set(state => ({
            programs: [...state.programs, newProgram],
            isLoading: false
          }));

          return newProgram;
        } catch (error) {
          console.error('Error adding program:', error);
          set({ error: 'Failed to add program', isLoading: false });
          throw error;
        }
      },

      updateProgram: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
          const supabaseUpdates: Partial<SupabaseProgram> = {};
          if (updates.name) supabaseUpdates.name = updates.name;
          if (updates.description) supabaseUpdates.description = updates.description;
          if (updates.partnerId) supabaseUpdates.partner_id = updates.partnerId;
          if (updates.formTemplateId) supabaseUpdates.form_template_id = updates.formTemplateId;
          if (updates.budget) supabaseUpdates.budget = updates.budget;
          if (updates.startDate) supabaseUpdates.start_date = updates.startDate.toISOString().split('T')[0];
          if (updates.endDate) supabaseUpdates.end_date = updates.endDate.toISOString().split('T')[0];
          if (updates.isActive !== undefined) supabaseUpdates.is_active = updates.isActive;
          if (updates.managerId) supabaseUpdates.manager_id = updates.managerId;
          if (updates.selectionCriteria) supabaseUpdates.selection_criteria = updates.selectionCriteria;
          if (updates.evaluationCriteria) supabaseUpdates.evaluation_criteria = updates.evaluationCriteria;
          if (updates.customAiPrompt) supabaseUpdates.custom_ai_prompt = updates.customAiPrompt;
          
          const supabaseProgram = await ProgramService.updateProgram(id, supabaseUpdates);
          const updatedProgram = convertSupabaseProgram(supabaseProgram);
          
          set(state => ({
            programs: state.programs.map(p => p.id === id ? updatedProgram : p),
            isLoading: false
          }));

          return updatedProgram;
        } catch (error) {
          console.error('Error updating program:', error);
          set({ error: 'Failed to update program', isLoading: false });
          throw error;
        }
      },

      deleteProgram: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await ProgramService.deleteProgram(id);
          
          set(state => ({
            programs: state.programs.filter(p => p.id !== id),
            isLoading: false
          }));

          return true;
        } catch (error) {
          console.error('Error deleting program:', error);
          set({ error: 'Failed to delete program', isLoading: false });
          return false;
        }
      },

      // Getters
      getPartner: (id) => {
        return get().partners.find(partner => partner.id === id);
      },

      getProgram: (id) => {
        return get().programs.find(program => program.id === id);
      },

      getProgramsByPartner: (partnerId) => {
        return get().programs.filter(program => program.partnerId === partnerId);
      },

      getPartnersByManager: (managerId) => {
        return get().partners.filter(partner => partner.assignedManagerId === managerId);
      },

      getProgramsByManager: (managerId) => {
        const managerPartners = get().getPartnersByManager(managerId);
        const partnerIds = managerPartners.map(p => p.id);
        return get().programs.filter(program => 
          partnerIds.includes(program.partnerId) || program.managerId === managerId
        );
      },
    }),
    {
      name: 'program-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert date strings back to Date objects for partners
          state.partners = state.partners.map(partner => ({
            ...partner,
            createdAt: new Date(partner.createdAt)
          }));
          
          // Convert date strings back to Date objects for programs
          state.programs = state.programs.map(program => ({
            ...program,
            startDate: new Date(program.startDate),
            endDate: new Date(program.endDate),
            createdAt: new Date(program.createdAt)
          }));
        }
      },
    }
  )
);