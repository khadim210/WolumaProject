import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { useProgramStore } from '../../stores/programStore';
import { useFormTemplateStore } from '../../stores/formTemplateStore';
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
import { getCurrencySymbol } from '../../utils/currency';

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
  formData: Record<string, any>;
}

const CreateProjectPage: React.FC = () => {
  const { user } = useAuthStore();
  const { addProject, projects } = useProjectStore();
  const { programs, partners, fetchPrograms, fetchPartners } = useProgramStore();
  const { templates, fetchTemplates } = useFormTemplateStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  React.useEffect(() => {
    console.log('➕ CreateProjectPage: Fetching programs and partners...');
    fetchPrograms();
    fetchPartners();
    fetchTemplates();
  }, [fetchPrograms, fetchPartners, fetchTemplates]);
  
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
    } else if (user.role === 'submitter') {
      // Submitters can only see programs where they haven't submitted yet
      const submittedProgramIds = projects
        .filter(p => p.submitterId === user.id)
        .map(p => p.programId);
      return programs.filter(p => !submittedProgramIds.includes(p.id));
    }

    return programs;
  };

  const accessiblePrograms = getAccessiblePrograms();
  const hasSubmittedPrograms = user?.role === 'submitter' && projects.filter(p => p.submitterId === user.id).length > 0;
  
  const initialValues: ProjectFormValues = {
    title: '',
    description: '',
    budget: 0,
    timeline: '',
    programId: '',
    tags: [''],
    formData: {},
  };
  
  const handleSubmit = async (values: ProjectFormValues, { resetForm }: { resetForm: () => void }) => {
    if (!user) {
      setError('Vous devez être connecté pour créer un projet');
      return;
    }

    // Vérification: Un soumissionnaire ne peut créer qu'une seule soumission par programme
    if (user.role === 'submitter') {
      const existingSubmission = projects.find(
        p => p.programId === values.programId && p.submitterId === user.id
      );

      if (existingSubmission) {
        setError('Vous avez déjà créé une soumission pour ce programme. Un seul projet par programme est autorisé.');
        return;
      }
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
        formData: values.formData,
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
        <h1 className="text-2xl font-bold text-gray-900">
          {user?.role === 'submitter' ? 'Créer une nouvelle soumission' : 'Créer un nouveau projet'}
        </h1>
        <p className="mt-1 text-gray-600">
          {user?.role === 'submitter'
            ? 'Remplissez le formulaire ci-dessous pour soumettre votre projet. Vous ne pouvez soumettre qu\'un seul projet par programme.'
            : 'Remplissez le formulaire ci-dessous pour créer un nouveau projet. Vous pourrez le modifier avant de le soumettre.'}
        </p>
        {hasSubmittedPrograms && user?.role === 'submitter' && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              💡 Les programmes pour lesquels vous avez déjà soumis un projet ne sont pas affichés dans la liste.
            </p>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-error-100 text-error-700 rounded-md">
          {error}
        </div>
      )}

      {user?.role === 'submitter' && accessiblePrograms.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-gray-500">
              <p className="text-lg font-medium mb-2">Aucun programme disponible</p>
              <p className="text-sm">
                Vous avez déjà soumis un projet pour tous les programmes disponibles.
                Un seul projet par programme est autorisé.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {(user?.role !== 'submitter' || accessiblePrograms.length > 0) && (
      <Card>
        <CardHeader>
          <CardTitle>{user?.role === 'submitter' ? 'Informations de la soumission' : 'Informations du projet'}</CardTitle>
        </CardHeader>
        
        <Formik
          initialValues={initialValues}
          validationSchema={projectSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, isValid }) => {
            const selectedProgram = accessiblePrograms.find(p => p.id === values.programId);
            const currencySymbol = selectedProgram ? getCurrencySymbol(selectedProgram.currency) : 'FCFA';

            return (
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
                      Budget estimé ({currencySymbol})*
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

                {/* Formulaire du programme */}
                {selectedProgram && selectedProgram.formTemplateId && (() => {
                  const programTemplate = templates.find(t => t.id === selectedProgram.formTemplateId);

                  if (!programTemplate || !programTemplate.fields || programTemplate.fields.length === 0) {
                    return null;
                  }

                  return (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Formulaire du programme: {programTemplate.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-6">
                        {programTemplate.description || 'Veuillez remplir les champs suivants pour compléter votre soumission.'}
                      </p>

                      <div className="space-y-6">
                        {programTemplate.fields.map((field: any) => (
                          <div key={field.id}>
                            <label htmlFor={`formData.${field.name}`} className="block text-sm font-medium text-gray-700">
                              {field.label}
                              {field.required && <span className="text-error-600 ml-1">*</span>}
                            </label>
                            {field.description && (
                              <p className="mt-1 text-xs text-gray-500">{field.description}</p>
                            )}
                            <div className="mt-1">
                              {field.type === 'text' && (
                                <Field
                                  id={`formData.${field.name}`}
                                  name={`formData.${field.name}`}
                                  type="text"
                                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                  placeholder={field.placeholder}
                                />
                              )}
                              {field.type === 'textarea' && (
                                <Field
                                  as="textarea"
                                  id={`formData.${field.name}`}
                                  name={`formData.${field.name}`}
                                  rows={4}
                                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                  placeholder={field.placeholder}
                                />
                              )}
                              {field.type === 'number' && (
                                <Field
                                  id={`formData.${field.name}`}
                                  name={`formData.${field.name}`}
                                  type="number"
                                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                  placeholder={field.placeholder}
                                />
                              )}
                              {field.type === 'email' && (
                                <Field
                                  id={`formData.${field.name}`}
                                  name={`formData.${field.name}`}
                                  type="email"
                                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                  placeholder={field.placeholder}
                                />
                              )}
                              {field.type === 'date' && (
                                <Field
                                  id={`formData.${field.name}`}
                                  name={`formData.${field.name}`}
                                  type="date"
                                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                />
                              )}
                              {field.type === 'select' && (
                                <Field
                                  as="select"
                                  id={`formData.${field.name}`}
                                  name={`formData.${field.name}`}
                                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                >
                                  <option value="">Sélectionnez une option</option>
                                  {field.options?.map((option: any, idx: number) => (
                                    <option key={idx} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </Field>
                              )}
                              {field.type === 'checkbox' && (
                                <div className="flex items-center">
                                  <Field
                                    id={`formData.${field.name}`}
                                    name={`formData.${field.name}`}
                                    type="checkbox"
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                  />
                                  <label htmlFor={`formData.${field.name}`} className="ml-2 block text-sm text-gray-700">
                                    {field.description}
                                  </label>
                                </div>
                              )}
                              {field.type === 'radio' && (
                                <div className="space-y-2">
                                  {field.options?.map((option: any, idx: number) => (
                                    <div key={idx} className="flex items-center">
                                      <Field
                                        id={`formData.${field.name}.${idx}`}
                                        name={`formData.${field.name}`}
                                        type="radio"
                                        value={option.value}
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                                      />
                                      <label htmlFor={`formData.${field.name}.${idx}`} className="ml-2 block text-sm text-gray-700">
                                        {option.label}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {field.type === 'multiple_select' && (
                                <Field
                                  as="select"
                                  id={`formData.${field.name}`}
                                  name={`formData.${field.name}`}
                                  multiple
                                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                  size={Math.min(field.options?.length || 3, 5)}
                                >
                                  {field.options?.map((option: any, idx: number) => (
                                    <option key={idx} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </Field>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
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
                  {user?.role === 'submitter' ? 'Créer la soumission' : 'Créer le projet'}
                </Button>
              </CardFooter>
            </Form>
            );
          }}
        </Formik>
      </Card>
      )}
    </div>
  );
};

export default CreateProjectPage;