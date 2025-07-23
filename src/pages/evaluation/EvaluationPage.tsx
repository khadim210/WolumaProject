import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import { useProjectStore, Project, ProjectStatus } from '../../stores/projectStore';
import { useProgramStore } from '../../stores/programStore';
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
import { Search, Filter, CheckCircle, XCircle, ArrowLeft, Save, Award, Target } from 'lucide-react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const EvaluationPage: React.FC = () => {
  const { user } = useAuthStore();
  const { checkPermission } = usePermissions();
  const { projects, updateProject } = useProjectStore();
  const { programs, partners, fetchPrograms, fetchPartners } = useProgramStore();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  useEffect(() => {
    fetchPrograms();
    fetchPartners();
  }, [fetchPrograms, fetchPartners]);
  
  // Ensure user is a manager
  useEffect(() => {
    if (!checkPermission('evaluation.evaluate')) {
      navigate('/dashboard');
    }
  }, [checkPermission, navigate]);
  
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
    }
    
    return programs;
  };
  
  const accessiblePrograms = getAccessiblePrograms();
  
  // Get projects in submitted status
  const submittedProjects = projects.filter(project => {
    const isAccessible = accessiblePrograms.some(p => p.id === project.programId);
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProgram = programFilter === 'all' || project.programId === programFilter;
    
    return project.status === 'submitted' && 
           isAccessible && 
           matchesSearch && 
           matchesProgram;
  });
  
  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setIsEvaluating(true);
  };
  
  const handleCancelEvaluation = () => {
    setIsEvaluating(false);
    setSelectedProject(null);
  };
  
  const createEvaluationSchema = (program: any) => {
    const schemaFields: any = {
      evaluationNotes: Yup.string()
        .required('Notes requises')
        .min(20, 'Minimum 20 caractères'),
      decision: Yup.string()
        .required('Décision requise')
        .oneOf(['pre_selected', 'selected', 'rejected'], 'Décision invalide'),
    };
    
    // Add validation for each evaluation criterion
    program.evaluationCriteria.forEach((criterion: any) => {
      schemaFields[`score_${criterion.id}`] = Yup.number()
        .required('Score requis')
        .min(0, 'Minimum 0')
        .max(criterion.maxScore, `Maximum ${criterion.maxScore}`);
    });
    
    return Yup.object().shape(schemaFields);
  };
  
  const handleSubmitEvaluation = async (values: any, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    if (!selectedProject || !user) return;
    
    const program = programs.find(p => p.id === selectedProject.programId);
    if (!program) return;
    
    try {
      // Calculate scores and total
      const evaluationScores: Record<string, number> = {};
      let totalScore = 0;
      
      program.evaluationCriteria.forEach(criterion => {
        const score = values[`score_${criterion.id}`];
        evaluationScores[criterion.id] = score;
        // Calculate weighted score
        totalScore += (score / criterion.maxScore) * criterion.weight;
      });
      
      const updatedProject = await updateProject(selectedProject.id, {
        status: values.decision as ProjectStatus,
        evaluationScores,
        totalEvaluationScore: Math.round(totalScore),
        evaluationNotes: values.evaluationNotes,
        evaluatedBy: user.id,
        evaluationDate: new Date(),
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
  
  const renderScoreIndicator = (score: number, maxScore: number) => {
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
                
                <div className="relative w-64">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Filter className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    className="block w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm appearance-none"
                    value={programFilter}
                    onChange={(e) => setProgramFilter(e.target.value)}
                  >
                    <option value="all">Tous les programmes</option>
                    {accessiblePrograms.map(program => {
                      const partner = partners.find(p => p.id === program.partnerId);
                      return (
                        <option key={program.id} value={program.id}>
                          {program.name} {partner && `(${partner.name})`}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Projets à évaluer</h2>
            
            {submittedProjects.length > 0 ? (
              <div className="space-y-4">
                {submittedProjects.map(project => {
                  const program = programs.find(p => p.id === project.programId);
                  const partner = program ? partners.find(p => p.id === program.partnerId) : null;
                  
                  return (
                    <div 
                      key={project.id} 
                      className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleSelectProject(project)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-md font-medium text-gray-900">{project.title}</h3>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>
                          
                          {program && (
                            <div className="mt-2 flex items-center text-sm text-primary-600">
                              <Target className="h-4 w-4 mr-1" />
                              <span className="font-medium">Programme:</span>
                              <span className="ml-1">{program.name}</span>
                              {partner && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span className="text-gray-600">{partner.name}</span>
                                </>
                              )}
                            </div>
                          )}
                          
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <span>Budget: {project.budget.toLocaleString()} FCFA • </span>
                            <span>Durée: {project.timeline}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <ProjectStatusBadge status={project.status} />
                          {program && (
                            <div className="mt-2 text-xs text-gray-500 flex items-center">
                              <Award className="h-3 w-3 mr-1" />
                              {program.evaluationCriteria.length} critères
                            </div>
                          )}
                        </div>
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
                  );
                })}
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
              
              {(() => {
                const program = programs.find(p => p.id === selectedProject.programId);
                const partner = program ? partners.find(p => p.id === program.partnerId) : null;
                
                if (!program) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      Programme non trouvé pour ce projet
                    </div>
                  );
                }
                
                const initialValues: any = {
                  evaluationNotes: '',
                  decision: 'pre_selected',
                };
                
                // Initialize scores for each criterion
                program.evaluationCriteria.forEach(criterion => {
                  initialValues[`score_${criterion.id}`] = 0;
                });
                
                return (
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
                            <h4 className="text-sm font-medium text-gray-700">Programme</h4>
                            <div className="text-sm text-gray-600 mt-1">
                              <div className="flex items-center">
                                <Target className="h-4 w-4 mr-1 text-primary-600" />
                                {program.name}
                              </div>
                              {partner && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Partenaire: {partner.name}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-700">Budget</h4>
                            <p className="text-sm text-gray-600 mt-1">{selectedProject.budget.toLocaleString()} FCFA</p>
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
                          <CardTitle className="flex items-center">
                            <Award className="h-5 w-5 mr-2" />
                            Évaluation du projet
                          </CardTitle>
                          <CardDescription>
                            Évaluez le projet selon les critères définis pour le programme "{program.name}"
                          </CardDescription>
                        </CardHeader>
                        <Formik
                          initialValues={initialValues}
                          validationSchema={createEvaluationSchema(program)}
                          onSubmit={handleSubmitEvaluation}
                        >
                          {({ values, isSubmitting, isValid }) => (
                            <Form>
                              <CardContent className="space-y-6">
                                <div>
                                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                    <Award className="h-5 w-5 mr-2 text-primary-600" />
                                    Critères d'évaluation
                                  </h3>
                                  
                                  <div className="space-y-6">
                                    {program.evaluationCriteria.map((criterion, index) => {
                                      const fieldName = `score_${criterion.id}`;
                                      const currentScore = values[fieldName] || 0;
                                      
                                      return (
                                        <div key={criterion.id} className="border border-gray-200 rounded-lg p-4">
                                          <div className="mb-3">
                                            <div className="flex items-center justify-between mb-2">
                                              <h4 className="text-sm font-medium text-gray-900">
                                                {criterion.name}
                                              </h4>
                                              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary-100 text-primary-800">
                                                Poids: {criterion.weight}%
                                              </span>
                                            </div>
                                            <p className="text-sm text-gray-600">{criterion.description}</p>
                                          </div>
                                          
                                          <div className="flex items-center space-x-4">
                                            <div className="flex items-center">
                                              <Field
                                                type="number"
                                                name={fieldName}
                                                min="0"
                                                max={criterion.maxScore}
                                                className="block w-20 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                              />
                                              <span className="mx-2 text-gray-500">/{criterion.maxScore}</span>
                                            </div>
                                            <div className="flex-grow">
                                              {renderScoreIndicator(currentScore, criterion.maxScore)}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                              {Math.round((currentScore / criterion.maxScore) * criterion.weight)}% du total
                                            </div>
                                          </div>
                                          <ErrorMessage name={fieldName} component="div" className="mt-1 text-sm text-error-600" />
                                        </div>
                                      );
                                    })}
                                  </div>
                                  
                                  <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg border border-primary-200">
                                    <div className="flex items-center justify-between">
                                      <span className="text-lg font-medium text-gray-900">Score Total Pondéré</span>
                                      <span className="text-2xl font-bold text-primary-600">
                                        {Math.round(program.evaluationCriteria.reduce((total, criterion) => {
                                          const score = values[`score_${criterion.id}`] || 0;
                                          return total + (score / criterion.maxScore) * criterion.weight;
                                        }, 0))}%
                                      </span>
                                    </div>
                                    <div className="mt-2">
                                      <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div 
                                          className="h-3 rounded-full bg-gradient-to-r from-primary-600 to-secondary-500 transition-all duration-300"
                                          style={{ 
                                            width: `${Math.min(100, program.evaluationCriteria.reduce((total, criterion) => {
                                              const score = values[`score_${criterion.id}`] || 0;
                                              return total + (score / criterion.maxScore) * criterion.weight;
                                            }, 0))}%` 
                                          }}
                                        ></div>
                                      </div>
                                    </div>
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
                                  <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Décision
                                  </label>
                                  <div className="space-y-3">
                                    <label className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                                      <Field
                                        type="radio"
                                        name="decision"
                                        value="pre_selected"
                                        className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                      />
                                      <div className="ml-3">
                                        <span className="block text-sm font-medium text-gray-900">
                                          Présélectionné
                                        </span>
                                        <span className="block text-sm text-gray-500">
                                          Le projet mérite une évaluation plus approfondie
                                        </span>
                                      </div>
                                    </label>
                                    <label className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                                      <Field
                                        type="radio"
                                        name="decision"
                                        value="selected"
                                        className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                      />
                                      <div className="ml-3">
                                        <span className="block text-sm font-medium text-gray-900">
                                          Sélectionné
                                        </span>
                                        <span className="block text-sm text-gray-500">
                                          Le projet est retenu pour financement
                                        </span>
                                      </div>
                                    </label>
                                    <label className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                                      <Field
                                        type="radio"
                                        name="decision"
                                        value="rejected"
                                        className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                      />
                                      <div className="ml-3">
                                        <span className="block text-sm font-medium text-gray-900">
                                          Rejeté
                                        </span>
                                        <span className="block text-sm text-gray-500">
                                          Le projet ne répond pas aux critères
                                        </span>
                                      </div>
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
                );
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EvaluationPage;