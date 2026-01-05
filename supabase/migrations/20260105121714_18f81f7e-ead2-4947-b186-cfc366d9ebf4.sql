
-- Enable realtime for transactions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- Enable realtime for member_dues table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.member_dues;
