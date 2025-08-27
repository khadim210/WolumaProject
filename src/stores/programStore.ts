import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

// Mock data
const mockPartners: Partner[] = [
  {
    id: '1',
    name: 'Fondation Innovation Afrique',
    description: 'Fondation dédiée à l\'innovation technologique en Afrique',
    contactEmail: 'contact@innovation-afrique.org',
    contactPhone: '+225 01 02 03 04',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    assignedManagerId: '3', // Assigné au manager (ID 3)
  },
  {
    id: '2',
    name: 'Banque de Développement',
    description: 'Institution financière pour le développement économique',
    contactEmail: 'projets@banque-dev.ci',
    contactPhone: '+225 05 06 07 08',
    isActive: true,
    createdAt: new Date('2024-02-01'),
    assignedManagerId: '3', // Assigné au même manager (ID 3)
  },
  {
    id: '3',
    name: 'Ministère de l\'Innovation',
    description: 'Ministère en charge de l\'innovation et des nouvelles technologies',
    contactEmail: 'innovation@gouv.ci',
    isActive: true,
    createdAt: new Date('2024-01-10'),
  },
];

const mockPrograms: Program[] = [
  {
    id: '1',
    name: 'Programme Innovation Tech 2025',
    description: 'Programme de financement pour les startups technologiques',
    partnerId: '1',
    budget: 500000000, // 500M FCFA
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    formTemplateId: '1', // Associé au modèle "Appel à projets innovation"
    isActive: true,
    createdAt: new Date('2024-12-01'),
    managerId: '3', // Manager ID 3
    selectionCriteria: [
      {
        id: 'c1',
        name: 'Budget maximum',
        description: 'Budget maximum autorisé pour le projet',
        type: 'number',
        required: true,
        minValue: 10000,
        maxValue: 1000000
      },
      {
        id: 'c2',
        name: 'Secteur d\'activité',
        description: 'Secteur d\'activité du projet',
        type: 'select',
        required: true,
        options: ['Technologies', 'Santé', 'Environnement', 'Education', 'Agriculture']
      },
      {
        id: 'c3',
        name: 'Durée du projet',
        description: 'Durée maximale du projet en mois',
        type: 'range',
        required: true,
        minValue: 6,
        maxValue: 36
      }
    ],
    evaluationCriteria: [
      {
        id: 'e1',
        name: 'Innovation et originalité',
        description: 'Niveau d\'innovation et d\'originalité du projet',
        weight: 25,
        maxScore: 20
      },
      {
        id: 'e2',
        name: 'Faisabilité technique',
        description: 'Capacité technique à réaliser le projet',
        weight: 20,
        maxScore: 20
      },
      {
        id: 'e3',
        name: 'Impact et pertinence',
        description: 'Impact potentiel et pertinence du projet',
        weight: 25,
        maxScore: 20
      },
      {
        id: 'e4',
        name: 'Réalisme budgétaire',
        description: 'Réalisme et justification du budget demandé',
        weight: 15,
        maxScore: 20
      },
      {
        id: 'e5',
        name: 'Compétence de l\'équipe',
        description: 'Compétences et expérience de l\'équipe projet',
        weight: 15,
        maxScore: 20
      }
    ]
  },
  {
    id: '2',
    name: 'Fonds Développement Durable',
    description: 'Financement de projets environnementaux et durables',
    partnerId: '2',
    budget: 750000000, // 750M FCFA
    startDate: new Date('2025-02-01'),
    endDate: new Date('2026-01-31'),
    formTemplateId: '1', // Associé au modèle "Appel à projets innovation"
    isActive: true,
    createdAt: new Date('2024-11-15'),
    managerId: '3', // Manager ID 3
    selectionCriteria: [
      {
        id: 'c4',
        name: 'Impact environnemental',
        description: 'Le projet doit avoir un impact environnemental positif',
        type: 'boolean',
        required: true,
        defaultValue: true
      },
      {
        id: 'c5',
        name: 'Zone géographique',
        description: 'Zone géographique d\'intervention',
        type: 'select',
        required: true,
        options: ['Urbaine', 'Rurale', 'Côtière', 'Forestière']
      },
      {
        id: 'c6',
        name: 'Nombre de bénéficiaires',
        description: 'Nombre minimum de bénéficiaires directs',
        type: 'number',
        required: true,
        minValue: 100,
        maxValue: 50000
      }
    ],
    evaluationCriteria: [
      {
        id: 'e6',
        name: 'Impact environnemental',
        description: 'Mesure de l\'impact positif sur l\'environnement',
        weight: 30,
        maxScore: 20
      },
      {
        id: 'e7',
        name: 'Durabilité du projet',
        description: 'Capacité du projet à perdurer dans le temps',
        weight: 25,
        maxScore: 20
      },
      {
        id: 'e8',
        name: 'Nombre de bénéficiaires',
        description: 'Étendue de l\'impact sur les populations',
        weight: 20,
        maxScore: 20
      },
      {
        id: 'e9',
        name: 'Innovation sociale',
        description: 'Caractère innovant de l\'approche sociale',
        weight: 15,
        maxScore: 20
      },
      {
        id: 'e10',
        name: 'Partenariats locaux',
        description: 'Qualité des partenariats avec les acteurs locaux',
        weight: 10,
        maxScore: 20
      }
    ]
  },
  {
    id: '3',
    name: 'Initiative Jeunes Entrepreneurs',
    description: 'Programme d\'accompagnement pour jeunes entrepreneurs',
    partnerId: '1',
    budget: 200000000, // 200M FCFA
    startDate: new Date('2025-03-01'),
    endDate: new Date('2025-08-31'),
    isActive: true,
    createdAt: new Date('2024-12-10'),
    selectionCriteria: [
      {
        id: 'c7',
        name: 'Âge du porteur',
        description: 'Âge maximum du porteur de projet',
        type: 'number',
        required: true,
        minValue: 18,
        maxValue: 35
      },
      {
        id: 'c8',
        name: 'Expérience entrepreneuriale',
        description: 'Le porteur a-t-il une expérience entrepreneuriale préalable ?',
        type: 'boolean',
        required: false,
        defaultValue: false
      },
      {
        id: 'c9',
        name: 'Description du projet',
        description: 'Description détaillée du projet',
        type: 'text',
        required: true,
        maxLength: 2000
      }
    ],
    evaluationCriteria: [
      {
        id: 'e11',
        name: 'Potentiel entrepreneurial',
        description: 'Évaluation du potentiel entrepreneurial du porteur',
        weight: 35,
        maxScore: 20
      },
      {
        id: 'e12',
        name: 'Viabilité économique',
        description: 'Viabilité économique du modèle proposé',
        weight: 30,
        maxScore: 20
      },
      {
        id: 'e13',
        name: 'Innovation du concept',
        description: 'Caractère innovant du concept d\'entreprise',
        weight: 20,
        maxScore: 20
      },
      {
        id: 'e14',
        name: 'Capacité d\'exécution',
        description: 'Capacité à exécuter le plan d\'affaires',
        weight: 15,
        maxScore: 20
      }
    ]
  },
];

export const useProgramStore = create<ProgramState>()(
  persist(
    (set, get) => ({
      partners: [...mockPartners],
      programs: [...mockPrograms],
      isLoading: false,
      error: null,

      // Partners
      fetchPartners: async () => {
        set({ isLoading: true, error: null });
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          set({ partners: [...mockPartners], isLoading: false });
        } catch (error) {
          console.error('Error fetching partners:', error);
          set({ error: 'Failed to fetch partners', isLoading: false });
        }
      },

      addPartner: async (partnerData) => {
        set({ isLoading: true, error: null });
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const newPartner: Partner = {
            ...partnerData,
            id: `${get().partners.length + 1}`,
            createdAt: new Date(),
          };

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
          await new Promise(resolve => setTimeout(resolve, 500));

          const partnerIndex = get().partners.findIndex(p => p.id === id);
          if (partnerIndex === -1) {
            set({ error: 'Partner not found', isLoading: false });
            return null;
          }

          const updatedPartner = {
            ...get().partners[partnerIndex],
            ...updates,
          };

          const updatedPartners = [...get().partners];
          updatedPartners[partnerIndex] = updatedPartner;

          set({ partners: updatedPartners, isLoading: false });
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
          await new Promise(resolve => setTimeout(resolve, 500));
          
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
          await new Promise(resolve => setTimeout(resolve, 500));
          set({ programs: [...mockPrograms], isLoading: false });
        } catch (error) {
          console.error('Error fetching programs:', error);
          set({ error: 'Failed to fetch programs', isLoading: false });
        }
      },

      addProgram: async (programData) => {
        set({ isLoading: true, error: null });
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const newProgram: Program = {
            ...programData,
            id: `${get().programs.length + 1}`,
            createdAt: new Date(),
          };

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
          await new Promise(resolve => setTimeout(resolve, 500));

          const programIndex = get().programs.findIndex(p => p.id === id);
          if (programIndex === -1) {
            set({ error: 'Program not found', isLoading: false });
            return null;
          }

          const updatedProgram = {
            ...get().programs[programIndex],
            ...updates,
          };

          const updatedPrograms = [...get().programs];
          updatedPrograms[programIndex] = updatedProgram;

          set({ programs: updatedPrograms, isLoading: false });
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
          await new Promise(resolve => setTimeout(resolve, 500));
          
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