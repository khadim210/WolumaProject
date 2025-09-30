import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import { useProjectStore, ProjectStatus } from '../../stores/projectStore';
import { useProgramStore } from '../../stores/programStore';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardFooter
} from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProjectStatusBadge from '../../components/projects/ProjectStatusBadge';
import ProcessDiagram from '../../components/workflow/ProcessDiagram';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Edit, 
  ArrowLeft,
  Send,
  CheckCircle,
  AlertTriangle,
  FileText,
  Download
} from 'lucide-react';
import { generateEvaluationReport } from '../../utils/pdfGenerator';

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { checkPermission } = usePermissions();
  const { projects, getProject, updateProject } = useProjectStore();
  const { programs, partners } = useProgramStore();
  
  const [project, setProject] = useState(id ? getProject(id) : undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  useEffect(() => {
    if (id) {
      const projectData = getProject(id);
      setProject(projectData);
      
      if (!projectData) {
        navigate('/dashboard/projects');
      }
    }
  }, [id, getProject, navigate, projects]);
  
  const handleSubmitProject = async () => {
    if (!project || !id) return;
    
    setIsSubmitting(true);
    
    try {
      const updatedProject = await updateProject(id, {
        status: 'submitted',
        submissionDate: new Date(),
      });
      
      if (updatedProject) {
        setProject(updatedProject);
        setShowSubmitConfirm(false);
      }
    } catch (error) {
      console.error('Error submitting project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleGeneratePdfReport = async () => {
    if (!project) return;
    
    setIsGeneratingPdf(true);
    try {
      const program = programs.find(p => p.id === project.programId);
      const partner = program ? partners.find(p => p.id === program.partnerId) : null;
      
      if (program) {
        await generateEvaluationReport(project, program, partner);
      }
    } catch (error) {
      console.error('Error generating PDF report:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  
  if (!project) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Chargement du projet...</div>
      </div>
    );
  }
  
  const canSubmit = project.status === 'draft' && user?.id === project.submitterId;
  const canEdit = project.status === 'draft' && user?.id === project.submitterId && checkPermission('projects.edit');
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
          onClick={() => navigate('/dashboard/projects')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Retour aux projets
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 sm:mb-0">
            {project.title}
          </h1>
          
          <div className="flex space-x-3">
            {canEdit && checkPermission('projects.edit') && (
              <Button
                variant="outline"
                leftIcon={<Edit className="h-4 w-4" />}
                onClick={() => navigate(`/dashboard/projects/${project.id}/edit`)}
              >
                Modifier
              </Button>
            )}
            
            {canSubmit && checkPermission('projects.submit') && (
              <Button
                variant="primary"
                leftIcon={<Send className="h-4 w-4" />}
                onClick={() => setShowSubmitConfirm(true)}
              >
                Soumettre
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {showSubmitConfirm && (
        <Card className="mb-6 border-2 border-warning-300">
          <CardContent className="p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-warning-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Confirmer la soumission</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Une fois soumis, vous ne pourrez plus modifier votre projet. Êtes-vous sûr de vouloir soumettre ce projet pour évaluation ?
                </p>
                <div className="mt-4 flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowSubmitConfirm(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="primary"
                    isLoading={isSubmitting}
                    leftIcon={<CheckCircle className="h-4 w-4" />}
                    onClick={handleSubmitProject}
                  >
                    Confirmer la soumission
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Détails du projet</CardTitle>
                <ProjectStatusBadge status={project.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700">{project.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm text-gray-500">Budget</div>
                    <div className="font-medium">{project.budget.toLocaleString()} FCFA</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm text-gray-500">Durée</div>
                    <div className="font-medium">{project.timeline}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm text-gray-500">Créé le</div>
                    <div className="font-medium">{project.createdAt.toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
              
              {project.submissionDate && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center">
                    <Send className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm text-gray-500">Soumis le</div>
                      <div className="font-medium">{project.submissionDate.toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {(project.totalEvaluationScore !== undefined || project.evaluationScores || project.evaluationScore !== undefined) && (
            <Card className="mt-6 border-l-4 border-l-primary-500">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 text-primary-600 mr-2" />
                    Résultats d'évaluation
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGeneratePdfReport}
                    isLoading={isGeneratingPdf}
                    leftIcon={<Download className="h-4 w-4" />}
                  >
                    Rapport PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {(project.totalEvaluationScore !== undefined || project.evaluationScore !== undefined) && (
                  <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-6 rounded-lg border border-primary-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-primary-800">Score d'évaluation total</h3>
                        <p className="text-sm text-primary-600">Calculé selon les critères pondérés</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-primary-700">
                          {project.totalEvaluationScore || project.evaluationScore}%
                        </div>
                        <div className={`text-sm font-medium ${
                          (project.totalEvaluationScore || project.evaluationScore || 0) >= 80 ? 'text-success-600' :
                          (project.totalEvaluationScore || project.evaluationScore || 0) >= 60 ? 'text-warning-600' : 'text-error-600'
                        }`}>
                          {(project.totalEvaluationScore || project.evaluationScore || 0) >= 80 ? 'Excellent' :
                           (project.totalEvaluationScore || project.evaluationScore || 0) >= 60 ? 'Satisfaisant' : 'À améliorer'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="overflow-hidden h-3 text-xs flex rounded-full bg-white shadow-inner">
                        <div 
                          style={{ width: `${Math.min(100, project.totalEvaluationScore || project.evaluationScore || 0)}%` }} 
                          className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
                            (project.totalEvaluationScore || project.evaluationScore || 0) >= 80 ? 'bg-gradient-to-r from-success-500 to-success-600' :
                            (project.totalEvaluationScore || project.evaluationScore || 0) >= 60 ? 'bg-gradient-to-r from-warning-500 to-warning-600' :
                            'bg-gradient-to-r from-error-500 to-error-600'
                          }`}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                    
                    {project.recommendedStatus && (
                      <div className="mt-4 flex items-center">
                        <span className="text-sm font-medium text-primary-700 mr-2">Recommandation :</span>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                          project.recommendedStatus === 'selected' ? 'bg-success-100 text-success-800' :
                          project.recommendedStatus === 'pre_selected' ? 'bg-warning-100 text-warning-800' :
                          'bg-error-100 text-error-800'
                        }`}>
                          {project.recommendedStatus === 'selected' ? '✅ Sélectionné' :
                           project.recommendedStatus === 'pre_selected' ? '⚠️ Présélectionné' :
                           '❌ Rejeté'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                {project.evaluationDate && (
                  <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Évalué le {project.evaluationDate.toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                    {project.evaluatedBy && (
                      <span className="ml-4 text-primary-600">
                        • Évaluateur ID: {project.evaluatedBy}
                      </span>
                    )}
                  </div>
                )}
                
                {project.evaluationScores && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-md font-semibold text-gray-800">Détail par critère</h4>
                      <span className="text-xs text-gray-500">
                        {Object.keys(project.evaluationScores).length} critère(s) évalué(s)
                      </span>
                    </div>
                    <div className="space-y-3">
                      {(() => {
                        const program = programs.find(p => p.id === project.programId);
                        if (!program) return null;
                        
                        return program.evaluationCriteria.map((criterion, index) => {
                          const score = project.evaluationScores![criterion.id] || 0;
                          const comment = project.evaluationComments?.[criterion.id] || '';
                          const percentage = (score / criterion.maxScore) * 100;
                          
                          return (
                            <div key={criterion.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center mb-1">
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-700 text-xs font-medium rounded-full mr-2">
                                      {index + 1}
                                    </span>
                                    <h5 className="font-medium text-gray-900">{criterion.name}</h5>
                                  </div>
                                  <p className="text-sm text-gray-600 ml-8">{criterion.description}</p>
                                </div>
                                <div className="text-right ml-4">
                                  <div className="text-lg font-semibold text-gray-900">
                                    {score}/{criterion.maxScore}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Poids: {criterion.weight}%
                                  </div>
                                </div>
                              </div>
                              
                              <div className="ml-8">
                                <div className="flex items-center mb-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                                    <div 
                                      className={`h-2 rounded-full transition-all duration-300 ${
                                        percentage >= 75 ? 'bg-gradient-to-r from-success-400 to-success-500' :
                                        percentage >= 50 ? 'bg-gradient-to-r from-warning-400 to-warning-500' : 
                                        'bg-gradient-to-r from-error-400 to-error-500'
                                      }`}
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium text-gray-700">
                                    {Math.round(percentage)}%
                                  </span>
                                </div>
                                
                                {comment && (
                                  <div className="mt-2 p-3 bg-gray-50 rounded-md border-l-3 border-l-primary-400">
                                    <div className="flex items-start">
                                      <FileText className="h-4 w-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <span className="text-xs font-medium text-primary-700 uppercase tracking-wide">Justification</span>
                                        <p className="text-sm text-gray-700 mt-1">{comment}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
                
                {project.evaluationNotes && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <FileText className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">Synthèse de l'évaluation</h4>
                        <p className="text-sm text-blue-700 leading-relaxed">{project.evaluationNotes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Progression</CardTitle>
            </CardHeader>
            <CardContent>
              <ProcessDiagram currentStatus={project.status} />
            </CardContent>
          </Card>
          
          {project.status === 'formalization' && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Formalisation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">NDA signé</span>
                  <span className={`flex items-center ${project.ndaSigned ? 'text-success-600' : 'text-gray-400'}`}>
                    {project.ndaSigned ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Clock className="h-5 w-5" />
                    )}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Dossier complet</span>
                  <span className={`flex items-center ${project.formalizationCompleted ? 'text-success-600' : 'text-gray-400'}`}>
                    {project.formalizationCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Clock className="h-5 w-5" />
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;