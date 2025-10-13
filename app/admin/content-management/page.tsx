'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ContentManagementHub from '@/components/admin/content/ContentManagementHub';

export default function ContentManagementPage() {
  return (
    <AdminLayout>
      <ContentManagementHub />
    </AdminLayout>
  );
}