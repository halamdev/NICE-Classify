import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NICE_CONTEXT = `You are a NICE Classification expert for trademark registration (NCL 13-2026).
Given a product/service description, classify it into the appropriate NICE class(es).

The 45 NICE classes are:
Classes 1-34: GOODS
1-Chemicals, 2-Paints, 3-Cosmetics, 4-Industrial oils, 5-Pharmaceuticals, 6-Common metals, 7-Machines, 8-Hand tools, 9-Computers/Electronics/Software, 10-Medical apparatus, 11-Lighting/Heating, 12-Vehicles, 13-Firearms, 14-Precious metals/Jewelry, 15-Musical instruments, 16-Paper/Printing, 17-Rubber/Plastics, 18-Leather goods/Bags, 19-Building materials, 20-Furniture, 21-Household utensils, 22-Ropes/Nets, 23-Yarns, 24-Textiles, 25-Clothing/Footwear, 26-Lace/Embroidery, 27-Carpets, 28-Games/Toys/Sports, 29-Processed foods, 30-Staple foods/Spices, 31-Agricultural products, 32-Beers/Non-alcoholic beverages, 33-Alcoholic beverages, 34-Tobacco

Classes 35-45: SERVICES
35-Advertising/Business management, 36-Insurance/Finance, 37-Construction/Repair, 38-Telecommunications, 39-Transport/Storage, 40-Material treatment, 41-Education/Entertainment, 42-Technology/Software design, 43-Food services/Hotels, 44-Medical/Beauty services, 45-Legal/Security services

IMPORTANT RULES:
- Return 1-3 most relevant classes ranked by confidence
- Provide confidence score (0-1) for each
- Explain WHY each class was chosen using NICE classification rules
- Mention specific items from the NICE alphabetical list when possible
- Consider both the literal and functional aspects of the product/service
- If a product could span multiple classes, explain the distinction

You MUST respond in valid JSON with this exact structure:
{
  "results": [
    {
      "classNumber": <number>,
      "confidence": <0-1>,
      "reason": "<explanation in the same language as the query>",
      "items": ["<related NICE items>"]
    }
  ]
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, language } = await req.json();

    if (!query || typeof query !== "string" || query.length > 1000) {
      return new Response(
        JSON.stringify({ error: "Invalid query" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const langInstruction = language === "en"
      ? "Respond with explanations in English."
      : "Respond with explanations in Vietnamese (tiếng Việt).";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: NICE_CONTEXT },
          { role: "user", content: `${langInstruction}\n\nClassify this product/service: "${query}"` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response (handle markdown code blocks)
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { results: [] };
    } catch {
      console.error("Failed to parse AI response:", content);
      parsed = { results: [] };
    }

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("classify error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
