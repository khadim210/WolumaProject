import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProgramStore } from '../../stores/programStore';
import { useFormTemplateStore } from '../../stores/formTemplateStore';
import { useProjectStore } from '../../stores/projectStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { AlertCircle, CheckCircle, Lock } from 'lucide-react';

const PublicSubmissionPage: React.FC = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const { programs, fetchPrograms } = useProgramStore();
  const { templates, fetchTemplates } = useFormTemplateStore();
  const { addProject } = useProjectStore();

  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    organization: ''
  });

  const program = programs.find(p => p.id === programId);
  const template = program?.formTemplateId ? templates.find(t => t.id === program.formTemplateId) : null;

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchPrograms();
        await fetchTemplates();
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchPrograms, fetchTemplates]);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!program || !template) return;

    if (!userInfo.name || !userInfo.email) {
      alert('Veuillez remplir vos informations de contact');
      setShowRegistration(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const submitterData = {
        name: userInfo.name,
        email: userInfo.email,
        organization: userInfo.organization
      };

      const projectData = {
        title: formData[template.fields[0]?.name] || `Soumission - ${userInfo.name}`,
        description: formData[template.fields[1]?.name] || 'Soumission publique',
        budget: parseFloat(formData.budget || '0'),
        timeline: formData.timeline || '12 mois',
        programId: program.id,
        submitterId: '00000000-0000-0000-0000-000000000001',
        status: 'submitted' as const,
        tags: ['public-submission'],
        formData: {
          ...formData,
          _submitterInfo: submitterData
        },
        manuallySubmitted: true,
        submittedAt: new Date().toISOString()
      };

      await addProject(projectData);
      setSubmissionSuccess(true);
    } catch (error) {
      console.error('Error submitting project:', error);
      alert('Erreur lors de la soumission du projet');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-error-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Programme non trouvé</h2>
            <p className="text-gray-600">Le programme que vous recherchez n'existe pas ou n'est plus disponible.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (program.isLocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <Lock className="mx-auto h-12 w-12 text-warning-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Programme verrouillé</h2>
            <p className="text-gray-600 mb-4">
              Ce programme n'accepte plus de nouvelles soumissions pour le moment.
            </p>
            <p className="text-sm text-gray-500">
              Veuillez contacter l'administrateur pour plus d'informations.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-warning-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Formulaire non configuré</h2>
            <p className="text-gray-600">
              Ce programme n'a pas encore de formulaire de soumission configuré.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submissionSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <CheckCircle className="mx-auto h-12 w-12 text-success-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Soumission réussie!</h2>
            <p className="text-gray-600 mb-6">
              Votre projet a été soumis avec succès au programme "{program.name}".
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Vous recevrez un email de confirmation à l'adresse: {userInfo.email}
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/register')}
            >
              Créer un compte pour suivre votre soumission
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{program.name}</CardTitle>
            <p className="text-gray-600 mt-2">{program.description}</p>
          </CardHeader>
        </Card>

        <form onSubmit={handleSubmit}>
          {!showRegistration && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    Avant de soumettre votre projet, veuillez d'abord renseigner vos informations de contact.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setShowRegistration(true)}
                >
                  Renseigner mes informations
                </Button>
              </CardContent>
            </Card>
          )}

          {showRegistration && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Vos informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet <span className="text-error-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={userInfo.name}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-error-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={userInfo.email}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organisation
                  </label>
                  <input
                    type="text"
                    value={userInfo.organization}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, organization: e.target.value }))}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {userInfo.name && userInfo.email && (
            <Card>
              <CardHeader>
                <CardTitle>Formulaire de soumission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {template.fields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-error-600 ml-1">*</span>}
                    </label>

                    {field.type === 'textarea' ? (
                      <textarea
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        rows={4}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    ) : field.type === 'select' ? (
                      <select
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      >
                        <option value="">Sélectionnez une option</option>
                        {field.options?.map((option, idx) => (
                          <option key={idx} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'file' ? (
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFieldChange(field.name, file.name);
                        }}
                        className="w-full"
                      />
                    ) : (
                      <input
                        type={field.type}
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    )}

                    {field.description && (
                      <p className="mt-1 text-sm text-gray-500">{field.description}</p>
                    )}
                  </div>
                ))}

                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Soumission en cours...' : 'Soumettre le projet'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </div>
    </div>
  );
};

export default PublicSubmissionPage;
