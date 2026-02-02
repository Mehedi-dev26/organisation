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
    const PIPRAPAY_API_KEY = Deno.env.get('PIPRAPAY_API_KEY');
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
    const pirapayResponse = await fetch(`${PIPRAPAY_BASE_URL}/create-charge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PIPRAPAY_API_KEY}`,
      },
      body: JSON.stringify({
        amount: amount,
        customer_name: member_name,
        customer_email: member_email || '',
        customer_phone: member_phone || '',
        redirect_url: successUrl,
        cancel_url: cancelUrl,
        webhook_url: webhookUrl,
        reference: reference,
        metadata: {
          due_id: due_id,
          member_id: member_id,
          month_year: month_year,
        },
      }),
    });

    const pirapayData = await pirapayResponse.json();

    if (!pirapayResponse.ok || !pirapayData.success) {
      console.error('PipraPay error:', pirapayData);
      throw new Error(pirapayData.message || 'Failed to create PipraPay charge');
    }

    // Update member_dues with pending status and PipraPay reference
    const { error: updateError } = await supabase
      .from('member_dues')
      .update({
        payment_status: 'piprapay_pending',
        transaction_id: pirapayData.charge_id || reference,
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
