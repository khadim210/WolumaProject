import React, { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
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
  Calendar 
} from 'lucide-react';

const MonitoringPage = () => {
  const { projects } = useProjectStore();
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  // Mock monitoring data
  const monitoringData = {
    projectProgress: 75,
    budgetUtilization: 65,
    milestones: [
      { id: 1, name: 'Phase 1: Initiation', status: 'completed', date: '2025-01-15' },
      { id: 2, name: 'Phase 2: Planning', status: 'completed', date: '2025-02-01' },
      { id: 3, name: 'Phase 3: Execution', status: 'in_progress', date: '2025-03-15' },
      { id: 4, name: 'Phase 4: Monitoring', status: 'pending', date: '2025-04-01' },
      { id: 5, name: 'Phase 5: Closure', status: 'pending', date: '2025-05-15' }
    ],
    risks: [
      { id: 1, description: 'Retard dans la livraison des équipements', level: 'high', status: 'active' },
      { id: 2, description: 'Dépassement budgétaire potentiel', level: 'medium', status: 'mitigated' },
      { id: 3, description: 'Problèmes techniques imprévus', level: 'low', status: 'active' }
    ],
    recentUpdates: [
      { id: 1, date: '2025-03-10', description: 'Réunion de suivi mensuelle effectuée', type: 'meeting' },
      { id: 2, date: '2025-03-08', description: 'Rapport d\'avancement soumis', type: 'report' },
      { id: 3, date: '2025-03-05', description: 'Validation des livrables de la Phase 2', type: 'milestone' }
    ]
  };

  const renderProgressBar = (percentage: number, color: string) => (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div 
        className={`h-2.5 rounded-full ${color} transition-all duration-300`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Suivi des Projets</h1>
        
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Projets en cours</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">12</p>
              </div>
              <div className="p-2 bg-primary-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-primary-600" />
              </div>
            </div>
            {renderProgressBar(75, 'bg-primary-600')}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taux de réussite</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">85%</p>
              </div>
              <div className="p-2 bg-success-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-success-600" />
              </div>
            </div>
            {renderProgressBar(85, 'bg-success-600')}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Risques actifs</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">3</p>
              </div>
              <div className="p-2 bg-warning-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-warning-600" />
              </div>
            </div>
            {renderProgressBar(30, 'bg-warning-600')}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Jalons complétés</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">8/12</p>
              </div>
              <div className="p-2 bg-secondary-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-secondary-600" />
              </div>
            </div>
            {renderProgressBar(66, 'bg-secondary-600')}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Jalons du projet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monitoringData.milestones.map(milestone => (
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
                      <span className="text-sm text-gray-500">{milestone.date}</span>
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
              {monitoringData.risks.map(risk => (
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
          <div className="flow-root">
            <ul role="list" className="-mb-8">
              {monitoringData.recentUpdates.map((update, updateIdx) => (
                <li key={update.id}>
                  <div className="relative pb-8">
                    {updateIdx !== monitoringData.recentUpdates.length - 1 ? (
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
                          <p className="text-sm text-gray-500">{update.description}</p>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default MonitoringPage;