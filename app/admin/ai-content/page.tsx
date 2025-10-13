'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AIContentDashboard from '@/components/admin/ai/AIContentDashboard';

export default function AIContentPage() {
  return (
    <AdminLayout>
      <AIContentDashboard />
    </AdminLayout>
  );
}