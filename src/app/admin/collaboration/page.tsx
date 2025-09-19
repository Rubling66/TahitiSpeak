'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import CollaborationHub from '@/components/admin/collaboration/CollaborationHub';

export default function CollaborationPage() {
  // Mock data for demonstration - in real app, these would come from URL params or context
  const contentId = 'demo-content-1';
  const currentVersionId = 'version-1';

  return (
    <AdminLayout>
      <CollaborationHub 
        contentId={contentId}
        currentVersionId={currentVersionId}
        onVersionChange={(versionId) => {
          console.log('Version changed to:', versionId);
        }}
      />
    </AdminLayout>
  );
}