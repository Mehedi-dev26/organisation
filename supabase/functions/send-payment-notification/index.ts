import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentNotificationRequest {
  email: string;
  memberName: string;
  monthYear: string;
  amount: number;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
  paymentMethod?: string;
  transactionId?: string;
}

const sendEmail = async (to: string, subject: string, html: string) => {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "সময়ের বাতিঘর <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: html,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return res.json();
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { 
      email, 
      memberName, 
      monthYear, 
      amount, 
      status, 
      rejectionReason,
      paymentMethod,
      transactionId
    }: PaymentNotificationRequest = await req.json();

    // Validate required fields
    if (!email || !memberName || !monthYear || !amount || !status) {
      throw new Error("Missing required fields");
    }

    let subject: string;
    let htmlContent: string;

    const paymentMethodLabel = paymentMethod === 'bkash' ? 'বিকাশ' :
                               paymentMethod === 'nagad' ? 'নগদ' :
                               paymentMethod === 'rocket' ? 'রকেট' :
                               paymentMethod === 'bank' ? 'ব্যাংক' : paymentMethod || '';

    if (status === 'approved') {
      subject = `✅ আপনার ${monthYear} মাসের চাঁদা অনুমোদিত হয়েছে - সময়ের বাতিঘর`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f7fa; padding: 20px 0;">
            <tr>
              <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✅ অভিনন্দন!</h1>
                      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">আপনার পেমেন্ট সফলভাবে অনুমোদিত হয়েছে</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                        প্রিয় <strong>${memberName}</strong>,
                      </p>
                      <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                        আপনার <strong>${monthYear}</strong> মাসের সদস্য চাঁদা সফলভাবে অনুমোদিত হয়েছে। আপনার সহযোগিতার জন্য ধন্যবাদ।
                      </p>
                      
                      <!-- Payment Details Box -->
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0; margin-bottom: 25px;">
                        <tr>
                          <td style="padding: 20px;">
                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                              <tr>
                                <td style="color: #6b7280; font-size: 14px; padding: 5px 0;">মাস-বছর:</td>
                                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${monthYear}</td>
                              </tr>
                              <tr>
                                <td style="color: #6b7280; font-size: 14px; padding: 5px 0;">পরিমাণ:</td>
                                <td style="color: #059669; font-size: 18px; font-weight: 700; text-align: right;">৳${amount}</td>
                              </tr>
                              ${paymentMethodLabel ? `
                              <tr>
                                <td style="color: #6b7280; font-size: 14px; padding: 5px 0;">পেমেন্ট মাধ্যম:</td>
                                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${paymentMethodLabel}</td>
                              </tr>
                              ` : ''}
                              ${transactionId ? `
                              <tr>
                                <td style="color: #6b7280; font-size: 14px; padding: 5px 0;">ট্রানজেকশন আইডি:</td>
                                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${transactionId}</td>
                              </tr>
                              ` : ''}
                              <tr>
                                <td style="color: #6b7280; font-size: 14px; padding: 5px 0;">স্ট্যাটাস:</td>
                                <td style="text-align: right;">
                                  <span style="background-color: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">অনুমোদিত</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                        সংগঠনের প্রতি আপনার অবদানের জন্য কৃতজ্ঞতা জানাই।
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 14px; margin: 0 0 5px 0; font-weight: 600;">সময়ের বাতিঘর</p>
                      <p style="color: #9ca3af; font-size: 12px; margin: 0;">একটি সামাজিক ও সাংস্কৃতিক সংগঠন</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;
    } else {
      subject = `❌ আপনার ${monthYear} মাসের চাঁদা প্রত্যাখ্যাত হয়েছে - সময়ের বাতিঘর`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f7fa; padding: 20px 0;">
            <tr>
              <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">❌ পেমেন্ট প্রত্যাখ্যাত</h1>
                      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">আপনার পেমেন্ট যাচাইকরণে সমস্যা হয়েছে</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                        প্রিয় <strong>${memberName}</strong>,
                      </p>
                      <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                        দুঃখিত! আপনার <strong>${monthYear}</strong> মাসের সদস্য চাঁদার পেমেন্ট প্রত্যাখ্যাত হয়েছে। অনুগ্রহ করে নিচের কারণটি দেখুন এবং সঠিক তথ্য দিয়ে আবার চেষ্টা করুন।
                      </p>
                      
                      <!-- Rejection Reason Box -->
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #fef2f2; border-radius: 8px; border: 1px solid #fecaca; margin-bottom: 25px;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="color: #991b1b; font-size: 14px; font-weight: 600; margin: 0 0 10px 0;">প্রত্যাখ্যানের কারণ:</p>
                            <p style="color: #7f1d1d; font-size: 15px; line-height: 1.6; margin: 0; background-color: #ffffff; padding: 15px; border-radius: 6px; border-left: 4px solid #ef4444;">
                              ${rejectionReason || 'কোনো কারণ উল্লেখ করা হয়নি'}
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Payment Details Box -->
                      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 25px;">
                        <tr>
                          <td style="padding: 20px;">
                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                              <tr>
                                <td style="color: #6b7280; font-size: 14px; padding: 5px 0;">মাস-বছর:</td>
                                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${monthYear}</td>
                              </tr>
                              <tr>
                                <td style="color: #6b7280; font-size: 14px; padding: 5px 0;">পরিমাণ:</td>
                                <td style="color: #111827; font-size: 16px; font-weight: 700; text-align: right;">৳${amount}</td>
                              </tr>
                              ${transactionId ? `
                              <tr>
                                <td style="color: #6b7280; font-size: 14px; padding: 5px 0;">জমা দেওয়া ট্রানজেকশন আইডি:</td>
                                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${transactionId}</td>
                              </tr>
                              ` : ''}
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                        অনুগ্রহ করে সঠিক ট্রানজেকশন আইডি দিয়ে আবার পেমেন্ট জমা দিন। কোনো সমস্যা হলে আমাদের সাথে যোগাযোগ করুন।
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 14px; margin: 0 0 5px 0; font-weight: 600;">সময়ের বাতিঘর</p>
                      <p style="color: #9ca3af; font-size: 12px; margin: 0;">একটি সামাজিক ও সাংস্কৃতিক সংগঠন</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;
    }

    const emailResponse = await sendEmail(email, subject, htmlContent);

    console.log("Payment notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-payment-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
