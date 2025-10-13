import { Metadata } from 'next';
import { UserDashboard } from '@/components/dashboard/UserDashboard';
import { AuthenticatedLayout } from '@/components/layout/AppLayout';

export const metadata: Metadata = {
  title: 'Dashboard | Tahitian Tutor',
  description: 'Your personalized learning dashboard with progress tracking, goals, and achievements.',
};

export default function DashboardPage() {
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8">
        <UserDashboard />
      </div>
    </AuthenticatedLayout>
  );
}