# সময়ের বাতিঘর - সম্পূর্ণ ব্যাকএন্ড এক্সপোর্ট
# Samoyer Batighor - Complete Backend Export
# তারিখ: 2026-02-19

---

# =====================================================
# পার্ট ১: সম্পূর্ণ SQL Schema (Supabase SQL Editor-এ রান করুন)
# =====================================================

```sql
-- ================================================
-- 1. ENUMS (Types)
-- ================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'member', 'cashier');
CREATE TYPE public.transaction_type AS ENUM ('member_fee', 'donation', 'event_fee', 'expense', 'other_income', 'other_expense');

-- ================================================
-- 2. FUNCTIONS
-- ================================================

-- Function: has_role (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function: handle_new_user (trigger function)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  RETURN NEW;
END;
$$;

-- Function: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ================================================
-- 3. TABLES
-- ================================================

-- Table: profiles
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: user_roles
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Table: members
CREATE TABLE public.members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id text NOT NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  address text,
  occupation text,
  blood_group text,
  member_type text DEFAULT 'general',
  status text DEFAULT 'pending',
  photo_url text,
  joining_date date DEFAULT CURRENT_DATE,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: member_dues
CREATE TABLE public.member_dues (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id uuid NOT NULL REFERENCES public.members(id),
  month_year text NOT NULL,
  amount numeric NOT NULL,
  is_paid boolean DEFAULT false,
  paid_date date,
  transaction_id text,
  payment_method text,
  payment_status text DEFAULT 'unpaid',
  rejection_reason text,
  submitted_at timestamp with time zone,
  verified_by uuid,
  verified_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table: transactions
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type transaction_type NOT NULL,
  amount numeric NOT NULL,
  member_id uuid REFERENCES public.members(id),
  event_id uuid,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  description_bn text,
  description_en text,
  donor_name text,
  donor_phone text,
  donor_email text,
  payment_method text DEFAULT 'cash',
  payment_reference text,
  month_year text,
  receipt_number text,
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table: cashiers
CREATE TABLE public.cashiers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table: committee_members
CREATE TABLE public.committee_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_bn text NOT NULL,
  name_en text,
  position_bn text NOT NULL,
  position_en text,
  photo_url text,
  phone text,
  email text,
  member_id uuid,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  term_start date,
  term_end date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: events
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_bn text NOT NULL,
  title_en text,
  description_bn text,
  description_en text,
  event_date timestamp with time zone NOT NULL,
  location_bn text,
  location_en text,
  image_url text,
  is_published boolean DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add foreign key for transactions -> events
ALTER TABLE public.transactions ADD CONSTRAINT transactions_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id);

-- Table: news
CREATE TABLE public.news (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_bn text NOT NULL,
  title_en text,
  content_bn text,
  content_en text,
  image_url text,
  is_published boolean DEFAULT false,
  published_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: gallery_images
CREATE TABLE public.gallery_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_bn text NOT NULL,
  title_en text,
  description_bn text,
  description_en text,
  image_url text NOT NULL,
  category text DEFAULT 'general',
  event_date date,
  sort_order integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: payment_methods
CREATE TABLE public.payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  method_type text NOT NULL,
  account_name text NOT NULL,
  account_number text NOT NULL,
  branch_name text,
  routing_number text,
  instructions_bn text,
  instructions_en text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: activity_logs
CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  description_en text,
  description_bn text,
  user_name text,
  user_role text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ================================================
-- 4. TRIGGERS
-- ================================================

-- Trigger: Auto-create profile on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_dues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- === profiles ===
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- === user_roles ===
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- === members ===
CREATE POLICY "Public can register as members" ON public.members FOR INSERT WITH CHECK (status = 'pending');
CREATE POLICY "Public can view approved members" ON public.members FOR SELECT USING (status = 'approved');
CREATE POLICY "Admins can manage all members" ON public.members FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Members can view own data" ON public.members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Members can update own profile" ON public.members FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Cashiers can view all members" ON public.members FOR SELECT USING (has_role(auth.uid(), 'cashier'::app_role));

-- === member_dues ===
CREATE POLICY "Admins can manage member dues" ON public.member_dues FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Cashiers can manage member dues" ON public.member_dues FOR ALL USING (has_role(auth.uid(), 'cashier'::app_role));
CREATE POLICY "Members can view own dues" ON public.member_dues FOR SELECT USING (EXISTS (SELECT 1 FROM members WHERE members.id = member_dues.member_id AND members.user_id = auth.uid()));
CREATE POLICY "Members can submit payment for own dues" ON public.member_dues FOR UPDATE USING ((EXISTS (SELECT 1 FROM members WHERE members.id = member_dues.member_id AND members.user_id = auth.uid())) AND (payment_status = ANY (ARRAY['unpaid', 'rejected']))) WITH CHECK (payment_status = 'submitted' AND transaction_id IS NOT NULL AND payment_method IS NOT NULL);

-- === transactions ===
CREATE POLICY "Admins can manage all transactions" ON public.transactions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public can view summary only" ON public.transactions FOR SELECT USING (false);
CREATE POLICY "Members can view own transactions" ON public.transactions FOR SELECT USING (EXISTS (SELECT 1 FROM members WHERE members.id = transactions.member_id AND members.user_id = auth.uid()));
CREATE POLICY "Cashiers can manage all transactions" ON public.transactions FOR ALL USING (has_role(auth.uid(), 'cashier'::app_role));

-- === cashiers ===
CREATE POLICY "Admins can manage all cashiers" ON public.cashiers FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Cashiers can view own data" ON public.cashiers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Cashiers can update own data" ON public.cashiers FOR UPDATE USING (auth.uid() = user_id);

-- === committee_members ===
CREATE POLICY "Public can view active committee members" ON public.committee_members FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage committee members" ON public.committee_members FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- === events ===
CREATE POLICY "Public can view published events" ON public.events FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage all events" ON public.events FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- === news ===
CREATE POLICY "Public can view published news" ON public.news FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage all news" ON public.news FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- === gallery_images ===
CREATE POLICY "Public can view published gallery images" ON public.gallery_images FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage gallery images" ON public.gallery_images FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- === payment_methods ===
CREATE POLICY "Public can view active payment methods" ON public.payment_methods FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage payment methods" ON public.payment_methods FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- === activity_logs ===
CREATE POLICY "Admins can view all activity logs" ON public.activity_logs FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins and Cashiers can insert logs" ON public.activity_logs FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'cashier'::app_role));

-- ================================================
-- 6. STORAGE BUCKETS
-- ================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('member-photos', 'member-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery-images', 'gallery-images', true);

-- Storage policies for member-photos
CREATE POLICY "Public can view member photos" ON storage.objects FOR SELECT USING (bucket_id = 'member-photos');
CREATE POLICY "Authenticated users can upload member photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'member-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Admins can manage member photos" ON storage.objects FOR ALL USING (bucket_id = 'member-photos' AND (SELECT has_role(auth.uid(), 'admin'::app_role)));

-- Storage policies for gallery-images
CREATE POLICY "Public can view gallery images" ON storage.objects FOR SELECT USING (bucket_id = 'gallery-images');
CREATE POLICY "Admins can upload gallery images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery-images' AND (SELECT has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Admins can manage gallery images storage" ON storage.objects FOR ALL USING (bucket_id = 'gallery-images' AND (SELECT has_role(auth.uid(), 'admin'::app_role)));
```

---

# =====================================================
# পার্ট ২: Edge Functions
# =====================================================

## প্রয়োজনীয় Secrets (Supabase Dashboard → Edge Functions → Secrets):
- `SUPABASE_URL` (auto-set)
- `SUPABASE_ANON_KEY` (auto-set)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-set)
- `PIPRAPAY_API_KEY` - PipraPay API Key
- `RESEND_API_KEY` - Resend Email API Key
- `LOVABLE_API_KEY` - Lovable AI Gateway Key (optional, for chatbot)

---

### Edge Function 1: `chat/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are a helpful AI assistant for "সময়ের বাতিঘর" (Somoyer Batighor) - a community welfare organization.

About the Organization:
- Name (Bengali): সময়ের বাতিঘর
- Name (English): Somoyer Batighor (Lighthouse of Time)
- Slogan: একতাই শক্তি, সেবাই ধর্ম (Unity is Strength, Service is Religion)
- Purpose: A community organization focused on social welfare, member support, and community development
- Activities: Member welfare programs, community events, charity work, and social gatherings

Membership Information:
- Anyone can become a member by registering through the website
- Members pay monthly dues to support the organization's activities
- Members can participate in events, get access to member benefits, and be part of the community

Contact Information:
- Email: contact@somoyerbatighor.org
- Phone: +880 1XXX-XXXXXX
- Website: Visit our website for more details

Guidelines:
1. Always be helpful, respectful, and friendly
2. Respond in the same language the user uses (Bengali or English)
3. If asked about specific member information or confidential data, politely explain you cannot access that
4. For membership registration, direct users to the registration page
5. For dues payment, direct users to the member dashboard after login
6. Keep responses concise but informative
7. Use appropriate greetings based on Bengali culture (আসসালামু আলাইকুম, নমস্কার, etc.)`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "অনেক বেশি অনুরোধ। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI সার্ভিস সাময়িকভাবে অনুপলব্ধ।" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI সার্ভিসে সমস্যা হয়েছে।" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

---

### Edge Function 2: `create-cashier-user/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateCashierUserRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing required environment variables");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !userData?.user) throw new Error("Invalid authorization token");

    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (roleError || !roleData) throw new Error("Unauthorized: Admin access required");

    const { email, password, fullName, phone }: CreateCashierUserRequest = await req.json();
    if (!email || !password || !fullName) throw new Error("Email, password, and full name are required");
    if (password.length < 6) throw new Error("Password must be at least 6 characters");

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { full_name: fullName },
    });
    if (createError) throw new Error(`Failed to create user: ${createError.message}`);
    if (!newUser.user) throw new Error("Failed to create user - no user returned");

    const { error: roleInsertError } = await supabaseAdmin.from("user_roles").insert({ user_id: newUser.user.id, role: "cashier" });
    if (roleInsertError) throw new Error(`Failed to assign cashier role: ${roleInsertError.message}`);

    const { error: cashierInsertError } = await supabaseAdmin.from("cashiers").insert({
      user_id: newUser.user.id, full_name: fullName, email, phone: phone || null, created_by: userData.user.id,
    });
    if (cashierInsertError) throw new Error(`Failed to create cashier record: ${cashierInsertError.message}`);

    return new Response(JSON.stringify({ success: true, userId: newUser.user.id, message: "Cashier account created successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
  }
});
```

---

### Edge Function 3: `create-member-user/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateMemberUserRequest {
  email: string;
  password: string;
  memberId: string;
  fullName: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceRoleKey) throw new Error("Missing required environment variables");

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !userData?.user) throw new Error("Invalid authorization token");

    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (roleError || !roleData) throw new Error("Unauthorized: Admin access required");

    const { email, password, memberId, fullName }: CreateMemberUserRequest = await req.json();
    if (!email || !password || !memberId) throw new Error("Email, password, and member ID are required");
    if (password.length < 6) throw new Error("Password must be at least 6 characters");

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { full_name: fullName },
    });
    if (createError) throw new Error(`Failed to create user: ${createError.message}`);
    if (!newUser.user) throw new Error("Failed to create user - no user returned");

    const { error: roleInsertError } = await supabaseAdmin.from("user_roles").insert({ user_id: newUser.user.id, role: "member" });
    if (roleInsertError) console.error("Role insert error:", roleInsertError.message);

    const { error: updateError } = await supabaseAdmin.from("members").update({ user_id: newUser.user.id }).eq("id", memberId);
    if (updateError) throw new Error(`Failed to link user to member: ${updateError.message}`);

    return new Response(JSON.stringify({ success: true, userId: newUser.user.id, message: "Member user account created successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
  }
});
```

---

### Edge Function 4: `delete-cashier-user/index.ts`

```typescript
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: requestingUser } } = await supabaseUser.auth.getUser();
    if (!requestingUser) {
      return new Response(JSON.stringify({ success: false, error: "Invalid user token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: adminRole } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", requestingUser.id).eq("role", "admin").single();
    if (!adminRole) {
      return new Response(JSON.stringify({ success: false, error: "Only admins can delete cashiers" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { cashierId, userId }: DeleteCashierRequest = await req.json();
    if (!cashierId || !userId) {
      return new Response(JSON.stringify({ success: false, error: "Cashier ID and User ID are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    const { error: cashierError } = await supabaseAdmin.from("cashiers").delete().eq("id", cashierId);
    if (cashierError) throw new Error(`Failed to delete cashier record: ${cashierError.message}`);
    await supabaseAdmin.from("profiles").delete().eq("id", userId);
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) console.error("Error deleting auth user:", authError);

    return new Response(JSON.stringify({ success: true, message: "Cashier deleted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
```

---

### Edge Function 5: `pirapay-initiate/index.ts`

```typescript
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
    const PIPRAPAY_API_KEY = (Deno.env.get('PIPRAPAY_API_KEY') ?? '').trim();
    const PIPRAPAY_BASE_URL = 'https://pay.aktoyworld.shop/api';
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!PIPRAPAY_API_KEY) throw new Error('PipraPay API Key not configured');

    const { due_id, member_id, amount, month_year, member_name, member_email, member_phone }: InitiateRequest = await req.json();
    if (!due_id || !amount || !month_year) throw new Error('Missing required fields: due_id, amount, month_year');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const webhookUrl = `${SUPABASE_URL}/functions/v1/pirapay-webhook`;
    const baseUrl = req.headers.get('origin') || 'https://samoyer-batighor.lovable.app';
    const successUrl = `${baseUrl}/member-dashboard?payment=success`;
    const cancelUrl = `${baseUrl}/member/pay-dues?payment=cancelled`;
    const emailMobile = member_email || member_phone || '';

    const chargePayload = {
      full_name: member_name,
      email_mobile: emailMobile,
      amount: String(amount),
      metadata: { due_id, member_id, month_year },
      redirect_url: successUrl,
      return_type: 'POST',
      cancel_url: cancelUrl,
      webhook_url: webhookUrl,
      currency: 'BDT',
    };

    const pirapayResponse = await fetch(`${PIPRAPAY_BASE_URL}/create-charge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'mh-piprapay-api-key': PIPRAPAY_API_KEY },
      body: JSON.stringify(chargePayload),
    });

    const responseText = await pirapayResponse.text();
    let pirapayData;
    try { pirapayData = JSON.parse(responseText); } catch { throw new Error(`Invalid JSON response from PipraPay: ${responseText.substring(0, 200)}`); }

    const isSuccess = pirapayData.status === true || pirapayData.success === true;
    const paymentUrl = pirapayData.pp_url || pirapayData.payment_url || pirapayData.url;

    if (!pirapayResponse.ok || !isSuccess || !paymentUrl) {
      throw new Error(pirapayData.message || pirapayData.error || 'Failed to create PipraPay charge');
    }

    const ppId = pirapayData.pp_id || pirapayData.id || pirapayData.charge_id;

    await supabase.from('member_dues').update({
      payment_status: 'piprapay_pending', transaction_id: ppId || `PP-${Date.now()}`,
      payment_method: 'piprapay', submitted_at: new Date().toISOString(),
    }).eq('id', due_id);

    return new Response(JSON.stringify({ success: true, payment_url: paymentUrl, pp_id: ppId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
  }
});
```

---

### Edge Function 6: `pirapay-webhook/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, mh-piprapay-api-key',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const PIPRAPAY_API_KEY = Deno.env.get('PIPRAPAY_API_KEY')!;
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    const receivedApiKey = req.headers.get('mh-piprapay-api-key') || req.headers.get('Mh-Piprapay-Api-Key') || '';
    if (receivedApiKey !== PIPRAPAY_API_KEY) {
      return new Response(JSON.stringify({ status: false, message: 'Unauthorized request' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }

    const webhookData = await req.json();
    const { pp_id, customer_name, customer_email_mobile, payment_method, amount, fee, total, currency, metadata, sender_number, transaction_id, status, date } = webhookData;

    const due_id = metadata?.due_id;
    const member_id = metadata?.member_id;
    const month_year = metadata?.month_year;

    if (!due_id) {
      return new Response(JSON.stringify({ status: false, message: 'Missing due_id in metadata' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const isSuccessful = status === 'completed' || status === 'success' || status === 'paid';

    if (isSuccessful) {
      await supabase.from('member_dues').update({
        is_paid: true, payment_status: 'verified', paid_date: new Date().toISOString(),
        verified_at: new Date().toISOString(), transaction_id: transaction_id || pp_id,
        payment_method: payment_method || 'piprapay',
      }).eq('id', due_id);

      await supabase.from('transactions').insert({
        type: 'member_fee', amount: parseFloat(total) || parseFloat(amount) || 0,
        member_id, month_year, payment_method: payment_method || 'piprapay',
        payment_reference: transaction_id || pp_id,
        description_bn: `${month_year} মাসের চাঁদা (PipraPay - ${payment_method || 'Online'})`,
        description_en: `Monthly dues for ${month_year} (PipraPay - ${payment_method || 'Online'})`,
        transaction_date: date || new Date().toISOString(),
      });

      if (RESEND_API_KEY && customer_email_mobile && customer_email_mobile.includes('@')) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'Samoyer Batighor <onboarding@resend.dev>',
              to: customer_email_mobile,
              subject: 'পেমেন্ট সফল - Samoyer Batighor',
              html: `<div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #16a34a;">✅ পেমেন্ট সফল হয়েছে!</h2>
                <p>প্রিয় ${customer_name || 'সদস্য'},</p>
                <p>আপনার <strong>${month_year}</strong> মাসের চাঁদা <strong>৳${total || amount}</strong> সফলভাবে গ্রহণ করা হয়েছে।</p>
                <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>ট্রানজেকশন আইডি:</strong> ${transaction_id || pp_id}</p>
                  <p style="margin: 5px 0;"><strong>পেমেন্ট মেথড:</strong> ${payment_method || 'PipraPay'}</p>
                  ${sender_number ? `<p style="margin: 5px 0;"><strong>প্রেরক নম্বর:</strong> ${sender_number}</p>` : ''}
                </div>
                <p>ধন্যবাদ।</p>
                <p style="color: #6b7280; font-size: 12px;">Samoyer Batighor</p>
              </div>`,
            }),
          });
        } catch (emailError) { console.error('Email send error:', emailError); }
      }
    } else {
      await supabase.from('member_dues').update({
        payment_status: 'piprapay_failed', rejection_reason: `PipraPay payment ${status || 'failed'}`,
      }).eq('id', due_id);
    }

    return new Response(JSON.stringify({ status: true, message: 'Webhook received' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ status: false, message: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
```

---

### Edge Function 7: `send-dues-reminder/index.ts`

```typescript
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

const sendEmail = async (to: string, subject: string, html: string) => {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: "সময়ের বাতিঘর <onboarding@resend.dev>", to: [to], subject, html }),
  });
  if (!res.ok) { const error = await res.text(); throw new Error(`Failed to send email: ${error}`); }
  return await res.json();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reminders }: { reminders: ReminderData[] } = await req.json();
    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ error: "No reminders to send" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const reminder of reminders) {
      if (!reminder.member_email) { failedCount++; continue; }
      try {
        const subject = `বকেয়া চাঁদার রিমাইন্ডার - ${reminder.month_year}`;
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #1a472a, #2d5a3d); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="font-size: 24px;">সময়ের বাতিঘর</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd;">
              <h2>প্রিয় ${reminder.member_name},</h2>
              <p>আপনার <strong>${reminder.month_year}</strong> মাসের সদস্য চাঁদা এখনো পরিশোধ করা হয়নি।</p>
              <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                <p style="margin: 0; color: #856404;">বকেয়া পরিমাণ</p>
                <div style="font-size: 32px; font-weight: bold; color: #856404;">৳${reminder.amount}</div>
              </div>
              <p><strong>পেমেন্ট মাধ্যম:</strong></p>
              <ul><li>বিকাশ: 01770323801</li><li>নগদ: 01770323801</li></ul>
              <p>শুভেচ্ছান্তে,<br><strong>সময়ের বাতিঘর কার্যনির্বাহী কমিটি</strong></p>
            </div>
            <div style="background: #1a472a; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px;">
              <p>&copy; ${new Date().getFullYear()} সময়ের বাতিঘর</p>
            </div>
          </div></body></html>`;
        await sendEmail(reminder.member_email, subject, html);
        sentCount++;
      } catch (emailError: any) {
        errors.push(`${reminder.member_name}: ${emailError.message}`);
        failedCount++;
      }
    }

    return new Response(JSON.stringify({ success: true, sent: sentCount, failed: failedCount, errors: errors.length > 0 ? errors : undefined }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
```

---

### Edge Function 8: `send-payment-notification/index.ts`

```typescript
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
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: "সময়ের বাতিঘর <onboarding@resend.dev>", to: [to], subject, html }),
  });
  if (!res.ok) { const error = await res.text(); throw new Error(`Failed to send email: ${error}`); }
  return res.json();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");
    const { email, memberName, monthYear, amount, status, rejectionReason, paymentMethod, transactionId }: PaymentNotificationRequest = await req.json();
    if (!email || !memberName || !monthYear || !amount || !status) throw new Error("Missing required fields");

    const paymentMethodLabel = paymentMethod === 'bkash' ? 'বিকাশ' : paymentMethod === 'nagad' ? 'নগদ' :
      paymentMethod === 'rocket' ? 'রকেট' : paymentMethod === 'bank' ? 'ব্যাংক' : paymentMethod || '';

    let subject: string;
    let htmlContent: string;

    if (status === 'approved') {
      subject = `✅ আপনার ${monthYear} মাসের চাঁদা অনুমোদিত হয়েছে - সময়ের বাতিঘর`;
      htmlContent = `<div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; color: white; border-radius: 12px 12px 0 0;">
          <h1>✅ অভিনন্দন!</h1><p>আপনার পেমেন্ট সফলভাবে অনুমোদিত হয়েছে</p>
        </div>
        <div style="padding: 30px; background: white;">
          <p>প্রিয় <strong>${memberName}</strong>,</p>
          <p>আপনার <strong>${monthYear}</strong> মাসের সদস্য চাঁদা সফলভাবে অনুমোদিত হয়েছে।</p>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #bbf7d0;">
            <p>মাস-বছর: <strong>${monthYear}</strong></p>
            <p>পরিমাণ: <strong style="color: #059669; font-size: 18px;">৳${amount}</strong></p>
            ${paymentMethodLabel ? `<p>পেমেন্ট মাধ্যম: <strong>${paymentMethodLabel}</strong></p>` : ''}
            ${transactionId ? `<p>ট্রানজেকশন আইডি: <strong>${transactionId}</strong></p>` : ''}
          </div>
        </div>
        <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
          <p style="font-weight: 600;">সময়ের বাতিঘর</p>
        </div>
      </div>`;
    } else {
      subject = `❌ আপনার ${monthYear} মাসের চাঁদা প্রত্যাখ্যাত হয়েছে - সময়ের বাতিঘর`;
      htmlContent = `<div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 30px; text-align: center; color: white; border-radius: 12px 12px 0 0;">
          <h1>❌ পেমেন্ট প্রত্যাখ্যাত</h1>
        </div>
        <div style="padding: 30px; background: white;">
          <p>প্রিয় <strong>${memberName}</strong>,</p>
          <p>আপনার <strong>${monthYear}</strong> মাসের চাঁদার পেমেন্ট প্রত্যাখ্যাত হয়েছে।</p>
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; border: 1px solid #fecaca;">
            <p style="color: #991b1b; font-weight: 600;">প্রত্যাখ্যানের কারণ:</p>
            <p style="background: white; padding: 15px; border-left: 4px solid #ef4444; border-radius: 6px;">${rejectionReason || 'কোনো কারণ উল্লেখ করা হয়নি'}</p>
          </div>
          <p>সঠিক ট্রানজেকশন আইডি দিয়ে আবার পেমেন্ট জমা দিন।</p>
        </div>
        <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
          <p style="font-weight: 600;">সময়ের বাতিঘর</p>
        </div>
      </div>`;
    }

    const emailResponse = await sendEmail(email, subject, htmlContent);
    return new Response(JSON.stringify({ success: true, data: emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
```

---

### Edge Function 9: `test-piprapay/index.ts` (Diagnostic - Optional)

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const PIPRAPAY_API_KEY = (Deno.env.get('PIPRAPAY_API_KEY') ?? '').trim();
  const PIPRAPAY_BASE_URL = 'https://pay.aktoyworld.shop/api';

  const testPayload = {
    full_name: "Test User",
    email_mobile: "test@test.com",
    amount: "10",
    metadata: { test: "true" },
    redirect_url: "https://example.com/success",
    return_type: "POST",
    cancel_url: "https://example.com/cancel",
    webhook_url: "https://example.com/webhook",
    currency: "BDT",
  };

  const testResults: Array<{method: string; status: number; body: string}> = [];

  try {
    const res = await fetch(`${PIPRAPAY_BASE_URL}/create-charge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'mh-piprapay-api-key': PIPRAPAY_API_KEY },
      body: JSON.stringify(testPayload),
    });
    const body = await res.text();
    testResults.push({ method: 'mh-piprapay-api-key', status: res.status, body: body.substring(0, 500) });
  } catch (e) {
    testResults.push({ method: 'mh-piprapay-api-key', status: 0, body: String(e) });
  }

  return new Response(JSON.stringify({ api_key_length: PIPRAPAY_API_KEY.length, results: testResults }, null, 2),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
});
```

---

# =====================================================
# পার্ট ৩: Supabase config.toml (Edge Function Configuration)
# =====================================================

```toml
[functions.send-dues-reminder]
verify_jwt = false

[functions.create-member-user]
verify_jwt = false

[functions.create-cashier-user]
verify_jwt = false

[functions.delete-cashier-user]
verify_jwt = false

[functions.chat]
verify_jwt = false

[functions.pirapay-initiate]
verify_jwt = false

[functions.pirapay-webhook]
verify_jwt = false

[functions.test-piprapay]
verify_jwt = false

[functions.send-payment-notification]
verify_jwt = false
```

---

# =====================================================
# পার্ট ৪: .env Variables (Frontend)
# =====================================================

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
```

---

# সেটআপ নির্দেশিকা:
# 1. নতুন Supabase প্রজেক্ট তৈরি করুন
# 2. SQL Editor-এ পার্ট ১ এর সম্পূর্ণ SQL রান করুন
# 3. Edge Functions ডিপ্লয় করুন (supabase functions deploy)
# 4. Secrets সেট করুন: PIPRAPAY_API_KEY, RESEND_API_KEY, LOVABLE_API_KEY
# 5. .env ফাইলে নতুন প্রজেক্টের URL ও Key বসান
# 6. Admin ইউজার তৈরি করে user_roles টেবিলে admin role যোগ করুন
