import { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '../../../components/auth/RegisterForm';
import { AuthLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, Users, BookOpen, Trophy } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sign Up | Tahitian Tutor',
  description: 'Create your Tahitian Tutor account and start learning Tahitian today.',
};

export default function RegisterPage() {
  return (
    <AuthLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Back to Home */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left Side - Welcome Content */}
          <div className="space-y-8">
            {/* Logo and Title */}
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-bold text-white">TT</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">
                  Start Your Tahitian Journey
                </h1>
                <p className="text-xl text-muted-foreground">
                  Join thousands of learners discovering the beauty of Tahitian language and culture.
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Interactive Lessons</h3>
                  <p className="text-muted-foreground">
                    Learn through engaging, bite-sized lessons designed by native speakers.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Community Learning</h3>
                  <p className="text-muted-foreground">
                    Connect with fellow learners and native speakers in our vibrant community.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Track Progress</h3>
                  <p className="text-muted-foreground">
                    Monitor your learning journey with detailed progress tracking and achievements.
                  </p>
                </div>
              </div>
            </div>

            {/* Testimonial */}
            <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <blockquote className="text-lg italic mb-4">
                  &quot;Tahitian Tutor made learning my heritage language accessible and enjoyable. 
                  The cultural context in each lesson helped me connect with my roots.&quot;
                </blockquote>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">M</span>
                  </div>
                  <div>
                    <p className="font-semibold">Moana T.</p>
                    <p className="text-sm text-muted-foreground">Student from Tahiti</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Registration Form */}
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-bold mb-2">Create Your Account</h2>
              <p className="text-muted-foreground">
                Get started with your free account today
              </p>
            </div>

            <RegisterForm />

            {/* Sign In Link */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?
                  </p>
                  <Link href="/auth/login">
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Terms */}
            <div className="text-center text-xs text-muted-foreground">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="underline hover:text-foreground">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </Link>
              .
            </div>
          </div>
        </div>
      </div>
      </div>
    </AuthLayout>
  );
}