import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import { useProjectStore, ProjectStatus } from '../../stores/projectStore';
import { useProgramStore } from '../../stores/programStore';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProjectStatusBadge from '../../components/projects/ProjectStatusBadge';
import { FolderPlus, Search, Filter } from 'lucide-react';

const ProjectsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { checkPermission } = usePermissions();
  const { projects, fetchProjects, filterProjectsByUser } = useProjectStore();
  const { programs, partners, fetchPrograms, fetchPartners } = useProgramStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [partnerFilter, setPartnerFilter] = useState<string>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');
  
  useEffect(() => {
    fetchProjects();
    fetchPrograms();
    fetchPartners();
  }, [fetchProjects, fetchPrograms, fetchPartners]);
  
  const userProjects = user ? filterProjectsByUser(user) : [];
  
  // Filter projects based on user role and program access
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
      const userPartner = partners.find(p => 
        p.contactEmail === user.email || 
        p.name === user.organization
      );
      if (userPartner) {
        return programs.filter(p => p.partnerId === userPartner.id);
      }
      // Fallback: show all programs if partner not found by email/organization
      return programs;
    }
    
    return programs; // For submitters, show all programs
  };
  
  const accessiblePrograms = getAccessiblePrograms();
  
  const filteredProjects = userProjects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesPartner = partnerFilter === 'all' || 
                          accessiblePrograms.some(p => p.id === project.programId && p.partnerId === partnerFilter);
    const matchesProgram = programFilter === 'all' || project.programId === programFilter;
    
    // Also check if user has access to this program
    const hasAccessToProgram = accessiblePrograms.some(p => p.id === project.programId);
    
    return matchesSearch && matchesStatus && matchesPartner && matchesProgram && hasAccessToProgram;
  });
  
  // Get programs filtered by selected partner
  const getFilteredPrograms = () => {
    if (partnerFilter === 'all') {
      return accessiblePrograms;
    }
    return accessiblePrograms.filter(p => p.partnerId === partnerFilter);
  };
  
  const filteredPrograms = getFilteredPrograms();
  
  // Reset program filter when partner changes
  React.useEffect(() => {
    if (partnerFilter !== 'all' && programFilter !== 'all') {
      const programExists = filteredPrograms.some(p => p.id === programFilter);
      if (!programExists) {
        setProgramFilter('all');
      }
    }
  }, [partnerFilter, programFilter, filteredPrograms]);
  
  // Get unique partners from accessible programs
  const getAccessiblePartners = () => {
    const partnerIds = [...new Set(accessiblePrograms.map(p => p.partnerId))];
    return partners.filter(partner => partnerIds.includes(partner.id));
  };
  
  const accessiblePartners = getAccessiblePartners();
  
  const sortedProjects = [...filteredProjects].sort((a, b) => 
    b.updatedAt.getTime() - a.updatedAt.getTime()
  );
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Projets</h1>
        
        {checkPermission('projects.create') && (
          <Link to="/dashboard/projects/create">
            <Button 
              variant="primary" 
              leftIcon={<FolderPlus className="h-4 w-4" />}
            >
              Nouveau projet
            </Button>
          </Link>
        )}
      </div>
      
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-col lg:flex-row gap-4">
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
            
            <div className="flex gap-4">
              <div className="relative w-48">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  className="block w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm appearance-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="draft">Brouillon</option>
                  <option value="submitted">Soumis</option>
                  <option value="under_review">En cours d'évaluation</option>
                  <option value="pre_selected">Présélectionné</option>
                  <option value="selected">Sélectionné</option>
                  <option value="formalization">Formalisation</option>
                  <option value="financed">Financé</option>
                  <option value="monitoring">Suivi</option>
                  <option value="closed">Clôturé</option>
                  <option value="rejected">Rejeté</option>
                </select>
              </div>
              
              <div className="relative w-64">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  className="block w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm appearance-none"
                  value={partnerFilter}
                  onChange={(e) => setPartnerFilter(e.target.value)}
                >
                  <option value="all">Tous les partenaires</option>
                  {accessiblePartners.map(partner => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name}
                    </option>
                  ))}
                </select>
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
                  {filteredPrograms.map(program => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {sortedProjects.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {sortedProjects.map(project => {
            const program = programs.find(p => p.id === project.programId);
            const partner = program ? partners.find(p => p.id === program.partnerId) : null;
            
            return (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="mb-4 md:mb-0">
                      <div className="flex items-start">
                        <h3 className="text-lg font-medium text-gray-900">
                          <Link to={`/dashboard/projects/${project.id}`} className="hover:text-primary-600">
                            {project.title}
                          </Link>
                        </h3>
                        <ProjectStatusBadge status={project.status} className="ml-3" />
                      </div>
                      
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {project.description}
                      </p>
                      
                      {program && (
                        <div className="mt-2 flex items-center text-sm text-primary-600">
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
                      
                      <div className="mt-3 flex flex-wrap gap-2">
                        {project.tags.map(tag => (
                          <span key={tag} className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex flex-col justify-between items-end">
                      <div className="text-sm text-gray-500">
                        <div>Budget: {project.budget.toLocaleString()} FCFA</div>
                        <div>Durée: {project.timeline}</div>
                        <div>{project.submissionDate 
                          ? `Soumis le ${project.submissionDate.toLocaleDateString()}`
                          : 'Non soumis'}
                        </div>
                      </div>
                      
                      <Link to={`/dashboard/projects/${project.id}`} className="mt-4">
                        <Button variant="outline" size="sm">
                          Voir le détail
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-gray-500">
            {searchTerm || statusFilter !== 'all' || partnerFilter !== 'all' || programFilter !== 'all'
              ? "Aucun projet ne correspond à vos critères de recherche"
              : "Aucun projet n'est disponible pour le moment"}
          </div>
          
          {checkPermission('projects.create') && (
            <Link to="/dashboard/projects/create" className="mt-4 inline-block">
              <Button 
                variant="primary" 
                leftIcon={<FolderPlus className="h-4 w-4" />}
              >
                Créer votre premier projet
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;