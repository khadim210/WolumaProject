import React, { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { useProgramStore } from '../../stores/programStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProjectStatusBadge from '../../components/projects/ProjectStatusBadge';
import {
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  User,
  AlertTriangle,
  Filter,
  CheckSquare,
  Square
} from 'lucide-react';

const EligibilityPage: React.FC = () => {
  const { user } = useAuthStore();
  const { projects, fetchProjects, updateProject } = useProjectStore();
  const { programs, fetchPrograms } = useProgramStore();

  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [eligibilityNotes, setEligibilityNotes] = useState('');
  const [batchNotes, setBatchNotes] = useState('');
  const [checkedCriteria, setCheckedCriteria] = useState<Record<string, boolean>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Filtres
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProjects();
    fetchPrograms();
  }, [fetchProjects, fetchPrograms]);

  const submittedProjects = projects.filter(p => p.status === 'submitted');

  const getProgram = (programId: string) => {
    return programs.find(p => p.id === programId);
  };

  // Filtrage des projets
  const filteredProjects = useMemo(() => {
    let filtered = submittedProjects;

    // Filtre par programme
    if (programFilter !== 'all') {
      filtered = filtered.filter(p => p.programId === programFilter);
    }

    // Filtre par date
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(p => {
        if (!p.submittedAt) return false;
        const submittedDate = new Date(p.submittedAt);
        const diffDays = Math.floor((now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24));

        switch (dateFilter) {
          case 'today':
            return diffDays === 0;
          case 'week':
            return diffDays <= 7;
          case 'month':
            return diffDays <= 30;
          default:
            return true;
        }
      });
    }

    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [submittedProjects, programFilter, dateFilter, searchTerm]);

  const handleSelectProject = (projectId: string) => {
    setSelectedProject(projectId);
    setEligibilityNotes('');
    setCheckedCriteria({});
  };

  const handleToggleProject = (projectId: string) => {
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      newSelected.add(projectId);
    }
    setSelectedProjects(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProjects.size === filteredProjects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(filteredProjects.map(p => p.id)));
    }
  };

  const handleCriteriaCheck = (criteriaIndex: number, checked: boolean) => {
    setCheckedCriteria(prev => ({
      ...prev,
      [criteriaIndex]: checked
    }));
  };

  const handleApprove = async () => {
    if (!selectedProject || !user) return;

    const project = projects.find(p => p.id === selectedProject);
    if (!project) return;

    const program = getProgram(project.programId);
    const criteriaList = program?.eligibilityCriteria?.split('\n').filter(c => c.trim()) || [];

    const allChecked = criteriaList.every((_, index) => checkedCriteria[index]);

    if (!allChecked && criteriaList.length > 0) {
      alert('Veuillez cocher tous les critères d\'éligibilité avant d\'approuver.');
      return;
    }

    setIsProcessing(true);
    try {
      await updateProject(selectedProject, {
        status: 'eligible',
        eligibilityNotes,
        eligibilityCheckedBy: user.id,
        eligibilityCheckedAt: new Date().toISOString()
      });

      alert('Projet marqué comme éligible avec succès!');
      setSelectedProject(null);
      setEligibilityNotes('');
      setCheckedCriteria({});
    } catch (error) {
      console.error('Error approving project:', error);
      alert('Erreur lors de l\'approbation du projet.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProject || !user) return;

    if (!eligibilityNotes.trim()) {
      alert('Veuillez fournir une raison pour le rejet.');
      return;
    }

    setIsProcessing(true);
    try {
      await updateProject(selectedProject, {
        status: 'ineligible',
        eligibilityNotes,
        eligibilityCheckedBy: user.id,
        eligibilityCheckedAt: new Date().toISOString()
      });

      alert('Projet marqué comme non éligible.');
      setSelectedProject(null);
      setEligibilityNotes('');
      setCheckedCriteria({});
    } catch (error) {
      console.error('Error rejecting project:', error);
      alert('Erreur lors du rejet du projet.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchApprove = async () => {
    if (selectedProjects.size === 0 || !user) return;

    if (!window.confirm(`Voulez-vous approuver ${selectedProjects.size} projet(s) ?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const promises = Array.from(selectedProjects).map(projectId =>
        updateProject(projectId, {
          status: 'eligible',
          eligibilityNotes: batchNotes || 'Approuvé en lot',
          eligibilityCheckedBy: user.id,
          eligibilityCheckedAt: new Date().toISOString()
        })
      );

      await Promise.all(promises);
      alert(`${selectedProjects.size} projet(s) approuvé(s) avec succès!`);
      setSelectedProjects(new Set());
      setBatchNotes('');
    } catch (error) {
      console.error('Error batch approving projects:', error);
      alert('Erreur lors de l\'approbation par lot.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchReject = async () => {
    if (selectedProjects.size === 0 || !user) return;

    if (!batchNotes.trim()) {
      alert('Veuillez fournir une raison pour le rejet par lot.');
      return;
    }

    if (!window.confirm(`Voulez-vous rejeter ${selectedProjects.size} projet(s) ?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const promises = Array.from(selectedProjects).map(projectId =>
        updateProject(projectId, {
          status: 'ineligible',
          eligibilityNotes: batchNotes,
          eligibilityCheckedBy: user.id,
          eligibilityCheckedAt: new Date().toISOString()
        })
      );

      await Promise.all(promises);
      alert(`${selectedProjects.size} projet(s) rejeté(s) avec succès!`);
      setSelectedProjects(new Set());
      setBatchNotes('');
    } catch (error) {
      console.error('Error batch rejecting projects:', error);
      alert('Erreur lors du rejet par lot.');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedProjectData = selectedProject ? projects.find(p => p.id === selectedProject) : null;
  const selectedProgram = selectedProjectData ? getProgram(selectedProjectData.programId) : null;
  const criteriaList = selectedProgram?.eligibilityCriteria?.split('\n').filter(c => c.trim()) || [];

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Accès Restreint
              </h3>
              <p className="text-gray-600">
                Seuls les administrateurs et managers peuvent accéder à la page de vérification d'éligibilité.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Vérification d'Éligibilité</h1>
        <p className="mt-2 text-gray-600">
          Vérifiez l'éligibilité des projets soumis selon les critères définis.
        </p>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Filter className="h-5 w-5 text-gray-500 mr-2" />
              <CardTitle>Filtres</CardTitle>
            </div>
            {selectedProjects.size > 0 && (
              <span className="text-sm font-medium text-blue-600">
                {selectedProjects.size} projet(s) sélectionné(s)
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recherche
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Titre ou description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Programme
              </label>
              <select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les programmes</option>
                {programs.map(program => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de soumission
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Toutes les dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setProgramFilter('all');
                  setDateFilter('all');
                  setSearchTerm('');
                  setSelectedProjects(new Set());
                }}
                className="w-full"
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions par lot */}
      {selectedProjects.size > 0 && (
        <Card className="border-2 border-blue-500 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Actions par lot ({selectedProjects.size} projet(s))
                </h3>
                <textarea
                  value={batchNotes}
                  onChange={(e) => setBatchNotes(e.target.value)}
                  placeholder="Notes pour l'ensemble des projets sélectionnés (obligatoire pour rejet)..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 ml-4">
                <Button
                  variant="success"
                  onClick={handleBatchApprove}
                  isLoading={isProcessing}
                  leftIcon={<CheckCircle className="h-5 w-5" />}
                >
                  Approuver Tout
                </Button>
                <Button
                  variant="danger"
                  onClick={handleBatchReject}
                  isLoading={isProcessing}
                  leftIcon={<XCircle className="h-5 w-5" />}
                >
                  Rejeter Tout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Projets en Attente</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {filteredProjects.length} projet(s) affiché(s)
                  </p>
                </div>
                <button
                  onClick={handleSelectAll}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {selectedProjects.size === filteredProjects.length ? (
                    <>
                      <CheckSquare className="h-4 w-4 mr-1" />
                      Tout désélectionner
                    </>
                  ) : (
                    <>
                      <Square className="h-4 w-4 mr-1" />
                      Tout sélectionner
                    </>
                  )}
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredProjects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Aucun projet correspondant aux filtres</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredProjects.map(project => {
                    const program = getProgram(project.programId);
                    const isSelected = selectedProjects.has(project.id);
                    const isCurrentProject = selectedProject === project.id;

                    return (
                      <div
                        key={project.id}
                        className={`relative p-4 rounded-lg border-2 transition-all ${
                          isCurrentProject
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleProject(project.id)}
                            className="mt-1 mr-3 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                          />
                          <button
                            onClick={() => handleSelectProject(project.id)}
                            className="flex-1 text-left"
                          >
                            <h3 className="font-semibold text-gray-900 mb-1">{project.title}</h3>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {project.description}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{program?.name || 'Programme inconnu'}</span>
                              <ProjectStatusBadge status={project.status} />
                            </div>
                            {project.submittedAt && (
                              <div className="flex items-center text-xs text-gray-400 mt-2">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(project.submittedAt).toLocaleDateString('fr-FR')}
                              </div>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {!selectedProjectData ? (
            <Card>
              <CardContent className="py-16">
                <div className="text-center text-gray-500">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg">Sélectionnez un projet pour commencer la vérification individuelle</p>
                  <p className="text-sm mt-2">ou utilisez les cases à cocher pour les actions par lot</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Détails du Projet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedProjectData.title}</h3>
                    <p className="text-gray-600 mt-2">{selectedProjectData.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">Soumis le:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {selectedProjectData.submittedAt
                          ? new Date(selectedProjectData.submittedAt).toLocaleDateString('fr-FR')
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">Programme:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {selectedProgram?.name || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {selectedProjectData.formData && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-gray-900 mb-3">Données du Formulaire</h4>
                      <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(selectedProjectData.formData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Critères d'Éligibilité</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Vérifiez tous les critères avant de prendre une décision
                  </p>
                </CardHeader>
                <CardContent>
                  {criteriaList.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-amber-500" />
                      <p className="text-gray-600">
                        Aucun critère d'éligibilité défini pour ce programme.
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Vous pouvez quand même approuver ou rejeter ce projet manuellement.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {criteriaList.map((criteria, index) => (
                        <label
                          key={index}
                          className="flex items-start p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checkedCriteria[index] || false}
                            onChange={(e) => handleCriteriaCheck(index, e.target.checked)}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-3 text-gray-700">{criteria}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notes d'Éligibilité</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Ajoutez des notes pour justifier votre décision (obligatoire en cas de rejet)
                  </p>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={eligibilityNotes}
                    onChange={(e) => setEligibilityNotes(e.target.value)}
                    placeholder="Entrez vos notes et commentaires..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button
                  variant="success"
                  onClick={handleApprove}
                  isLoading={isProcessing}
                  leftIcon={<CheckCircle className="h-5 w-5" />}
                  className="flex-1"
                >
                  Approuver (Éligible)
                </Button>
                <Button
                  variant="danger"
                  onClick={handleReject}
                  isLoading={isProcessing}
                  leftIcon={<XCircle className="h-5 w-5" />}
                  className="flex-1"
                >
                  Rejeter (Non Éligible)
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EligibilityPage;
