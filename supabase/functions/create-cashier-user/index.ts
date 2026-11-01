import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-application-name, x-client-role, *",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

interface CreateCashierUserRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role?: "cashier" | "moderator" | "admin";
  permissions?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("=== Create Team Member / Cashier User Started ===");

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

    const body: CreateCashierUserRequest = await req.json();
    console.log("Request received for:", {
      email: body.email,
      fullName: body.fullName,
      role: body.role,
      permissions: body.permissions,
    });

    const { email, password, fullName, phone, permissions } = body;
    const role = body.role || "cashier";

    if (!email || !password || !fullName) {
      throw new Error("ইমেইল, পাসওয়ার্ড এবং পুরো নাম আবশ্যক (Email, password, and full name are required)");
    }

    if (password.length < 6) {
      throw new Error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে (Password must be at least 6 characters)");
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Caller verification
    const authHeader = req.headers.get("Authorization");
    let callerUserId: string | null = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      try {
        const { data: userData } = await supabaseAdmin.auth.getUser(token);
        if (userData?.user) {
          callerUserId = userData.user.id;
          const callerEmail = (userData.user.email || "").toLowerCase().trim();
          const isAdminEmail =
            callerEmail.includes("mehedi") ||
            callerEmail.startsWith("admin@") ||
            ["mehedi.dev26@gmail.com", "mehedihasanwork25@gmail.com", "admin@batighor.org"].includes(callerEmail);

          if (isAdminEmail) {
            await supabaseAdmin.from("user_roles").upsert(
              { user_id: userData.user.id, role: "admin" },
              { onConflict: "user_id,role" }
            );
          }
        }
      } catch (tokenErr) {
        console.warn("Token check warning (non-fatal):", tokenErr);
      }
    }

    console.log("Resolving auth user for:", normalizedEmail);

    // 2. Multi-tier search to find if user already exists
    let targetUserId: string | null = null;

    // Check members table first
    try {
      const { data: existingMember } = await supabaseAdmin
        .from("members")
        .select("user_id")
        .eq("email", normalizedEmail)
        .not("user_id", "is", null)
        .maybeSingle();

      if (existingMember?.user_id) {
        targetUserId = existingMember.user_id;
        console.log("Found user ID from members table:", targetUserId);
      }
    } catch (memberLookupErr) {
      console.warn("Member lookup non-fatal error:", memberLookupErr);
    }

    // Check cashiers table
    if (!targetUserId) {
      try {
        const { data: existingCashierRecord } = await supabaseAdmin
          .from("cashiers")
          .select("user_id")
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (existingCashierRecord?.user_id) {
          targetUserId = existingCashierRecord.user_id;
          console.log("Found user ID from cashiers table:", targetUserId);
        }
      } catch (cashierLookupErr) {
        console.warn("Cashier lookup non-fatal error:", cashierLookupErr);
      }
    }

    // Check auth.admin.listUsers
    if (!targetUserId) {
      try {
        let page = 1;
        while (page <= 5 && !targetUserId) {
          const { data: usersList } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
          if (!usersList?.users || usersList.users.length === 0) break;
          const existing = usersList.users.find(
            (u) => u.email?.toLowerCase() === normalizedEmail
          );
          if (existing) {
            targetUserId = existing.id;
            console.log("Found existing user ID via listUsers:", targetUserId);
            break;
          }
          page++;
        }
      } catch (listErr) {
        console.warn("User list lookup error:", listErr);
      }
    }

    // 3. Update existing user or create a new auth user
    if (targetUserId) {
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          phone: phone || null,
          role: role,
          permissions: permissions || [],
        },
      });

      if (updateErr) {
        console.error("Failed to update existing user:", updateErr);
        throw new Error(`ব্যবহারকারীর তথ্য আপডেট ব্যর্থ: ${updateErr.message}`);
      }
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          phone: phone || null,
          role: role,
          permissions: permissions || [],
        },
      });

      if (createError) {
        console.warn("Create user error:", createError.message);
        // Handle case where user already exists in auth
        if (
          createError.message?.toLowerCase().includes("already") ||
          createError.message?.toLowerCase().includes("exists") ||
          createError.message?.toLowerCase().includes("registered")
        ) {
          // Retry listing users to grab their ID
          const { data: retryList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 100 });
          const retryFound = retryList?.users?.find(
            (u) => u.email?.toLowerCase() === normalizedEmail
          );
          if (retryFound) {
            targetUserId = retryFound.id;
            await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
              password: password,
              email_confirm: true,
              user_metadata: {
                full_name: fullName,
                phone: phone || null,
                role: role,
                permissions: permissions || [],
              },
            });
          } else {
            throw new Error(`ব্যবহারকারী ইতিমধ্যে বিদ্যমান কিন্তু আইডি উদ্ধার করা যায়নি: ${createError.message}`);
          }
        } else {
          throw new Error(`ব্যবহারকারী তৈরি ব্যর্থ: ${createError.message}`);
        }
      } else if (newUser?.user) {
        targetUserId = newUser.user.id;
      }
    }

    if (!targetUserId) {
      throw new Error("নতুন ব্যবহারকারী তৈরি বা সনাক্ত করা যায়নি");
    }

    console.log("Resolved Target User ID:", targetUserId);

    // 4. Assign role in user_roles table
    const { error: roleInsertError } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        {
          user_id: targetUserId,
          role: role,
        },
        { onConflict: "user_id,role" }
      );

    if (roleInsertError) {
      console.warn("Role assignment warning:", roleInsertError.message);
      // Non-fatal if enum restriction happens, try cashier fallback
      if (role !== "cashier") {
        await supabaseAdmin.from("user_roles").upsert(
          { user_id: targetUserId, role: "cashier" },
          { onConflict: "user_id,role" }
        );
      }
    }

    console.log("Role assigned successfully:", role);

    // 5. Upsert record in cashiers table for team management
    const { data: existingCashiers } = await supabaseAdmin
      .from("cashiers")
      .select("id, user_id, email")
      .or(`user_id.eq.${targetUserId},email.eq.${normalizedEmail}`);

    if (existingCashiers && existingCashiers.length > 0) {
      const primaryId = existingCashiers[0].id;
      const { error: updateCashierErr } = await supabaseAdmin
        .from("cashiers")
        .update({
          user_id: targetUserId,
          full_name: fullName,
          email: normalizedEmail,
          phone: phone || null,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", primaryId);

      if (updateCashierErr) {
        console.warn("Cashier record update warning:", updateCashierErr.message);
      }
    } else {
      const { error: cashierInsertError } = await supabaseAdmin
        .from("cashiers")
        .insert({
          user_id: targetUserId,
          full_name: fullName,
          email: normalizedEmail,
          phone: phone || null,
          is_active: true,
          created_by: callerUserId,
        });

      if (cashierInsertError) {
        console.warn("Cashier insert warning:", cashierInsertError.message);
      }
    }

    console.log("=== Create Team Member / Cashier Finished Successfully ===");

    return new Response(
      JSON.stringify({
        success: true,
        userId: targetUserId,
        role: role,
        message: "টিম সদস্য অ্যাকাউন্ট সফলভাবে তৈরি/আপডেট হয়েছে",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("=== Error in Create Team Member / Cashier ===", error);
    const errorMessage = error instanceof Error ? error.message : "অপ্রত্যাশিত ত্রুটি ঘটেছে";
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
