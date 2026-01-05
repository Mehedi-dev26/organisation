import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateMemberUserRequest {
  email: string;
  password: string;
  memberId: string;
  fullName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("=== Create Member User Function Started ===");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log("SUPABASE_URL exists:", !!supabaseUrl);
    console.log("SUPABASE_SERVICE_ROLE_KEY exists:", !!supabaseServiceRoleKey);

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
    console.log("Authorization header exists:", !!authHeader);

    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    // Verify the calling user is an admin
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    console.log("Auth verification - User:", userData?.user?.email);
    console.log("Auth verification - Error:", authError?.message);

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

    console.log("Role check - Data:", roleData);
    console.log("Role check - Error:", roleError?.message);

    if (roleError || !roleData) {
      throw new Error("Unauthorized: Admin access required");
    }

    const body = await req.json();
    console.log("Request body received:", { ...body, password: "[HIDDEN]" });

    const { email, password, memberId, fullName }: CreateMemberUserRequest = body;

    if (!email || !password || !memberId) {
      throw new Error("Email, password, and member ID are required");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    console.log("Creating user for email:", email);

    // Create the user account
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    console.log("Create user result - Success:", !!newUser?.user);
    console.log("Create user result - Error:", createError?.message);

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    if (!newUser.user) {
      throw new Error("Failed to create user - no user returned");
    }

    console.log("User created with ID:", newUser.user.id);

    // Add 'member' role to the user
    const { error: roleInsertError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: newUser.user.id,
        role: "member",
      });

    if (roleInsertError) {
      console.error("Role insert error:", roleInsertError.message);
      // Don't throw, just log - the user is created
    } else {
      console.log("Member role assigned successfully");
    }

    // Link the user to the member
    const { error: updateError } = await supabaseAdmin
      .from("members")
      .update({ user_id: newUser.user.id })
      .eq("id", memberId);

    if (updateError) {
      console.error("Member link error:", updateError.message);
      throw new Error(`Failed to link user to member: ${updateError.message}`);
    }

    console.log("User linked to member successfully");
    console.log("=== Create Member User Function Completed ===");

    return new Response(
      JSON.stringify({
        success: true,
        userId: newUser.user.id,
        message: "Member user account created successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("=== Error in Create Member User Function ===");
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
