import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ProxyRequest {
  provider: "anthropic" | "mistral" | "gemini" | "chatgpt";
  apiKey: string;
  model: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: ProxyRequest = await req.json();
    const { provider, apiKey, model, prompt, systemPrompt, temperature = 0.3, maxTokens = 8192 } = body;

    if (!provider || !apiKey || !model || !prompt) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: provider, apiKey, model, prompt" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let responseText: string;

    if (provider === "anthropic") {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt || "Vous êtes un expert en évaluation de projets. Analysez objectivement les projets selon les critères fournis et répondez uniquement au format JSON demandé.",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const msg = err?.error?.message || "Erreur inconnue";
        if (response.status === 401) throw new Error("Clé API Anthropic invalide ou expirée.");
        if (response.status === 429) throw new Error("Limite de taux API Anthropic dépassée. Réessayez plus tard.");
        throw new Error(`Erreur API Anthropic: ${response.status} - ${msg}`);
      }

      const data = await response.json();
      responseText = data.content[0].text;

    } else if (provider === "mistral") {
      const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: systemPrompt || "Vous êtes un expert en évaluation de projets. Analysez objectivement les projets selon les critères fournis et répondez uniquement au format JSON demandé.",
            },
            { role: "user", content: prompt },
          ],
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const msg = err?.error?.message || err?.message || "Erreur inconnue";
        if (response.status === 401) throw new Error("Clé API Mistral invalide ou expirée.");
        if (response.status === 429) throw new Error("Limite de taux API Mistral dépassée. Réessayez plus tard.");
        throw new Error(`Erreur API Mistral: ${response.status} - ${msg}`);
      }

      const data = await response.json();
      responseText = data.choices[0].message.content;

    } else if (provider === "gemini") {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: maxTokens,
            },
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const msg = err?.error?.message || "Erreur inconnue";
        if (response.status === 400) throw new Error(`Requête invalide (400): ${msg}. Modèle: "${model}".`);
        throw new Error(`Erreur API Gemini: ${response.status} - ${msg}`);
      }

      const data = await response.json();
      responseText = data.candidates[0].content.parts[0].text;

    } else if (provider === "chatgpt") {
      const isOSeries = model.startsWith("o1") || model.startsWith("o3") || model.startsWith("o4");
      const msgBody: Record<string, unknown> = {
        model,
        messages: [
          {
            role: "system",
            content: systemPrompt || "Vous êtes un expert en évaluation de projets. Analysez objectivement les projets selon les critères fournis et répondez uniquement au format JSON demandé.",
          },
          { role: "user", content: prompt },
        ],
      };

      if (isOSeries) {
        msgBody.max_completion_tokens = maxTokens;
      } else {
        msgBody.temperature = temperature;
        msgBody.max_tokens = maxTokens;
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(msgBody),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const msg = err?.error?.message || "Erreur inconnue";
        if (response.status === 401) throw new Error("Clé API OpenAI invalide ou expirée.");
        if (response.status === 429) throw new Error("Limite de taux API OpenAI dépassée. Réessayez plus tard.");
        if (response.status === 400) throw new Error(`Requête invalide (400): ${msg}. Modèle: "${model}".`);
        throw new Error(`Erreur API OpenAI: ${response.status} - ${msg}`);
      }

      const data = await response.json();
      responseText = data.choices[0].message.content;

    } else {
      return new Response(
        JSON.stringify({ error: `Provider non supporté: ${provider}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ text: responseText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
