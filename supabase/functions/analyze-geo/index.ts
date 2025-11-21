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

    const systemPrompt = `You are a GEO (Generative Engine Optimization) scoring expert. GEO refers to techniques that increase the perceived quality of a webpage for Large Language Models.

Analyze the provided webpage content and evaluate it based on these criteria (each worth up to 10 points):
1. Explicit external sources from authoritative institutions
2. Use of precise statistics instead of vague qualifiers
3. Expert quotations
4. Definitions for any complex terms
5. Clear structural hierarchy (titles, subtitles, sections)
6. A concise summary or key takeaways
7. Concrete examples or case studies
8. Standardized and unambiguous language
9. Relevant internal linking
10. Actionable recommendations or next steps

Your response MUST be in valid JSON format with this exact structure:
{
  "score": <number 0-100>,
  "diagnostic": "<detailed explanation of what is present, what is missing, and how each factor affects the score>",
  "improvements": [
    "<improvement 1>",
    "<improvement 2>",
    ... (exactly 10 improvements)
  ]
}

Each improvement should be a concrete, measurable action that would increase the score.`;

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
          { role: "user", content: `Analyze this webpage content:\n\n${textContent}` },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to your workspace." }),
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
