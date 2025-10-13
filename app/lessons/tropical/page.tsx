import React from 'react';
import { TropicalLessonUI } from '@/components/TropicalLessonUI';
import { AuthenticatedLayout } from '@/components/layout/AppLayout';

export default function TropicalLessonPage() {
  return (
    <AuthenticatedLayout>
      <TropicalLessonUI />
    </AuthenticatedLayout>
  );
}

export const metadata = {
  title: 'Tropical Lesson Experience - Tahiti Speaks',
  description: 'Immersive tropical learning experience for Tahitian language',
};