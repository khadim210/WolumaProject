export type AIProvider = 'gemini' | 'chatgpt' | 'mock';

export interface AIEvaluationRequest {
  projectData: {
    title: string;
    description: string;
    budget: number;
    timeline: string;
    tags: string[];
    submissionDate?: string;
  };
  evaluationCriteria: {
    id: string;
    name: string;
    description: string;
    maxScore: number;
    weight: number;
  }[];
}

export interface AIEvaluationResponse {
  scores: Record<string, number>;
  notes: string;
  recommendation: 'pre_selected' | 'selected' | 'rejected';
}

class AIEvaluationService {
  private provider: AIProvider = 'mock';
  private apiKey: string = '';

  setProvider(provider: AIProvider, apiKey?: string) {
    this.provider = provider;
    if (apiKey) {
      this.apiKey = apiKey;
    }
  }

  async evaluateProject(request: AIEvaluationRequest): Promise<AIEvaluationResponse> {
    switch (this.provider) {
      case 'gemini':
        return this.evaluateWithGemini(request);
      case 'chatgpt':
        return this.evaluateWithChatGPT(request);
      default:
        return this.evaluateWithMock(request);
    }
  }

  private async evaluateWithGemini(request: AIEvaluationRequest): Promise<AIEvaluationResponse> {
    if (!this.apiKey) {
      throw new Error('Clé API Gemini manquante');
    }

    const prompt = this.buildPrompt(request);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur API Gemini: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.candidates[0].content.parts[0].text;
      
      return this.parseAIResponse(aiResponse, request.evaluationCriteria);
    } catch (error) {
      console.error('Erreur Gemini:', error);
      throw new Error('Erreur lors de l\'évaluation avec Gemini');
    }
  }

  private async evaluateWithChatGPT(request: AIEvaluationRequest): Promise<AIEvaluationResponse> {
    if (!this.apiKey) {
      throw new Error('Clé API OpenAI manquante');
    }

    const prompt = this.buildPrompt(request);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Vous êtes un expert en évaluation de projets. Analysez objectivement les projets selon les critères fournis et répondez uniquement au format JSON demandé.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2048,
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur API OpenAI: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      return this.parseAIResponse(aiResponse, request.evaluationCriteria);
    } catch (error) {
      console.error('Erreur ChatGPT:', error);
      throw new Error('Erreur lors de l\'évaluation avec ChatGPT');
    }
  }

  private buildPrompt(request: AIEvaluationRequest): string {
    const { projectData, evaluationCriteria } = request;

    return `
En tant qu'expert en évaluation de projets, analysez le projet suivant et attribuez un score pour chaque critère d'évaluation.

PROJET À ÉVALUER:
- Titre: ${projectData.title}
- Description: ${projectData.description}
- Budget: ${projectData.budget.toLocaleString()} FCFA
- Durée: ${projectData.timeline}
- Tags: ${projectData.tags.join(', ')}
- Date de soumission: ${projectData.submissionDate || 'Non spécifiée'}

CRITÈRES D'ÉVALUATION:
${evaluationCriteria.map((c, i) => 
  `${i + 1}. ${c.name} (${c.description}) - Score max: ${c.maxScore}, Poids: ${c.weight}%`
).join('\n')}

INSTRUCTIONS:
1. Analysez objectivement le projet selon chaque critère
2. Attribuez un score entre 0 et le score maximum pour chaque critère
3. Justifiez brièvement votre évaluation globale
4. Répondez UNIQUEMENT au format JSON suivant (sans markdown):

{
  "scores": {
${evaluationCriteria.map(c => `    "${c.name}": [score_entre_0_et_${c.maxScore}]`).join(',\n')}
  },
  "notes": "Justification détaillée de l'évaluation en 2-3 phrases par critère",
  "recommendation": "pre_selected|selected|rejected"
}

Critères de recommandation:
- "selected": Score total pondéré ≥ 80%
- "pre_selected": Score total pondéré ≥ 60%
- "rejected": Score total pondéré < 60%

Soyez rigoureux et objectif dans votre évaluation.`;
  }

  private parseAIResponse(aiResponse: string, criteria: any[]): AIEvaluationResponse {
    try {
      // Nettoyer la réponse (supprimer les balises markdown si présentes)
      const cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const parsed = JSON.parse(cleanResponse);
      
      // Valider et nettoyer les scores
      const scores: Record<string, number> = {};
      criteria.forEach(criterion => {
        const score = parsed.scores[criterion.name];
        if (typeof score === 'number' && score >= 0 && score <= criterion.maxScore) {
          scores[criterion.name] = Math.round(score);
        } else {
          // Score par défaut si invalide
          scores[criterion.name] = Math.floor(criterion.maxScore * 0.6);
        }
      });

      // Valider la recommandation
      const validRecommendations = ['pre_selected', 'selected', 'rejected'];
      const recommendation = validRecommendations.includes(parsed.recommendation) 
        ? parsed.recommendation 
        : 'pre_selected';

      return {
        scores,
        notes: parsed.notes || 'Évaluation générée automatiquement',
        recommendation
      };
    } catch (error) {
      console.error('Erreur parsing réponse IA:', error);
      // Fallback vers l'évaluation mock en cas d'erreur
      return this.evaluateWithMock({ projectData: {} as any, evaluationCriteria: criteria });
    }
  }

  private async evaluateWithMock(request: AIEvaluationRequest): Promise<AIEvaluationResponse> {
    // Simuler un délai d'API
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { projectData, evaluationCriteria } = request;
    const scores: Record<string, number> = {};
    
    evaluationCriteria.forEach(criterion => {
      // Logique de scoring simulée basée sur des heuristiques
      let score = Math.floor(Math.random() * (criterion.maxScore * 0.4)) + Math.floor(criterion.maxScore * 0.6);
      
      // Ajustements basés sur des mots-clés
      const description = projectData.description?.toLowerCase() || '';
      const title = projectData.title?.toLowerCase() || '';
      
      if (criterion.name.toLowerCase().includes('innovation')) {
        if (description.includes('nouveau') || description.includes('innovant') || title.includes('ia')) {
          score = Math.min(criterion.maxScore, score + 2);
        }
      }
      
      if (criterion.name.toLowerCase().includes('faisabilité')) {
        if (projectData.budget > 100000000) {
          score = Math.max(1, score - 1);
        }
      }
      
      if (criterion.name.toLowerCase().includes('impact')) {
        if (projectData.tags?.some((tag: string) => 
          ['environnement', 'santé', 'education'].includes(tag.toLowerCase())
        )) {
          score = Math.min(criterion.maxScore, score + 1);
        }
      }
      
      scores[criterion.name] = Math.max(0, Math.min(criterion.maxScore, score));
    });
    
    // Calculer le score total pour la recommandation
    const totalScore = evaluationCriteria.reduce((total, criterion) => {
      return total + (scores[criterion.name] / criterion.maxScore) * criterion.weight;
    }, 0);
    
    let recommendation: 'pre_selected' | 'selected' | 'rejected' = 'rejected';
    if (totalScore >= 80) recommendation = 'selected';
    else if (totalScore >= 60) recommendation = 'pre_selected';
    
    return {
      scores,
      notes: `Évaluation automatique basée sur l'analyse du contenu du projet. Score total calculé: ${Math.round(totalScore)}%. ${
        totalScore >= 80 ? 'Projet très prometteur avec des critères solides.' :
        totalScore >= 60 ? 'Projet intéressant nécessitant quelques améliorations.' :
        'Projet nécessitant des améliorations significatives avant acceptation.'
      }`,
      recommendation
    };
  }
}

export const aiEvaluationService = new AIEvaluationService();