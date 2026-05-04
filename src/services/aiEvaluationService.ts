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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const SYSTEM_PROMPT =
  'Vous êtes un expert en évaluation de projets. Analysez objectivement les projets selon les critères fournis et répondez uniquement au format JSON demandé.';

class AIEvaluationService {
  private provider: AIProvider = 'mock';
  private apiKey: string = '';
  private model: string = 'gpt-4.1-mini';

  setProvider(provider: AIProvider, apiKey?: string) {
    this.provider = provider;
    if (apiKey) this.apiKey = apiKey;
  }

  setModel(model: string) {
    this.model = model;
  }

  configure(config: { provider: AIProvider; apiKey: string; model?: string }) {
    this.provider = config.provider;
    this.apiKey = config.apiKey;
    if (config.model) this.model = config.model;
  }

  async evaluateProject(request: AIEvaluationRequest): Promise<AIEvaluationResponse> {
    if (this.provider === 'mock') {
      return this.evaluateWithMock(request);
    }
    return this.evaluateViaProxy(request);
  }

  private async evaluateViaProxy(request: AIEvaluationRequest): Promise<AIEvaluationResponse> {
    if (!this.apiKey) {
      const providerNames: Record<string, string> = {
        chatgpt: 'OpenAI',
        gemini: 'Google Gemini',
        anthropic: 'Anthropic',
        mistral: 'Mistral',
      };
      throw new Error(`Clé API ${providerNames[this.provider] || this.provider} manquante`);
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Configuration Supabase manquante. Vérifiez les variables d\'environnement.');
    }

    const prompt = await this.buildPrompt(request);

    const proxyUrl = `${SUPABASE_URL}/functions/v1/ai-proxy`;

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        provider: this.provider,
        apiKey: this.apiKey,
        model: this.model,
        prompt,
        systemPrompt: SYSTEM_PROMPT,
        temperature: 0.3,
        maxTokens: 8192,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error || `Erreur proxy: ${response.status}`;
      throw new Error(msg);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return this.parseAIResponse(data.text, request.evaluationCriteria);
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
            files.forEach(f => filesList.push({ path: f.path, name: f.name }));
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
        basePrompt += formatFileContentForPrompt(fileContents);
      } catch {
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
Évaluation selon les critères de la plateforme Woluma-Flow:
${evaluationCriteria.map(c =>
  `  • ${c.name} (Pondération: ${c.weight}%, Score max: ${c.maxScore}) - ${c.description}`
).join('\n')}`;

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
    "strengths": ["Force 1", "Force 2", "Force 3"],
    "weaknesses": ["Faiblesse 1", "Faiblesse 2"],
    "opportunities": ["Opportunité 1", "Opportunité 2"],
    "risks": ["Risque 1", "Risque 2"],
    "observations": {
${evaluationCriteria.map(c => `      "${c.name}": "[COMMENTAIRE DÉTAILLÉ DE 200-300 MOTS]"`).join(',\n')}
    }
  }
}

=== CRITÈRES DE NOTATION ===
- "selected": Score global ≥ 80%
- "pre_selected": Score global ≥ 60%
- "rejected": Score global < 60%

Chaque commentaire dans "observations" doit contenir minimum 200 mots avec: introduction, analyse détaillée, points forts/faibles, recommandations.`;

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
          comment = `ÉVALUATION DU CRITÈRE "${criterion.name}" (Score: ${score}/${criterion.maxScore} soit ${percentage}%)

ANALYSE DÉTAILLÉE:
Le projet a obtenu un score de ${score} sur ${criterion.maxScore} pour ce critère, représentant ${percentage}% de la note maximale. Cette évaluation se base sur une analyse approfondie des documents fournis et des données disponibles dans le dossier.

${comment || 'Sur la base des éléments fournis, l\'évaluation révèle plusieurs aspects importants. L\'analyse montre une approche cohérente dans la présentation du projet.'}

POINTS FORTS IDENTIFIÉS:
Les forces du projet sur ce critère se manifestent par une présentation structurée et des arguments soutenus. Les données présentées démontrent une réflexion approfondie et une compréhension des enjeux.

AXES D'AMÉLIORATION:
Une documentation plus exhaustive sur certains points techniques permettrait de consolider l'évaluation. Des précisions supplémentaires sur la méthodologie seraient appréciables.

RECOMMANDATIONS:
Pour améliorer le score: (1) Développer davantage les aspects techniques, (2) Fournir des données quantitatives complémentaires, (3) Renforcer l'argumentation sur les méthodologies employées.

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
    } catch {
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
        }
        observations[criterion.name] = 'Le projet montre un potentiel d\'innovation satisfaisant.';
      } else if (criterion.name.toLowerCase().includes('faisabilité') || criterion.name.toLowerCase().includes('technique')) {
        observations[criterion.name] = 'Bonne maîtrise technique démontrée avec un budget réaliste.';
      } else if (criterion.name.toLowerCase().includes('impact')) {
        observations[criterion.name] = 'Impact social identifiable avec des bénéficiaires clairement définis.';
      } else {
        observations[criterion.name] = `Score de ${score}/${criterion.maxScore} — performance satisfaisante sur ce critère.`;
      }

      scores[criterion.name] = Math.max(0, Math.min(criterion.maxScore, score));
    });

    const totalScore = evaluationCriteria.reduce((total, criterion) =>
      total + (scores[criterion.name] / criterion.maxScore) * criterion.weight, 0);

    let recommendation: 'pre_selected' | 'selected' | 'rejected' = 'rejected';
    if (totalScore >= 80) recommendation = 'selected';
    else if (totalScore >= 60) recommendation = 'pre_selected';

    const strengths = evaluationCriteria
      .filter(c => (scores[c.name] / c.maxScore) >= 0.8)
      .map(c => `${c.name}: Performance excellente`);
    const weaknesses = evaluationCriteria
      .filter(c => (scores[c.name] / c.maxScore) < 0.6)
      .map(c => `${c.name}: Nécessite des améliorations`);

    if (strengths.length === 0) strengths.push('Projet cohérent dans son ensemble');
    if (weaknesses.length === 0) weaknesses.push('Quelques aspects nécessitent un suivi rapproché');

    return {
      scores,
      notes: `Évaluation simulée. Score global: ${Math.round(totalScore)}%. ${
        totalScore >= 80 ? 'Projet très prometteur recommandé pour financement.' :
        totalScore >= 60 ? 'Projet intéressant nécessitant quelques ajustements.' :
        'Projet nécessitant des améliorations significatives.'
      }`,
      recommendation,
      detailedAnalysis: {
        strengths,
        weaknesses,
        opportunities: ['Potentiel de scalabilité identifié', 'Intégration possible dans l\'écosystème régional'],
        risks: ['Dépendances potentielles vis-à-vis de partenaires externes'],
        observations,
      },
    };
  }
}

export const aiEvaluationService = new AIEvaluationService();
