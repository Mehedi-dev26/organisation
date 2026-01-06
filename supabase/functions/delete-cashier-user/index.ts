import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    // Get the authorization header to verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a client with the user's token to verify they're an admin
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: requestingUser } } = await supabaseUser.auth.getUser();
    if (!requestingUser) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid user token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is an admin
    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin")
      .single();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ success: false, error: "Only admins can delete cashiers" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
      console.error("Error deleting user roles:", rolesError);
    }

    // 2. Delete cashier record
    const { error: cashierError } = await supabaseAdmin
      .from("cashiers")
      .delete()
      .eq("id", cashierId);

    if (cashierError) {
      throw new Error(`Failed to delete cashier record: ${cashierError.message}`);
    }

    // 3. Delete profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.error("Error deleting profile:", profileError);
    }

    // 4. Delete auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error("Error deleting auth user:", authError);
      // Don't throw here as the cashier record is already deleted
    }

    return new Response(
      JSON.stringify({ success: true, message: "Cashier deleted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in delete-cashier-user:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
