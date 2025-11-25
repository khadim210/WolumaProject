import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProgramStore } from '../../stores/programStore';
import { useFormTemplateStore } from '../../stores/formTemplateStore';
import { useProjectStore } from '../../stores/projectStore';
import { useAuthStore } from '../../stores/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import {
  FileText,
  Send,
  CheckCircle,
  AlertCircle,
  User,
  Mail,
  Lock,
  Building
} from 'lucide-react';

const PublicSubmissionPage: React.FC = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();

  const { programs, fetchPrograms } = useProgramStore();
  const { templates, fetchTemplates } = useFormTemplateStore();
  const { addProject } = useProjectStore();
  const { register, isAuthenticated, user } = useAuthStore();

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Données d'enregistrement
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organization: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔍 Loading data for programId:', programId);
        await fetchPrograms();
        await fetchTemplates();
        console.log('✅ Data loaded. Programs count:', programs.length);
      } catch (error) {
        console.error('❌ Error loading data:', error);
      }
    };
    loadData();
  }, [fetchPrograms, fetchTemplates, programId]);

  const program = programs.find(p => p.id === programId);
  const template = program?.formTemplateId
    ? templates.find(t => t.id === program.formTemplateId)
    : null;

  useEffect(() => {
    if (programs.length > 0) {
      console.log('📋 Available programs:', programs.map(p => ({ id: p.id, name: p.name })));
      console.log('🎯 Looking for program:', programId);
      console.log('✨ Program found:', program ? program.name : 'NOT FOUND');
    }
  }, [programs, programId, program]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!program) return;

    setIsSubmitting(true);
    try {
      // Si l'utilisateur n'est pas connecté, montrer le formulaire d'inscription
      if (!isAuthenticated) {
        setShowRegisterForm(true);
        setIsSubmitting(false);
        return;
      }

      // Créer le projet
      await addProject({
        title: formData.project_name || formData.nom_de_la_startup || 'Projet sans titre',
        description: formData.description || formData.probleme || 'Description du projet',
        status: 'submitted',
        budget: 0,
        timeline: '12 mois',
        submitterId: user!.id,
        programId: program.id,
        submissionDate: new Date(),
        tags: [],
        formData: formData,
        submittedAt: new Date()
      });

      setSubmitSuccess(true);
    } catch (error) {
      console.error('Error submitting project:', error);
      alert('Erreur lors de la soumission du projet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registerData.password !== registerData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas.');
      return;
    }

    if (registerData.password.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setIsSubmitting(true);
    try {
      // S'enregistrer
      await register(
        registerData.email,
        registerData.password,
        registerData.name,
        'submitter',
        registerData.organization
      );

      // Soumettre le projet
      await addProject({
        title: formData.project_name || formData.nom_de_la_startup || 'Projet sans titre',
        description: formData.description || formData.probleme || 'Description du projet',
        status: 'submitted',
        budget: 0,
        timeline: '12 mois',
        submitterId: user!.id,
        programId: program!.id,
        submissionDate: new Date(),
        tags: [],
        formData: formData,
        submittedAt: new Date()
      });

      setSubmitSuccess(true);
    } catch (error) {
      console.error('Error registering and submitting:', error);
      alert('Erreur lors de l\'enregistrement. Cet email est peut-être déjà utilisé.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!program && programs.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Programme Introuvable
              </h3>
              <p className="text-gray-600 mb-4">
                Le programme demandé n'existe pas ou n'est plus disponible.
              </p>
              <div className="bg-gray-100 rounded-lg p-4 text-left">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>ID recherché:</strong> <code className="bg-white px-2 py-1 rounded">{programId}</code>
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Programmes disponibles:</strong>
                </p>
                <ul className="mt-2 space-y-1">
                  {programs.slice(0, 5).map(p => (
                    <li key={p.id} className="text-xs text-gray-600">
                      • {p.name} <code className="bg-white px-1 rounded ml-1">{p.id}</code>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Chargement...
              </h3>
              <p className="text-gray-600">
                Récupération des informations du programme
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Projet Soumis avec Succès!
              </h3>
              <p className="text-gray-600 mb-6">
                Votre projet a été soumis au programme <strong>{program.name}</strong>.
                Vous recevrez une notification par email concernant l'état de votre candidature.
              </p>
              <Button
                onClick={() => navigate('/')}
                className="w-full"
              >
                Retour à l'accueil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showRegisterForm) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Créer un Compte</h2>
            <p className="mt-2 text-sm text-gray-600">
              Pour finaliser votre soumission au programme <strong>{program.name}</strong>
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleRegisterAndSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Jean Dupont"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="jean@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organisation (optionnel)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={registerData.organization}
                      onChange={(e) => setRegisterData({ ...registerData, organization: e.target.value })}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Mon Entreprise"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      required
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Minimum 6 caractères</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      required
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowRegisterForm(false)}
                    className="flex-1"
                  >
                    Retour
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    className="flex-1"
                  >
                    S'inscrire et Soumettre
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {program.name}
          </h1>
          <p className="text-lg text-gray-600">
            {program.description}
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-6 w-6 mr-2 text-blue-600" />
              Formulaire de Candidature
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!template ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <p className="text-gray-600">
                  Aucun formulaire n'est associé à ce programme pour le moment.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitProject} className="space-y-6">
                {template.fields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>

                    {field.type === 'text' && (
                      <input
                        type="text"
                        required={field.required}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}

                    {field.type === 'email' && (
                      <input
                        type="email"
                        required={field.required}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}

                    {field.type === 'number' && (
                      <input
                        type="number"
                        required={field.required}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}

                    {field.type === 'textarea' && (
                      <textarea
                        required={field.required}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        rows={4}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}

                    {field.type === 'select' && field.options && (
                      <select
                        required={field.required}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Sélectionnez une option</option>
                        {field.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}

                    {field.type === 'checkbox' && (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData[field.id] || false}
                          onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-600">{field.placeholder}</span>
                      </div>
                    )}

                    {field.type === 'date' && (
                      <input
                        type="date"
                        required={field.required}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}

                    {field.type === 'file' && (
                      <input
                        type="file"
                        required={field.required}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFieldChange(field.id, file.name);
                          }
                        }}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100"
                      />
                    )}

                    {field.helperText && (
                      <p className="mt-1 text-sm text-gray-500">{field.helperText}</p>
                    )}
                  </div>
                ))}

                <div className="pt-6 border-t">
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    leftIcon={<Send className="h-5 w-5" />}
                    className="w-full"
                  >
                    {isAuthenticated ? 'Soumettre le Projet' : 'Continuer vers l\'inscription'}
                  </Button>
                  {!isAuthenticated && (
                    <p className="mt-2 text-sm text-center text-gray-500">
                      Vous devrez créer un compte pour finaliser votre soumission
                    </p>
                  )}
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicSubmissionPage;
