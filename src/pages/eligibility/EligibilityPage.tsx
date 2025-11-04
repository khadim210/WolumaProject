import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useProgramStore } from '../../stores/programStore';
import { useAuthStore } from '../../stores/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { CheckCircle, XCircle, AlertCircle, Eye, Play, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EligibilityPage: React.FC = () => {
  const { projects, fetchProjects, updateProject } = useProjectStore();
  const { programs, fetchPrograms } = useProgramStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [checkingProjectId, setCheckingProjectId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'submitted' | 'eligible' | 'ineligible'>('submitted');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [criteriaChecks, setCriteriaChecks] = useState<Record<string, Record<number, boolean>>>({});

  useEffect(() => {
    fetchProjects();
    fetchPrograms();
  }, [fetchProjects, fetchPrograms]);

  const submittedProjects = projects.filter(p =>
    p.status === 'submitted' || p.status === 'eligible' || p.status === 'ineligible'
  );

  const filteredProjects = selectedStatus === 'all'
    ? submittedProjects
    : submittedProjects.filter(p => p.status === selectedStatus);

  const getProgram = (programId: string) => programs.find(p => p.id === programId);

  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const getEligibilityCriteria = (programId: string): { label: string; description: string }[] => {
    const program = getProgram(programId);
    if (!program) return [];

    if (!program.fieldEligibilityCriteria || program.fieldEligibilityCriteria.length === 0) {
      return [];
    }

    return program.fieldEligibilityCriteria
      .filter(field => field.isEligibilityCriteria === true)
      .map(field => {
        let description = field.fieldLabel || field.fieldName;

        if (field.conditions) {
          const { operator, value, value2 } = field.conditions;

          switch (operator) {
            case '>':
              description += ` (doit être supérieur à ${value})`;
              break;
            case '<':
              description += ` (doit être inférieur à ${value})`;
              break;
            case '>=':
              description += ` (doit être supérieur ou égal à ${value})`;
              break;
            case '<=':
              description += ` (doit être inférieur ou égal à ${value})`;
              break;
            case '==':
              if (value) description += ` (doit être égal à ${value})`;
              break;
            case '!=':
              description += ` (ne doit pas être égal à ${value})`;
              break;
            case 'between':
              description += ` (doit être entre ${value} et ${value2})`;
              break;
            case 'contains':
              description += ` (doit contenir "${value}")`;
              break;
            case 'required':
              description += ' (requis)';
              break;
          }
        }

        return {
          label: field.fieldLabel || field.fieldName,
          description
        };
      });
  };

  const toggleCriteriaCheck = (projectId: string, criteriaIndex: number) => {
    setCriteriaChecks(prev => ({
      ...prev,
      [projectId]: {
        ...(prev[projectId] || {}),
        [criteriaIndex]: !(prev[projectId]?.[criteriaIndex] || false)
      }
    }));
  };

  const areAllCriteriaChecked = (projectId: string, totalCriteria: number): boolean => {
    const checks = criteriaChecks[projectId] || {};
    for (let i = 0; i < totalCriteria; i++) {
      if (!checks[i]) return false;
    }
    return totalCriteria > 0;
  };

  const checkEligibilityAutomatic = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const program = getProgram(project.programId);
    const eligibilityCriteria = getEligibilityCriteria(project.programId);

    if (!program || eligibilityCriteria.length === 0) {
      alert('Ce programme n\'a pas de critères d\'éligibilité définis.');
      return;
    }

    if (!project.formData) {
      alert('Ce projet n\'a pas de données de formulaire pour vérifier l\'éligibilité.');
      return;
    }

    setCheckingProjectId(projectId);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const failedCriteria: string[] = [];

      program.fieldEligibilityCriteria?.forEach(field => {
        if (!field.isEligibilityCriteria) return;

        const fieldValue = project.formData?.[field.fieldName];
        const { operator, value, value2 } = field.conditions;

        let passes = true;

        if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
          passes = false;
        } else {
          const numericValue = parseFloat(fieldValue);
          const numericCondition = parseFloat(value);

          switch (operator) {
            case '>':
              passes = !isNaN(numericValue) && !isNaN(numericCondition) && numericValue > numericCondition;
              break;
            case '<':
              passes = !isNaN(numericValue) && !isNaN(numericCondition) && numericValue < numericCondition;
              break;
            case '>=':
              passes = !isNaN(numericValue) && !isNaN(numericCondition) && numericValue >= numericCondition;
              break;
            case '<=':
              passes = !isNaN(numericValue) && !isNaN(numericCondition) && numericValue <= numericCondition;
              break;
            case '==':
              passes = String(fieldValue) === String(value);
              break;
            case '!=':
              passes = String(fieldValue) !== String(value);
              break;
            case 'between':
              passes = !isNaN(numericValue) && !isNaN(numericCondition) && !isNaN(parseFloat(value2 || '0')) &&
                       numericValue >= numericCondition && numericValue <= parseFloat(value2 || '0');
              break;
            case 'contains':
              passes = String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
              break;
          }
        }

        if (!passes) {
          failedCriteria.push(field.fieldLabel || field.fieldName);
        }
      });

      const isEligible = failedCriteria.length === 0;

      await updateProject(projectId, {
        status: isEligible ? 'eligible' : 'ineligible',
        eligibilityNotes: isEligible
          ? `[Vérification automatique] Le projet répond à tous les critères d'éligibilité du programme "${program.name}".`
          : `[Vérification automatique] Le projet ne répond pas aux critères suivants: ${failedCriteria.join(', ')}.`,
        eligibilityCheckedBy: user?.id,
        eligibilityCheckedAt: new Date().toISOString()
      });

      await fetchProjects();
    } catch (error) {
      console.error('Error checking eligibility:', error);
      alert('Erreur lors de la vérification d\'éligibilité');
    } finally {
      setCheckingProjectId(null);
    }
  };

  const markAsEligible = async (projectId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir marquer ce projet comme éligible ?')) return;

    setIsLoading(true);
    try {
      await updateProject(projectId, {
        status: 'eligible',
        eligibilityNotes: `[Vérification manuelle] Projet marqué comme éligible par ${user?.name}`,
        eligibilityCheckedBy: user?.id,
        eligibilityCheckedAt: new Date().toISOString()
      });
      await fetchProjects();
    } catch (error) {
      console.error('Error updating eligibility:', error);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsIneligible = async (projectId: string) => {
    const reason = prompt('Veuillez indiquer la raison de l\'inéligibilité :');
    if (!reason) return;

    setIsLoading(true);
    try {
      await updateProject(projectId, {
        status: 'ineligible',
        eligibilityNotes: `[Vérification manuelle] Projet marqué comme inéligible par ${user?.name}. Raison: ${reason}`,
        eligibilityCheckedBy: user?.id,
        eligibilityCheckedAt: new Date().toISOString()
      });
      await fetchProjects();
    } catch (error) {
      console.error('Error updating eligibility:', error);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setIsLoading(false);
    }
  };

  const resetEligibilityStatus = async (projectId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir réinitialiser le statut d\'éligibilité de ce projet ?')) return;

    setIsLoading(true);
    try {
      await updateProject(projectId, {
        status: 'submitted',
        eligibilityNotes: undefined,
        eligibilityCheckedBy: undefined,
        eligibilityCheckedAt: undefined
      });
      await fetchProjects();
    } catch (error) {
      console.error('Error resetting eligibility:', error);
      alert('Erreur lors de la réinitialisation du statut');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="warning"><AlertCircle className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'eligible':
        return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Éligible</Badge>;
      case 'ineligible':
        return <Badge variant="error"><XCircle className="h-3 w-3 mr-1" />Non éligible</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vérification d'Éligibilité</h1>
        <p className="mt-1 text-gray-600">
          Vérifiez l'éligibilité des projets soumis aux critères des programmes
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Button
              variant={selectedStatus === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('all')}
            >
              Tous ({submittedProjects.length})
            </Button>
            <Button
              variant={selectedStatus === 'submitted' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('submitted')}
            >
              En attente ({submittedProjects.filter(p => p.status === 'submitted').length})
            </Button>
            <Button
              variant={selectedStatus === 'eligible' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('eligible')}
            >
              Éligibles ({submittedProjects.filter(p => p.status === 'eligible').length})
            </Button>
            <Button
              variant={selectedStatus === 'ineligible' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('ineligible')}
            >
              Non éligibles ({submittedProjects.filter(p => p.status === 'ineligible').length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun projet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Aucun projet ne correspond aux critères sélectionnés.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map(project => {
            const program = getProgram(project.programId);
            const isChecking = checkingProjectId === project.id;

            return (
              <Card key={project.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                        {getStatusBadge(project.status)}
                      </div>

                      <p className="text-sm text-gray-600 mb-3">
                        {project.description.substring(0, 150)}...
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">Programme:</span>
                          <span className="ml-2 font-medium text-gray-900">{program?.name || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Soumis le:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {project.submittedAt ? new Date(project.submittedAt).toLocaleDateString('fr-FR') : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {(() => {
                        const eligibilityCriteria = getEligibilityCriteria(project.programId);
                        if (eligibilityCriteria.length === 0) return null;

                        return (
                          <div className="mb-3">
                            <button
                              onClick={() => toggleProjectExpansion(project.id)}
                              className="flex items-center justify-between w-full bg-gray-50 hover:bg-gray-100 p-3 rounded-md transition-colors"
                            >
                              <span className="text-xs font-medium text-gray-700">
                                Critères d'éligibilité ({eligibilityCriteria.length})
                              </span>
                              {expandedProjects.has(project.id) ? (
                                <ChevronUp className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              )}
                            </button>

                            {expandedProjects.has(project.id) && (
                              <div className="mt-2 bg-white border border-gray-200 rounded-md p-4">
                                <div className="space-y-3">
                                  {eligibilityCriteria.map((criterion, index) => (
                                    <div key={index} className="flex items-start space-x-3">
                                      <input
                                        type="checkbox"
                                        id={`${project.id}-criterion-${index}`}
                                        checked={criteriaChecks[project.id]?.[index] || false}
                                        onChange={() => toggleCriteriaCheck(project.id, index)}
                                        className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                      />
                                      <label
                                        htmlFor={`${project.id}-criterion-${index}`}
                                        className="text-sm text-gray-700 cursor-pointer flex-1"
                                      >
                                        {criterion.description}
                                      </label>
                                    </div>
                                  ))}
                                </div>

                                {eligibilityCriteria.length > 0 && (
                                  <div className="mt-4 pt-3 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-600">
                                        {Object.values(criteriaChecks[project.id] || {}).filter(Boolean).length} sur {eligibilityCriteria.length} critères cochés
                                      </span>
                                      {areAllCriteriaChecked(project.id, eligibilityCriteria.length) && (
                                        <span className="flex items-center text-xs text-green-600 font-medium">
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Tous les critères validés
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {project.eligibilityNotes && (
                        <div className="bg-blue-50 p-3 rounded-md mb-3">
                          <p className="text-xs font-medium text-blue-900 mb-1">Notes d'éligibilité:</p>
                          <p className="text-xs text-blue-700">{project.eligibilityNotes}</p>
                          {project.eligibilityCheckedAt && (
                            <p className="text-xs text-blue-600 mt-1">
                              Vérifié le {new Date(project.eligibilityCheckedAt).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex flex-col space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Eye className="h-4 w-4" />}
                        onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                      >
                        Voir
                      </Button>

                      {project.status === 'submitted' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<Play className="h-4 w-4" />}
                            onClick={() => checkEligibilityAutomatic(project.id)}
                            isLoading={isChecking}
                            disabled={isChecking || isLoading}
                          >
                            Vérifier
                          </Button>

                          <Button
                            variant="success"
                            size="sm"
                            leftIcon={<CheckCircle className="h-4 w-4" />}
                            onClick={() => markAsEligible(project.id)}
                            disabled={isLoading || isChecking}
                          >
                            Éligible
                          </Button>

                          <Button
                            variant="error"
                            size="sm"
                            leftIcon={<XCircle className="h-4 w-4" />}
                            onClick={() => markAsIneligible(project.id)}
                            disabled={isLoading || isChecking}
                          >
                            Non éligible
                          </Button>
                        </>
                      )}

                      {(project.status === 'eligible' || project.status === 'ineligible') && (
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<RefreshCw className="h-4 w-4" />}
                          onClick={() => resetEligibilityStatus(project.id)}
                          disabled={isLoading}
                        >
                          Réinitialiser
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EligibilityPage;
