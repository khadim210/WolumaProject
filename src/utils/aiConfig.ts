export type AIProvider = 'openai' | 'google' | 'anthropic' | 'mistral';
export type AIServiceProvider = 'chatgpt' | 'gemini' | 'anthropic' | 'mistral' | 'mock';

export const AI_PROVIDER_MAP: Record<string, AIServiceProvider> = {
  'openai': 'chatgpt',
  'google': 'gemini',
  'anthropic': 'anthropic',
  'mistral': 'mistral',
  'default': 'mock'
};

export const OPENAI_MODELS: { value: string; label: string }[] = [
  { value: 'gpt-4.1', label: 'GPT-4.1 (Dernier - Recommandé)' },
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini (Économique)' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'o4-mini', label: 'o4-mini (Raisonnement)' },
  { value: 'o3', label: 'o3 (Raisonnement avancé)' },
  { value: 'o3-mini', label: 'o3-mini (Raisonnement compact)' },
];

export const ANTHROPIC_MODELS: { value: string; label: string }[] = [
  { value: 'claude-opus-4-5', label: 'Claude Opus 4.5 (Plus puissant)' },
  { value: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5 (Recommandé - Équilibré)' },
  { value: 'claude-haiku-3-5', label: 'Claude Haiku 3.5 (Rapide et économique)' },
  { value: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet' },
];

export const GOOGLE_MODELS: { value: string; label: string }[] = [
  { value: 'gemini-2.5-pro-preview-05-06', label: 'Gemini 2.5 Pro Preview (Plus puissant)' },
  { value: 'gemini-2.5-flash-preview-04-17', label: 'Gemini 2.5 Flash Preview (Recommandé)' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite (Économique)' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
];

export const MISTRAL_MODELS: { value: string; label: string }[] = [
  { value: 'mistral-large-latest', label: 'Mistral Large (Recommandé)' },
  { value: 'mistral-medium-latest', label: 'Mistral Medium' },
  { value: 'mistral-small-latest', label: 'Mistral Small' },
  { value: 'codestral-latest', label: 'Codestral (Code)' },
  { value: 'open-mistral-nemo', label: 'Mistral Nemo (Open Source)' },
];

export const OPENAI_MODEL_MAP: Record<string, string> = {
  'gpt-4.1': 'gpt-4.1',
  'gpt-4.1-mini': 'gpt-4.1-mini',
  'gpt-4o': 'gpt-4o',
  'gpt-4o-mini': 'gpt-4o-mini',
  'o4-mini': 'o4-mini',
  'o3': 'o3',
  'o3-mini': 'o3-mini',
  'gpt-4': 'gpt-4o',
  'gpt-4-turbo': 'gpt-4o',
  'gpt-4-turbo-preview': 'gpt-4o',
  'gpt-3.5-turbo': 'gpt-4o-mini',
};

export const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini';
export const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-5';
export const DEFAULT_GOOGLE_MODEL = 'gemini-2.0-flash';
export const DEFAULT_MISTRAL_MODEL = 'mistral-large-latest';

export const getAIServiceProvider = (provider: string): AIServiceProvider => {
  return AI_PROVIDER_MAP[provider] || AI_PROVIDER_MAP['default'];
};

export const getOpenAIModel = (configuredModel: string): string => {
  const model = configuredModel?.toLowerCase() || '';
  return OPENAI_MODEL_MAP[configuredModel] || OPENAI_MODEL_MAP[model] || DEFAULT_OPENAI_MODEL;
};

export const getScoreComment = (score: number, maxScore: number, criterionName: string): string => {
  const percentage = (score / maxScore) * 100;

  if (percentage >= 75) {
    return `Score eleve (${score}/${maxScore}) - Le projet repond excellemment a ce critere.`;
  } else if (percentage >= 50) {
    return `Score moyen (${score}/${maxScore}) - Le projet repond partiellement a ce critere avec des ameliorations possibles.`;
  } else {
    return `Score faible (${score}/${maxScore}) - Le projet presente des lacunes importantes sur ce critere.`;
  }
};
