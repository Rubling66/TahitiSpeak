import { Metadata } from 'next';
import Link from 'next/link';
import { PasswordResetForm } from '../../../components/auth/PasswordResetForm';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, Shield, Mail, Lock } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AppLayout';

export const metadata: Metadata = {
  title: 'Reset Password | Tahitian Tutor',
  description: 'Reset your Tahitian Tutor account password securely.',
};

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back to Login */}
        <div className="flex justify-center">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </div>

        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Reset Password</h1>
          <p className="text-muted-foreground">
            We&apos;ll help you get back into your account securely
          </p>
        </div>

        {/* Reset Form */}
        <PasswordResetForm />

        {/* Help Information */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-blue-900 flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                How it works
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-xs font-semibold mt-0.5">
                    1
                  </div>
                  <p>Enter your email address associated with your account</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-xs font-semibold mt-0.5">
                    2
                  </div>
                  <p>Check your email for a secure reset link</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-xs font-semibold mt-0.5">
                    3
                  </div>
                  <p>Click the link and create a new password</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Note */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Lock className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-semibold text-amber-900">Security Note</h4>
                <p className="text-sm text-amber-800">
                  For your security, password reset links expire after 1 hour. 
                  If you don&apos;t receive an email, check your spam folder or try again.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Help */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Still having trouble?
          </p>
          <Link 
            href="/contact" 
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Contact Support
          </Link>
        </div>

        {/* Back to Sign In */}
        <div className="text-center">
          <Link href="/auth/login">
            <Button variant="outline" className="w-full">
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
    </AuthLayout>
  );
}