'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useAuthorization } from '../../hooks/useAuthorization';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Loader2, Lock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  fallbackUrl?: string;
  showFallback?: boolean;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requiredRoles = [],
  requiredPermissions = [],
  fallbackUrl = '/auth/login',
  showFallback = true,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { hasRole, hasPermission, hasAnyRole, hasAllPermissions } = useAuthorization();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      setIsChecking(false);
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading && !isChecking) {
      // Check authentication requirement
      if (requireAuth && !isAuthenticated) {
        router.push(fallbackUrl);
        return;
      }

      // Check role requirements
      if (requiredRoles.length > 0 && isAuthenticated) {
        const hasRequiredRole = hasAnyRole(requiredRoles);
        if (!hasRequiredRole) {
          router.push('/unauthorized');
          return;
        }
      }

      // Check permission requirements
      if (requiredPermissions.length > 0 && isAuthenticated) {
        const hasRequiredPermissions = hasAllPermissions(requiredPermissions);
        if (!hasRequiredPermissions) {
          router.push('/unauthorized');
          return;
        }
      }
    }
  }, [isLoading, isChecking, isAuthenticated, requireAuth, requiredRoles, requiredPermissions, router, fallbackUrl, hasAnyRole, hasAllPermissions]);

  // Show loading state
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <div className="text-center">
                <h3 className="font-semibold">Loading...</h3>
                <p className="text-sm text-muted-foreground">
                  Verifying your access permissions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    if (!showFallback) {
      return null;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Lock className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Authentication Required</h3>
                <p className="text-sm text-muted-foreground">
                  You need to sign in to access this page.
                </p>
              </div>
              <div className="flex flex-col space-y-2 w-full">
                <Link href={fallbackUrl}>
                  <Button className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    Go Home
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check role requirements
  if (requiredRoles.length > 0 && isAuthenticated) {
    const hasRequiredRole = hasAnyRole(requiredRoles);
    if (!hasRequiredRole) {
      if (!showFallback) {
        return null;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Access Denied</h3>
                  <p className="text-sm text-muted-foreground">
                    You don't have the required role to access this page.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Required roles: {requiredRoles.join(', ')}
                  </p>
                  {user && (
                    <p className="text-xs text-muted-foreground">
                      Your role: {user.role}
                    </p>
                  )}
                </div>
                <div className="flex flex-col space-y-2 w-full">
                  <Link href="/dashboard">
                    <Button className="w-full">
                      Go to Dashboard
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline" className="w-full">
                      Go Home
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // Check permission requirements
  if (requiredPermissions.length > 0 && isAuthenticated) {
    const hasRequiredPermissions = hasAllPermissions(requiredPermissions);
    if (!hasRequiredPermissions) {
      if (!showFallback) {
        return null;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-3 bg-orange-100 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Insufficient Permissions</h3>
                  <p className="text-sm text-muted-foreground">
                    You don't have the required permissions to access this page.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Required permissions: {requiredPermissions.join(', ')}
                  </p>
                </div>
                <div className="flex flex-col space-y-2 w-full">
                  <Link href="/dashboard">
                    <Button className="w-full">
                      Go to Dashboard
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline" className="w-full">
                      Go Home
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // All checks passed, render children
  return <>{children}</>;
}

// Convenience wrapper components
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['admin']}>
      {children}
    </ProtectedRoute>
  );
}

export function InstructorRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['admin', 'instructor']}>
      {children}
    </ProtectedRoute>
  );
}

export function StudentRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['admin', 'instructor', 'student']}>
      {children}
    </ProtectedRoute>
  );
}