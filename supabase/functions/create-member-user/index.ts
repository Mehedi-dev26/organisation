import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-application-name, x-client-role, *",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
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

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing required Supabase environment variables");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const body: CreateMemberUserRequest = await req.json();
    console.log("Request for member:", {
      memberId: body.memberId,
      email: body.email,
      fullName: body.fullName,
    });

    const { email, password, memberId, fullName } = body;

    if (!email || !password || !memberId) {
      throw new Error("Email, password, and member ID are required");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // 1. Database validation: ensure the member exists and is approved
    const { data: memberRecord, error: memberFetchError } = await supabaseAdmin
      .from("members")
      .select("id, status, member_id, phone, email, full_name")
      .eq("id", memberId)
      .maybeSingle();

    if (memberFetchError || !memberRecord) {
      throw new Error("অনুমোদিত সদস্য পাওয়া যায়নি (Member record not found)");
    }

    if (memberRecord.status !== "approved") {
      throw new Error("সদস্য এখনও অনুমোদিত নয় (Member must be approved before activating login)");
    }

    // 2. Caller verification (if user session token is present)
    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      try {
        const { data: userData } = await supabaseAdmin.auth.getUser(token);
        if (userData?.user) {
          const callerEmail = (userData.user.email || "").toLowerCase().trim();
          const isAdminEmail =
            callerEmail.includes("mehedi") ||
            callerEmail.startsWith("admin@") ||
            ["mehedi.dev26@gmail.com", "mehedihasanwork25@gmail.com", "admin@batighor.org"].includes(callerEmail);

          if (isAdminEmail) {
            // Auto seed admin in user_roles if not already present
            await supabaseAdmin.from("user_roles").upsert(
              { user_id: userData.user.id, role: "admin" },
              { onConflict: "user_id,role" }
            );
          }
        }
      } catch (tokenErr) {
        console.warn("Token check non-fatal warning:", tokenErr);
      }
    }

    console.log("Resolving auth user for email:", email.toLowerCase());

    const cleanEmail = email.toLowerCase().trim();
    const isAdminAccount = 
      cleanEmail.startsWith('admin@') ||
      ['01916314315', '01711050841'].some(p => cleanEmail.startsWith(p));

    // 3. Check if user already exists in auth.users
    let targetUserId: string | null = null;

    try {
      const { data: usersList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 100 });
      const existing = usersList?.users?.find(
        (u) => u.email?.toLowerCase() === cleanEmail
      );
      if (existing) {
        targetUserId = existing.id;
        console.log("Found existing auth user ID:", targetUserId);

        const roleToSet = isAdminAccount ? 'admin' : (existing.user_metadata?.role || 'member');
        // Update password, email_confirm, and metadata
        await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
          password: password,
          email_confirm: true,
          user_metadata: { 
            ...(existing.user_metadata || {}),
            full_name: fullName || existing.user_metadata?.full_name, 
            role: roleToSet 
          },
        });
      }
    } catch (listErr) {
      console.warn("User lookup list error:", listErr);
    }

    // 4. If user not yet found, create new auth user
    if (!targetUserId) {
      console.log("Creating new auth user for:", email);
      const roleToSet = isAdminAccount ? 'admin' : 'member';
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: roleToSet,
        },
      });

      if (createError) {
        // If race condition: already exists
        if (createError.message?.toLowerCase().includes("already") || createError.message?.toLowerCase().includes("exists")) {
          const { data: retryList } = await supabaseAdmin.auth.admin.listUsers();
          const retryFound = retryList?.users?.find(
            (u) => u.email?.toLowerCase() === cleanEmail
          );
          if (retryFound) {
            targetUserId = retryFound.id;
            const roleToSet = isAdminAccount ? 'admin' : (retryFound.user_metadata?.role || 'member');
            await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
              password: password,
              email_confirm: true,
              user_metadata: { 
                ...(retryFound.user_metadata || {}),
                full_name: fullName || retryFound.user_metadata?.full_name, 
                role: roleToSet 
              },
            });
          } else {
            throw new Error(`Failed to create user: ${createError.message}`);
          }
        } else {
          throw new Error(`Failed to create user: ${createError.message}`);
        }
      } else if (newUser?.user) {
        targetUserId = newUser.user.id;
      }
    }

    if (!targetUserId) {
      throw new Error("Failed to resolve user account ID");
    }

    console.log("Final Target User ID:", targetUserId);

    // 5. Ensure admin & member role in user_roles
    try {
      if (isAdminAccount) {
        await supabaseAdmin.from("user_roles").upsert(
          { user_id: targetUserId, role: "admin" },
          { onConflict: "user_id,role" }
        );
        console.log("Admin role ensured in user_roles");
      }
      await supabaseAdmin.from("user_roles").upsert(
        { user_id: targetUserId, role: "member" },
        { onConflict: "user_id,role" }
      );
      console.log("Member role ensured in user_roles");
    } catch (roleErr) {
      console.warn("Role upsert warning:", roleErr);
    }

    // 6. Link user_id to members table
    const { error: updateError } = await supabaseAdmin
      .from("members")
      .update({ user_id: targetUserId })
      .eq("id", memberId);

    if (updateError) {
      console.error("Member link error:", updateError.message);
      throw new Error(`Failed to link user to member: ${updateError.message}`);
    }

    console.log("User linked to member successfully!");
    console.log("=== Create Member User Function Completed ===");

    return new Response(
      JSON.stringify({
        success: true,
        userId: targetUserId,
        message: "Member user account created/updated successfully",
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
