import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { useProgramStore } from '../../stores/programStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProjectStatusBadge from '../../components/projects/ProjectStatusBadge';
import { CheckCircle, XCircle, FileText, Calendar, User, AlertTriangle } from 'lucide-react';

const EligibilityPage: React.FC = () => {
  const { user } = useAuthStore();
  const { projects, fetchProjects, updateProject } = useProjectStore();
  const { programs, fetchPrograms } = useProgramStore();

  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [eligibilityNotes, setEligibilityNotes] = useState('');
  const [checkedCriteria, setCheckedCriteria] = useState<Record<string, boolean>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchPrograms();
  }, [fetchProjects, fetchPrograms]);

  const submittedProjects = projects.filter(p => p.status === 'submitted');

  const getProgram = (programId: string) => {
    return programs.find(p => p.id === programId);
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProject(projectId);
    setEligibilityNotes('');
    setCheckedCriteria({});
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Projets en Attente</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {submittedProjects.length} projet(s) à vérifier
              </p>
            </CardHeader>
            <CardContent>
              {submittedProjects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Aucun projet en attente de vérification</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submittedProjects.map(project => {
                    const program = getProgram(project.programId);
                    return (
                      <button
                        key={project.id}
                        onClick={() => handleSelectProject(project.id)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          selectedProject === project.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <h3 className="font-semibold text-gray-900 mb-1">{project.title}</h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {project.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{program?.name || 'Programme inconnu'}</span>
                          <ProjectStatusBadge status={project.status} />
                        </div>
                      </button>
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
                  <p className="text-lg">Sélectionnez un projet pour commencer la vérification</p>
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
