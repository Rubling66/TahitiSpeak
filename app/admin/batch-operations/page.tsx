'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import BatchOperationsSystem from '@/components/admin/batch/BatchOperationsSystem';

export default function BatchOperationsPage() {
  return (
    <AdminLayout>
      <BatchOperationsSystem />
    </AdminLayout>
  );
}