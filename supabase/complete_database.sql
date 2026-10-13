-- ============================================================================
-- সম্পূর্ণ ডাটাবেজ স্কিমা (Complete Database SQL File)
-- প্রজেক্ট: সময়ের বাতিঘর (Somoyer Batighor)
-- প্ল্যাটফর্ম: Supabase (PostgreSQL)
-- নির্দেশিকা: Supabase Dashboard -> SQL Editor এ পেস্ট করে 'Run' বাটনে ক্লিক করুন
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ১. EXTENSIONS (এক্সটেনশনসমূহ)
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- ২. ENUMS (কাস্টম টাইপসমূহ)
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'member', 'cashier');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.transaction_type AS ENUM ('member_fee', 'donation', 'event_fee', 'expense', 'other_income', 'other_expense');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- ৩. TABLES (টেবিলসমূহ - সঠিক ক্রমানুসারে)
-- ----------------------------------------------------------------------------

-- Table 1: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table 2: user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Table 3: members
CREATE TABLE IF NOT EXISTS public.members (
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
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table 4: member_dues
CREATE TABLE IF NOT EXISTS public.member_dues (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  month_year text NOT NULL,
  amount numeric NOT NULL,
  is_paid boolean DEFAULT false,
  paid_date date,
  transaction_id text,
  payment_method text,
  payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'submitted', 'approved', 'rejected')),
  rejection_reason text,
  submitted_at timestamp with time zone,
  verified_by uuid,
  verified_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table 5: events
CREATE TABLE IF NOT EXISTS public.events (
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

-- Table 6: transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type transaction_type NOT NULL,
  amount numeric NOT NULL,
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
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

-- Table 7: cashiers
CREATE TABLE IF NOT EXISTS public.cashiers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table 8: committee_members
CREATE TABLE IF NOT EXISTS public.committee_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_bn text NOT NULL,
  name_en text,
  position_bn text NOT NULL,
  position_en text,
  photo_url text,
  phone text,
  email text,
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  term_start date,
  term_end date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table 9: news
CREATE TABLE IF NOT EXISTS public.news (
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

-- Table 10: gallery_images
CREATE TABLE IF NOT EXISTS public.gallery_images (
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

-- Table 11: payment_methods
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  method_type text NOT NULL CHECK (method_type IN ('bkash', 'nagad', 'rocket', 'bank')),
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

-- Table 12: activity_logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
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

-- Table 13: blood_donors (জরুরি রক্তদাতা ডাটাবেস)
CREATE TABLE IF NOT EXISTS public.blood_donors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  phone text NOT NULL,
  blood_group text NOT NULL,
  last_donated date,
  division text,
  district text,
  upazila text,
  address text,
  is_public_details boolean NOT NULL DEFAULT true,
  is_member boolean NOT NULL DEFAULT false,
  member_id text,
  status text NOT NULL DEFAULT 'approved',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- ৪. INDEXES (পারফরম্যান্স ইনডেক্সসমূহ)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_members_user_id ON public.members(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_member ON public.transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_member_dues_member ON public.member_dues(member_id);
CREATE INDEX IF NOT EXISTS idx_member_dues_month ON public.member_dues(month_year);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON public.activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_blood_donors_group ON public.blood_donors(blood_group);
CREATE INDEX IF NOT EXISTS idx_blood_donors_district ON public.blood_donors(district);
CREATE INDEX IF NOT EXISTS idx_blood_donors_status ON public.blood_donors(status);

-- ----------------------------------------------------------------------------
-- ৫. FUNCTIONS (ডাটাবেজ ফাংশনসমূহ - টেবিল তৈরির পর)
-- ----------------------------------------------------------------------------

-- Function: has_role (Security Definer PL/pgSQL)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- Function: handle_new_user (Auto Profile Insert Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;
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

-- ----------------------------------------------------------------------------
-- ৬. TRIGGERS (স্বয়ংক্রিয় ট্রিগারসমূহ)
-- ----------------------------------------------------------------------------

-- Trigger: Auth User Create -> Profile Auto Insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated At Triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_members_updated_at ON public.members;
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_member_dues_updated_at ON public.member_dues;
CREATE TRIGGER update_member_dues_updated_at BEFORE UPDATE ON public.member_dues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_cashiers_updated_at ON public.cashiers;
CREATE TRIGGER update_cashiers_updated_at BEFORE UPDATE ON public.cashiers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_news_updated_at ON public.news;
CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_committee_members_updated_at ON public.committee_members;
CREATE TRIGGER update_committee_members_updated_at BEFORE UPDATE ON public.committee_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_gallery_images_updated_at ON public.gallery_images;
CREATE TRIGGER update_gallery_images_updated_at BEFORE UPDATE ON public.gallery_images FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- ৭. ROW LEVEL SECURITY (RLS) & POLICIES
-- ----------------------------------------------------------------------------

-- RLS Enable
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

-- === profiles policies ===
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- === user_roles policies ===
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- === members policies ===
DROP POLICY IF EXISTS "Public can register as members" ON public.members;
CREATE POLICY "Public can register as members" ON public.members FOR INSERT WITH CHECK (status = 'pending');

DROP POLICY IF EXISTS "Public can view approved members" ON public.members;
CREATE POLICY "Public can view approved members" ON public.members FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Members can view own data" ON public.members;
CREATE POLICY "Members can view own data" ON public.members FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Members can update own profile" ON public.members;
CREATE POLICY "Members can update own profile" ON public.members FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Cashiers can view all members" ON public.members;
CREATE POLICY "Cashiers can view all members" ON public.members FOR SELECT USING (has_role(auth.uid(), 'cashier'::app_role));

DROP POLICY IF EXISTS "Admins can manage all members" ON public.members;
CREATE POLICY "Admins can manage all members" ON public.members FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- === member_dues policies ===
DROP POLICY IF EXISTS "Admins can manage member dues" ON public.member_dues;
CREATE POLICY "Admins can manage member dues" ON public.member_dues FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Cashiers can manage member dues" ON public.member_dues;
CREATE POLICY "Cashiers can manage member dues" ON public.member_dues FOR ALL USING (has_role(auth.uid(), 'cashier'::app_role));

DROP POLICY IF EXISTS "Members can view own dues" ON public.member_dues;
CREATE POLICY "Members can view own dues" ON public.member_dues FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.members
    WHERE members.id = member_dues.member_id 
    AND members.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Members can submit payment for own dues" ON public.member_dues;
CREATE POLICY "Members can submit payment for own dues" ON public.member_dues FOR UPDATE
USING (
  (EXISTS (
    SELECT 1 FROM public.members 
    WHERE members.id = member_dues.member_id 
    AND members.user_id = auth.uid()
  )) 
  AND payment_status IN ('unpaid', 'rejected')
)
WITH CHECK (
  payment_status = 'submitted' 
  AND transaction_id IS NOT NULL
  AND payment_method IS NOT NULL
);

-- === transactions policies ===
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.transactions;
CREATE POLICY "Admins can manage all transactions" ON public.transactions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Public can view summary only" ON public.transactions;
CREATE POLICY "Public can view summary only" ON public.transactions FOR SELECT USING (false);

DROP POLICY IF EXISTS "Members can view own transactions" ON public.transactions;
CREATE POLICY "Members can view own transactions" ON public.transactions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.members 
    WHERE members.id = transactions.member_id 
    AND members.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Cashiers can manage all transactions" ON public.transactions;
CREATE POLICY "Cashiers can manage all transactions" ON public.transactions FOR ALL USING (has_role(auth.uid(), 'cashier'::app_role));

-- === cashiers policies ===
DROP POLICY IF EXISTS "Admins can manage all cashiers" ON public.cashiers;
CREATE POLICY "Admins can manage all cashiers" ON public.cashiers FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Cashiers can view own data" ON public.cashiers;
CREATE POLICY "Cashiers can view own data" ON public.cashiers FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Cashiers can update own data" ON public.cashiers;
CREATE POLICY "Cashiers can update own data" ON public.cashiers FOR UPDATE USING (auth.uid() = user_id);

-- === committee_members policies ===
DROP POLICY IF EXISTS "Public can view active committee members" ON public.committee_members;
CREATE POLICY "Public can view active committee members" ON public.committee_members FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage committee members" ON public.committee_members;
CREATE POLICY "Admins can manage committee members" ON public.committee_members FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- === events policies ===
DROP POLICY IF EXISTS "Public can view published events" ON public.events;
CREATE POLICY "Public can view published events" ON public.events FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Admins can manage all events" ON public.events;
CREATE POLICY "Admins can manage all events" ON public.events FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- === news policies ===
DROP POLICY IF EXISTS "Public can view published news" ON public.news;
CREATE POLICY "Public can view published news" ON public.news FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Admins can manage all news" ON public.news;
CREATE POLICY "Admins can manage all news" ON public.news FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- === gallery_images policies ===
DROP POLICY IF EXISTS "Public can view published gallery images" ON public.gallery_images;
CREATE POLICY "Public can view published gallery images" ON public.gallery_images FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Admins can manage gallery images" ON public.gallery_images;
CREATE POLICY "Admins can manage gallery images" ON public.gallery_images FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- === payment_methods policies ===
DROP POLICY IF EXISTS "Public can view active payment methods" ON public.payment_methods;
CREATE POLICY "Public can view active payment methods" ON public.payment_methods FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage payment methods" ON public.payment_methods;
CREATE POLICY "Admins can manage payment methods" ON public.payment_methods FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- === blood_donors policies ===
ALTER TABLE public.blood_donors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view approved blood donors" ON public.blood_donors;
CREATE POLICY "Anyone can view approved blood donors" ON public.blood_donors FOR SELECT USING (status = 'approved' OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can register as a blood donor" ON public.blood_donors;
CREATE POLICY "Anyone can register as a blood donor" ON public.blood_donors FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update blood donors" ON public.blood_donors;
CREATE POLICY "Admins can update blood donors" ON public.blood_donors FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'cashier'::app_role));

DROP POLICY IF EXISTS "Admins can delete blood donors" ON public.blood_donors;
CREATE POLICY "Admins can delete blood donors" ON public.blood_donors FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- === activity_logs policies ===
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.activity_logs;
CREATE POLICY "Admins can view all activity logs" ON public.activity_logs FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins and Cashiers can insert logs" ON public.activity_logs;
CREATE POLICY "Admins and Cashiers can insert logs" ON public.activity_logs FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'cashier'::app_role)
);

-- ----------------------------------------------------------------------------
-- ৮. REALTIME PUBLICATIONS (রিয়েলটাইম পাবলিকেশন)
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.members;
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.member_dues;
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_methods;
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.news;
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.committee_members;
EXCEPTION WHEN OTHERS THEN null; END $$;

-- ----------------------------------------------------------------------------
-- ৯. STORAGE BUCKETS & STORAGE POLICIES (স্টোরেজ বাকেট ও পলিসিসমূহ)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public) 
  VALUES 
    ('member-photos', 'member-photos', true),
    ('gallery-images', 'gallery-images', true)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

-- Storage policies for member-photos
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can view member photos" ON storage.objects;
  CREATE POLICY "Public can view member photos" ON storage.objects FOR SELECT USING (bucket_id = 'member-photos');
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated users can upload member photos" ON storage.objects;
  CREATE POLICY "Authenticated users can upload member photos" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'member-photos' AND auth.role() = 'authenticated'
  );
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can manage member photos" ON storage.objects;
  CREATE POLICY "Admins can manage member photos" ON storage.objects FOR ALL USING (
    bucket_id = 'member-photos' AND (SELECT has_role(auth.uid(), 'admin'::app_role))
  );
EXCEPTION WHEN OTHERS THEN null; END $$;

-- Storage policies for gallery-images
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can view gallery images" ON storage.objects;
  CREATE POLICY "Public can view gallery images" ON storage.objects FOR SELECT USING (bucket_id = 'gallery-images');
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can upload gallery images" ON storage.objects;
  CREATE POLICY "Admins can upload gallery images" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'gallery-images' AND (SELECT has_role(auth.uid(), 'admin'::app_role))
  );
EXCEPTION WHEN OTHERS THEN null; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can manage gallery images storage" ON storage.objects;
  CREATE POLICY "Admins can manage gallery images storage" ON storage.objects FOR ALL USING (
    bucket_id = 'gallery-images' AND (SELECT has_role(auth.uid(), 'admin'::app_role))
  );
EXCEPTION WHEN OTHERS THEN null; END $$;

-- ----------------------------------------------------------------------------
-- ১০. DEFAULT SEED DATA (প্রাথমিক পেমেন্ট মেথড ডেটা)
-- ----------------------------------------------------------------------------
INSERT INTO public.payment_methods (method_type, account_name, account_number, instructions_bn, instructions_en, sort_order)
VALUES 
  ('bkash', 'সময়ের বাতিঘর', '01XXXXXXXXX', 'বিকাশ অ্যাপ থেকে Send Money করুন এবং Transaction ID সংরক্ষণ করুন', 'Send Money from bKash app and save the Transaction ID', 1),
  ('nagad', 'সময়ের বাতিঘর', '01XXXXXXXXX', 'নগদ অ্যাপ থেকে Send Money করুন এবং Transaction ID সংরক্ষণ করুন', 'Send Money from Nagad app and save the Transaction ID', 2),
  ('rocket', 'সময়ের বাতিঘর', '01XXXXXXXXX', 'রকেট অ্যাপ থেকে Send Money করুন এবং Transaction ID সংরক্ষণ করুন', 'Send Money from Rocket app and save the Transaction ID', 3),
  ('bank', 'সময়ের বাতিঘর', '1234567890', 'ব্যাংক ট্রান্সফার করুন এবং রেফারেন্স নম্বর সংরক্ষণ করুন', 'Make bank transfer and save the reference number', 4)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- সম্পন্ন! প্রথম এডমিন তৈরির নিয়ম:
-- Supabase Authentication এ গিয়ে একজন ইউজার সাইন আপ করান, তারপর SQL Editor এ রান করুন:
-- INSERT INTO public.user_roles (user_id, role) VALUES ('YOUR-USER-UUID', 'admin');
-- ============================================================================
