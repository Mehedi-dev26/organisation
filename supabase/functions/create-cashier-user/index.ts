import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateCashierUserRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("=== Create Cashier User Function Started ===");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing required environment variables");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get the authorization header to verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    // Verify the calling user is an admin
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !userData?.user) {
      throw new Error("Invalid authorization token");
    }

    // Check if calling user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error("Unauthorized: Admin access required");
    }

    const body = await req.json();
    console.log("Request body received:", { ...body, password: "[HIDDEN]" });

    const { email, password, fullName, phone }: CreateCashierUserRequest = body;

    if (!email || !password || !fullName) {
      throw new Error("Email, password, and full name are required");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    console.log("Creating cashier user for email:", email);

    // Create the user account
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    if (!newUser.user) {
      throw new Error("Failed to create user - no user returned");
    }

    console.log("User created with ID:", newUser.user.id);

    // Add 'cashier' role to the user
    const { error: roleInsertError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: newUser.user.id,
        role: "cashier",
      });

    if (roleInsertError) {
      console.error("Role insert error:", roleInsertError.message);
      throw new Error(`Failed to assign cashier role: ${roleInsertError.message}`);
    }

    console.log("Cashier role assigned successfully");

    // Create cashier record
    const { error: cashierInsertError } = await supabaseAdmin
      .from("cashiers")
      .insert({
        user_id: newUser.user.id,
        full_name: fullName,
        email: email,
        phone: phone || null,
        created_by: userData.user.id,
      });

    if (cashierInsertError) {
      console.error("Cashier insert error:", cashierInsertError.message);
      throw new Error(`Failed to create cashier record: ${cashierInsertError.message}`);
    }

    console.log("Cashier record created successfully");
    console.log("=== Create Cashier User Function Completed ===");

    return new Response(
      JSON.stringify({
        success: true,
        userId: newUser.user.id,
        message: "Cashier account created successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("=== Error in Create Cashier User Function ===");
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
