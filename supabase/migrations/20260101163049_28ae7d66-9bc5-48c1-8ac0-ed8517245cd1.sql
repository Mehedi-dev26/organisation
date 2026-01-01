
-- Create transaction types enum
CREATE TYPE public.transaction_type AS ENUM ('member_fee', 'donation', 'event_fee', 'expense', 'other_income', 'other_expense');

-- Create transactions table for all financial records
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type transaction_type NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description_bn TEXT,
  description_en TEXT,
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  donor_name TEXT,
  donor_phone TEXT,
  donor_email TEXT,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  payment_method TEXT DEFAULT 'cash',
  payment_reference TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  month_year TEXT,
  receipt_number TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all transactions" 
ON public.transactions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view summary only" 
ON public.transactions 
FOR SELECT 
USING (false);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create member dues tracking table
CREATE TABLE public.member_dues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  paid_date DATE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(member_id, month_year)
);

-- Enable RLS for member_dues
ALTER TABLE public.member_dues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage member dues" 
ON public.member_dues 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for member_dues
CREATE TRIGGER update_member_dues_updated_at
BEFORE UPDATE ON public.member_dues
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX idx_transactions_member ON public.transactions(member_id);
CREATE INDEX idx_member_dues_member ON public.member_dues(member_id);
CREATE INDEX idx_member_dues_month ON public.member_dues(month_year);
