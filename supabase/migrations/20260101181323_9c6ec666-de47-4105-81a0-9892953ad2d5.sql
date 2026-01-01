-- Allow public users to insert new member registrations (pending status only)
CREATE POLICY "Public can register as members"
ON public.members
FOR INSERT
WITH CHECK (status = 'pending');