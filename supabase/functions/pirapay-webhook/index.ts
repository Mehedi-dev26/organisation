import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    // Parse webhook payload from PipraPay
    const webhookData = await req.json();
    
    console.log('PipraPay webhook received:', JSON.stringify(webhookData, null, 2));

    // Extract data from webhook - based on common PipraPay structure
    const {
      pp_id,
      charge_id,
      reference,
      transaction_id,
      payment_method,
      amount,
      status,
      customer_name,
      customer_email,
      customer_phone,
      metadata,
    } = webhookData;

    // Get due_id from metadata or reference
    let due_id = metadata?.due_id;
    let member_id = metadata?.member_id;
    let month_year = metadata?.month_year;

    // If metadata is not available, try to extract from reference
    if (!due_id && reference) {
      // Reference format: DUES-{due_id_first_8_chars}-{timestamp}
      const parts = reference.split('-');
      if (parts.length >= 2 && parts[0] === 'DUES') {
        // We need to find the due by partial ID match
        const partialDueId = parts[1];
        
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: dues } = await supabase
          .from('member_dues')
          .select('id, member_id, month_year')
          .ilike('id', `${partialDueId}%`)
          .eq('payment_status', 'piprapay_pending')
          .limit(1);
        
        if (dues && dues.length > 0) {
          due_id = dues[0].id;
          member_id = dues[0].member_id;
          month_year = dues[0].month_year;
        }
      }
    }

    if (!due_id) {
      console.error('Could not determine due_id from webhook data');
      return new Response(
        JSON.stringify({ success: false, error: 'Could not determine due_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check payment status
    const isSuccessful = status === 'success' || status === 'completed' || status === 'paid';

    if (isSuccessful) {
      // Update member_dues as paid
      const { error: updateError } = await supabase
        .from('member_dues')
        .update({
          is_paid: true,
          payment_status: 'verified',
          paid_date: new Date().toISOString(),
          verified_at: new Date().toISOString(),
          transaction_id: transaction_id || pp_id || charge_id,
          payment_method: payment_method || 'piprapay',
        })
        .eq('id', due_id);

      if (updateError) {
        console.error('Error updating member_dues:', updateError);
        throw updateError;
      }

      // Create transaction record
      const { error: txnError } = await supabase
        .from('transactions')
        .insert({
          type: 'member_fee',
          amount: parseFloat(amount) || 0,
          member_id: member_id,
          month_year: month_year,
          payment_method: payment_method || 'piprapay',
          payment_reference: transaction_id || pp_id,
          description_bn: `${month_year} মাসের চাঁদা (PipraPay)`,
          description_en: `Monthly dues for ${month_year} (PipraPay)`,
          transaction_date: new Date().toISOString(),
        });

      if (txnError) {
        console.error('Error creating transaction:', txnError);
      }

      // Send success email notification
      if (RESEND_API_KEY && customer_email) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Samoyer Batighor <onboarding@resend.dev>',
              to: customer_email,
              subject: 'পেমেন্ট সফল - Samoyer Batighor',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #16a34a;">✅ পেমেন্ট সফল হয়েছে!</h2>
                  <p>প্রিয় ${customer_name || 'সদস্য'},</p>
                  <p>আপনার <strong>${month_year}</strong> মাসের চাঁদা <strong>৳${amount}</strong> সফলভাবে গ্রহণ করা হয়েছে।</p>
                  <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>ট্রানজেকশন আইডি:</strong> ${transaction_id || pp_id}</p>
                    <p style="margin: 5px 0;"><strong>পেমেন্ট মেথড:</strong> ${payment_method || 'PipraPay'}</p>
                  </div>
                  <p>ধন্যবাদ।</p>
                  <p style="color: #6b7280; font-size: 12px;">Samoyer Batighor</p>
                </div>
              `,
            }),
          });
        } catch (emailError) {
          console.error('Email send error:', emailError);
        }
      }

      console.log(`Payment successful for due_id: ${due_id}`);
    } else {
      // Payment failed - update status
      const { error: updateError } = await supabase
        .from('member_dues')
        .update({
          payment_status: 'piprapay_failed',
          rejection_reason: `PipraPay payment ${status || 'failed'}`,
        })
        .eq('id', due_id);

      if (updateError) {
        console.error('Error updating failed payment:', updateError);
      }

      console.log(`Payment failed for due_id: ${due_id}, status: ${status}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error in pirapay-webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
