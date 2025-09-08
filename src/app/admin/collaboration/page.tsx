'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import CollaborationHub from '@/components/admin/collaboration/CollaborationHub';

export default function CollaborationPage() {
  return (
    <AdminLayout>
      <CollaborationHub />
    </AdminLayout>
  );
}