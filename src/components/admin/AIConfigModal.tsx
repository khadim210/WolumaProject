import React, { useState } from 'react';
import { aiEvaluationService, AIProvider } from '../../services/aiEvaluationService';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import Button from '../ui/Button';
import { X, Save, Bot, Key, TestTube } from 'lucide-react';

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIConfigModal: React.FC<AIConfigModalProps> = ({ isOpen, onClose }) => {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('mock');
  const [apiKey, setApiKey] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const providers = [
    {
      id: 'mock' as AIProvider,
      name: 'Simulation (Mock)',
      description: 'Évaluation simulée pour les tests',
      icon: <TestTube className="h-5 w-5" />,
      requiresApiKey: false,
      color: 'text-gray-600'
    },
    {
      id: 'gemini' as AIProvider,
      name: 'Google Gemini',
      description: 'API Google Gemini 1.5 Flash',
      icon: <Bot className="h-5 w-5" />,
      requiresApiKey: true,
      color: 'text-blue-600'
    },
    {
      id: 'chatgpt' as AIProvider,
      name: 'OpenAI ChatGPT',
      description: 'API OpenAI GPT-4o-mini',
      icon: <Bot className="h-5 w-5" />,
      requiresApiKey: true,
      color: 'text-green-600'
    }
  ];

  const handleSave = () => {
    aiEvaluationService.setProvider(selectedProvider, apiKey);
    localStorage.setItem('ai_provider', selectedProvider);
    if (apiKey) {
      localStorage.setItem('ai_api_key', apiKey);
    }
    onClose();
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);

    try {
      // Test avec un projet simple
      const testRequest = {
        projectData: {
          title: 'Projet de test',
          description: 'Description de test pour vérifier la connexion API',
          budget: 100000,
          timeline: '12 mois',
          tags: ['test']
        },
        evaluationCriteria: [
          {
            id: 'test1',
            name: 'Test Critère',
            description: 'Critère de test',
            maxScore: 20,
            weight: 100
          }
        ]
      };

      // Sauvegarder la configuration actuelle
      const currentProvider = localStorage.getItem('ai_provider');
      const currentApiKey = localStorage.getItem('ai_api_key');
      
      // Configurer temporairement le service pour le test
      aiEvaluationService.setProvider(selectedProvider, apiKey);
      
      await aiEvaluationService.evaluateProject(testRequest);
      
      // Restaurer la configuration précédente si elle existait
      if (currentProvider) {
        aiEvaluationService.setProvider(currentProvider as any, currentApiKey || '');
      }
      
      setTestResult({
        success: true,
        message: 'Connexion réussie ! L\'API fonctionne correctement.'
      });
    } catch (error) {
      // Restaurer la configuration précédente en cas d'erreur aussi
      const currentProvider = localStorage.getItem('ai_provider');
      const currentApiKey = localStorage.getItem('ai_api_key');
      if (currentProvider) {
        aiEvaluationService.setProvider(currentProvider as any, currentApiKey || '');
      }
      
      setTestResult({
        success: false,
        message: `Erreur de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      // Charger la configuration sauvegardée
      const savedProvider = localStorage.getItem('ai_provider') as AIProvider;
      const savedApiKey = localStorage.getItem('ai_api_key');
      
      if (savedProvider) {
        setSelectedProvider(savedProvider);
      }
      if (savedApiKey) {
        setApiKey(savedApiKey);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedProviderInfo = providers.find(p => p.id === selectedProvider);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Bot className="h-6 w-6 mr-2 text-primary-600" />
            Configuration de l'IA d'évaluation
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Choisir le fournisseur d'IA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {providers.map(provider => (
              <label
                key={provider.id}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedProvider === provider.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  value={provider.id}
                  checked={selectedProvider === provider.id}
                  onChange={(e) => setSelectedProvider(e.target.value as AIProvider)}
                  className="sr-only"
                />
                <div className={`mr-3 ${provider.color}`}>
                  {provider.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{provider.name}</div>
                  <div className="text-sm text-gray-500">{provider.description}</div>
                  {provider.requiresApiKey && (
                    <div className="text-xs text-warning-600 mt-1">
                      Nécessite une clé API
                    </div>
                  )}
                </div>
                {selectedProvider === provider.id && (
                  <div className="w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </label>
            ))}

            {selectedProviderInfo?.requiresApiKey && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Key className="h-4 w-4 inline mr-1" />
                  Clé API {selectedProviderInfo.name}
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder={`Entrez votre clé API ${selectedProviderInfo.name}`}
                />
                <div className="mt-2 text-xs text-gray-500">
                  {selectedProvider === 'gemini' && (
                    <>
                      Obtenez votre clé API sur{' '}
                      <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                        Google AI Studio
                      </a>
                    </>
                  )}
                  {selectedProvider === 'chatgpt' && (
                    <>
                      Obtenez votre clé API sur{' '}
                      <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                        OpenAI Platform
                      </a>
                    </>
                  )}
                </div>

                {apiKey && (
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTestConnection}
                      isLoading={isTestingConnection}
                      leftIcon={<TestTube className="h-4 w-4" />}
                    >
                      Tester la connexion
                    </Button>
                  </div>
                )}

                {testResult && (
                  <div className={`mt-3 p-3 rounded-md ${
                    testResult.success 
                      ? 'bg-success-50 text-success-800 border border-success-200' 
                      : 'bg-error-50 text-error-800 border border-error-200'
                  }`}>
                    <div className="text-sm">
                      {testResult.success ? '✅' : '❌'} {testResult.message}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              leftIcon={<Save className="h-4 w-4" />}
              disabled={selectedProviderInfo?.requiresApiKey && !apiKey}
            >
              Enregistrer
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AIConfigModal;