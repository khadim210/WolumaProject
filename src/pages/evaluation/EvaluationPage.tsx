import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import { useProjectStore, Project, ProjectStatus } from '../../stores/projectStore';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardFooter,
  CardDescription
} from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProjectStatusBadge from '../../components/projects/ProjectStatusBadge';
import { Search, Filter, CheckCircle, XCircle, ArrowLeft, Save } from 'lucide-react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const evaluationSchema = Yup.object().shape({
  innovationScore: Yup.number()
    .required('Score requis')
    .min(0, 'Minimum 0')
    .max(20, 'Maximum 20'),
  feasibilityScore: Yup.number()
    .required('Score requis')
    .min(0, 'Minimum 0')
    .max(20, 'Maximum 20'),
  impactScore: Yup.number()
    .required('Score requis')
    .min(0, 'Minimum 0')
    .max(20, 'Maximum 20'),
  budgetScore: Yup.number()
    .required('Score requis')
    .min(0, 'Minimum 0')
    .max(20, 'Maximum 20'),
  teamScore: Yup.number()
    .required('Score requis')
    .min(0, 'Minimum 0')
    .max(20, 'Maximum 20'),
  evaluationNotes: Yup.string()
    .required('Notes requises')
    .min(20, 'Minimum 20 caractères'),
  decision: Yup.string()
    .required('Décision requise')
    .oneOf(['pre_selected', 'selected', 'rejected'], 'Décision invalide'),
});

interface EvaluationFormValues {
  innovationScore: number;
  feasibilityScore: number;
  impactScore: number;
  budgetScore: number;
  teamScore: number;
  evaluationNotes: string;
  decision: string;
}

const EvaluationPage: React.FC = () => {
  const { user } = useAuthStore();
  const { checkPermission } = usePermissions();
  const { projects, updateProject } = useProjectStore();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  // Ensure user is a manager
  useEffect(() => {
    if (!checkPermission('evaluation.evaluate')) {
      navigate('/dashboard');
    }
  }, [checkPermission, navigate]);
  
  // Get projects in submitted status
  const submittedProjects = projects.filter(project => 
    project.status === 'submitted' && 
    (project.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
     project.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setIsEvaluating(true);
  };
  
  const handleCancelEvaluation = () => {
    setIsEvaluating(false);
    setSelectedProject(null);
  };
  
  const handleSubmitEvaluation = async (values: EvaluationFormValues, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    if (!selectedProject || !user) return;
    
    try {
      const totalScore = 
        values.innovationScore + 
        values.feasibilityScore + 
        values.impactScore + 
        values.budgetScore + 
        values.teamScore;
        
      const updatedProject = await updateProject(selectedProject.id, {
        status: values.decision as ProjectStatus,
        evaluationScore: totalScore,
        evaluationNotes: values.evaluationNotes,
        evaluatedBy: user.id,
      });
      
      if (updatedProject) {
        setIsEvaluating(false);
        setSelectedProject(null);
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  const initialValues: EvaluationFormValues = {
    innovationScore: 0,
    feasibilityScore: 0,
    impactScore: 0,
    budgetScore: 0,
    teamScore: 0,
    evaluationNotes: '',
    decision: 'pre_selected',
  };
  
  const renderScoreIndicator = (score: number, maxScore: number = 20) => {
    const percentage = (score / maxScore) * 100;
    let bgColor = 'bg-error-500';
    
    if (percentage >= 75) {
      bgColor = 'bg-success-500';
    } else if (percentage >= 50) {
      bgColor = 'bg-warning-500';
    } else if (percentage >= 25) {
      bgColor = 'bg-error-300';
    }
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
        <div 
          className={`h-2.5 rounded-full ${bgColor} transition-all duration-300`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };
  
  if (!user || user.role !== 'manager') {
    return null;
  }
  
  if (!checkPermission('evaluation.evaluate')) {
    return null;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Évaluation des Projets</h1>
      </div>
      
      {!isEvaluating ? (
        <>
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Rechercher un projet..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Projets à évaluer</h2>
            
            {submittedProjects.length > 0 ? (
              <div className="space-y-4">
                {submittedProjects.map(project => (
                  <div 
                    key={project.id} 
                    className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleSelectProject(project)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-md font-medium text-gray-900">{project.title}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <span>Budget: {project.budget.toLocaleString()} € • </span>
                          <span>Durée: {project.timeline}</span>
                        </div>
                      </div>
                      <ProjectStatusBadge status={project.status} />
                    </div>
                    
                    <div className="mt-3 flex flex-wrap gap-2">
                      {project.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-500">
                      Soumis le {project.submissionDate?.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Aucun projet à évaluer pour le moment
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {selectedProject && (
            <div>
              <button
                className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
                onClick={handleCancelEvaluation}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Retour à la liste
              </button>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>Détails du projet</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{selectedProject.title}</h3>
                        <ProjectStatusBadge status={selectedProject.status} className="mt-2" />
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Description</h4>
                        <p className="text-sm text-gray-600 mt-1">{selectedProject.description}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Budget</h4>
                        <p className="text-sm text-gray-600 mt-1">{selectedProject.budget.toLocaleString()} €</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Durée</h4>
                        <p className="text-sm text-gray-600 mt-1">{selectedProject.timeline}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Tags</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedProject.tags.map(tag => (
                            <span key={tag} className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Date de soumission</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedProject.submissionDate?.toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Évaluation du projet</CardTitle>
                      <CardDescription>
                        Veuillez évaluer le projet sur les critères suivants (score sur 20 pour chaque critère)
                      </CardDescription>
                    </CardHeader>
                    <Formik
                      initialValues={initialValues}
                      validationSchema={evaluationSchema}
                      onSubmit={handleSubmitEvaluation}
                    >
                      {({ values, isSubmitting, isValid }) => (
                        <Form>
                          <CardContent className="space-y-6">
                            <div>
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Innovation et originalité (20 points)
                                </label>
                                <div className="flex items-center">
                                  <Field
                                    type="number"
                                    name="innovationScore"
                                    min="0"
                                    max="20"
                                    className="block w-20 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                  />
                                  <span className="mx-2 text-gray-500">/20</span>
                                  <div className="flex-grow">
                                    {renderScoreIndicator(values.innovationScore)}
                                  </div>
                                </div>
                                <ErrorMessage name="innovationScore" component="div" className="mt-1 text-sm text-error-600" />
                              </div>
                              
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Faisabilité technique (20 points)
                                </label>
                                <div className="flex items-center">
                                  <Field
                                    type="number"
                                    name="feasibilityScore"
                                    min="0"
                                    max="20"
                                    className="block w-20 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                  />
                                  <span className="mx-2 text-gray-500">/20</span>
                                  <div className="flex-grow">
                                    {renderScoreIndicator(values.feasibilityScore)}
                                  </div>
                                </div>
                                <ErrorMessage name="feasibilityScore" component="div" className="mt-1 text-sm text-error-600" />
                              </div>
                              
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Impact et pertinence (20 points)
                                </label>
                                <div className="flex items-center">
                                  <Field
                                    type="number"
                                    name="impactScore"
                                    min="0"
                                    max="20"
                                    className="block w-20 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                  />
                                  <span className="mx-2 text-gray-500">/20</span>
                                  <div className="flex-grow">
                                    {renderScoreIndicator(values.impactScore)}
                                  </div>
                                </div>
                                <ErrorMessage name="impactScore" component="div" className="mt-1 text-sm text-error-600" />
                              </div>
                              
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Réalisme budgétaire (20 points)
                                </label>
                                <div className="flex items-center">
                                  <Field
                                    type="number"
                                    name="budgetScore"
                                    min="0"
                                    max="20"
                                    className="block w-20 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                  />
                                  <span className="mx-2 text-gray-500">/20</span>
                                  <div className="flex-grow">
                                    {renderScoreIndicator(values.budgetScore)}
                                  </div>
                                </div>
                                <ErrorMessage name="budgetScore" component="div" className="mt-1 text-sm text-error-600" />
                              </div>
                              
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Compétence de l'équipe (20 points)
                                </label>
                                <div className="flex items-center">
                                  <Field
                                    type="number"
                                    name="teamScore"
                                    min="0"
                                    max="20"
                                    className="block w-20 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                  />
                                  <span className="mx-2 text-gray-500">/20</span>
                                  <div className="flex-grow">
                                    {renderScoreIndicator(values.teamScore)}
                                  </div>
                                </div>
                                <ErrorMessage name="teamScore" component="div" className="mt-1 text-sm text-error-600" />
                              </div>
                              
                              <div className="mt-6 p-4 bg-gray-50 rounded-md">
                                <div className="flex items-center justify-between">
                                  <span className="text-lg font-medium text-gray-900">Score Total</span>
                                  <span className="text-lg font-bold text-primary-600">
                                    {values.innovationScore + values.feasibilityScore + values.impactScore + values.budgetScore + values.teamScore}/100
                                  </span>
                                </div>
                                {renderScoreIndicator(
                                  values.innovationScore + values.feasibilityScore + values.impactScore + values.budgetScore + values.teamScore,
                                  100
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes d'évaluation
                              </label>
                              <Field
                                as="textarea"
                                name="evaluationNotes"
                                rows={5}
                                className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                placeholder="Détaillez votre évaluation et vos recommandations..."
                              />
                              <ErrorMessage name="evaluationNotes" component="div" className="mt-1 text-sm text-error-600" />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Décision
                              </label>
                              <div className="space-y-2">
                                <label className="flex items-center">
                                  <Field
                                    type="radio"
                                    name="decision"
                                    value="pre_selected"
                                    className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                  />
                                  <span className="ml-2 block text-sm text-gray-700">
                                    Présélectionné
                                  </span>
                                </label>
                                <label className="flex items-center">
                                  <Field
                                    type="radio"
                                    name="decision"
                                    value="selected"
                                    className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                  />
                                  <span className="ml-2 block text-sm text-gray-700">
                                    Sélectionné
                                  </span>
                                </label>
                                <label className="flex items-center">
                                  <Field
                                    type="radio"
                                    name="decision"
                                    value="rejected"
                                    className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                  />
                                  <span className="ml-2 block text-sm text-gray-700">
                                    Rejeté
                                  </span>
                                </label>
                              </div>
                              <ErrorMessage name="decision" component="div" className="mt-1 text-sm text-error-600" />
                            </div>
                          </CardContent>
                          
                          <CardFooter className="bg-gray-50 border-t border-gray-200 flex justify-between">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleCancelEvaluation}
                              leftIcon={<ArrowLeft className="h-4 w-4" />}
                            >
                              Annuler
                            </Button>
                            <Button
                              type="submit"
                              variant="primary"
                              isLoading={isSubmitting}
                              disabled={!isValid}
                              leftIcon={<Save className="h-4 w-4" />}
                            >
                              Soumettre l'évaluation
                            </Button>
                          </CardFooter>
                        </Form>
                      )}
                    </Formik>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EvaluationPage;