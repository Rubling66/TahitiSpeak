'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AccessibilityCompliance from '@/components/admin/accessibility/AccessibilityCompliance';

export default function AccessibilityPage() {
  return (
    <AdminLayout>
      <AccessibilityCompliance />
    </AdminLayout>
  );
}