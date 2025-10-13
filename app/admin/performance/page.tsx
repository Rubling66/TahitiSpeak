'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import PerformanceMonitoring from '@/components/admin/performance/PerformanceMonitoring';

export default function PerformancePage() {
  return (
    <AdminLayout>
      <PerformanceMonitoring />
    </AdminLayout>
  );
}