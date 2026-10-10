'use client';

import { useEffect, useState } from 'react';
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
  const { isLoading, isAuthenticated, refreshTokens } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Ensure consistent hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Attempt to refresh token on app load
    if (mounted && !isAuthenticated && !isLoading) {
      refreshTokens().catch(() => {
        // Silent fail - user will need to login
      });
    }
  }, [mounted, isAuthenticated, isLoading, refreshTokens]);

  // Show loading state during initial authentication check
  // Use consistent styling to avoid hydration mismatch
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--tahiti-deep)' }}>
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--tahiti-aqua)' }} />
          <div className="text-center">
            <h3 className="font-semibold" style={{ color: 'var(--tahiti-pearl)' }}>Loading...</h3>
            <p className="text-sm" style={{ color: 'var(--tahiti-platinum)' }}>
              Initializing your session
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--tahiti-deep)' }}>
      {showNavigation && <Navigation />}

      <main className={showNavigation ? 'pt-16' : ''}>
        {children}
      </main>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--tahiti-ocean)',
            border: '1px solid rgba(0, 212, 170, 0.2)',
            color: 'var(--tahiti-pearl)',
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