import React from 'react';
import dynamic from 'next/dynamic';

const LoadingFallback: React.FC<{ label?: string }> = ({ label = 'Loading component...' }) => (
  <div className="p-8 text-center flex flex-col items-center justify-center space-y-2 select-none">
    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    <span className="text-xs text-slate-500 font-bold tracking-tight">{label}</span>
  </div>
);

// 1. Dynamic POS Cart Panel
export const DynamicPOSCartPanel = dynamic(
  () => import('../pos/POSCartPanel').then((mod) => mod.POSCartPanel),
  {
    loading: () => <LoadingFallback label="Initializing POS Cart Panel..." />,
    ssr: false,
  }
);

// 2. Dynamic Barcode Generator & Print Modal
export const DynamicBarcodePrintModal = dynamic(
  () => import('../inventory/BarcodePrintModal').then((mod) => mod.BarcodePrintModal),
  {
    loading: () => <LoadingFallback label="Loading Barcode Generator Engine..." />,
    ssr: false,
  }
);

// 3. Dynamic Reports Sales & Profit Chart
export const DynamicSalesAndProfitChart = dynamic(
  () => import('../reports/SalesAndProfitChart').then((mod) => mod.SalesAndProfitChart),
  {
    loading: () => <LoadingFallback label="Rendering Visual Analytics Chart..." />,
    ssr: false,
  }
);

// 4. Dynamic Customer 360-Degree Profile Drawer
export const DynamicCustomerProfileDrawer = dynamic(
  () => import('../customer-crm/CustomerProfileDrawer').then((mod) => mod.CustomerProfileDrawer),
  {
    loading: () => <LoadingFallback label="Loading Customer 360 Profile..." />,
    ssr: false,
  }
);
