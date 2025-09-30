import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { useProgramStore } from '../../stores/programStore';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardFooter
} from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';

const projectSchema = Yup.object().shape({
  title: Yup.string()
    .required('Titre requis')
    .min(5, 'Le titre doit contenir au moins 5 caractères')
    .max(100, 'Le titre ne peut pas dépasser 100 caractères'),
  description: Yup.string()
    .required('Description requise')
    .min(20, 'La description doit contenir au moins 20 caractères'),
  budget: Yup.number()
    .required('Budget requis')
    .positive('Le budget doit être positif'),
  timeline: Yup.string()
    .required('Durée requise'),
  programId: Yup.string()
    .required('Programme requis'),
  tags: Yup.array()
    .of(Yup.string().required('Tag requis'))
    .min(1, 'Au moins un tag est requis'),
});

interface ProjectFormValues {
  title: string;
  description: string;
  budget: number;
  timeline: string;
  programId: string;
  tags: string[];
}

const CreateProjectPage: React.FC = () => {
  const { user } = useAuthStore();
  const { addProject } = useProjectStore();
  const { programs, partners, fetchPrograms, fetchPartners } = useProgramStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  React.useEffect(() => {
    console.log('➕ CreateProjectPage: Fetching programs and partners...');
    fetchPrograms();
    fetchPartners();
  }, [fetchPrograms, fetchPartners]);
  
  // Get accessible programs based on user role
  const getAccessiblePrograms = () => {
    if (!user) return [];
    
    if (user.role === 'admin') {
      return programs;
    } else if (user.role === 'manager') {
      // Manager can see programs from their assigned partners
      const managerPartners = partners.filter(p => p.assignedManagerId === user.id);
      const partnerIds = managerPartners.map(p => p.id);
      return programs.filter(p => partnerIds.includes(p.partnerId));
    } else if (user.role === 'partner') {
      // Partner can see their own programs
      const userPartner = partners.find(p => p.contactEmail === user.email);
      return userPartner ? programs.filter(p => p.partnerId === userPartner.id) : [];
    }
    
    return programs; // For submitters, show all programs
  };
  
  const accessiblePrograms = getAccessiblePrograms();
  
  const initialValues: ProjectFormValues = {
    title: '',
    description: '',
    budget: 0,
    timeline: '',
    programId: '',
    tags: [''],
  };
  
  const handleSubmit = async (values: ProjectFormValues, { resetForm }: { resetForm: () => void }) => {
    if (!user) {
      setError('Vous devez être connecté pour créer un projet');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const newProject = await addProject({
        title: values.title,
        description: values.description,
        status: 'draft',
        budget: values.budget,
        timeline: values.timeline,
        submitterId: user.id,
        programId: values.programId,
        tags: values.tags.filter(tag => tag.trim() !== ''),
      });
      
      resetForm();
      navigate(`/dashboard/projects/${newProject.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      setError('Une erreur est survenue lors de la création du projet');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Créer un nouveau projet</h1>
        <p className="mt-1 text-gray-600">
          Remplissez le formulaire ci-dessous pour créer un nouveau projet. Vous pourrez le modifier avant de le soumettre.
        </p>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-error-100 text-error-700 rounded-md">
          {error}
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Informations du projet</CardTitle>
        </CardHeader>
        
        <Formik
          initialValues={initialValues}
          validationSchema={projectSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, isValid }) => (
            <Form>
              <CardContent className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Titre du projet*
                  </label>
                  <div className="mt-1">
                    <Field
                      id="title"
                      name="title"
                      type="text"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Entrez le titre de votre projet"
                    />
                    <ErrorMessage name="title" component="div" className="mt-1 text-sm text-error-600" />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description du projet*
                  </label>
                  <div className="mt-1">
                    <Field
                      as="textarea"
                      id="description"
                      name="description"
                      rows={5}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Détaillez votre projet, ses objectifs, et son impact potentiel"
                    />
                    <ErrorMessage name="description" component="div" className="mt-1 text-sm text-error-600" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                      Budget estimé (€)*
                    </label>
                    <div className="mt-1">
                      <Field
                        id="budget"
                        name="budget"
                        type="number"
                        min="0"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                      <ErrorMessage name="budget" component="div" className="mt-1 text-sm text-error-600" />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="timeline" className="block text-sm font-medium text-gray-700">
                      Durée du projet*
                    </label>
                    <div className="mt-1">
                      <Field
                        id="timeline"
                        name="timeline"
                        type="text"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="ex: 12 mois, 2 ans..."
                      />
                      <ErrorMessage name="timeline" component="div" className="mt-1 text-sm text-error-600" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="programId" className="block text-sm font-medium text-gray-700">
                    Programme*
                  </label>
                  <div className="mt-1">
                    <Field
                      as="select"
                      id="programId"
                      name="programId"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="">Sélectionnez un programme</option>
                      {accessiblePrograms.map(program => {
                        const partner = partners.find(p => p.id === program.partnerId);
                        return (
                          <option key={program.id} value={program.id}>
                            {program.name} {partner && `(${partner.name})`}
                          </option>
                        );
                      })}
                    </Field>
                    <ErrorMessage name="programId" component="div" className="mt-1 text-sm text-error-600" />
                  </div>
                  {accessiblePrograms.length === 0 && (
                    <p className="mt-1 text-sm text-gray-500">
                      Aucun programme disponible. Contactez l'administrateur.
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags*
                  </label>
                  <FieldArray name="tags">
                    {({ push, remove }) => (
                      <div className="space-y-2">
                        {values.tags.map((tag, index) => (
                          <div key={index} className="flex items-center">
                            <Field
                              name={`tags.${index}`}
                              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              placeholder="Ajoutez un mot-clé"
                            />
                            {index > 0 && (
                              <button
                                type="button"
                                className="ml-2 p-2 text-gray-400 hover:text-error-500"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          leftIcon={<Plus className="h-4 w-4" />}
                          onClick={() => push('')}
                        >
                          Ajouter un tag
                        </Button>
                        {errors.tags && touched.tags && (
                          <div className="mt-1 text-sm text-error-600">
                            {typeof errors.tags === 'string' ? errors.tags : ''}
                          </div>
                        )}
                      </div>
                    )}
                  </FieldArray>
                </div>
              </CardContent>
              
              <CardFooter className="bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard/projects')}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  disabled={!isValid}
                >
                  Créer le projet
                </Button>
              </CardFooter>
            </Form>
          )}
        </Formik>
      </Card>
    </div>
  );
};

export default CreateProjectPage;