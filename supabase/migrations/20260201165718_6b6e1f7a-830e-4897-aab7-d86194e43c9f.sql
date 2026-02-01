-- Drop existing policy and recreate with payment_method support
DROP POLICY IF EXISTS "Members can submit payment for own dues" ON public.member_dues;

-- Recreate the policy allowing payment_method to be updated along with transaction_id
CREATE POLICY "Members can submit payment for own dues" 
ON public.member_dues 
FOR UPDATE 
USING (
  (EXISTS (
    SELECT 1 FROM members 
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