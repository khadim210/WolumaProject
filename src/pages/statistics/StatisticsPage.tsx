import React, { useState } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '../../components/ui/Card';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const StatisticsPage = () => {
  const [timeframe, setTimeframe] = useState('year');

  // Mock data for project statistics
  const mockData = {
    projectsByStatus: {
      labels: ['Soumis', 'En revue', 'Présélectionné', 'Sélectionné', 'Financé', 'Clôturé'],
      datasets: [{
        label: 'Nombre de projets',
        data: [12, 8, 6, 4, 3, 2],
        backgroundColor: [
          'rgba(59, 130, 246, 0.5)', // primary
          'rgba(16, 185, 129, 0.5)', // secondary
          'rgba(251, 191, 36, 0.5)', // warning
          'rgba(34, 197, 94, 0.5)',  // success
          'rgba(239, 68, 68, 0.5)',  // error
          'rgba(107, 114, 128, 0.5)' // gray
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(251, 191, 36)',
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)',
          'rgb(107, 114, 128)'
        ],
        borderWidth: 1
      }]
    },
    monthlySubmissions: {
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
      datasets: [{
        label: 'Projets soumis',
        data: [5, 8, 12, 9, 7, 15, 10, 13, 11, 8, 14, 12],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4
      }]
    },
    budgetDistribution: {
      labels: ['< 50k€', '50k€-100k€', '100k€-250k€', '250k€-500k€', '> 500k€'],
      datasets: [{
        label: 'Nombre de projets',
        data: [8, 12, 15, 6, 4],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(251, 191, 36, 0.7)',
          'rgba(34, 197, 94, 0.7)',
          'rgba(239, 68, 68, 0.7)'
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(251, 191, 36)',
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 1
      }]
    }
  };

  const kpis = [
    {
      label: 'Taux d\'acceptation',
      value: '45%',
      change: '+5%',
      positive: true
    },
    {
      label: 'Budget moyen',
      value: '185k€',
      change: '+12%',
      positive: true
    },
    {
      label: 'Durée moyenne',
      value: '18 mois',
      change: '-2 mois',
      positive: false
    },
    {
      label: 'Projets actifs',
      value: '24',
      change: '+3',
      positive: true
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Statistiques</h1>
        
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          <option value="month">Dernier mois</option>
          <option value="quarter">Dernier trimestre</option>
          <option value="year">Dernière année</option>
          <option value="all">Toutes les périodes</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{kpi.label}</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{kpi.value}</p>
                </div>
                <div className={`flex items-center ${kpi.positive ? 'text-success-600' : 'text-error-600'}`}>
                  {kpi.positive ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium ml-1">{kpi.change}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribution par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar
                data={mockData.projectsByStatus}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1
                      }
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Soumissions mensuelles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line
                data={mockData.monthlySubmissions}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 5
                      }
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Distribution des budgets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar
                data={mockData.budgetDistribution}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 5
                      }
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition des projets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <Doughnut
                data={mockData.projectsByStatus}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tableau récapitulatif</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget total
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durée moyenne
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[
                  { status: 'Soumis', count: 12, budget: '2.4M€', duration: '15 mois' },
                  { status: 'En revue', count: 8, budget: '1.6M€', duration: '18 mois' },
                  { status: 'Présélectionné', count: 6, budget: '1.2M€', duration: '16 mois' },
                  { status: 'Sélectionné', count: 4, budget: '800k€', duration: '20 mois' },
                  { status: 'Financé', count: 3, budget: '600k€', duration: '24 mois' },
                  { status: 'Clôturé', count: 2, budget: '400k€', duration: '12 mois' }
                ].map((row, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.budget}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.duration}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatisticsPage;