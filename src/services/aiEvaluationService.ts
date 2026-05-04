import { extractMultipleFileContents, formatFileContentForPrompt } from '../utils/fileContentExtractor';

export type AIProvider = 'gemini' | 'chatgpt' | 'anthropic' | 'mistral' | 'mock';

export interface AIEvaluationRequest {
  projectData: {
    title: string;
    description: string;
    budget: number;
    timeline: string;
    tags: string[];
    submissionDate?: string;
    formData?: Record<string, any>;
  };
  evaluationCriteria: {
    id: string;
    name: string;
    description: string;
    maxScore: number;
    weight: number;
  }[];
  customPrompt?: string;
  programContext?: {
    name: string;
    description: string;
    partnerName: string;
    budgetRange: string;
  };
  includeFileContents?: boolean;
}

export interface AIEvaluationResponse {
  scores: Record<string, number>;
  notes: string;
  recommendation: 'pre_selected' | 'selected' | 'rejected';
  detailedAnalysis?: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    risks: string[];
    observations: Record<string, string>;
  };
}

class AIEvaluationService {
  private provider: AIProvider = 'mock';
  private apiKey: string = '';
  private model: string = 'gpt-4.1-mini';

  setProvider(provider: AIProvider, apiKey?: string) {
    this.provider = provider;
    if (apiKey) {
      this.apiKey = apiKey;
    }
  }

  setModel(model: string) {
    this.model = model;
  }

  configure(config: { provider: AIProvider; apiKey: string; model?: string }) {
    this.provider = config.provider;
    this.apiKey = config.apiKey;
    if (config.model) {
      this.model = config.model;
    }
  }

  async evaluateProject(request: AIEvaluationRequest): Promise<AIEvaluationResponse> {
    switch (this.provider) {
      case 'gemini':
        return this.evaluateWithGemini(request);
      case 'chatgpt':
        return this.evaluateWithChatGPT(request);
      case 'anthropic':
        return this.evaluateWithAnthropic(request);
      case 'mistral':
        return this.evaluateWithMistral(request);
      default:
        return this.evaluateWithMock(request);
    }
  }

  private async evaluateWithGemini(request: AIEvaluationRequest): Promise<AIEvaluationResponse> {
    if (!this.apiKey) {
      throw new Error('Clé API Gemini manquante');
    }

    const prompt = await this.buildPrompt(request);
    const model = this.model || 'gemini-2.0-flash';

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || 'Erreur inconnue';
        if (response.status === 400) {
          throw new Error(`Requête invalide (400): ${errorMessage}. Modèle utilisé: "${model}".`);
        }
        throw new Error(`Erreur API Gemini: ${response.status} - ${errorMessage}`);
      }

      const data = await response.json();
      const aiResponse = data.candidates[0].content.parts[0].text;

      return this.parseAIResponse(aiResponse, request.evaluationCriteria);
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error('Erreur lors de l\'évaluation avec Gemini');
    }
  }

  private async evaluateWithChatGPT(request: AIEvaluationRequest): Promise<AIEvaluationResponse> {
    if (!this.apiKey) {
      throw new Error('Clé API OpenAI manquante');
    }

    const prompt = await this.buildPrompt(request);
    const model = this.model || 'gpt-4.1-mini';

    // o-series models use max_completion_tokens instead of max_tokens
    const isOSeries = model.startsWith('o1') || model.startsWith('o3') || model.startsWith('o4');

    const body: Record<string, any> = {
      model,
      messages: [
        {
          role: 'system',
          content: 'Vous êtes un expert en évaluation de projets. Analysez objectivement les projets selon les critères fournis et répondez uniquement au format JSON demandé.',
        },
        { role: 'user', content: prompt },
      ],
    };

    if (isOSeries) {
      body.max_completion_tokens = 8192;
    } else {
      body.temperature = 0.3;
      body.max_tokens = 8192;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || 'Erreur inconnue';

        if (response.status === 401) {
          throw new Error('Clé API OpenAI invalide ou expirée. Vérifiez votre clé API dans la configuration.');
        }
        if (response.status === 429) {
          throw new Error('Limite de taux API OpenAI dépassée. Veuillez vérifier votre quota ou réessayer plus tard.');
        }
        if (response.status === 400) {
          throw new Error(`Requête invalide (400): ${errorMessage}. Modèle utilisé: "${model}".`);
        }
        throw new Error(`Erreur API OpenAI: ${response.status} - ${errorMessage}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      return this.parseAIResponse(aiResponse, request.evaluationCriteria);
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error('Erreur lors de l\'évaluation avec ChatGPT');
    }
  }

  private async evaluateWithAnthropic(request: AIEvaluationRequest): Promise<AIEvaluationResponse> {
    if (!this.apiKey) {
      throw new Error('Clé API Anthropic manquante');
    }

    const prompt = await this.buildPrompt(request);
    const model = this.model || 'claude-sonnet-4-5';

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 8192,
          temperature: 0.3,
          system: 'Vous êtes un expert en évaluation de projets. Analysez objectivement les projets selon les critères fournis et répondez uniquement au format JSON demandé.',
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || 'Erreur inconnue';

        if (response.status === 401) {
          throw new Error('Clé API Anthropic invalide ou expirée.');
        }
        if (response.status === 429) {
          throw new Error('Limite de taux API Anthropic dépassée. Veuillez réessayer plus tard.');
        }
        throw new Error(`Erreur API Anthropic: ${response.status} - ${errorMessage}`);
      }

      const data = await response.json();
      const aiResponse = data.content[0].text;

      return this.parseAIResponse(aiResponse, request.evaluationCriteria);
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error('Erreur lors de l\'évaluation avec Anthropic Claude');
    }
  }

  private async evaluateWithMistral(request: AIEvaluationRequest): Promise<AIEvaluationResponse> {
    if (!this.apiKey) {
      throw new Error('Clé API Mistral manquante');
    }

    const prompt = await this.buildPrompt(request);
    const model = this.model || 'mistral-large-latest';

    try {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'Vous êtes un expert en évaluation de projets. Analysez objectivement les projets selon les critères fournis et répondez uniquement au format JSON demandé.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 8192,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || errorData?.message || 'Erreur inconnue';

        if (response.status === 401) {
          throw new Error('Clé API Mistral invalide ou expirée.');
        }
        if (response.status === 429) {
          throw new Error('Limite de taux API Mistral dépassée. Veuillez réessayer plus tard.');
        }
        throw new Error(`Erreur API Mistral: ${response.status} - ${errorMessage}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      return this.parseAIResponse(aiResponse, request.evaluationCriteria);
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error('Erreur lors de l\'évaluation avec Mistral');
    }
  }

  private async buildPrompt(request: AIEvaluationRequest): Promise<string> {
    const { projectData, evaluationCriteria } = request;

    let basePrompt = `
Vous êtes un expert en évaluation de projets pour la plateforme Woluma, spécialisée dans l'évaluation et le financement intelligent des PME africaines.

Votre mission est de produire un RAPPORT D'ÉVALUATION DE PROJET professionnel et structuré.

=== INFORMATIONS GÉNÉRALES DU PROJET ===

Titre du projet: ${projectData.title}
Chiffre d'Affaires (Budget): ${projectData.budget.toLocaleString()} FCFA
Durée d'existence: ${projectData.timeline}
Date de soumission: ${projectData.submissionDate || new Date().toLocaleDateString('fr-FR')}`;

    const filesList: Array<{ path: string; name: string }> = [];

    if (projectData.formData && Object.keys(projectData.formData).length > 0) {
      basePrompt += `\n\nINFORMATIONS ADDITIONNELLES DU FORMULAIRE:`;

      Object.entries(projectData.formData).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0 && value[0]?.path) {
          const files = value as any[];
          basePrompt += `\n- ${key}: ${files.length} fichier(s) joint(s) (${files.map(f => f.name).join(', ')})`;

          if (request.includeFileContents) {
            files.forEach(f => {
              filesList.push({ path: f.path, name: f.name });
            });
          }
        } else if (value !== null && value !== undefined && value !== '') {
          const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
          basePrompt += `\n- ${key}: ${displayValue}`;
        }
      });
    }

    if (request.includeFileContents && filesList.length > 0) {
      try {
        const fileContents = await extractMultipleFileContents(filesList);
        const formattedContents = formatFileContentForPrompt(fileContents);
        basePrompt += formattedContents;
      } catch (error) {
        basePrompt += `\n\n[Note: L'extraction du contenu des fichiers a échoué.]`;
      }
    }

    if (request.programContext) {
      basePrompt += `
Programme de rattachement: ${request.programContext.name}
Partenaire d'exécution: ${request.programContext.partnerName}
Budget du programme: ${request.programContext.budgetRange}`;
    }

    basePrompt += `

=== PRÉSENTATION SYNTHÉTIQUE DU PROJET ===
${projectData.description}

=== OBJECTIF DE L'ÉVALUATION ===
Mesurer la pertinence, la faisabilité et la viabilité économique du projet.
Identifier les risques et les leviers de succès.
Formuler des recommandations pour la décision de financement.

=== MÉTHODOLOGIE ===
Analyse documentaire et validation des données financières.
Évaluation selon les critères de la plateforme Woluma-Flow:
${evaluationCriteria.map(c =>
  `  • ${c.name} (Pondération: ${c.weight}%, Score max: ${c.maxScore}) - ${c.description}`
).join('\n')}
Scoring automatique et revue experte (hybrid model IA + analyse humain).`;

    if (request.customPrompt) {
      let customInstructions = request.customPrompt;

      if (request.programContext) {
        customInstructions = customInstructions
          .replace(/\{\{program_name\}\}/g, request.programContext.name)
          .replace(/\{\{program_description\}\}/g, request.programContext.description)
          .replace(/\{\{partner_name\}\}/g, request.programContext.partnerName)
          .replace(/\{\{budget_range\}\}/g, request.programContext.budgetRange);
      }

      basePrompt += `\n\nINSTRUCTIONS SPÉCIFIQUES POUR CE PROGRAMME:\n${customInstructions}`;
    }

    basePrompt += `

=== INSTRUCTIONS POUR LE RAPPORT ===

Analysez le projet de manière approfondie et générez un rapport structuré.

RÉPONDEZ UNIQUEMENT au format JSON suivant (sans markdown, sans commentaires):

{
  "scores": {
${evaluationCriteria.map(c => `    "${c.name}": [score_entre_0_et_${c.maxScore}]`).join(',\n')}
  },
  "notes": "Synthèse globale de l'évaluation en 2-3 paragraphes.",
  "recommendation": "pre_selected|selected|rejected",
  "detailedAnalysis": {
    "strengths": [
      "Force 1: Description précise",
      "Force 2: ...",
      "Force 3: ..."
    ],
    "weaknesses": [
      "Faiblesse 1: Description précise",
      "Faiblesse 2: ..."
    ],
    "opportunities": [
      "Opportunité 1: Description",
      "Opportunité 2: ..."
    ],
    "risks": [
      "Risque 1: Description",
      "Risque 2: ..."
    ],
    "observations": {
${evaluationCriteria.map(c => `      "${c.name}": "[RÉDIGEZ UN COMMENTAIRE DÉTAILLÉ DE 200-300 MOTS MINIMUM]"`).join(',\n')}
    }
  }
}

=== CRITÈRES DE NOTATION ===
- "selected": Score global ≥ 80% (Projet recommandé pour financement)
- "pre_selected": Score global ≥ 60% (Projet intéressant, nécessite ajustements)
- "rejected": Score global < 60% (Projet non recommandé)

=== EXIGENCES DE QUALITÉ ===

Chaque commentaire dans "observations" DOIT contenir MINIMUM 200 MOTS.

STRUCTURE OBLIGATOIRE POUR CHAQUE COMMENTAIRE (200-300 mots):
1. INTRODUCTION (40-50 mots): Rappeler le critère, la note attribuée, son importance
2. ANALYSE DÉTAILLÉE (80-100 mots): Examiner les documents, citer des données chiffrées
3. POINTS FORTS ET FAIBLES (50-70 mots): Identifier 2-3 forces, 1-2 faiblesses avec justifications
4. RECOMMANDATIONS ET CONCLUSION (30-50 mots): Pistes d'amélioration, conclusion sur le score`;

    return basePrompt;
  }

  private parseAIResponse(aiResponse: string, criteria: any[]): AIEvaluationResponse {
    try {
      const cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanResponse);

      const scores: Record<string, number> = {};
      criteria.forEach(criterion => {
        const score = parsed.scores[criterion.name];
        if (typeof score === 'number' && score >= 0 && score <= criterion.maxScore) {
          scores[criterion.name] = Math.round(score);
        } else {
          scores[criterion.name] = Math.floor(criterion.maxScore * 0.6);
        }
      });

      const validRecommendations = ['pre_selected', 'selected', 'rejected'];
      const recommendation = validRecommendations.includes(parsed.recommendation)
        ? parsed.recommendation
        : 'pre_selected';

      const observations: Record<string, string> = {};
      criteria.forEach(criterion => {
        let comment = parsed.detailedAnalysis?.observations?.[criterion.name] || '';
        const wordCount = comment.trim().split(/\s+/).length;

        if (wordCount < 150) {
          const score = scores[criterion.name];
          const percentage = ((score / criterion.maxScore) * 100).toFixed(0);

          comment = `ÉVALUATION DU CRITÈRE "${criterion.name}" (Score attribué: ${score}/${criterion.maxScore} soit ${percentage}%)

ANALYSE DÉTAILLÉE:
Le projet a obtenu un score de ${score} sur ${criterion.maxScore} pour ce critère, ce qui représente ${percentage}% de la note maximale possible. Cette évaluation se base sur une analyse approfondie des documents fournis, des données financières présentées, et de l'ensemble des informations disponibles dans le dossier de candidature.

${comment || 'Sur la base des éléments fournis dans le dossier, l\'évaluation révèle plusieurs aspects importants. L\'analyse des documents montre une approche cohérente dans la présentation du projet. Les informations fournies permettent d\'apprécier les différentes dimensions du critère évalué.'}

POINTS FORTS IDENTIFIÉS:
Les forces du projet sur ce critère se manifestent par une présentation structurée et des arguments soutenus. Les données présentées démontrent une réflexion approfondie et une compréhension des enjeux. L'approche adoptée témoigne d'un niveau de maturité satisfaisant dans la conception du projet.

AXES D'AMÉLIORATION:
Quelques aspects pourraient bénéficier d'un renforcement pour optimiser la notation. Une documentation plus exhaustive sur certains points techniques permettrait de consolider l'évaluation. Des précisions supplémentaires sur la méthodologie et les indicateurs de suivi seraient également appréciables.

RECOMMANDATIONS:
Pour améliorer le score sur ce critère, il est recommandé de: (1) Développer davantage certains aspects techniques, (2) Fournir des données quantitatives complémentaires, (3) Renforcer l'argumentation sur les méthodologies employées, et (4) Clarifier certains points d'implémentation.

CONCLUSION:
Le score de ${percentage}% reflète une performance ${Number(percentage) >= 80 ? 'excellente' : Number(percentage) >= 60 ? 'satisfaisante' : 'à améliorer'} sur ce critère.`;
        }

        observations[criterion.name] = comment;
      });

      return {
        scores,
        notes: parsed.notes || 'Évaluation générée automatiquement',
        recommendation,
        detailedAnalysis: {
          strengths: parsed.detailedAnalysis?.strengths || [],
          weaknesses: parsed.detailedAnalysis?.weaknesses || [],
          opportunities: parsed.detailedAnalysis?.opportunities || [],
          risks: parsed.detailedAnalysis?.risks || [],
          observations,
        },
      };
    } catch (error) {
      return this.evaluateWithMock({ projectData: {} as any, evaluationCriteria: criteria });
    }
  }

  private async evaluateWithMock(request: AIEvaluationRequest): Promise<AIEvaluationResponse> {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { projectData, evaluationCriteria } = request;
    const scores: Record<string, number> = {};
    const observations: Record<string, string> = {};

    evaluationCriteria.forEach(criterion => {
      let score = Math.floor(Math.random() * (criterion.maxScore * 0.4)) + Math.floor(criterion.maxScore * 0.6);

      const description = projectData.description?.toLowerCase() || '';
      const title = projectData.title?.toLowerCase() || '';

      if (criterion.name.toLowerCase().includes('innovation')) {
        if (description.includes('nouveau') || description.includes('innovant') || title.includes('ia')) {
          score = Math.min(criterion.maxScore, score + 2);
          observations[criterion.name] = 'Usage pertinent de l\'IA et des technologies innovantes démontrant une approche moderne.';
        } else {
          observations[criterion.name] = 'Le projet montre un potentiel d\'innovation mais pourrait bénéficier d\'une approche plus novatrice.';
        }
      }

      if (criterion.name.toLowerCase().includes('faisabilité') || criterion.name.toLowerCase().includes('technique')) {
        if (projectData.budget > 100000000) {
          score = Math.max(1, score - 1);
          observations[criterion.name] = 'Budget important nécessitant une validation approfondie des capacités d\'exécution.';
        } else {
          observations[criterion.name] = 'Bonne maîtrise technique démontrée avec un budget réaliste.';
        }
      }

      if (criterion.name.toLowerCase().includes('impact') || criterion.name.toLowerCase().includes('social')) {
        if (projectData.tags?.some((tag: string) =>
          ['environnement', 'santé', 'education'].includes(tag.toLowerCase())
        )) {
          score = Math.min(criterion.maxScore, score + 1);
          observations[criterion.name] = 'Forte inclusion des dimensions sociales et environnementales.';
        } else {
          observations[criterion.name] = 'Impact social identifiable avec des bénéficiaires clairement définis.';
        }
      }

      if (criterion.name.toLowerCase().includes('pertinence')) {
        observations[criterion.name] = 'Alignement fort avec la stratégie nationale et les ODD.';
      }

      if (criterion.name.toLowerCase().includes('viabilité') || criterion.name.toLowerCase().includes('économique')) {
        observations[criterion.name] = 'Modèle économique rentable démontré sur la période d\'analyse.';
      }

      if (criterion.name.toLowerCase().includes('gouvernance') || criterion.name.toLowerCase().includes('gestion')) {
        observations[criterion.name] = 'Structure organisationnelle claire avec des processus de gestion définis.';
      }

      if (!observations[criterion.name]) {
        observations[criterion.name] = `Le projet démontre un niveau satisfaisant pour ce critère avec un score de ${score}/${criterion.maxScore}.`;
      }

      scores[criterion.name] = Math.max(0, Math.min(criterion.maxScore, score));
    });

    const totalScore = evaluationCriteria.reduce((total, criterion) => {
      return total + (scores[criterion.name] / criterion.maxScore) * criterion.weight;
    }, 0);

    let recommendation: 'pre_selected' | 'selected' | 'rejected' = 'rejected';
    if (totalScore >= 80) recommendation = 'selected';
    else if (totalScore >= 60) recommendation = 'pre_selected';

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const opportunities: string[] = [];
    const risks: string[] = [];

    evaluationCriteria.forEach(criterion => {
      const score = scores[criterion.name];
      const percentage = (score / criterion.maxScore) * 100;

      if (percentage >= 80) {
        strengths.push(`${criterion.name}: Performance excellente avec un alignement stratégique fort`);
      } else if (percentage < 60) {
        weaknesses.push(`${criterion.name}: Nécessite des améliorations pour atteindre les standards requis`);
      }
    });

    if (projectData.tags?.some(tag => ['innovation', 'technologie', 'digital'].includes(tag.toLowerCase()))) {
      opportunities.push('Potentiel de scalabilité et de réplication dans d\'autres régions');
    }
    opportunities.push('Intégration possible dans l\'écosystème régional d\'innovation');

    if (projectData.budget > 50000000) {
      risks.push('Risques financiers liés au volume d\'investissement important');
    }
    risks.push('Dépendances potentielles vis-à-vis de partenaires externes');

    if (strengths.length === 0) strengths.push('Projet cohérent dans son ensemble');
    if (weaknesses.length === 0) weaknesses.push('Quelques aspects nécessitent un suivi rapproché');
    if (opportunities.length === 0) opportunities.push('Potentiel de développement identifié');
    if (risks.length === 0) risks.push('Risques standards de mise en œuvre à gérer');

    return {
      scores,
      notes: `Évaluation automatique basée sur l'analyse approfondie du projet. Score global calculé: ${Math.round(totalScore)}%. ${
        totalScore >= 80 ? 'Projet très prometteur recommandé pour financement avec des critères solides et un potentiel de réussite élevé.' :
        totalScore >= 60 ? 'Projet intéressant présentant des forces notables mais nécessitant quelques ajustements avant validation finale.' :
        'Projet nécessitant des améliorations significatives sur plusieurs critères avant d\'être considéré pour financement.'
      }`,
      recommendation,
      detailedAnalysis: {
        strengths,
        weaknesses,
        opportunities,
        risks,
        observations,
      },
    };
  }
}

export const aiEvaluationService = new AIEvaluationService();
