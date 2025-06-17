import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useParametersStore } from '../../stores/parametersStore';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardFooter
} from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { 
  Settings, 
  Shield, 
  Mail, 
  Database, 
  Bell, 
  Palette, 
  Globe,
  Save,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const parametersSchema = Yup.object().shape({
  siteName: Yup.string().required('Nom du site requis'),
  siteDescription: Yup.string().required('Description requise'),
  adminEmail: Yup.string().email('Email invalide').required('Email administrateur requis'),
  maxProjectsPerUser: Yup.number().min(1, 'Minimum 1').required('Limite requise'),
  evaluationDeadlineDays: Yup.number().min(1, 'Minimum 1 jour').required('Délai requis'),
  autoApprovalThreshold: Yup.number().min(0, 'Minimum 0').max(100, 'Maximum 100'),
});

const ParametersPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { parameters, updateParameters, resetToDefaults } = useParametersStore();
  const [activeTab, setActiveTab] = useState('general');
  const [isResetting, setIsResetting] = useState(false);

  const handleSaveParameters = async (values: any, { setSubmitting }: any) => {
    try {
      await updateParameters(values);
    } catch (error) {
      console.error('Error saving parameters:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetToDefaults = async () => {
    setIsResetting(true);
    try {
      await resetToDefaults();
    } catch (error) {
      console.error('Error resetting parameters:', error);
    } finally {
      setIsResetting(false);
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">Accès restreint</h2>
        <p className="text-gray-500">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Apparence', icon: Palette },
    { id: 'system', label: 'Système', icon: Database },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres système</h1>
          <p className="mt-1 text-gray-600">Configurez les paramètres de la plateforme</p>
        </div>
        <Button
          variant="outline"
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={handleResetToDefaults}
          isLoading={isResetting}
        >
          Réinitialiser
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <Card>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-none first:rounded-t-lg last:rounded-b-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          <Formik
            initialValues={parameters}
            validationSchema={parametersSchema}
            onSubmit={handleSaveParameters}
            enableReinitialize
          >
            {({ isSubmitting, values }) => (
              <Form>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      {tabs.find(tab => tab.id === activeTab)?.icon && 
                        React.createElement(tabs.find(tab => tab.id === activeTab)!.icon, { className: "h-5 w-5 mr-2" })
                      }
                      {tabs.find(tab => tab.id === activeTab)?.label}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {activeTab === 'general' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Nom du site</label>
                          <Field
                            name="siteName"
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                          <ErrorMessage name="siteName" component="div" className="mt-1 text-sm text-error-600" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Description du site</label>
                          <Field
                            as="textarea"
                            name="siteDescription"
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                          <ErrorMessage name="siteDescription" component="div" className="mt-1 text-sm text-error-600" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email administrateur</label>
                          <Field
                            name="adminEmail"
                            type="email"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                          <ErrorMessage name="adminEmail" component="div" className="mt-1 text-sm text-error-600" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Langue par défaut</label>
                          <Field
                            as="select"
                            name="defaultLanguage"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          >
                            <option value="fr">Français</option>
                            <option value="en">English</option>
                            <option value="es">Español</option>
                          </Field>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Fuseau horaire</label>
                          <Field
                            as="select"
                            name="timezone"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          >
                            <option value="UTC">UTC</option>
                            <option value="Europe/Paris">Europe/Paris</option>
                            <option value="Africa/Abidjan">Africa/Abidjan</option>
                            <option value="Africa/Dakar">Africa/Dakar</option>
                          </Field>
                        </div>
                      </>
                    )}

                    {activeTab === 'security' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Durée de session (minutes)</label>
                          <Field
                            name="sessionTimeout"
                            type="number"
                            min="15"
                            max="1440"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                          <p className="mt-1 text-sm text-gray-500">Durée avant déconnexion automatique</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Tentatives de connexion max</label>
                          <Field
                            name="maxLoginAttempts"
                            type="number"
                            min="3"
                            max="10"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                          <p className="mt-1 text-sm text-gray-500">Nombre de tentatives avant blocage</p>
                        </div>

                        <div>
                          <label className="flex items-center">
                            <Field
                              name="requireEmailVerification"
                              type="checkbox"
                              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-900">Vérification email obligatoire</span>
                          </label>
                        </div>

                        <div>
                          <label className="flex items-center">
                            <Field
                              name="enableTwoFactor"
                              type="checkbox"
                              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-900">Authentification à deux facteurs</span>
                          </label>
                        </div>

                        <div>
                          <label className="flex items-center">
                            <Field
                              name="enablePasswordPolicy"
                              type="checkbox"
                              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-900">Politique de mot de passe stricte</span>
                          </label>
                        </div>
                      </>
                    )}

                    {activeTab === 'notifications' && (
                      <>
                        <div>
                          <label className="flex items-center">
                            <Field
                              name="emailNotifications"
                              type="checkbox"
                              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-900">Notifications par email</span>
                          </label>
                        </div>

                        <div>
                          <label className="flex items-center">
                            <Field
                              name="notifyNewSubmissions"
                              type="checkbox"
                              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-900">Notifier les nouvelles soumissions</span>
                          </label>
                        </div>

                        <div>
                          <label className="flex items-center">
                            <Field
                              name="notifyStatusChanges"
                              type="checkbox"
                              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-900">Notifier les changements de statut</span>
                          </label>
                        </div>

                        <div>
                          <label className="flex items-center">
                            <Field
                              name="notifyDeadlines"
                              type="checkbox"
                              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-900">Notifier les échéances</span>
                          </label>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Serveur SMTP</label>
                          <Field
                            name="smtpServer"
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            placeholder="smtp.example.com"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Port SMTP</label>
                            <Field
                              name="smtpPort"
                              type="number"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                              placeholder="587"
                            />
                          </div>
                          <div>
                            <label className="flex items-center mt-6">
                              <Field
                                name="smtpSecure"
                                type="checkbox"
                                className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                              />
                              <span className="ml-2 text-sm text-gray-900">Connexion sécurisée</span>
                            </label>
                          </div>
                        </div>
                      </>
                    )}

                    {activeTab === 'appearance' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Thème par défaut</label>
                          <Field
                            as="select"
                            name="defaultTheme"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          >
                            <option value="light">Clair</option>
                            <option value="dark">Sombre</option>
                            <option value="auto">Automatique</option>
                          </Field>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Logo personnalisé</label>
                          <div className="mt-1 flex items-center">
                            <input
                              type="file"
                              accept="image/*"
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                            />
                          </div>
                          <p className="mt-1 text-sm text-gray-500">Format recommandé: PNG, 200x50px</p>
                        </div>

                        <div>
                          <label className="flex items-center">
                            <Field
                              name="showBranding"
                              type="checkbox"
                              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-900">Afficher le branding Woluma</span>
                          </label>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Couleur primaire</label>
                          <div className="mt-1 flex items-center space-x-3">
                            <Field
                              name="primaryColor"
                              type="color"
                              className="h-10 w-20 rounded border border-gray-300"
                            />
                            <Field
                              name="primaryColor"
                              type="text"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                              placeholder="#003366"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Couleur secondaire</label>
                          <div className="mt-1 flex items-center space-x-3">
                            <Field
                              name="secondaryColor"
                              type="color"
                              className="h-10 w-20 rounded border border-gray-300"
                            />
                            <Field
                              name="secondaryColor"
                              type="text"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                              placeholder="#00BFFF"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {activeTab === 'system' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Projets max par utilisateur</label>
                          <Field
                            name="maxProjectsPerUser"
                            type="number"
                            min="1"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                          <ErrorMessage name="maxProjectsPerUser" component="div" className="mt-1 text-sm text-error-600" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Délai d'évaluation (jours)</label>
                          <Field
                            name="evaluationDeadlineDays"
                            type="number"
                            min="1"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                          <ErrorMessage name="evaluationDeadlineDays" component="div" className="mt-1 text-sm text-error-600" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Seuil d'approbation automatique (%)</label>
                          <Field
                            name="autoApprovalThreshold"
                            type="number"
                            min="0"
                            max="100"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                          <ErrorMessage name="autoApprovalThreshold" component="div" className="mt-1 text-sm text-error-600" />
                          <p className="mt-1 text-sm text-gray-500">Score minimum pour approbation automatique</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Taille max fichier (MB)</label>
                          <Field
                            name="maxFileSize"
                            type="number"
                            min="1"
                            max="100"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="flex items-center">
                            <Field
                              name="enableMaintenanceMode"
                              type="checkbox"
                              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-900">Mode maintenance</span>
                          </label>
                          <p className="mt-1 text-sm text-gray-500">Désactive l'accès pour tous sauf les administrateurs</p>
                        </div>

                        <div>
                          <label className="flex items-center">
                            <Field
                              name="enableRegistration"
                              type="checkbox"
                              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-900">Autoriser les inscriptions</span>
                          </label>
                        </div>

                        <div>
                          <label className="flex items-center">
                            <Field
                              name="enableBackups"
                              type="checkbox"
                              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-900">Sauvegardes automatiques</span>
                          </label>
                        </div>

                        {values.enableMaintenanceMode && (
                          <div className="p-4 bg-warning-50 border border-warning-200 rounded-md">
                            <div className="flex">
                              <AlertTriangle className="h-5 w-5 text-warning-400" />
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-warning-800">Mode maintenance activé</h3>
                                <p className="mt-1 text-sm text-warning-700">
                                  La plateforme sera inaccessible pour tous les utilisateurs sauf les administrateurs.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                  
                  <CardFooter className="bg-gray-50 border-t border-gray-200 flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isSubmitting}
                      leftIcon={<Save className="h-4 w-4" />}
                    >
                      Enregistrer les paramètres
                    </Button>
                  </CardFooter>
                </Card>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default ParametersPage;