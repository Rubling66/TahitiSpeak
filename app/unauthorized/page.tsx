import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';
import { PublicLayout } from '@/components/layout/AppLayout';

export const metadata: Metadata = {
  title: 'Access Denied | Tahitian Tutor',
  description: 'You do not have permission to access this page.',
};

export default function UnauthorizedPage() {
  return (
    <PublicLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Error Icon and Title */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
              Access Denied
            </h1>
            <p className="text-lg text-gray-600">
              You don't have permission to access this page
            </p>
          </div>
        </div>

        {/* Error Details */}
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-red-900">Why am I seeing this?</h3>
              <div className="space-y-2 text-sm text-red-800">
                <p>• You may not have the required role or permissions</p>
                <p>• Your account may need additional verification</p>
                <p>• The page may be restricted to certain user types</p>
                <p>• Your session may have expired</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link href="/dashboard">
            <Button className="w-full" size="lg">
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </Link>
          
          <Link href="/">
            <Button variant="outline" className="w-full" size="lg">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Help Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <h4 className="font-semibold">Need Help?</h4>
              <p className="text-sm text-muted-foreground">
                If you believe this is an error, please contact support or try signing in again.
              </p>
              <div className="flex flex-col space-y-2">
                <Link href="/auth/login">
                  <Button variant="outline" size="sm" className="w-full">
                    Sign In Again
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="ghost" size="sm" className="w-full">
                    Contact Support
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Code */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Error Code: 403 - Forbidden
          </p>
        </div>
      </div>
    </div>
    </PublicLayout>
  );
}