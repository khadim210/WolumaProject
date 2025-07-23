import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import { useProjectStore, ProjectStatus } from '../../stores/projectStore';
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
  AlertTriangle
} from 'lucide-react';

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { checkPermission } = usePermissions();
  const { projects, getProject, updateProject } = useProjectStore();
  
  const [project, setProject] = useState(id ? getProject(id) : undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  
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
          
          {project.evaluationScore && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Évaluation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-1">Score d'évaluation</div>
                    <div className="relative pt-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-semibold inline-block text-primary-600">
                            {project.evaluationScore}/100
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                        <div 
                          style={{ width: `${project.evaluationScore}%` }} 
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-600"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {project.evaluationNotes && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Notes d'évaluation</div>
                    <p className="text-gray-700">{project.evaluationNotes}</p>
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