import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderData {
  member_name: string;
  member_email: string;
  month_year: string;
  amount: number;
}

interface RequestBody {
  reminders: ReminderData[];
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
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return await res.json();
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reminders }: RequestBody = await req.json();
    
    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({ error: "No reminders to send" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending reminders to ${reminders.length} members`);

    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const reminder of reminders) {
      if (!reminder.member_email) {
        console.log(`Skipping ${reminder.member_name}: No email`);
        failedCount++;
        continue;
      }

      try {
        const subject = `বকেয়া চাঁদার রিমাইন্ডার - ${reminder.month_year}`;
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Noto Sans Bengali', Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
              .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
              .amount-box { background: #fff3cd; border: 2px solid #ffc107; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
              .amount { font-size: 32px; font-weight: bold; color: #856404; }
              .footer { background: #1a472a; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">সময়ের বাতিঘর</div>
                <p>Samoyer Batighor</p>
              </div>
              <div class="content">
                <h2>প্রিয় ${reminder.member_name},</h2>
                <p>আশা করি আপনি ভালো আছেন। আপনাকে জানাচ্ছি যে আপনার <strong>${reminder.month_year}</strong> মাসের সদস্য চাঁদা এখনো পরিশোধ করা হয়নি।</p>
                
                <div class="amount-box">
                  <p style="margin: 0; color: #856404;">বকেয়া পরিমাণ</p>
                  <div class="amount">৳${reminder.amount}</div>
                </div>
                
                <p>অনুগ্রহ করে যত দ্রুত সম্ভব আপনার চাঁদা পরিশোধ করুন। আপনার সহযোগিতার জন্য ধন্যবাদ।</p>
                
                <p><strong>পেমেন্ট মাধ্যম:</strong></p>
                <ul>
                  <li>বিকাশ: 01XXXXXXXXX</li>
                  <li>নগদ: কোষাধ্যক্ষের কাছে</li>
                </ul>
                
                <p>কোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন।</p>
                
                <p>শুভেচ্ছান্তে,<br><strong>সময়ের বাতিঘর কার্যনির্বাহী কমিটি</strong></p>
              </div>
              <div class="footer">
                <p>এটি একটি স্বয়ংক্রিয় বার্তা। অনুগ্রহ করে এই ইমেইলে সরাসরি উত্তর দেবেন না।</p>
                <p>&copy; ${new Date().getFullYear()} সময়ের বাতিঘর</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await sendEmail(reminder.member_email, subject, html);
        console.log(`Email sent to ${reminder.member_email}`);
        sentCount++;
      } catch (emailError: any) {
        console.error(`Error sending to ${reminder.member_email}:`, emailError);
        errors.push(`${reminder.member_name}: ${emailError.message}`);
        failedCount++;
      }
    }

    console.log(`Completed: ${sentCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true,
        sent: sentCount, 
        failed: failedCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-dues-reminder function:", error);
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
