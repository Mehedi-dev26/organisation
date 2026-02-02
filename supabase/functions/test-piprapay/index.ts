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

  // Test different API formats
  const testPayload = {
    amount: 10,
    customer_name: "Test",
    customer_email: "test@test.com",
    customer_phone: "01700000000",
    redirect_url: "https://example.com/success",
    cancel_url: "https://example.com/cancel",
    webhook_url: "https://example.com/webhook",
    reference: "TEST-123",
  };

  // Method 1: api_key in body
  try {
    const res1 = await fetch(`${PIPRAPAY_BASE_URL}/create-charge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...testPayload, api_key: PIPRAPAY_API_KEY }),
    });
    const body1 = await res1.text();
    testResults.push({ method: 'body.api_key', status: res1.status, body: body1.substring(0, 500) });
  } catch (e) {
    testResults.push({ method: 'body.api_key', status: 0, body: String(e) });
  }

  // Method 2: Bearer token
  try {
    const res2 = await fetch(`${PIPRAPAY_BASE_URL}/create-charge`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PIPRAPAY_API_KEY}`,
      },
      body: JSON.stringify(testPayload),
    });
    const body2 = await res2.text();
    testResults.push({ method: 'Bearer', status: res2.status, body: body2.substring(0, 500) });
  } catch (e) {
    testResults.push({ method: 'Bearer', status: 0, body: String(e) });
  }

  // Method 3: x-api-key header
  try {
    const res3 = await fetch(`${PIPRAPAY_BASE_URL}/create-charge`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': PIPRAPAY_API_KEY,
      },
      body: JSON.stringify(testPayload),
    });
    const body3 = await res3.text();
    testResults.push({ method: 'x-api-key', status: res3.status, body: body3.substring(0, 500) });
  } catch (e) {
    testResults.push({ method: 'x-api-key', status: 0, body: String(e) });
  }

  // Method 4: API-KEY header (uppercase)
  try {
    const res4 = await fetch(`${PIPRAPAY_BASE_URL}/create-charge`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'API-KEY': PIPRAPAY_API_KEY,
      },
      body: JSON.stringify(testPayload),
    });
    const body4 = await res4.text();
    testResults.push({ method: 'API-KEY', status: res4.status, body: body4.substring(0, 500) });
  } catch (e) {
    testResults.push({ method: 'API-KEY', status: 0, body: String(e) });
  }

  // Method 5: secret_key in body (alternative field name)
  try {
    const res5 = await fetch(`${PIPRAPAY_BASE_URL}/create-charge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...testPayload, secret_key: PIPRAPAY_API_KEY }),
    });
    const body5 = await res5.text();
    testResults.push({ method: 'body.secret_key', status: res5.status, body: body5.substring(0, 500) });
  } catch (e) {
    testResults.push({ method: 'body.secret_key', status: 0, body: String(e) });
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
