import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InitiateRequest {
  due_id: string;
  member_id: string;
  amount: number;
  month_year: string;
  member_name: string;
  member_email?: string;
  member_phone?: string;
}

type PipraPayResponse = {
  success?: boolean;
  status?: boolean;
  message?: string;
  payment_url?: string;
  charge_id?: string;
  pp_id?: string;
  [key: string]: unknown;
};

function maskKey(key: string) {
  if (!key) return "";
  if (key.length <= 8) return "***";
  return `${key.slice(0, 4)}***${key.slice(-4)}`;
}

function isPipraPaySuccess(data: PipraPayResponse) {
  const okFlag = data.success === true || data.status === true;
  return okFlag && typeof data.payment_url === "string" && data.payment_url.length > 0;
}

async function parseJsonSafe(response: Response): Promise<{ json: unknown; raw: string }> {
  const raw = await response.text();
  try {
    return { json: JSON.parse(raw), raw };
  } catch {
    return { json: { raw }, raw };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PIPRAPAY_API_KEY = (Deno.env.get('PIPRAPAY_API_KEY') ?? '').trim();
    const PIPRAPAY_BASE_URL = 'https://pay.aktoyworld.shop/api';
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!PIPRAPAY_API_KEY) {
      throw new Error('PipraPay API Key not configured');
    }

    const { due_id, member_id, amount, month_year, member_name, member_email, member_phone }: InitiateRequest = await req.json();

    if (!due_id || !amount || !month_year) {
      throw new Error('Missing required fields: due_id, amount, month_year');
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Generate unique reference
    const reference = `DUES-${due_id.substring(0, 8)}-${Date.now()}`;

    // Get webhook URL - using the Supabase function URL
    const webhookUrl = `${SUPABASE_URL}/functions/v1/pirapay-webhook`;
    
    // Get success/cancel URLs
    const baseUrl = req.headers.get('origin') || 'https://samoyer-batighor.lovable.app';
    const successUrl = `${baseUrl}/member-dashboard?payment=success`;
    const cancelUrl = `${baseUrl}/member/pay-dues?payment=cancelled`;

    // Create charge in PipraPay
    // We don't have official docs for this self-hosted instance, so we try several common auth styles.
    const baseChargePayload = {
      amount,
      customer_name: member_name,
      customer_email: member_email || "",
      customer_phone: member_phone || "",
      redirect_url: successUrl,
      cancel_url: cancelUrl,
      webhook_url: webhookUrl,
      reference,
      metadata: {
        due_id,
        member_id,
        month_year,
      },
    };

    const attempts: Array<{ name: string; headers: Record<string, string>; body: Record<string, unknown> }> = [
      {
        name: "body.api_key",
        headers: { "Content-Type": "application/json" },
        body: { ...baseChargePayload, api_key: PIPRAPAY_API_KEY },
      },
      {
        name: "header.Authorization.Bearer",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PIPRAPAY_API_KEY}`,
        },
        body: { ...baseChargePayload },
      },
      {
        name: "header.x-api-key",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": PIPRAPAY_API_KEY,
        },
        body: { ...baseChargePayload },
      },
      {
        name: "header.api-key",
        headers: {
          "Content-Type": "application/json",
          "api-key": PIPRAPAY_API_KEY,
        },
        body: { ...baseChargePayload },
      },
      {
        name: "header.X-API-KEY",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": PIPRAPAY_API_KEY,
        },
        body: { ...baseChargePayload },
      },
    ];

    console.log(
      `PipraPay create-charge attempts=${attempts.length}, api_key(masked)=${maskKey(PIPRAPAY_API_KEY)}, endpoint=${PIPRAPAY_BASE_URL}/create-charge`,
    );

    let pirapayData: PipraPayResponse | null = null;
    let lastRaw = "";
    let lastStatus = 0;
    let lastAttemptName = "";

    for (const attempt of attempts) {
      lastAttemptName = attempt.name;
      const pirapayResponse = await fetch(`${PIPRAPAY_BASE_URL}/create-charge`, {
        method: "POST",
        headers: attempt.headers,
        body: JSON.stringify(attempt.body),
      });

      lastStatus = pirapayResponse.status;
      const parsed = await parseJsonSafe(pirapayResponse);
      lastRaw = parsed.raw;
      pirapayData = (parsed.json ?? {}) as PipraPayResponse;

      const message = typeof pirapayData.message === "string" ? pirapayData.message : "";
      console.log(
        `[${attempt.name}] status=${pirapayResponse.status} ok=${pirapayResponse.ok} successFlag=${pirapayData.success ?? pirapayData.status ?? "n/a"} message=${message}`,
      );

      if (pirapayResponse.ok && isPipraPaySuccess(pirapayData)) {
        break;
      }
    }

    if (!pirapayData || !isPipraPaySuccess(pirapayData)) {
      const msg = (pirapayData && typeof pirapayData.message === "string" && pirapayData.message) || "Failed to create PipraPay charge";
      console.error("PipraPay error (final):", { lastAttemptName, lastStatus, msg, lastRawPreview: lastRaw.slice(0, 400) });
      throw new Error(`${msg} (attempt=${lastAttemptName}, http=${lastStatus})`);
    }

    // Update member_dues with pending status and PipraPay reference
    const { error: updateError } = await supabase
      .from('member_dues')
      .update({
        payment_status: 'piprapay_pending',
        transaction_id: (pirapayData.charge_id as string) || (pirapayData.pp_id as string) || reference,
        payment_method: 'piprapay',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', due_id);

    if (updateError) {
      console.error('Database update error:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_url: pirapayData.payment_url,
        charge_id: pirapayData.charge_id,
        reference: reference,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error('Error in pirapay-initiate:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
