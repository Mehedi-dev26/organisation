-- Drop the restrictive policy and create a new one that allows admins to view all members
DROP POLICY IF EXISTS "Public can view approved members" ON public.members;

-- Create policy that allows public to view approved members
CREATE POLICY "Public can view approved members"
ON public.members
FOR SELECT
USING (status = 'approved');

-- Update admin policy to ensure admins can see ALL members including pending
DROP POLICY IF EXISTS "Admins can manage all members" ON public.members;

CREATE POLICY "Admins can manage all members"
ON public.members
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));