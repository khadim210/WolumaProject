import { create } from 'zustand';
import { User } from './authStore';
import { ProjectService } from '../services/supabaseService';
import type { SupabaseProject } from '../services/supabaseService';

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
  evaluationComments?: Record<string, string>; // Commentaires par critère d'évaluation
  totalEvaluationScore?: number;
  evaluationNotes?: string;
  evaluatedBy?: string;
  evaluationDate?: Date;
  formalizationCompleted?: boolean;
  ndaSigned?: boolean;
  tags: string[];
  formData?: Record<string, any>; // Données du formulaire soumis
  recommendedStatus?: ProjectStatus; // Status recommandé après évaluation
  manuallySubmitted?: boolean; // Indique si le projet a été soumis manuellement après évaluation
}

// Fonction utilitaire pour convertir SupabaseProject vers Project
const convertSupabaseProject = (supabaseProject: SupabaseProject): Project => ({
  id: supabaseProject.id,
  title: supabaseProject.title,
  description: supabaseProject.description,
  status: supabaseProject.status as ProjectStatus,
  budget: supabaseProject.budget,
  timeline: supabaseProject.timeline,
  submitterId: supabaseProject.submitter_id,
  programId: supabaseProject.program_id,
  createdAt: new Date(supabaseProject.created_at),
  updatedAt: new Date(supabaseProject.updated_at),
  submissionDate: supabaseProject.submission_date ? new Date(supabaseProject.submission_date) : undefined,
  evaluationScores: supabaseProject.evaluation_scores,
  evaluationComments: supabaseProject.evaluation_comments,
  totalEvaluationScore: supabaseProject.total_evaluation_score,
  evaluationNotes: supabaseProject.evaluation_notes,
  evaluatedBy: supabaseProject.evaluated_by,
  evaluationDate: supabaseProject.evaluation_date ? new Date(supabaseProject.evaluation_date) : undefined,
  formalizationCompleted: supabaseProject.formalization_completed,
  ndaSigned: supabaseProject.nda_signed,
  tags: supabaseProject.tags,
  formData: supabaseProject.form_data,
  recommendedStatus: supabaseProject.recommended_status as ProjectStatus,
  manuallySubmitted: supabaseProject.manually_submitted
});

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

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,
  
  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const supabaseProjects = await ProjectService.getProjects();
      const projects = supabaseProjects.map(convertSupabaseProject);
      set({ projects, isLoading: false });
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
      const supabaseProject = await ProjectService.createProject({
        title: projectData.title,
        description: projectData.description,
        status: projectData.status,
        budget: projectData.budget,
        timeline: projectData.timeline,
        submitter_id: projectData.submitterId,
        program_id: projectData.programId,
        submission_date: projectData.submissionDate?.toISOString(),
        evaluation_scores: projectData.evaluationScores,
        evaluation_comments: projectData.evaluationComments,
        total_evaluation_score: projectData.totalEvaluationScore,
        evaluation_notes: projectData.evaluationNotes,
        evaluated_by: projectData.evaluatedBy,
        evaluation_date: projectData.evaluationDate?.toISOString(),
        formalization_completed: projectData.formalizationCompleted || false,
        nda_signed: projectData.ndaSigned || false,
        tags: projectData.tags,
        form_data: projectData.formData,
        recommended_status: projectData.recommendedStatus,
        manually_submitted: projectData.manuallySubmitted || false
      });
      
      const newProject = convertSupabaseProject(supabaseProject);
      
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
      const supabaseUpdates: Partial<SupabaseProject> = {};
      if (updates.title) supabaseUpdates.title = updates.title;
      if (updates.description) supabaseUpdates.description = updates.description;
      if (updates.status) supabaseUpdates.status = updates.status;
      if (updates.budget) supabaseUpdates.budget = updates.budget;
      if (updates.timeline) supabaseUpdates.timeline = updates.timeline;
      if (updates.submissionDate) supabaseUpdates.submission_date = updates.submissionDate.toISOString();
      if (updates.evaluationScores) supabaseUpdates.evaluation_scores = updates.evaluationScores;
      if (updates.evaluationComments) supabaseUpdates.evaluation_comments = updates.evaluationComments;
      if (updates.totalEvaluationScore) supabaseUpdates.total_evaluation_score = updates.totalEvaluationScore;
      if (updates.evaluationNotes) supabaseUpdates.evaluation_notes = updates.evaluationNotes;
      if (updates.evaluatedBy) supabaseUpdates.evaluated_by = updates.evaluatedBy;
      if (updates.evaluationDate) supabaseUpdates.evaluation_date = updates.evaluationDate.toISOString();
      if (updates.formalizationCompleted !== undefined) supabaseUpdates.formalization_completed = updates.formalizationCompleted;
      if (updates.ndaSigned !== undefined) supabaseUpdates.nda_signed = updates.ndaSigned;
      if (updates.tags) supabaseUpdates.tags = updates.tags;
      if (updates.formData) supabaseUpdates.form_data = updates.formData;
      if (updates.recommendedStatus) supabaseUpdates.recommended_status = updates.recommendedStatus;
      if (updates.manuallySubmitted !== undefined) supabaseUpdates.manually_submitted = updates.manuallySubmitted;
      
      const supabaseProject = await ProjectService.updateProject(id, supabaseUpdates);
      const updatedProject = convertSupabaseProject(supabaseProject);
      
      set(state => ({
        projects: state.projects.map(p => p.id === id ? updatedProject : p),
        isLoading: false
      }));
      
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
      await ProjectService.deleteProject(id);
      
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
      // Managers can see all projects (filtering by program access is done in components)
      return projects.filter(p => p.status !== 'draft');
    } else if (user.role === 'submitter') {
      // Submitters can only see their own projects
      return projects.filter(p => p.submitterId === user.id);
    } else if (user.role === 'partner') {
      // Partners can see all submitted and later stage projects
      return projects.filter(p => p.status !== 'draft');
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