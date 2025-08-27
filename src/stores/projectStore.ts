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
    evaluatedBy: '3', // Évalué par le manager ID 3
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
    evaluatedBy: '3', // Évalué par le manager ID 3
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
    evaluatedBy: '3', // Évalué par le manager ID 3
    totalEvaluationScore: 92,
    evaluationScores: {
      'Impact environnemental': 18,
      'Durabilité du projet': 17,
      'Nombre de bénéficiaires': 19,
      'Innovation sociale': 16,
      'Partenariats locaux': 18
    },
    evaluationComments: {
      'Impact environnemental': 'Excellent impact sur la réduction de la pollution océanique',
      'Durabilité du projet': 'Système autonome avec maintenance minimale',
      'Nombre de bénéficiaires': 'Impact global sur l\'écosystème marin',
      'Innovation sociale': 'Sensibilisation et engagement communautaire',
      'Partenariats locaux': 'Collaboration avec ONG environnementales'
    },
    formalizationCompleted: true,
    ndaSigned: true,
    tags: ['environnement', 'nettoyage', 'océan', 'développement durable'],
  },
  // Nouveaux projets pour tester l'évaluation IA - Programme Innovation Tech 2025
  {
    id: '5',
    title: 'Plateforme de E-learning Intelligente',
    description: 'Développement d\'une plateforme d\'apprentissage en ligne utilisant l\'IA pour personnaliser les parcours éducatifs selon les besoins de chaque apprenant. La solution intègre des algorithmes de machine learning pour analyser les performances et adapter le contenu.',
    status: 'submitted',
    budget: 180000000, // 180 millions FCFA
    timeline: '15 mois',
    submitterId: '4',
    programId: '1', // Programme Innovation Tech 2025
    createdAt: new Date('2025-01-20'),
    updatedAt: new Date('2025-01-20'),
    submissionDate: new Date('2025-01-20'),
    tags: ['éducation', 'IA', 'e-learning', 'technologie'],
  },
  {
    id: '6',
    title: 'Application Mobile de Télémédecine',
    description: 'Création d\'une application mobile permettant aux patients ruraux de consulter des médecins spécialisés à distance. L\'app inclut des fonctionnalités de diagnostic préliminaire par IA et de suivi médical personnalisé.',
    status: 'submitted',
    budget: 120000000, // 120 millions FCFA
    timeline: '12 mois',
    submitterId: '4',
    programId: '1', // Programme Innovation Tech 2025
    createdAt: new Date('2025-01-18'),
    updatedAt: new Date('2025-01-18'),
    submissionDate: new Date('2025-01-18'),
    tags: ['santé', 'télémédecine', 'mobile', 'IA'],
  },
  {
    id: '7',
    title: 'Système de Gestion Intelligente de l\'Énergie',
    description: 'Développement d\'un système IoT pour optimiser la consommation énergétique des bâtiments commerciaux. Utilise des capteurs intelligents et des algorithmes prédictifs pour réduire la consommation d\'énergie de 30%.',
    status: 'submitted',
    budget: 250000000, // 250 millions FCFA
    timeline: '20 mois',
    submitterId: '4',
    programId: '1', // Programme Innovation Tech 2025
    createdAt: new Date('2025-01-22'),
    updatedAt: new Date('2025-01-22'),
    submissionDate: new Date('2025-01-22'),
    tags: ['énergie', 'IoT', 'optimisation', 'bâtiment intelligent'],
  },
  // Nouveaux projets pour tester l'évaluation IA - Fonds Développement Durable
  {
    id: '8',
    title: 'Programme de Reforestation Communautaire',
    description: 'Initiative de plantation d\'arbres impliquant les communautés locales pour restaurer 5000 hectares de forêt dégradée. Le projet inclut la formation des populations locales et la création d\'une pépinière communautaire.',
    status: 'submitted',
    budget: 95000000, // 95 millions FCFA
    timeline: '36 mois',
    submitterId: '4',
    programId: '2', // Fonds Développement Durable
    createdAt: new Date('2025-01-19'),
    updatedAt: new Date('2025-01-19'),
    submissionDate: new Date('2025-01-19'),
    tags: ['environnement', 'reforestation', 'communauté', 'formation'],
  },
  {
    id: '9',
    title: 'Système de Traitement des Eaux Usées Écologique',
    description: 'Installation de systèmes de traitement des eaux usées utilisant des technologies naturelles (phytoépuration) pour 10 villages ruraux. Solution durable et peu coûteuse en maintenance.',
    status: 'submitted',
    budget: 140000000, // 140 millions FCFA
    timeline: '18 mois',
    submitterId: '4',
    programId: '2', // Fonds Développement Durable
    createdAt: new Date('2025-01-21'),
    updatedAt: new Date('2025-01-21'),
    submissionDate: new Date('2025-01-21'),
    tags: ['eau', 'traitement', 'écologique', 'rural'],
  },
  {
    id: '10',
    title: 'Ferme Solaire Communautaire',
    description: 'Construction d\'une ferme solaire de 2MW gérée par la communauté locale. Le projet vise à fournir de l\'électricité propre à 3000 foyers tout en générant des revenus pour la communauté.',
    status: 'submitted',
    budget: 320000000, // 320 millions FCFA
    timeline: '24 mois',
    submitterId: '4',
    programId: '2', // Fonds Développement Durable
    createdAt: new Date('2025-01-23'),
    updatedAt: new Date('2025-01-23'),
    submissionDate: new Date('2025-01-23'),
    tags: ['énergie solaire', 'communauté', 'électricité', 'revenus'],
  },
  // Nouveaux projets pour tester l'évaluation IA - Initiative Jeunes Entrepreneurs
  {
    id: '11',
    title: 'Marketplace de Produits Locaux',
    description: 'Création d\'une plateforme en ligne connectant les producteurs locaux aux consommateurs urbains. L\'objectif est de réduire les intermédiaires et d\'augmenter les revenus des producteurs de 40%.',
    status: 'submitted',
    budget: 45000000, // 45 millions FCFA
    timeline: '10 mois',
    submitterId: '4',
    programId: '3', // Initiative Jeunes Entrepreneurs
    createdAt: new Date('2025-01-17'),
    updatedAt: new Date('2025-01-17'),
    submissionDate: new Date('2025-01-17'),
    tags: ['marketplace', 'agriculture', 'local', 'e-commerce'],
  },
  {
    id: '12',
    title: 'Service de Livraison Écologique à Vélo',
    description: 'Lancement d\'un service de livraison urbaine utilisant uniquement des vélos électriques. Service rapide, écologique et créateur d\'emplois pour les jeunes. Objectif : 50 livreurs en 6 mois.',
    status: 'submitted',
    budget: 35000000, // 35 millions FCFA
    timeline: '8 mois',
    submitterId: '4',
    programId: '3', // Initiative Jeunes Entrepreneurs
    createdAt: new Date('2025-01-16'),
    updatedAt: new Date('2025-01-16'),
    submissionDate: new Date('2025-01-16'),
    tags: ['livraison', 'écologique', 'vélo', 'emploi jeunes'],
  },
  {
    id: '13',
    title: 'Atelier de Fabrication de Meubles Recyclés',
    description: 'Création d\'un atelier de fabrication de meubles à partir de matériaux recyclés. Formation de 20 jeunes artisans et commercialisation via des showrooms et vente en ligne.',
    status: 'submitted',
    budget: 28000000, // 28 millions FCFA
    timeline: '12 mois',
    submitterId: '4',
    programId: '3', // Initiative Jeunes Entrepreneurs
    createdAt: new Date('2025-01-24'),
    updatedAt: new Date('2025-01-24'),
    submissionDate: new Date('2025-01-24'),
    tags: ['meubles', 'recyclage', 'artisanat', 'formation'],
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