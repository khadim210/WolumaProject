import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
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
  FolderPlus, 
  Users, 
  CheckCircle, 
  Clock,
  FileCheck, 
  ListChecks, 
  ArrowRight 
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { projects, fetchProjects, filterProjectsByUser } = useProjectStore();
  
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);
  
  const userProjects = user ? filterProjectsByUser(user) : [];
  
  const getStatusCounts = () => {
    const counts: Record<ProjectStatus, number> = {
      draft: 0,
      submitted: 0,
      under_review: 0,
      pre_selected: 0,
      selected: 0,
      formalization: 0,
      financed: 0,
      monitoring: 0,
      closed: 0,
      rejected: 0,
    };
    
    userProjects.forEach(project => {
      counts[project.status]++;
    });
    
    return counts;
  };
  
  const statusCounts = getStatusCounts();
  
  const recentProjects = [...userProjects]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 5);

  const getNextActions = () => {
    if (!user) return [];
    
    const actions = [];
    
    if (user.role === 'submitter') {
      if (statusCounts.draft > 0) {
        actions.push({
          label: 'Finaliser et soumettre des projets',
          icon: <CheckCircle className="h-6 w-6 text-primary-600" />,
          link: '/dashboard/projects',
        });
      }
      if (statusCounts.submitted + statusCounts.under_review > 0) {
        actions.push({
          label: 'Suivre les projets en cours d\'évaluation',
          icon: <Clock className="h-6 w-6 text-warning-600" />,
          link: '/dashboard/projects',
        });
      }
      actions.push({
        label: 'Créer un nouveau projet',
        icon: <FolderPlus className="h-6 w-6 text-secondary-600" />,
        link: '/dashboard/projects/create',
      });
    }
    
    if (user.role === 'manager') {
      if (statusCounts.submitted > 0) {
        actions.push({
          label: 'Évaluer les projets soumis',
          icon: <ListChecks className="h-6 w-6 text-primary-600" />,
          link: '/dashboard/evaluation',
        });
      }
      if (statusCounts.selected > 0) {
        actions.push({
          label: 'Formaliser les projets sélectionnés',
          icon: <FileCheck className="h-6 w-6 text-secondary-600" />,
          link: '/dashboard/formalization',
        });
      }
      if (statusCounts.financed > 0) {
        actions.push({
          label: 'Suivre les projets financés',
          icon: <Clock className="h-6 w-6 text-warning-600" />,
          link: '/dashboard/monitoring',
        });
      }
    }
    
    if (user.role === 'partner') {
      actions.push({
        label: 'Consulter les projets soumis',
        icon: <ListChecks className="h-6 w-6 text-primary-600" />,
        link: '/dashboard/projects',
      });
      if (statusCounts.financed + statusCounts.monitoring > 0) {
        actions.push({
          label: 'Suivre les projets financés',
          icon: <Clock className="h-6 w-6 text-warning-600" />,
          link: '/dashboard/monitoring',
        });
      }
    }
    
    return actions;
  };
  
  const nextActions = getNextActions();
  
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bonjour, {user?.name}
        </h1>
        <p className="mt-1 text-lg text-gray-500">
          Bienvenue sur votre tableau de bord {user?.role === 'partner' ? 'partenaire' : user?.role === 'manager' ? 'gestionnaire' : 'soumissionnaire'}
        </p>
      </div>
      
      {user?.role === 'submitter' && userProjects.length > 0 && (
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Progression de vos projets</CardTitle>
            </CardHeader>
            <CardContent>
              <ProcessDiagram 
                currentStatus={userProjects.length > 0 ? userProjects[0].status : 'draft'}
                className="py-4"
              />
            </CardContent>
          </Card>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Projets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary-600">
              {userProjects.length}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Total des projets {user?.role === 'submitter' ? 'soumis' : ''}
            </div>
            
            <div className="mt-4 space-y-2">
              {Object.entries(statusCounts)
                .filter(([status, count]) => count > 0)
                .map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <ProjectStatusBadge status={status as ProjectStatus} />
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t border-gray-200">
            <Link to="/dashboard/projects" className="text-sm text-primary-600 hover:text-primary-700 flex items-center">
              Voir tous les projets <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Actions recommandées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nextActions.length > 0 ? (
                nextActions.map((action, index) => (
                  <Link 
                    key={index} 
                    to={action.link}
                    className="flex items-start p-3 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div className="mr-3 flex-shrink-0">
                      {action.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {action.label}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Aucune action requise pour le moment
                </div>
              )}
            </div>
          </CardContent>
          {user?.role === 'submitter' && (
            <CardFooter className="bg-gray-50 border-t border-gray-200">
              <Link to="/dashboard/projects/create">
                <Button 
                  variant="primary" 
                  leftIcon={<FolderPlus className="h-4 w-4" />}
                >
                  Créer un nouveau projet
                </Button>
              </Link>
            </CardFooter>
          )}
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            {recentProjects.length > 0 ? (
              <div className="space-y-4">
                {recentProjects.map(project => (
                  <Link 
                    key={project.id} 
                    to={`/dashboard/projects/${project.id}`}
                    className="block p-3 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="text-sm font-medium text-gray-900">
                        {project.title}
                      </div>
                      <ProjectStatusBadge status={project.status} />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Modifié le {project.updatedAt.toLocaleDateString()}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Aucun projet récent
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-gray-50 border-t border-gray-200">
            <Link to="/dashboard/projects" className="text-sm text-primary-600 hover:text-primary-700 flex items-center">
              Voir l'historique complet <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;