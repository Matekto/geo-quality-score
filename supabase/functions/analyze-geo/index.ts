// @ts-ignore: Deno deploy

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeoAnalysis {
  score: number;
  diagnostic: string;
  improvements: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching website content for:", url);

    // Fetch the webpage content
    const websiteResponse = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; GEOScorer/1.0)",
      },
    });

    if (!websiteResponse.ok) {
      throw new Error(`Failed to fetch website: ${websiteResponse.status}`);
    }

    const html = await websiteResponse.text();
    
    // Extract text content (simple extraction, removing HTML tags)
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 15000); // Limit content size

    console.log("Analyzing content with Lovable AI...");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `Tu es un expert en GEO (Generative Engine Optimization). Le GEO désigne les techniques qui augmentent la qualité perçue d'une page web par les modèles de langage (IA).

Analyse le contenu de la page web fournie et évalue-la selon ces critères (chacun valant jusqu'à 10 points) :
1. Sources externes explicites provenant d'institutions autoritaires
2. Utilisation de statistiques précises plutôt que de qualificatifs vagues
3. Citations d'experts
4. Définitions des termes complexes
5. Hiérarchie structurelle claire (titres, sous-titres, sections)
6. Résumé concis ou points clés à retenir
7. Exemples concrets ou études de cas
8. Langage standardisé et non ambigu
9. Liens internes pertinents
10. Recommandations actionnables ou étapes suivantes

Ta réponse DOIT être au format JSON valide avec cette structure exacte :
{
  "score": <nombre de 0 à 100>,
  "diagnostic": "<explication détaillée en français de ce qui est présent, ce qui manque, et comment chaque facteur affecte le score>",
  "improvements": [
    "<amélioration 1>",
    "<amélioration 2>",
    ... (exactement 10 améliorations)
  ]
}

Chaque amélioration doit être une action concrète et mesurable qui augmenterait le score. Réponds en français.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyse ce contenu de page web :\n\n${textContent}` },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte. Veuillez réessayer dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA épuisés. Veuillez ajouter des crédits à votre espace de travail." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const responseContent = aiData.choices[0].message.content;

    console.log("AI Response:", responseContent);

    // Parse the JSON response
    let analysis: GeoAnalysis;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = responseContent.match(/```json\n([\s\S]*?)\n```/) || 
                       responseContent.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : responseContent;
      analysis = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Failed to parse AI analysis");
    }

    // Validate the response structure
    if (!analysis.score || !analysis.diagnostic || !Array.isArray(analysis.improvements)) {
      throw new Error("Invalid analysis structure from AI");
    }

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-geo function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An unexpected error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
