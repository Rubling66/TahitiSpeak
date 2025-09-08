'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AIContentHub from '@/components/admin/ai/AIContentHub';

export default function AIContentPage() {
  return (
    <AdminLayout>
      <AIContentHub />
    </AdminLayout>
  );
}