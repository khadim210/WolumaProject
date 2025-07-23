import { create } from 'zustand';
import { User } from './authStore';

export type ProjectStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'pre_selected'
  | 'selected'
  | 'formalization'
  | 'financed'
  | 'monitoring'
  | 'closed'
  | 'rejected';

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  budget: number;
  timeline: string;
  submitterId: string;
  programId: string; // Projet soumis pour un programme spécifique
  createdAt: Date;
  updatedAt: Date;
  submissionDate?: Date;
  evaluationScores?: Record<string, number>; // Scores par critère d'évaluation
  totalEvaluationScore?: number;
  evaluationNotes?: string;
  evaluatedBy?: string;
  evaluationDate?: Date;
  formalizationCompleted?: boolean;
  ndaSigned?: boolean;
  tags: string[];
  formData?: Record<string, any>; // Données du formulaire soumis
}

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  getProject: (id: string) => Project | undefined;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
  filterProjectsByStatus: (status: ProjectStatus | 'all') => Project[];
  filterProjectsByUser: (user: User) => Project[];
}

// Mock projects data
const mockProjects: Project[] = [
  {
    id: '1',
    title: 'Recherche sur les Énergies Renouvelables',
    description: 'Projet de recherche visant à améliorer l\'efficacité des panneaux solaires de 20%',
    status: 'submitted',
    budget: 150000000, // 150 millions FCFA
    timeline: '18 mois',
    submitterId: '3',
    programId: '1', // Programme Innovation Tech 2025
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
    submissionDate: new Date('2025-01-15'),
    tags: ['énergie', 'recherche', 'développement durable'],
  },
  {
    id: '2',
    title: 'Initiative d\'Agriculture Urbaine',
    description: 'Création de solutions d\'agriculture verticale pour les environnements urbains denses',
    status: 'pre_selected',
    budget: 75000000, // 75 millions FCFA
    timeline: '12 mois',
    submitterId: '3',
    programId: '2', // Fonds Développement Durable
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-20'),
    submissionDate: new Date('2025-01-10'),
    evaluationScore: 87,
    evaluationNotes: 'Proposition solide avec un potentiel de marché clair',
    evaluatedBy: '2',
    tags: ['agriculture', 'urbain', 'développement durable'],
  },
  {
    id: '3',
    title: 'IA pour le Diagnostic Médical',
    description: 'Développement de solutions d\'IA pour améliorer la détection précoce des maladies',
    status: 'formalization',
    budget: 300000000, // 300 millions FCFA
    timeline: '24 mois',
    submitterId: '3',
    programId: '1', // Programme Innovation Tech 2025
    createdAt: new Date('2024-12-05'),
    updatedAt: new Date('2025-01-25'),
    submissionDate: new Date('2024-12-05'),
    evaluationScore: 95,
    evaluationNotes: 'Équipe de recherche exceptionnelle avec des résultats préliminaires prometteurs',
    evaluatedBy: '2',
    tags: ['santé', 'IA', 'technologie'],
  },
  {
    id: '4',
    title: 'Initiative de Nettoyage des Océans',
    description: 'Développement de systèmes automatisés pour la collecte des plastiques océaniques',
    status: 'financed',
    budget: 200000000, // 200 millions FCFA
    timeline: '18 mois',
    submitterId: '3',
    programId: '2', // Fonds Développement Durable
    createdAt: new Date('2024-11-20'),
    updatedAt: new Date('2025-01-30'),
    submissionDate: new Date('2024-11-20'),
    evaluationScore: 92,
    evaluationNotes: 'Approche innovante avec un impact environnemental significatif',
    evaluatedBy: '2',
    formalizationCompleted: true,
    ndaSigned: true,
    tags: ['environnement', 'nettoyage', 'océan', 'développement durable'],
  },
];

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [...mockProjects],
  isLoading: false,
  error: null,
  
  fetchProjects: async () => {
    // In a real app, this would be an API call
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In a real app, we would fetch from an API
      set({ projects: [...mockProjects], isLoading: false });
    } catch (error) {
      console.error('Error fetching projects:', error);
      set({ error: 'Failed to fetch projects', isLoading: false });
    }
  },
  
  getProject: (id) => {
    return get().projects.find(project => project.id === id);
  },
  
  addProject: async (projectData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newProject: Project = {
        ...projectData,
        id: `${get().projects.length + 1}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      set(state => ({
        projects: [...state.projects, newProject],
        isLoading: false
      }));
      
      return newProject;
    } catch (error) {
      console.error('Error adding project:', error);
      set({ error: 'Failed to add project', isLoading: false });
      throw error;
    }
  },
  
  updateProject: async (id, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const projectIndex = get().projects.findIndex(p => p.id === id);
      
      if (projectIndex === -1) {
        set({ error: 'Project not found', isLoading: false });
        return null;
      }
      
      const updatedProject = {
        ...get().projects[projectIndex],
        ...updates,
        updatedAt: new Date()
      };
      
      const updatedProjects = [...get().projects];
      updatedProjects[projectIndex] = updatedProject;
      
      set({ projects: updatedProjects, isLoading: false });
      
      return updatedProject;
    } catch (error) {
      console.error('Error updating project:', error);
      set({ error: 'Failed to update project', isLoading: false });
      throw error;
    }
  },
  
  deleteProject: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      set(state => ({
        projects: state.projects.filter(p => p.id !== id),
        isLoading: false
      }));
      
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      set({ error: 'Failed to delete project', isLoading: false });
      return false;
    }
  },
  
  filterProjectsByStatus: (status) => {
    if (status === 'all') {
      return get().projects;
    }
    return get().projects.filter(p => p.status === status);
  },
  
  filterProjectsByUser: (user) => {
    const projects = get().projects;
    
    if (user.role === 'manager') {
      // Managers can see projects from their assigned partners' programs
      // For now, return all projects (will be filtered by program access)
      return projects;
    } else if (user.role === 'submitter') {
      // Submitters can only see their own projects
      return projects.filter(p => p.submitterId === user.id);
    } else if (user.role === 'partner') {
      // Partners can see all submitted and later stage projects
      return projects.filter(p => 
        p.status !== 'draft'
      );
    } else if (user.role === 'admin') {
      // Admins can see all projects
      return projects;
    }
    return [];
  },
  
  filterProjectsByProgram: (programId) => {
    return get().projects.filter(p => p.programId === programId);
  }
}));