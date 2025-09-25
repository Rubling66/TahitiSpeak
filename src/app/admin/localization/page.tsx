'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import LocalizationHub from '@/components/admin/localization/LocalizationHub';

export default function LocalizationPage() {
  return (
    <AdminLayout>
      <LocalizationHub />
    </AdminLayout>
  );
}