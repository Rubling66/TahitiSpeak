'use client';

import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Navigation } from './Navigation';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  requireAuth?: boolean;
}

export function AppLayout({ 
  children, 
  showNavigation = true,
  requireAuth = false 
}: AppLayoutProps) {
  const { isLoading, isAuthenticated, refreshToken } = useAuth();

  useEffect(() => {
    // Attempt to refresh token on app load
    if (!isAuthenticated && !isLoading) {
      refreshToken().catch(() => {
        // Silent fail - user will need to login
      });
    }
  }, [isAuthenticated, isLoading, refreshToken]);

  // Show loading state during initial authentication check
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <div className="text-center">
            <h3 className="font-semibold text-gray-900">Loading...</h3>
            <p className="text-sm text-gray-600">
              Initializing your session
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showNavigation && <Navigation />}
      
      <main className={showNavigation ? 'pt-0' : ''}>
        {children}
      </main>

      {/* Toast notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'white',
            border: '1px solid #e5e7eb',
            color: '#374151',
          },
        }}
      />
    </div>
  );
}

// Convenience wrapper for authenticated layouts
export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout requireAuth={true}>
      {children}
    </AppLayout>
  );
}

// Convenience wrapper for public layouts
export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout requireAuth={false}>
      {children}
    </AppLayout>
  );
}

// Convenience wrapper for auth pages (no navigation)
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout showNavigation={false} requireAuth={false}>
      {children}
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'white',
            border: '1px solid #e5e7eb',
            color: '#374151',
          },
        }}
      />
    </AppLayout>
  );
}