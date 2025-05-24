import { create } from 'zustand';

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'radio' | 'checkbox' | 'date';

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  name: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

interface FormTemplateState {
  templates: FormTemplate[];
  isLoading: boolean;
  error: string | null;
  fetchTemplates: () => Promise<void>;
  getTemplate: (id: string) => FormTemplate | undefined;
  addTemplate: (template: Omit<FormTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<FormTemplate>;
  updateTemplate: (id: string, updates: Partial<FormTemplate>) => Promise<FormTemplate | null>;
  deleteTemplate: (id: string) => Promise<boolean>;
  duplicateTemplate: (id: string) => Promise<FormTemplate | null>;
}

// Mock templates
const mockTemplates: FormTemplate[] = [
  {
    id: '1',
    name: 'Appel à projets innovation',
    description: 'Formulaire standard pour les projets d\'innovation technologique',
    fields: [
      {
        id: 'f1',
        type: 'text',
        label: 'Titre du projet',
        name: 'projectTitle',
        required: true,
        placeholder: 'Entrez le titre de votre projet'
      },
      {
        id: 'f2',
        type: 'textarea',
        label: 'Description du projet',
        name: 'projectDescription',
        required: true,
        placeholder: 'Décrivez votre projet en détail'
      },
      {
        id: 'f3',
        type: 'number',
        label: 'Budget demandé',
        name: 'requestedBudget',
        required: true,
        placeholder: 'Montant en euros'
      },
      {
        id: 'f4',
        type: 'select',
        label: 'Secteur d\'activité',
        name: 'sector',
        required: true,
        options: ['Technologies', 'Santé', 'Environnement', 'Education', 'Autre']
      }
    ],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    isActive: true
  }
];

export const useFormTemplateStore = create<FormTemplateState>((set, get) => ({
  templates: [...mockTemplates],
  isLoading: false,
  error: null,

  fetchTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      set({ templates: [...mockTemplates], isLoading: false });
    } catch (error) {
      console.error('Error fetching templates:', error);
      set({ error: 'Failed to fetch templates', isLoading: false });
    }
  },

  getTemplate: (id) => {
    return get().templates.find(template => template.id === id);
  },

  addTemplate: async (templateData) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newTemplate: FormTemplate = {
        ...templateData,
        id: `${get().templates.length + 1}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      set(state => ({
        templates: [...state.templates, newTemplate],
        isLoading: false
      }));

      return newTemplate;
    } catch (error) {
      console.error('Error adding template:', error);
      set({ error: 'Failed to add template', isLoading: false });
      throw error;
    }
  },

  updateTemplate: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const templateIndex = get().templates.findIndex(t => t.id === id);
      if (templateIndex === -1) {
        set({ error: 'Template not found', isLoading: false });
        return null;
      }

      const updatedTemplate = {
        ...get().templates[templateIndex],
        ...updates,
        updatedAt: new Date()
      };

      const updatedTemplates = [...get().templates];
      updatedTemplates[templateIndex] = updatedTemplate;

      set({ templates: updatedTemplates, isLoading: false });
      return updatedTemplate;
    } catch (error) {
      console.error('Error updating template:', error);
      set({ error: 'Failed to update template', isLoading: false });
      throw error;
    }
  },

  deleteTemplate: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      set(state => ({
        templates: state.templates.filter(t => t.id !== id),
        isLoading: false
      }));

      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      set({ error: 'Failed to delete template', isLoading: false });
      return false;
    }
  },

  duplicateTemplate: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const template = get().templates.find(t => t.id === id);
      if (!template) {
        set({ error: 'Template not found', isLoading: false });
        return null;
      }

      const newTemplate: FormTemplate = {
        ...template,
        id: `${get().templates.length + 1}`,
        name: `${template.name} (copie)`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      set(state => ({
        templates: [...state.templates, newTemplate],
        isLoading: false
      }));

      return newTemplate;
    } catch (error) {
      console.error('Error duplicating template:', error);
      set({ error: 'Failed to duplicate template', isLoading: false });
      throw error;
    }
  }
}));