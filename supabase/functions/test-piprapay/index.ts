import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const PIPRAPAY_API_KEY = (Deno.env.get('PIPRAPAY_API_KEY') ?? '').trim();
  const PIPRAPAY_BASE_URL = 'https://pay.aktoyworld.shop/api';

  // Test 1: Check if endpoint is reachable
  console.log('Testing PipraPay endpoint...');
  console.log('API Key length:', PIPRAPAY_API_KEY.length);
  console.log('API Key first 10 chars:', PIPRAPAY_API_KEY.substring(0, 10));
  console.log('API Key last 10 chars:', PIPRAPAY_API_KEY.substring(PIPRAPAY_API_KEY.length - 10));

  const testResults: Array<{method: string; status: number; body: string}> = [];

  // Test payload according to official PipraPay documentation
  const testPayload = {
    full_name: "Test User",
    email_mobile: "test@test.com",
    amount: "10",
    metadata: { test: "true" },
    redirect_url: "https://example.com/success",
    return_type: "POST",
    cancel_url: "https://example.com/cancel",
    webhook_url: "https://example.com/webhook",
    currency: "BDT",
  };

  // Method 1: mh-piprapay-api-key header (OFFICIAL - per documentation)
  try {
    const res1 = await fetch(`${PIPRAPAY_BASE_URL}/create-charge`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'mh-piprapay-api-key': PIPRAPAY_API_KEY,
      },
      body: JSON.stringify(testPayload),
    });
    const body1 = await res1.text();
    testResults.push({ method: 'mh-piprapay-api-key (OFFICIAL)', status: res1.status, body: body1.substring(0, 500) });
  } catch (e) {
    testResults.push({ method: 'mh-piprapay-api-key (OFFICIAL)', status: 0, body: String(e) });
  }

  // Method 2: Mh-Piprapay-Api-Key (case variant)
  try {
    const res2 = await fetch(`${PIPRAPAY_BASE_URL}/create-charge`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Mh-Piprapay-Api-Key': PIPRAPAY_API_KEY,
      },
      body: JSON.stringify(testPayload),
    });
    const body2 = await res2.text();
    testResults.push({ method: 'Mh-Piprapay-Api-Key', status: res2.status, body: body2.substring(0, 500) });
  } catch (e) {
    testResults.push({ method: 'Mh-Piprapay-Api-Key', status: 0, body: String(e) });
  }

  console.log('Test results:', JSON.stringify(testResults, null, 2));

  return new Response(
    JSON.stringify({
      api_key_length: PIPRAPAY_API_KEY.length,
      api_key_preview: `${PIPRAPAY_API_KEY.substring(0, 6)}...${PIPRAPAY_API_KEY.substring(PIPRAPAY_API_KEY.length - 6)}`,
      results: testResults,
    }, null, 2),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
  );
});
