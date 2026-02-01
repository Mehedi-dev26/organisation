-- Add payment submission tracking fields to member_dues
ALTER TABLE public.member_dues 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'submitted', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS submitted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS verified_by uuid,
ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Create payment_methods table for storing bKash/Nagad/Bank details
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Enable RLS on payment_methods
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Public can view active payment methods
CREATE POLICY "Public can view active payment methods"
ON public.payment_methods
FOR SELECT
USING (is_active = true);

-- Admins can manage payment methods
CREATE POLICY "Admins can manage payment methods"
ON public.payment_methods
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default payment methods
INSERT INTO public.payment_methods (method_type, account_name, account_number, instructions_bn, instructions_en, sort_order)
VALUES 
  ('bkash', 'সামোয়ার বাতিঘর', '01XXXXXXXXX', 'বিকাশ অ্যাপ থেকে Send Money করুন এবং Transaction ID সংরক্ষণ করুন', 'Send Money from bKash app and save the Transaction ID', 1),
  ('nagad', 'সামোয়ার বাতিঘর', '01XXXXXXXXX', 'নগদ অ্যাপ থেকে Send Money করুন এবং Transaction ID সংরক্ষণ করুন', 'Send Money from Nagad app and save the Transaction ID', 2),
  ('rocket', 'সামোয়ার বাতিঘর', '01XXXXXXXXX', 'রকেট অ্যাপ থেকে Send Money করুন এবং Transaction ID সংরক্ষণ করুন', 'Send Money from Rocket app and save the Transaction ID', 3),
  ('bank', 'সামোয়ার বাতিঘর', '1234567890', 'ব্যাংক ট্রান্সফার করুন এবং রেফারেন্স নম্বর সংরক্ষণ করুন', 'Make bank transfer and save the reference number', 4);

-- Update RLS for member_dues to allow members to submit payment
DROP POLICY IF EXISTS "Members can view own dues" ON public.member_dues;

CREATE POLICY "Members can view own dues"
ON public.member_dues
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM members
  WHERE members.id = member_dues.member_id 
  AND members.user_id = auth.uid()
));

-- Members can update their own unpaid dues to submit payment
CREATE POLICY "Members can submit payment for own dues"
ON public.member_dues
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM members
    WHERE members.id = member_dues.member_id 
    AND members.user_id = auth.uid()
  )
  AND payment_status IN ('unpaid', 'rejected')
)
WITH CHECK (
  payment_status = 'submitted'
  AND transaction_id IS NOT NULL
);

-- Enable realtime for payment updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_methods;