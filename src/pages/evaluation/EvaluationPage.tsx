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
import { Search, Filter, CheckCircle, XCircle, ArrowLeft, Save, Award, Target, Sparkles } from 'lucide-react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { aiEvaluationService } from '../../services/aiEvaluationService';
import { generateEvaluationReport } from '../../utils/pdfGenerator';

  Send,
  Shield,
  AlertTriangle,
  XCircle,
  X
  const { user } = useAuthStore();
  const { checkPermission } = usePermissions();
  const { projects, updateProject } = useProjectStore();
  const { programs, partners, fetchPrograms, fetchPartners } = useProgramStore();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isAIEvaluating, setIsAIEvaluating] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [isBulkEvaluating, setIsBulkEvaluating] = useState(false);
  const [bulkEvaluationProgress, setBulkEvaluationProgress] = useState<{
    current: number;
    total: number;
    currentProject: string;
  } | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
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
  
  // Get projects in submitted status or evaluated but not yet submitted to next stage
  const submittedProjects = projects.filter(project => {
    const isAccessible = accessiblePrograms.some(p => p.id === project.programId);
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProgram = programFilter === 'all' || project.programId === programFilter;
    
    // Include projects that are submitted OR evaluated but waiting for manual submission
    const isEvaluationPending = project.status === 'submitted' || 
                               (project.evaluationScores && !project.manuallySubmitted);
    
    return isEvaluationPending && 
           isAccessible && 
           matchesSearch && 
           matchesProgram;
  });
  
  const handleSelectProjectForEvaluation = (project: Project) => {
    setSelectedProject(project);
    setIsEvaluating(true);
  };
  
  const handleCancelEvaluation = () => {
    setIsEvaluating(false);
    setSelectedProject(null);
  };
  
  const handleSelectAll = () => {
    const allProjectIds = submittedProjects.map(p => p.id);
    setSelectedProjects(allProjectIds);
  };
  
  const handleDeselectAll = () => {
    setSelectedProjects([]);
  };
  
  const handleBulkAIEvaluation = async () => {
    if (selectedProjects.length === 0) return;
    
    setIsBulkEvaluating(true);
    setBulkEvaluationProgress({
      current: 0,
      total: selectedProjects.length,
      currentProject: ''
    });
    
    try {
      for (let i = 0; i < selectedProjects.length; i++) {
        const projectId = selectedProjects[i];
        const project = submittedProjects.find(p => p.id === projectId);
        const program = project ? programs.find(p => p.id === project.programId) : null;
        
        if (!project || !program || !user) continue;
        
        setBulkEvaluationProgress({
          current: i + 1,
          total: selectedProjects.length,
          currentProject: project.title
        });
        
        try {
          const request = {
            projectData: {
              title: project.title,
              description: project.description,
              budget: project.budget,
              timeline: project.timeline,
              tags: project.tags,
              submissionDate: project.submissionDate?.toLocaleDateString()
            },
            evaluationCriteria: program.evaluationCriteria.map((criterion: any) => ({
              id: criterion.id,
              name: criterion.name,
              description: criterion.description,
              maxScore: criterion.maxScore,
              weight: criterion.weight
            }))
          };

          const response = await aiEvaluationService.evaluateProject(request);
          
          // Préparer les scores et commentaires
          const evaluationScores: Record<string, number> = {};
          const evaluationComments: Record<string, string> = {};
          let totalScore = 0;
          
          program.evaluationCriteria.forEach((criterion: any) => {
            const score = response.scores[criterion.name] || 0;
            evaluationScores[criterion.id] = score;
            
            const percentage = (score / criterion.maxScore) * 100;
            let comment = '';
            if (percentage >= 75) {
              comment = `Score élevé (${score}/${criterion.maxScore}) - Le projet répond excellemment à ce critère.`;
            } else if (percentage >= 50) {
              comment = `Score moyen (${score}/${criterion.maxScore}) - Le projet répond partiellement à ce critère avec des améliorations possibles.`;
            } else {
              comment = `Score faible (${score}/${criterion.maxScore}) - Le projet présente des lacunes importantes sur ce critère.`;
            }
            
            evaluationComments[criterion.id] = `[IA] ${comment}`;
            totalScore += (score / criterion.maxScore) * criterion.weight;
          });
          
          // Mettre à jour le projet
          await updateProject(project.id, {
            evaluationScores,
            evaluationComments,
            totalEvaluationScore: Math.round(totalScore),
            evaluationNotes: `[Évaluation IA en lot] ${response.notes}`,
            evaluatedBy: user.id,
            evaluationDate: new Date(),
            // Don't change status automatically - wait for manual submission
          });
          
          // Petite pause entre les évaluations pour éviter les limites de taux
          if (i < selectedProjects.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (error) {
          console.error(`Erreur lors de l'évaluation du projet ${project.title}:`, error);
          // Continuer avec le projet suivant même en cas d'erreur
        }
      }
      
      // Réinitialiser la sélection après évaluation
      setSelectedProjects([]);
      
    } catch (error) {
      console.error('Erreur lors de l\'évaluation en lot:', error);
    } finally {
      setIsBulkEvaluating(false);
      setBulkEvaluationProgress(null);
    }
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
      const evaluationComments: Record<string, string> = {};
      let totalScore = 0;
      
      program.evaluationCriteria.forEach(criterion => {
        const score = values[`score_${criterion.id}`];
        const comment = values[`comment_${criterion.id}`] || '';
        evaluationScores[criterion.id] = score;
        evaluationComments[criterion.id] = comment;
        // Calculate weighted score
        totalScore += (score / criterion.maxScore) * criterion.weight;
      });
      
      const updatedProject = await updateProject(selectedProject.id, {
        evaluationScores,
        evaluationComments,
        totalEvaluationScore: Math.round(totalScore),
        evaluationNotes: values.evaluationNotes,
        evaluatedBy: user.id,
        evaluationDate: new Date(),
        recommendedStatus: values.decision as ProjectStatus,
        // Don't change status automatically - wait for manual submission
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
  
  const handleAIEvaluation = async (project: Project, program: any, setFieldValue: any, setValues: any) => {
    setIsAIEvaluating(true);
    
    try {
      const partner = partners.find(p => p.id === program?.partnerId);
      const request = {
        projectData: {
          title: project.title,
          description: project.description,
          budget: project.budget,
          timeline: project.timeline,
          tags: project.tags,
          submissionDate: project.submissionDate?.toLocaleDateString()
        },
        evaluationCriteria: program.evaluationCriteria,
        customPrompt: program.customAiPrompt,
        programContext: {
          name: program.name,
          description: program.description || '',
          partnerName: partner?.name || 'Non spécifié',
          budgetRange: `${program.budget.toLocaleString()} FCFA`
        }
      };

      const response = await aiEvaluationService.evaluateProject(request);
      
      // Préparer les nouvelles valeurs pour Formik
      const newValues: any = {};
      
      // Mettre à jour les scores et commentaires
      program.evaluationCriteria.forEach((criterion: any) => {
        const score = response.scores[criterion.name];
        if (score !== undefined) {
          newValues[`score_${criterion.id}`] = score;
          
          // Générer un commentaire basé sur le score
          const percentage = (score / criterion.maxScore) * 100;
          let comment = '';
          if (percentage >= 75) {
            comment = `Score élevé (${score}/${criterion.maxScore}) - Le projet répond excellemment à ce critère.`;
          } else if (percentage >= 50) {
            comment = `Score moyen (${score}/${criterion.maxScore}) - Le projet répond partiellement à ce critère avec des améliorations possibles.`;
          } else {
            comment = `Score faible (${score}/${criterion.maxScore}) - Le projet présente des lacunes importantes sur ce critère.`;
          }
          
          newValues[`comment_${criterion.id}`] = `[IA] ${comment}`;
        }
      });
      
      // Mettre à jour les notes globales et la décision
      newValues.evaluationNotes = `[Évaluation IA] ${response.notes}`;
      newValues.decision = response.recommendation;
      
      // Appliquer toutes les mises à jour
      setValues((prevValues: any) => ({
        ...prevValues,
        ...newValues
      }));
      
    } catch (error) {
      console.error('Erreur lors de l\'évaluation IA:', error);
      alert(`Erreur lors de l\'évaluation par IA: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsAIEvaluating(false);
    }
  };
  
  const handleSubmitEvaluatedProject = async (project: Project) => {
    if (!project.recommendedStatus) return;
    
    try {
      await updateProject(project.id, {
        status: project.recommendedStatus,
        manuallySubmitted: true,
      });
    } catch (error) {
      console.error('Error submitting evaluated project:', error);
    }
  };
  
  const handleGenerateReport = async (project: Project) => {
    const program = programs.find(p => p.id === project.programId);
    const partner = program ? partners.find(p => p.id === program.partnerId) : null;
    
    if (!program) {
      alert('Programme non trouvé pour ce projet');
      return;
    }
    
    setIsGeneratingReport(true);
    
    try {
      await generateEvaluationReport(project, program, partner);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Erreur lors de la génération du rapport');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Fonction de simulation conservée comme fallback
  const simulateAIEvaluation = async (projectData: any, criteria: any[]) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const scores: Record<string, number> = {};
    
    criteria.forEach(criterion => {
      let score = Math.floor(Math.random() * (criterion.maxScore * 0.4)) + Math.floor(criterion.maxScore * 0.6);
      
      const description = projectData.description?.toLowerCase() || '';
      const title = projectData.title?.toLowerCase() || '';
      
      if (criterion.name.toLowerCase().includes('innovation')) {
        if (description.includes('nouveau') || description.includes('innovant') || title.includes('ia')) {
          score = Math.min(criterion.maxScore, score + 2);
        }
      }
      
      if (criterion.name.toLowerCase().includes('faisabilité')) {
        if (projectData.budget > 100000000) {
          score = Math.max(1, score - 1);
        }
      }
      
      if (criterion.name.toLowerCase().includes('impact')) {
        if (projectData.tags?.some((tag: string) => 
          ['environnement', 'santé', 'education'].includes(tag.toLowerCase())
        )) {
          score = Math.min(criterion.maxScore, score + 1);
        }
      }
      
      scores[criterion.name] = Math.max(0, Math.min(criterion.maxScore, score));
    });
    
    const totalScore = criteria.reduce((total, criterion) => {
      return total + (scores[criterion.name] / criterion.maxScore) * criterion.weight;
    }, 0);
    
    let recommendation = 'rejected';
    if (totalScore >= 80) recommendation = 'selected';

    )
  }
}    else if (totalScore >= 60) recommendation = 'pre_selected';
    
    return {
      scores,
      notes: `Évaluation automatique basée sur l'analyse du contenu du projet. Score total calculé: ${Math.round(totalScore)}%. ${
        totalScore >= 80 ? 'Projet très prometteur avec des critères solides.' :
        totalScore >= 60 ? 'Projet intéressant nécessitant quelques améliorations.' :
        'Projet nécessitant des améliorations significatives avant acceptation.'
      }`,
      recommendation
    };
  };

  // Version simplifiée pour la compatibilité
  const handleAIEvaluationLegacy = async (project: Project, program: any, setFieldValue: any, setValues: any) => {
    setIsAIEvaluating(true);
    
    try {
      const projectData = {
        title: project.title,
        description: project.description,
        budget: project.budget,
        timeline: project.timeline,
        tags: project.tags,
        submissionDate: project.submissionDate?.toLocaleDateString()
      };
      
      const response = await simulateAIEvaluation(projectData, program.evaluationCriteria);
      
      if (response.scores) {
        const newValues: any = {};
        
        program.evaluationCriteria.forEach((criterion: any) => {
          if (response.scores[criterion.name] !== undefined) {
            const score = response.scores[criterion.name];
            const maxScore = criterion.maxScore;
            const percentage = (score / maxScore) * 100;
            
            newValues[`score_${criterion.id}`] = score;
            
            let aiComment = '';
            if (percentage >= 75) {
              aiComment = `Score élevé (${score}/${maxScore}) - Le projet répond excellemment à ce critère.`;
            } else if (percentage >= 50) {
              aiComment = `Score moyen (${score}/${maxScore}) - Le projet répond partiellement à ce critère avec des améliorations possibles.`;
            } else {
              aiComment = `Score faible (${score}/${maxScore}) - Le projet présente des lacunes importantes sur ce critère.`;
            }
            
            newValues[`comment_${criterion.id}`] = `[IA] ${aiComment}`;
          }
        });
        
        if (response.notes) {
          newValues.evaluationNotes = `[Évaluation IA] ${response.notes}`;
        }
        
        if (response.recommendation) {
          newValues.decision = response.recommendation;
        }
        
        setValues((prevValues: any) => ({
          ...prevValues,
          ...newValues
        }));
      }
      
    } catch (error) {
      console.error('Erreur lors de l\'évaluation IA:', error);
      alert('Erreur lors de l\'évaluation par IA. Veuillez réessayer.');
    } finally {
      setIsAIEvaluating(false);
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
          
          {/* Bulk Evaluation Controls */}
          {submittedProjects.length > 0 && (
            <Card className="mb-6 border-l-4 border-l-secondary-500">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-secondary-600" />
                  Évaluation IA en lot
                </CardTitle>
                <CardDescription>
                  Sélectionnez plusieurs projets pour les évaluer automatiquement par IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      disabled={isBulkEvaluating}
                    >
                      Tout sélectionner
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeselectAll}
                      disabled={isBulkEvaluating}
                    >
                      Tout désélectionner
                    </Button>
                    <span className="text-sm text-gray-600">
                      {selectedProjects.length} projet(s) sélectionné(s)
                    </span>
                  </div>
                  
                  <Button
                    variant="secondary"
                    onClick={handleBulkAIEvaluation}
                    disabled={selectedProjects.length === 0 || isBulkEvaluating}
                    isLoading={isBulkEvaluating}
                    leftIcon={<Sparkles className="h-4 w-4" />}
                  >
                    {isBulkEvaluating ? 'Évaluation en cours...' : 'Évaluer par IA'}
                  </Button>
                </div>
                
                {bulkEvaluationProgress && (
                  <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-secondary-800">
                        Évaluation en cours...
                      </span>
                      <span className="text-sm text-secondary-600">
                        {bulkEvaluationProgress.current}/{bulkEvaluationProgress.total}
                      </span>
                    </div>
                    <div className="w-full bg-secondary-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-secondary-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(bulkEvaluationProgress.current / bulkEvaluationProgress.total) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-secondary-700">
                      Projet actuel: {bulkEvaluationProgress.currentProject}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Projets à évaluer</h2>
            
            {submittedProjects.length > 0 ? (
              <div className="space-y-4">
                {submittedProjects.map(project => {
                  const program = programs.find(p => p.id === project.programId);
                  const partner = program ? partners.find(p => p.id === program.partnerId) : null;
                  const isSelected = selectedProjects.includes(project.id);
                  const isEvaluated = project.evaluationScores && project.evaluatedBy;
                  
                  return (
                    <div 
                      key={project.id} 
                      className={`border rounded-md p-4 transition-colors ${
                        isSelected 
                          ? 'border-secondary-300 bg-secondary-50' 
                          : isEvaluated
                          ? 'border-success-300 bg-success-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex items-center pt-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (e.target.checked) {
                                setSelectedProjects(prev => [...prev, project.id]);
                              } else {
                                setSelectedProjects(prev => prev.filter(id => id !== project.id));
                              }
                            }}
                            disabled={isBulkEvaluating}
                            className="h-4 w-4 text-secondary-600 border-gray-300 rounded focus:ring-secondary-500"
                          />
                        </div>
                        
                        <div>
                          <h3 
                            className="text-md font-medium text-gray-900 cursor-pointer hover:text-primary-600"
                            onClick={() => handleSelectProjectForEvaluation(project)}
                          >
                            {project.title}
                          </h3>
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
                          
                          {isEvaluated && (
                            <div className="mt-2 p-2 bg-success-100 border border-success-200 rounded-md">
                              <div className="text-xs text-success-800 font-medium">
                                ✅ Évalué le {project.evaluationDate?.toLocaleDateString()}
                              </div>
                              <div className="text-xs text-success-700">
                                Score: {project.totalEvaluationScore}% • 
                                Recommandation: {project.recommendedStatus === 'selected' ? 'Sélectionné' : 
                                                project.recommendedStatus === 'pre_selected' ? 'Présélectionné' : 'Rejeté'}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end ml-auto">
                          <div className="flex items-center space-x-2">
                            <ProjectStatusBadge status={project.status} />
                            {!isEvaluated ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelectProjectForEvaluation(project)}
                                disabled={isBulkEvaluating}
                              >
                                Évaluer
                              </Button>
                            ) : (
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleGenerateReport(project)}
                                  disabled={isGeneratingReport}
                                >
                                  📄 Rapport PDF
                                </Button>
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleSubmitEvaluatedProject(project)}
                                >
                                  ✅ Soumettre
                                </Button>
                              </div>
                            )}
                          </div>
                          {program && (
                            <div className="mt-2 text-xs text-gray-500 flex items-center">
                              <Award className="h-3 w-3 mr-1" />
                              {program.evaluationCriteria.length} critères
                            </div>
                          )}
                        </div>
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
                  decision: 'pre_selected', // This will be stored as recommendedStatus
                };
                
                // Initialize scores for each criterion
                program.evaluationCriteria.forEach(criterion => {
                  initialValues[`score_${criterion.id}`] = 0;
                  initialValues[`comment_${criterion.id}`] = '';
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
                          {({ values, isSubmitting, isValid, setFieldValue, setValues }) => (
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
                                          
                                          <div className="mt-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                              Justification de la note
                                            </label>
                                            <Field
                                              as="textarea"
                                              name={`comment_${criterion.id}`}
                                              rows={2}
                                              className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                              placeholder="Expliquez pourquoi vous attribuez cette note..."
                                            />
                                          </div>
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
                               <div className="flex space-x-3">
                                 <Button
                                   type="button"
                                   variant="secondary"
                                   onClick={() => handleAIEvaluation(selectedProject, program, setFieldValue, setValues)}
                                   leftIcon={<Sparkles className="h-4 w-4" />}
                                   disabled={isSubmitting || isAIEvaluating}
                                   isLoading={isAIEvaluating}
                                 >
                                   {isAIEvaluating ? 'Analyse en cours...' : 'Évaluation IA'}
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
                               </div>
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