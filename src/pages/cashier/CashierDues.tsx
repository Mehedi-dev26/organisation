import React from 'react';
import DuesManagement from '@/pages/admin/DuesManagement';

// Reuse the admin DuesManagement component for cashier
// The RLS policies allow cashiers to access this data
const CashierDues = () => {
  return <DuesManagement />;
};

export default CashierDues;
