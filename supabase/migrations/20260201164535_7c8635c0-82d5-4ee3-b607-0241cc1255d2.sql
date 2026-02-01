-- Add payment_method column to member_dues table to store the selected payment method (bkash, nagad, rocket, bank)
ALTER TABLE public.member_dues 
ADD COLUMN IF NOT EXISTS payment_method text;