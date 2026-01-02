-- Allow members to view their own transactions
CREATE POLICY "Members can view own transactions" 
ON public.transactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM members 
    WHERE members.id = transactions.member_id 
    AND members.user_id = auth.uid()
  )
);