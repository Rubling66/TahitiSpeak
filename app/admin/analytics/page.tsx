'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import EnhancedAnalyticsDashboard from '@/components/admin/analytics/EnhancedAnalyticsDashboard';

export default function AnalyticsPage() {
  return (
    <AdminLayout>
      <EnhancedAnalyticsDashboard />
    </AdminLayout>
  );
}