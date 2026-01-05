import React from 'react';
import YearlyAccounts from '@/pages/admin/YearlyAccounts';

// Reuse the admin YearlyAccounts component for cashier
// The RLS policies allow cashiers to access this data
const CashierYearlyAccounts = () => {
  return <YearlyAccounts />;
};

export default CashierYearlyAccounts;
