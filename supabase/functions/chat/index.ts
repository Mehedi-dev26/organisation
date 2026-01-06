import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are a helpful AI assistant for "সময়ের বাতিঘর" (Somoyer Batighor) - a community welfare organization.

About the Organization:
- Name (Bengali): সময়ের বাতিঘর
- Name (English): Somoyer Batighor (Lighthouse of Time)
- Slogan: একতাই শক্তি, সেবাই ধর্ম (Unity is Strength, Service is Religion)
- Purpose: A community organization focused on social welfare, member support, and community development
- Activities: Member welfare programs, community events, charity work, and social gatherings

Membership Information:
- Anyone can become a member by registering through the website
- Members pay monthly dues to support the organization's activities
- Members can participate in events, get access to member benefits, and be part of the community

Contact Information:
- Email: contact@somoyerbatighor.org
- Phone: +880 1XXX-XXXXXX
- Website: Visit our website for more details

Guidelines:
1. Always be helpful, respectful, and friendly
2. Respond in the same language the user uses (Bengali or English)
3. If asked about specific member information or confidential data, politely explain you cannot access that
4. For membership registration, direct users to the registration page
5. For dues payment, direct users to the member dashboard after login
6. Keep responses concise but informative
7. Use appropriate greetings based on Bengali culture (আসসালামু আলাইকুম, নমস্কার, etc.)`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    console.log("Sending request to Lovable AI Gateway with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "অনেক বেশি অনুরোধ। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।" }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI সার্ভিস সাময়িকভাবে অনুপলব্ধ।" }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI সার্ভিসে সমস্যা হয়েছে।" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Streaming response from AI gateway");
    
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
