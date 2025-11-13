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
import { FolderPlus, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

const ProjectsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { checkPermission } = usePermissions();
  const {  fetchProjects, filterProjectsByUser } = useProjectStore();
  const { programs, partners, fetchPrograms, fetchPartners } = useProgramStore();
  
  const [searchTerm] = useState('');
  const [statusFilter] = useState<ProjectStatus | 'all'>('all');
  const [partnerFilter] = useState<string>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [selectedProgramForImport, setSelectedProgramForImport] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string>('');
  const [importSuccess, setImportSuccess] = useState<string>('');
  
  useEffect(() => {
    console.log('📁 ProjectsPage: Fetching all data...');
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
  

  
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedProgramForImport || !user) {
      setImportError('Veuillez sélectionner un programme et un fichier');
      return;
    }

    setIsImporting(true);
    setImportError('');
    setImportSuccess('');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const selectedProgram = accessiblePrograms.find(p => p.id === selectedProgramForImport);
      if (!selectedProgram) {
        throw new Error('Programme sélectionné introuvable');
      }

      let importedCount = 0;
      const errors: string[] = [];

      for (const [index, row] of jsonData.entries()) {
        try {
          const rowData = row as any;
          
          // Validation des champs requis
          if (!rowData.Titre || !rowData.Description || !rowData.Budget || !rowData.Durée) {
            errors.push(`Ligne ${index + 2}: Champs requis manquants (Titre, Description, Budget, Durée)`);
            continue;
          }

          // Conversion et validation du budget
          const budget = typeof rowData.Budget === 'number' ? rowData.Budget : parseFloat(String(rowData.Budget).replace(/[^\d.-]/g, ''));
          if (isNaN(budget) || budget <= 0) {
            errors.push(`Ligne ${index + 2}: Budget invalide`);
            continue;
          }

          // Traitement des tags
          const tags = rowData.Tags ? String(rowData.Tags).split(',').map((tag: string) => tag.trim()).filter(Boolean) : ['import'];

          // Créer le projet
          await addProject({
            title: String(rowData.Titre).trim(),
            description: String(rowData.Description).trim(),
            status: 'draft',
            budget: budget,
            timeline: String(rowData.Durée).trim(),
            submitterId: user.id,
            programId: selectedProgramForImport,
            tags: tags,
          });

          importedCount++;
        } catch (error) {
          errors.push(`Ligne ${index + 2}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
      }

      if (importedCount > 0) {
        setImportSuccess(`${importedCount} projet(s) importé(s) avec succès`);
      }

      if (errors.length > 0) {
        setImportError(`Erreurs d'importation:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... et ${errors.length - 5} autres erreurs` : ''}`);
      }

    } catch (error) {
      setImportError(`Erreur lors de l'importation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Titre': 'Exemple de projet',
        'Description': 'Description détaillée du projet avec ses objectifs et son impact potentiel',
        'Budget': 150000,
        'Durée': '18 mois',
        'Tags': 'innovation, technologie, impact'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Modèle');

    // Auto-size columns
    const colWidths = Object.keys(templateData[0]).map(key => ({
      wch: Math.max(key.length, 20)
    }));
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, 'Modele_Import_Projets.xlsx');
  };
  
  const getStatusLabel = (status: ProjectStatus): string => {
    const labels: Record<ProjectStatus, string> = {
      draft: 'Brouillon',
      submitted: 'Soumis',
      under_review: 'En revue',
      pre_selected: 'Présélectionné',
      selected: 'Sélectionné',
      formalization: 'Formalisation',
      financed: 'Financé',
      monitoring: 'Suivi',
      closed: 'Clôturé',
      rejected: 'Rejeté'
    };
    return labels[status];
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Projets</h1>
        
        <div className="flex space-x-3">
        
          
          {checkPermission('projects.create') && (
            <Link to="/dashboard/projects/create">
              <Button
                variant="primary"
                leftIcon={<FolderPlus className="h-4 w-4" />}
              >
                {user?.role === 'submitter' ? 'Nouvelle soumission' : 'Nouveau projet'}
              </Button>
            </Link>
          )}
        </div>
      </div>
     
      {/* Import Section */}
      {checkPermission('projects.create') && (
        <Card className="border-l-4 border-l-secondary-500">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSpreadsheet className="h-5 w-5 text-secondary-600 mr-2" />
              Importation de projets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner un programme*
                </label>
                <select
                  value={selectedProgramForImport}
                  onChange={(e) => setSelectedProgramForImport(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-secondary-500 focus:border-secondary-500 sm:text-sm"
                >
                  <option value="">Choisir un programme...</option>
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fichier Excel (.xlsx)
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileImport}
                  disabled={!selectedProgramForImport || isImporting}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-secondary-50 file:text-secondary-700 hover:file:bg-secondary-100 disabled:opacity-50"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p>Format attendu: Titre, Description, Budget, Durée, Tags (optionnel)</p>
                <button
                  onClick={downloadTemplate}
                  className="text-secondary-600 hover:text-secondary-700 underline"
                >
                  Télécharger le modèle Excel
                </button>
              </div>
              
              {isImporting && (
                <div className="flex items-center text-secondary-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-secondary-600 mr-2"></div>
                  Importation en cours...
                </div>
              )}
            </div>
            
            {importError && (
              <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md">
                <pre className="text-sm whitespace-pre-wrap">{importError}</pre>
              </div>
            )}
            
            {importSuccess && (
              <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-md">
                <p className="text-sm">{importSuccess}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
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
                {user?.role === 'submitter' ? 'Créer votre première soumission' : 'Créer votre premier projet'}
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;