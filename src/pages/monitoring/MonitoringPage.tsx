import React, { useState, useEffect, useMemo } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useProgramStore } from '../../stores/programStore';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '../../components/ui/Card';
import {
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
  RefreshCw
} from 'lucide-react';
import Button from '../../components/ui/Button';

const MonitoringPage = () => {
  const { projects, fetchProjects, isLoading } = useProjectStore();
  const { programs, fetchPrograms } = useProgramStore();
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchProjects();
    fetchPrograms();
  }, [fetchProjects, fetchPrograms]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchProjects();
      fetchPrograms();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchProjects, fetchPrograms]);

  const filteredProjects = useMemo(() => {
    const now = new Date();
    const filterDate = new Date();

    switch (selectedPeriod) {
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        filterDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return projects;
    }

    return projects.filter(p => new Date(p.createdAt) >= filterDate);
  }, [projects, selectedPeriod]);

  const statistics = useMemo(() => {
    const monitoringProjects = filteredProjects.filter(p => p.status === 'monitoring');
    const financedProjects = filteredProjects.filter(p => p.status === 'financed');
    const activeProjects = filteredProjects.filter(p =>
      ['monitoring', 'financed', 'formalization'].includes(p.status)
    );

    const totalBudget = activeProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const successfulProjects = filteredProjects.filter(p =>
      ['financed', 'monitoring', 'closed'].includes(p.status)
    ).length;
    const totalProjects = filteredProjects.length;
    const successRate = totalProjects > 0 ? Math.round((successfulProjects / totalProjects) * 100) : 0;

    const recentUpdates = filteredProjects
      .filter(p => p.updatedAt)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10)
      .map(p => {
        let type = 'report';
        let description = `Projet "${p.title}" mis à jour`;

        if (p.status === 'financed' && p.submittedAt) {
          const submittedDate = new Date(p.submittedAt);
          const updatedDate = new Date(p.updatedAt);
          if (updatedDate.getTime() - submittedDate.getTime() < 86400000) {
            type = 'milestone';
            description = `Projet "${p.title}" a été financé`;
          }
        } else if (p.status === 'monitoring') {
          type = 'meeting';
          description = `Suivi du projet "${p.title}"`;
        }

        return {
          id: p.id,
          date: new Date(p.updatedAt).toLocaleDateString('fr-FR'),
          description,
          type,
          projectId: p.id
        };
      });

    const statusDistribution = {
      monitoring: monitoringProjects.length,
      financed: financedProjects.length,
      formalization: filteredProjects.filter(p => p.status === 'formalization').length,
      closed: filteredProjects.filter(p => p.status === 'closed').length
    };

    const milestones = [
      {
        id: 1,
        name: 'Projets soumis',
        status: 'completed' as const,
        count: filteredProjects.filter(p => p.status !== 'draft').length,
        date: 'Continu'
      },
      {
        id: 2,
        name: 'Projets éligibles',
        status: 'completed' as const,
        count: filteredProjects.filter(p => p.status === 'eligible').length,
        date: 'Continu'
      },
      {
        id: 3,
        name: 'Projets sélectionnés',
        status: activeProjects.length > 0 ? 'in_progress' as const : 'pending' as const,
        count: filteredProjects.filter(p => ['selected', 'pre_selected'].includes(p.status)).length,
        date: 'Continu'
      },
      {
        id: 4,
        name: 'Projets financés',
        status: financedProjects.length > 0 ? 'in_progress' as const : 'pending' as const,
        count: financedProjects.length,
        date: 'Continu'
      },
      {
        id: 5,
        name: 'Projets en suivi',
        status: monitoringProjects.length > 0 ? 'in_progress' as const : 'pending' as const,
        count: monitoringProjects.length,
        date: 'Continu'
      }
    ];

    const risks = [];
    if (activeProjects.length > 10) {
      risks.push({
        id: 1,
        description: `Charge de travail élevée: ${activeProjects.length} projets actifs`,
        level: 'medium' as const,
        status: 'active' as const
      });
    }

    const overdueProjects = filteredProjects.filter(p => {
      if (!p.submissionDate) return false;
      const daysSinceSubmission = Math.floor(
        (Date.now() - new Date(p.submissionDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceSubmission > 90 && ['submitted', 'under_review'].includes(p.status);
    });

    if (overdueProjects.length > 0) {
      risks.push({
        id: 2,
        description: `${overdueProjects.length} projet(s) en attente depuis plus de 90 jours`,
        level: 'high' as const,
        status: 'active' as const
      });
    }

    const lowScoreProjects = filteredProjects.filter(p =>
      p.totalEvaluationScore && p.totalEvaluationScore < 50
    );

    if (lowScoreProjects.length > 0) {
      risks.push({
        id: 3,
        description: `${lowScoreProjects.length} projet(s) avec score d'évaluation faible`,
        level: 'low' as const,
        status: 'active' as const
      });
    }

    if (risks.length === 0) {
      risks.push({
        id: 0,
        description: 'Aucun risque identifié pour le moment',
        level: 'low' as const,
        status: 'mitigated' as const
      });
    }

    return {
      activeProjectsCount: activeProjects.length,
      successRate,
      totalBudget,
      statusDistribution,
      milestones,
      risks,
      recentUpdates
    };
  }, [filteredProjects]);

  const renderProgressBar = (percentage: number, color: string) => (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div 
        className={`h-2.5 rounded-full ${color} transition-all duration-300`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );

  const handleManualRefresh = async () => {
    await Promise.all([fetchProjects(), fetchPrograms()]);
  };

  if (isLoading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suivi des Projets</h1>
          <p className="text-sm text-gray-600 mt-1">
            Statistiques mises à jour automatiquement toutes les 30 secondes
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            leftIcon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
            disabled={isLoading}
          >
            Actualiser
          </Button>

          <label className="flex items-center space-x-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            <span>Auto-actualisation</span>
          </label>

          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="all">Toutes les périodes</option>
            <option value="month">Dernier mois</option>
            <option value="quarter">Dernier trimestre</option>
            <option value="year">Dernière année</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Projets actifs</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{statistics.activeProjectsCount}</p>
                <p className="text-xs text-gray-500 mt-1">
                  En suivi, financement ou formalisation
                </p>
              </div>
              <div className="p-2 bg-primary-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-primary-600" />
              </div>
            </div>
            {renderProgressBar(
              filteredProjects.length > 0 ? Math.min((statistics.activeProjectsCount / filteredProjects.length) * 100, 100) : 0,
              'bg-primary-600'
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taux de réussite</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{statistics.successRate}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  Projets financés ou terminés
                </p>
              </div>
              <div className="p-2 bg-success-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-success-600" />
              </div>
            </div>
            {renderProgressBar(statistics.successRate, 'bg-success-600')}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Risques identifiés</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {statistics.risks.filter(r => r.status === 'active').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Nécessitant une attention
                </p>
              </div>
              <div className="p-2 bg-warning-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-warning-600" />
              </div>
            </div>
            {renderProgressBar(
              statistics.risks.length > 0 ? (statistics.risks.filter(r => r.status === 'active').length / statistics.risks.length) * 100 : 0,
              'bg-warning-600'
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Budget total actif</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {new Intl.NumberFormat('fr-FR', {
                    notation: 'compact',
                    compactDisplay: 'short'
                  }).format(statistics.totalBudget)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Projets en cours
                </p>
              </div>
              <div className="p-2 bg-secondary-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-secondary-600" />
              </div>
            </div>
            {renderProgressBar(100, 'bg-secondary-600')}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Étapes du workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statistics.milestones.map(milestone => (
                <div key={milestone.id} className="flex items-center">
                  <div className={`
                    flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                    ${milestone.status === 'completed' ? 'bg-success-100' :
                      milestone.status === 'in_progress' ? 'bg-primary-100' : 'bg-gray-100'}
                  `}>
                    {milestone.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-success-600" />
                    ) : milestone.status === 'in_progress' ? (
                      <Clock className="h-5 w-5 text-primary-600" />
                    ) : (
                      <Calendar className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{milestone.name}</p>
                      <span className="text-sm font-semibold text-gray-700">{milestone.count}</span>
                    </div>
                    <div className="mt-1">
                      <span className={`
                        inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                        ${milestone.status === 'completed' ? 'bg-success-100 text-success-800' :
                          milestone.status === 'in_progress' ? 'bg-primary-100 text-primary-800' :
                          'bg-gray-100 text-gray-800'}
                      `}>
                        {milestone.status === 'completed' ? 'Complété' :
                         milestone.status === 'in_progress' ? 'En cours' : 'À venir'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risques identifiés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statistics.risks.map(risk => (
                <div key={risk.id} className="flex items-start">
                  <div className={`
                    flex-shrink-0 w-2 h-2 mt-2 rounded-full
                    ${risk.level === 'high' ? 'bg-error-500' :
                      risk.level === 'medium' ? 'bg-warning-500' : 'bg-success-500'}
                  `} />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">{risk.description}</p>
                    <div className="mt-1 flex items-center space-x-2">
                      <span className={`
                        inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                        ${risk.level === 'high' ? 'bg-error-100 text-error-800' :
                          risk.level === 'medium' ? 'bg-warning-100 text-warning-800' :
                          'bg-success-100 text-success-800'}
                      `}>
                        {risk.level === 'high' ? 'Élevé' :
                         risk.level === 'medium' ? 'Moyen' : 'Faible'}
                      </span>
                      <span className={`
                        inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                        ${risk.status === 'active' ? 'bg-error-100 text-error-800' :
                          'bg-success-100 text-success-800'}
                      `}>
                        {risk.status === 'active' ? 'Actif' : 'Atténué'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mises à jour récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {statistics.recentUpdates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Aucune mise à jour récente</p>
            </div>
          ) : (
            <div className="flow-root">
              <ul role="list" className="-mb-8">
                {statistics.recentUpdates.map((update, updateIdx) => (
                  <li key={update.id}>
                    <div className="relative pb-8">
                      {updateIdx !== statistics.recentUpdates.length - 1 ? (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`
                            h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white
                            ${update.type === 'meeting' ? 'bg-primary-100' :
                              update.type === 'report' ? 'bg-warning-100' : 'bg-success-100'}
                          `}>
                            {update.type === 'meeting' ? (
                              <Calendar className="h-5 w-5 text-primary-600" />
                            ) : update.type === 'report' ? (
                              <BarChart3 className="h-5 w-5 text-warning-600" />
                            ) : (
                              <CheckCircle2 className="h-5 w-5 text-success-600" />
                            )}
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p className="text-sm text-gray-700">{update.description}</p>
                          </div>
                          <div className="whitespace-nowrap text-right text-sm text-gray-500">
                            <time dateTime={update.date}>{update.date}</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonitoringPage;