import React, { useMemo } from 'react';
import { ProjectStatus } from '../../stores/projectStore';

interface ProcessStepProps {
  number: number;
  title: string;
  isActive: boolean;
  isCompleted: boolean;
}

const ProcessStep: React.FC<ProcessStepProps> = ({ number, title, isActive, isCompleted }) => {
  const stepClasses = useMemo(() => {
    if (isCompleted) {
      return 'bg-success-600 text-white border-success-600 shadow-lg';
    }
    if (isActive) {
      return 'bg-gradient-to-r from-primary-600 to-secondary-500 text-white border-primary-600 shadow-lg';
    }
    return 'bg-white text-gray-500 border-gray-300 shadow-sm';
  }, [isActive, isCompleted]);

  const lineClasses = useMemo(() => {
    if (isCompleted) {
      return 'bg-gradient-to-b from-success-600 to-success-500';
    }
    return 'bg-gray-300';
  }, [isCompleted]);

  return (
    <div className="flex items-center">
      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${stepClasses} font-medium transition-all duration-300 transform hover:scale-110`}>
        {number}
      </div>
      <div className="ml-4 flex-1">
        <div className={`text-sm font-medium transition-colors ${isActive ? 'text-primary-700' : isCompleted ? 'text-success-700' : 'text-gray-600'}`}>
          {title}
        </div>
      </div>
    </div>
  );
};

const getStatusIndex = (status: ProjectStatus): number => {
  const statusOrder: ProjectStatus[] = [
    'draft',
    'submitted',
    'under_review',
    'pre_selected',
    'selected',
    'formalization',
    'financed',
    'monitoring',
    'closed'
  ];
  
  return statusOrder.indexOf(status);
};

interface ProcessDiagramProps {
  currentStatus: ProjectStatus;
  className?: string;
}

const ProcessDiagram: React.FC<ProcessDiagramProps> = ({ currentStatus, className }) => {
  const currentIndex = getStatusIndex(currentStatus);

  const steps = [
    { number: 1, title: 'Préparation', statuses: ['draft'] },
    { number: 2, title: 'Soumission', statuses: ['submitted'] },
    { number: 3, title: 'Sélection', statuses: ['under_review', 'pre_selected', 'selected'] },
    { number: 4, title: 'Formalisation', statuses: ['formalization'] },
    { number: 5, title: 'Suivi', statuses: ['financed', 'monitoring'] },
    { number: 6, title: 'Clôture', statuses: ['closed'] },
  ];

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="space-y-6">
        {steps.map((step, index) => {
          const stepIndex = getStatusIndex(step.statuses[0]);
          const isActive = step.statuses.includes(currentStatus);
          const isCompleted = stepIndex < currentIndex;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.number} className="relative">
              <ProcessStep
                number={step.number}
                title={step.title}
                isActive={isActive}
                isCompleted={isCompleted}
              />
              {!isLast && (
                <div className="absolute left-5 top-10 w-0.5 h-6 bg-gray-300 rounded-full overflow-hidden">
                  <div 
                    className={`w-0.5 transition-all duration-500 ${isCompleted ? 'bg-gradient-to-b from-success-600 to-success-500' : 'bg-gray-300'}`}
                    style={{ height: isCompleted ? '100%' : '0%' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProcessDiagram;