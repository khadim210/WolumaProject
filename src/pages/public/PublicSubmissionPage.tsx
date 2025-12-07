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
  Building,
  FolderOpen
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
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Données d'identification
  const [submitterInfo, setSubmitterInfo] = useState({
    projectName: '',
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

  const handleSubmitterInfoChange = (field: string, value: string) => {
    setSubmitterInfo(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Si l'utilisateur n'est pas déjà authentifié, valider les champs d'identification
    if (!isAuthenticated) {
      if (!submitterInfo.projectName.trim()) {
        newErrors.projectName = 'Le nom du projet est requis';
      }

      if (!submitterInfo.name.trim()) {
        newErrors.name = 'Le nom complet est requis';
      }

      if (!submitterInfo.email.trim()) {
        newErrors.email = 'L\'email est requis';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitterInfo.email)) {
        newErrors.email = 'Email invalide';
      }

      if (!submitterInfo.password) {
        newErrors.password = 'Le mot de passe est requis';
      } else if (submitterInfo.password.length < 6) {
        newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
      }

      if (submitterInfo.password !== submitterInfo.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    } else if (!submitterInfo.projectName.trim()) {
      newErrors.projectName = 'Le nom du projet est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!program) return;

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      let submitterId = user?.id;

      // Si l'utilisateur n'est pas connecté, créer le compte
      if (!isAuthenticated) {
        const registered = await register(
          submitterInfo.email,
          submitterInfo.password,
          submitterInfo.name,
          'submitter',
          submitterInfo.organization
        );

        if (!registered) {
          throw new Error('Échec de la création du compte');
        }

        // Récupérer l'ID de l'utilisateur nouvellement créé
        const { user: authUser } = useAuthStore.getState();
        submitterId = authUser?.id;
      }

      if (!submitterId) {
        throw new Error('Impossible d\'identifier l\'utilisateur');
      }

      // Créer le projet
      await addProject({
        title: submitterInfo.projectName,
        description: formData.description || formData.probleme || 'Description du projet',
        status: 'submitted',
        budget: 0,
        timeline: '12 mois',
        submitterId: submitterId,
        programId: program.id,
        submissionDate: new Date(),
        tags: [],
        formData: formData,
        submittedAt: new Date()
      });

      setSubmitSuccess(true);
    } catch (error) {
      console.error('Error submitting project:', error);
      if (error instanceof Error) {
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          alert('Cet email est déjà utilisé. Veuillez utiliser un autre email ou vous connecter.');
        } else {
          alert(`Erreur lors de la soumission: ${error.message}`);
        }
      } else {
        alert('Erreur lors de la soumission du projet. Veuillez réessayer.');
      }
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
                Votre projet <strong>{submitterInfo.projectName}</strong> a été soumis au programme <strong>{program.name}</strong>.
                {!isAuthenticated && (
                  <>
                    <br /><br />
                    Un compte a été créé avec l'email <strong>{submitterInfo.email}</strong>.
                  </>
                )}
                <br /><br />
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Informations du Soumissionnaire */}
          {!isAuthenticated && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-6 w-6 mr-2 text-blue-600" />
                  Vos Informations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Un compte sera créé automatiquement pour suivre votre candidature.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={submitterInfo.name}
                      onChange={(e) => handleSubmitterInfoChange('name', e.target.value)}
                      className={`pl-10 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Jean Dupont"
                    />
                  </div>
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={submitterInfo.email}
                      onChange={(e) => handleSubmitterInfoChange('email', e.target.value)}
                      className={`pl-10 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="jean@example.com"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organisation
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={submitterInfo.organization}
                      onChange={(e) => handleSubmitterInfoChange('organization', e.target.value)}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Mon Entreprise (optionnel)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      value={submitterInfo.password}
                      onChange={(e) => handleSubmitterInfoChange('password', e.target.value)}
                      className={`pl-10 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        errors.password ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                  {!errors.password && <p className="mt-1 text-xs text-gray-500">Minimum 6 caractères</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      value={submitterInfo.confirmPassword}
                      onChange={(e) => handleSubmitterInfoChange('confirmPassword', e.target.value)}
                      className={`pl-10 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section: Nom du Projet */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FolderOpen className="h-6 w-6 mr-2 text-blue-600" />
                Votre Projet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du projet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={submitterInfo.projectName}
                  onChange={(e) => handleSubmitterInfoChange('projectName', e.target.value)}
                  className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors.projectName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Application mobile de gestion agricole"
                />
                {errors.projectName && <p className="mt-1 text-sm text-red-600">{errors.projectName}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Section: Formulaire de Candidature */}
          <Card>
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
                <div className="space-y-6">
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
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bouton de soumission */}
          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              isLoading={isSubmitting}
              leftIcon={<Send className="h-5 w-5" />}
              className="w-full sm:w-auto px-8"
              size="lg"
            >
              {isSubmitting ? 'Soumission en cours...' : 'Soumettre le Projet'}
            </Button>
          </div>

          {!isAuthenticated && (
            <p className="text-sm text-center text-gray-500">
              En soumettant ce formulaire, un compte sera automatiquement créé pour vous permettre de suivre votre candidature.
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default PublicSubmissionPage;
