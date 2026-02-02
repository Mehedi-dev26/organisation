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

    // Get webhook URL - using the Supabase function URL
    const webhookUrl = `${SUPABASE_URL}/functions/v1/pirapay-webhook`;
    
    // Get success/cancel URLs
    const baseUrl = req.headers.get('origin') || 'https://samoyer-batighor.lovable.app';
    const successUrl = `${baseUrl}/member-dashboard?payment=success`;
    const cancelUrl = `${baseUrl}/member/pay-dues?payment=cancelled`;

    // Prepare email_mobile - use email if available, otherwise phone
    const emailMobile = member_email || member_phone || '';

    // Create charge payload according to PipraPay API documentation
    const chargePayload = {
      full_name: member_name,
      email_mobile: emailMobile,
      amount: String(amount),
      metadata: {
        due_id,
        member_id,
        month_year,
      },
      redirect_url: successUrl,
      return_type: 'POST',
      cancel_url: cancelUrl,
      webhook_url: webhookUrl,
      currency: 'BDT',
    };

    console.log('PipraPay create-charge request:', {
      url: `${PIPRAPAY_BASE_URL}/create-charge`,
      payload: { ...chargePayload, metadata: '...' },
    });

    // Call PipraPay API with correct header: mh-piprapay-api-key
    const pirapayResponse = await fetch(`${PIPRAPAY_BASE_URL}/create-charge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'mh-piprapay-api-key': PIPRAPAY_API_KEY,
      },
      body: JSON.stringify(chargePayload),
    });

    const responseText = await pirapayResponse.text();
    console.log('PipraPay response:', {
      status: pirapayResponse.status,
      body: responseText.substring(0, 500),
    });

    let pirapayData;
    try {
      pirapayData = JSON.parse(responseText);
    } catch {
      throw new Error(`Invalid JSON response from PipraPay: ${responseText.substring(0, 200)}`);
    }

    // Check for successful response - pp_url is the payment URL per documentation
    const isSuccess = pirapayData.status === true || pirapayData.success === true;
    const paymentUrl = pirapayData.pp_url || pirapayData.payment_url || pirapayData.url;

    if (!pirapayResponse.ok || !isSuccess || !paymentUrl) {
      const errorMsg = pirapayData.message || pirapayData.error || 'Failed to create PipraPay charge';
      console.error('PipraPay error:', { status: pirapayResponse.status, data: pirapayData });
      throw new Error(errorMsg);
    }

    // Get pp_id from response
    const ppId = pirapayData.pp_id || pirapayData.id || pirapayData.charge_id;

    // Update member_dues with pending status and PipraPay reference
    const { error: updateError } = await supabase
      .from('member_dues')
      .update({
        payment_status: 'piprapay_pending',
        transaction_id: ppId || `PP-${Date.now()}`,
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
        payment_url: paymentUrl,
        pp_id: ppId,
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
