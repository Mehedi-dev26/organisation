import React from 'react';
import FinanceManagement from '@/pages/admin/FinanceManagement';

// Reuse the admin FinanceManagement component for cashier
// The RLS policies allow cashiers to access this data
const CashierFinance = () => {
  return <FinanceManagement />;
};

export default CashierFinance;
