import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const AuthLayout: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <img 
            src="/logo_couleur.png" 
            alt="Woluma" 
            className="h-20 w-auto"
          />
        </div>
        <p className="mt-2 text-center text-lg font-medium text-primary-600">
          Plateforme d'Évaluation et de Financement de Projets
        </p>
        <p className="mt-1 text-center text-sm text-gray-600">
          Soumettez, évaluez, et suivez des projets facilement
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10 border border-gray-100">
          <Outlet />
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          © 2025 Woluma. Tous droits réservés.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;