import React, { useState, useEffect } from 'react';
import { useParametersStore } from '../../stores/parametersStore';
import { DatabaseManager } from '../../utils/database';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardFooter
} from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { 
  Save, 
  RefreshCw, 
  Database, 
  TestTube, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Settings,
  Mail,
  Palette,
  Shield,
  Server
} from 'lucide-react';

const ParametersPage: React.FC = () => {
  const { 
    parameters, 
    isLoading, 
    error,
    updateParameters, 
    resetToDefaults,
    testDatabaseConnection,
    initializeDatabase,
    resetDatabase
  } = useParametersStore();
  
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [formData, setFormData] = useState(parameters);
  const [connectionTest, setConnectionTest] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  useEffect(() => {
    setFormData(parameters);
  }, [parameters]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateParameters(formData);
      // Force refresh of services when Supabase is enabled
      if (formData.enableSupabase) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error saving parameters:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await resetToDefaults();
      setFormData(parameters);
    } catch (error) {
      console.error('Error resetting parameters:', error);
    } finally {
      setIsResetting(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTest(null);
    try {
      const result = await testDatabaseConnection();
      setConnectionTest(result);
    } catch (error) {
      setConnectionTest({
        success: false,
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: <Settings className="h-4 w-4" /> },
    { id: 'security', label: 'Sécurité', icon: <Shield className="h-4 w-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Mail className="h-4 w-4" /> },
    { id: 'appearance', label: 'Apparence', icon: <Palette className="h-4 w-4" /> },
    { id: 'system', label: 'Système', icon: <Server className="h-4 w-4" /> },
    { id: 'supabase', label: 'Supabase', icon: <Database className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres système</h1>
          <p className="mt-1 text-gray-600">Configurez les paramètres de l'application</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleReset}
            isLoading={isResetting}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Réinitialiser
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            leftIcon={<Save className="h-4 w-4" />}
          >
            {formData.enableSupabase ? 'Activer Supabase' : 'Enregistrer'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-error-100 text-error-700 p-4 rounded-md">
          Erreur: {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <Card>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-none first:rounded-t-lg last:rounded-b-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-3">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            {activeTab === 'general' && (
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres généraux</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du site
                    </label>
                    <input
                      type="text"
                      value={formData.siteName}
                      onChange={(e) => handleInputChange('siteName', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description du site
                    </label>
                    <textarea
                      value={formData.siteDescription}
                      onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                      rows={3}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email administrateur
                    </label>
                    <input
                      type="email"
                      value={formData.adminEmail}
                      onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Langue par défaut
                      </label>
                      <select
                        value={formData.defaultLanguage}
                        onChange={(e) => handleInputChange('defaultLanguage', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fuseau horaire
                      </label>
                      <select
                        value={formData.timezone}
                        onChange={(e) => handleInputChange('timezone', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        <option value="UTC">UTC</option>
                        <option value="Europe/Paris">Europe/Paris</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="Asia/Tokyo">Asia/Tokyo</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'supabase' && (
              <Card>
                <CardHeader>
                  <CardTitle>Configuration Supabase</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        checked={formData.enableSupabase}
                        onChange={(e) => handleInputChange('enableSupabase', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">Activer Supabase</span>
                    </label>
                  </div>

                  {formData.enableSupabase && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          URL Supabase
                        </label>
                        <input
                          type="url"
                          value={formData.supabaseUrl}
                          onChange={(e) => handleInputChange('supabaseUrl', e.target.value)}
                          placeholder="https://votre-projet.supabase.co"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          URL de votre projet Supabase (disponible dans Settings → API)
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Clé publique anonyme (anon key)
                        </label>
                        <input
                          type="password"
                          value={formData.supabaseAnonKey}
                          onChange={(e) => handleInputChange('supabaseAnonKey', e.target.value)}
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Clé publique pour les opérations côté client
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Clé service role (optionnelle)
                        </label>
                        <input
                          type="password"
                          value={formData.supabaseServiceRoleKey}
                          onChange={(e) => handleInputChange('supabaseServiceRoleKey', e.target.value)}
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Clé secrète pour les opérations administratives (bypass RLS)
                        </p>
                      </div>

                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Test de connexion Supabase</h3>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div>
                              <h4 className="font-medium text-blue-900">Test de connexion</h4>
                              <p className="text-sm text-blue-700">Vérifiez que la connexion à Supabase fonctionne</p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleTestConnection}
                              disabled={!formData.supabaseUrl || !formData.supabaseAnonKey}
                              isLoading={isTestingConnection}
                              leftIcon={<TestTube className="h-4 w-4" />}
                            >
                              Tester
                            </Button>
                          </div>

                          {connectionTest && (
                            <div className={`p-4 rounded-lg border ${
                              connectionTest.success 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-red-50 border-red-200'
                            }`}>
                              <div className="flex items-center">
                                {connectionTest.success ? (
                                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-400 mr-2" />
                                )}
                                <div>
                                  <h4 className={`text-sm font-medium ${
                                    connectionTest.success ? 'text-green-800' : 'text-red-800'
                                  }`}>
                                    {connectionTest.success ? 'Connexion réussie' : 'Échec de la connexion'}
                                  </h4>
                                  <p className={`text-sm ${
                                    connectionTest.success ? 'text-green-700' : 'text-red-700'
                                  }`}>
                                    {connectionTest.message}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex">
                          <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-medium text-yellow-800">Configuration Supabase</h4>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p className="mb-2">Pour configurer Supabase :</p>
                              <ol className="list-decimal list-inside space-y-1">
                                <li>Créez un projet sur <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a></li>
                                <li>Allez dans Settings → API</li>
                                <li>Copiez l'URL du projet et les clés API</li>
                                <li>Collez-les dans les champs ci-dessus</li>
                                <li>Testez la connexion</li>
                              </ol>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres de notifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.emailNotifications}
                        onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">Activer les notifications par email</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.notifyNewSubmissions}
                        onChange={(e) => handleInputChange('notifyNewSubmissions', e.target.checked)}
                        disabled={!formData.emailNotifications}
                        className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-900">Notifier les nouvelles soumissions</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.notifyStatusChanges}
                        onChange={(e) => handleInputChange('notifyStatusChanges', e.target.checked)}
                        disabled={!formData.emailNotifications}
                        className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-900">Notifier les changements de statut</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.notifyDeadlines}
                        onChange={(e) => handleInputChange('notifyDeadlines', e.target.checked)}
                        disabled={!formData.emailNotifications}
                        className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-900">Notifier les échéances</span>
                    </label>
                  </div>

                  {formData.emailNotifications && (
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration SMTP</h3>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Serveur SMTP
                          </label>
                          <input
                            type="text"
                            value={formData.smtpServer}
                            onChange={(e) => handleInputChange('smtpServer', e.target.value)}
                            placeholder="smtp.gmail.com"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Port SMTP
                            </label>
                            <input
                              type="number"
                              value={formData.smtpPort}
                              onChange={(e) => handleInputChange('smtpPort', parseInt(e.target.value))}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            />
                          </div>

                          <div className="flex items-end">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.smtpSecure}
                                onChange={(e) => handleInputChange('smtpSecure', e.target.checked)}
                                className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                              />
                              <span className="ml-2 text-sm text-gray-900">Connexion sécurisée (TLS)</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'appearance' && (
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres d'apparence</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thème par défaut
                    </label>
                    <select
                      value={formData.defaultTheme}
                      onChange={(e) => handleInputChange('defaultTheme', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    >
                      <option value="light">Clair</option>
                      <option value="dark">Sombre</option>
                      <option value="auto">Automatique</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.showBranding}
                        onChange={(e) => handleInputChange('showBranding', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">Afficher le branding</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Couleur primaire
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={formData.primaryColor}
                          onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                          className="h-10 w-20 rounded border border-gray-300"
                        />
                        <input
                          type="text"
                          value={formData.primaryColor}
                          onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Couleur secondaire
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={formData.secondaryColor}
                          onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                          className="h-10 w-20 rounded border border-gray-300"
                        />
                        <input
                          type="text"
                          value={formData.secondaryColor}
                          onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'system' && (
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres système</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Projets max par utilisateur
                      </label>
                      <input
                        type="number"
                        value={formData.maxProjectsPerUser}
                        onChange={(e) => handleInputChange('maxProjectsPerUser', parseInt(e.target.value))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Délai d'évaluation (jours)
                      </label>
                      <input
                        type="number"
                        value={formData.evaluationDeadlineDays}
                        onChange={(e) => handleInputChange('evaluationDeadlineDays', parseInt(e.target.value))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Seuil d'auto-approbation (%)
                      </label>
                      <input
                        type="number"
                        value={formData.autoApprovalThreshold}
                        onChange={(e) => handleInputChange('autoApprovalThreshold', parseInt(e.target.value))}
                        min="0"
                        max="100"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Taille max fichier (MB)
                      </label>
                      <input
                        type="number"
                        value={formData.maxFileSize}
                        onChange={(e) => handleInputChange('maxFileSize', parseInt(e.target.value))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-gray-200 pt-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.enableMaintenanceMode}
                        onChange={(e) => handleInputChange('enableMaintenanceMode', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">Mode maintenance</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.enableRegistration}
                        onChange={(e) => handleInputChange('enableRegistration', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">Autoriser les inscriptions</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.enableBackups}
                        onChange={(e) => handleInputChange('enableBackups', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">Activer les sauvegardes automatiques</span>
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres de sécurité</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timeout de session (minutes)
                      </label>
                      <input
                        type="number"
                        value={formData.sessionTimeout}
                        onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tentatives de connexion max
                      </label>
                      <input
                        type="number"
                        value={formData.maxLoginAttempts}
                        onChange={(e) => handleInputChange('maxLoginAttempts', parseInt(e.target.value))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.requireEmailVerification}
                        onChange={(e) => handleInputChange('requireEmailVerification', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">Vérification email obligatoire</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.enableTwoFactor}
                        onChange={(e) => handleInputChange('enableTwoFactor', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">Authentification à deux facteurs</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.enablePasswordPolicy}
                        onChange={(e) => handleInputChange('enablePasswordPolicy', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">Politique de mot de passe stricte</span>
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ParametersPage;