import { Metadata } from 'next';
import { UserProfile } from '@/components/profile/UserProfile';
import { AuthenticatedLayout } from '@/components/layout/AppLayout';

export const metadata: Metadata = {
  title: 'Profile | Tahitian Tutor',
  description: 'Manage your account settings, preferences, and security options.',
};

export default function ProfilePage() {
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Profile Settings</h1>
            <p className="text-muted-foreground">
              Manage your account information, preferences, and security settings.
            </p>
          </div>
          
          <UserProfile />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}