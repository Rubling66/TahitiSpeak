'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import IntegrationHub from '@/components/admin/integration/IntegrationHub';

export default function IntegrationsPage() {
  return (
    <AdminLayout>
      <IntegrationHub />
    </AdminLayout>
  );
}