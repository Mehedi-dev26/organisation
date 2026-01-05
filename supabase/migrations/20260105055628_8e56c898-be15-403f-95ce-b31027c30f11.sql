-- Create cashiers table to store cashier information
CREATE TABLE public.cashiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE (user_id),
  UNIQUE (email)
);

-- Enable RLS
ALTER TABLE public.cashiers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cashiers table
CREATE POLICY "Admins can manage all cashiers"
ON public.cashiers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Cashiers can view own data"
ON public.cashiers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Cashiers can update own data"
ON public.cashiers
FOR UPDATE
USING (auth.uid() = user_id);

-- Update RLS policies to allow cashiers to access financial data
CREATE POLICY "Cashiers can manage all transactions"
ON public.transactions
FOR ALL
USING (has_role(auth.uid(), 'cashier'::app_role));

CREATE POLICY "Cashiers can manage member dues"
ON public.member_dues
FOR ALL
USING (has_role(auth.uid(), 'cashier'::app_role));

-- Allow cashiers to view members for financial operations
CREATE POLICY "Cashiers can view all members"
ON public.members
FOR SELECT
USING (has_role(auth.uid(), 'cashier'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_cashiers_updated_at
BEFORE UPDATE ON public.cashiers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();