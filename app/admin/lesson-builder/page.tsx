'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import VisualLessonBuilder from '@/components/admin/content/VisualLessonBuilder';

export default function LessonBuilderPage() {
  return (
    <AdminLayout>
      <VisualLessonBuilder />
    </AdminLayout>
  );
}