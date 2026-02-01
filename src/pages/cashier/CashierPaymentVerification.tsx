import React from 'react';
import PaymentVerification from '@/pages/admin/PaymentVerification';

// Reuse the admin PaymentVerification component for cashier
// The RLS policies allow cashiers to access this data
const CashierPaymentVerification = () => {
  return <PaymentVerification />;
};

export default CashierPaymentVerification;
