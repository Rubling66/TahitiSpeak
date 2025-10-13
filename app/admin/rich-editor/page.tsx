'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import TahitianRichEditor from '@/components/admin/editor/TahitianRichEditor';

export default function RichEditorPage() {
  return (
    <AdminLayout>
      <TahitianRichEditor />
    </AdminLayout>
  );
}