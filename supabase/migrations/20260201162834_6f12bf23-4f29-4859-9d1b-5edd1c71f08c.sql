-- Step 1: Drop the RLS policy that depends on transaction_id
DROP POLICY IF EXISTS "Members can submit payment for own dues" ON public.member_dues;

-- Step 2: Drop the foreign key constraint
ALTER TABLE public.member_dues 
DROP CONSTRAINT IF EXISTS member_dues_transaction_id_fkey;

-- Step 3: Change transaction_id column from UUID to TEXT
ALTER TABLE public.member_dues 
ALTER COLUMN transaction_id TYPE text USING transaction_id::text;

-- Step 4: Recreate the RLS policy with TEXT type
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
);