import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-application-name, x-client-role, *",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

interface DeleteCashierRequest {
  cashierId: string;
  userId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { cashierId, userId }: DeleteCashierRequest = await req.json();

    if (!cashierId || !userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Cashier ID and User ID are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Delete user_roles for this user
    const { error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (rolesError) {
      console.warn("Warning deleting user roles:", rolesError.message);
    }

    // 2. Delete cashier record
    const { error: cashierError } = await supabaseAdmin
      .from("cashiers")
      .delete()
      .eq("id", cashierId);

    if (cashierError) {
      throw new Error(`Failed to delete cashier record: ${cashierError.message}`);
    }

    // 3. Delete auth user from supabase auth
    const { error: authUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authUserError) {
      console.warn("Auth user delete warning:", authUserError.message);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Cashier / team member deleted successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in delete-cashier-user:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Failed to delete team member" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
