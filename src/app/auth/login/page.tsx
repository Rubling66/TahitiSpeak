import { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '../../../components/auth/LoginForm';
import { AuthLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Login | Tahitian Tutor',
  description: 'Sign in to your Tahitian Tutor account to continue your language learning journey.',
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back to Home */}
        <div className="flex justify-center">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
            <span className="text-2xl font-bold text-white">TT</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
          <p className="text-muted-foreground">
            Sign in to continue your Tahitian learning journey
          </p>
        </div>

        {/* Login Form */}
        <LoginForm />

        {/* Sign Up Link */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?
              </p>
              <Link href="/auth/register">
                <Button variant="outline" className="w-full">
                  Create Account
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Additional Links */}
        <div className="text-center space-y-2">
          <Link 
            href="/auth/reset-password" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Forgot your password?
          </Link>
          <div className="text-xs text-muted-foreground">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-foreground">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
      </div>
    </AuthLayout>
  );
}