export type AIProvider = 'openai' | 'google' | 'anthropic' | 'mistral';
export type AIServiceProvider = 'chatgpt' | 'gemini' | 'mock';

export const AI_PROVIDER_MAP: Record<string, AIServiceProvider> = {
  'openai': 'chatgpt',
  'google': 'gemini',
  'anthropic': 'mock',
  'mistral': 'mock',
  'default': 'mock'
};

export const OPENAI_MODEL_MAP: Record<string, string> = {
  'gpt-5': 'gpt-4o',
  'gpt-4o': 'gpt-4o',
  'gpt-4': 'gpt-4',
  'gpt-4-turbo': 'gpt-4-turbo-preview',
  'gpt-4-turbo-preview': 'gpt-4-turbo-preview',
  'gpt-3.5-turbo': 'gpt-3.5-turbo',
  'gpt-4o-mini': 'gpt-4o-mini'
};

export const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';

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
