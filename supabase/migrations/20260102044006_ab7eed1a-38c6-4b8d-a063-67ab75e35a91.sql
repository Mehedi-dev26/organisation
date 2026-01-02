-- Add user_id column to members table to link with auth users
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_members_user_id ON public.members(user_id);

-- Add 'member' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'member';

-- Update RLS policies for members table to allow members to view their own data
DROP POLICY IF EXISTS "Members can view own data" ON public.members;
CREATE POLICY "Members can view own data" 
ON public.members 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow members to update their own profile (limited fields)
DROP POLICY IF EXISTS "Members can update own profile" ON public.members;
CREATE POLICY "Members can update own profile"
ON public.members
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Update member_dues RLS to allow members to view their own dues
DROP POLICY IF EXISTS "Members can view own dues" ON public.member_dues;
CREATE POLICY "Members can view own dues"
ON public.member_dues
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.members 
    WHERE members.id = member_dues.member_id 
    AND members.user_id = auth.uid()
  )
);