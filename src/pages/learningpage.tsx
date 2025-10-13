import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Play, Award, Clock } from 'lucide-react';

export const LearningPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">FT</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Learning Center</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/profile">
                <Button variant="outline">Profile</Button>
              </Link>
              <Link to="/dashboard">
                <Button>Dashboard</Button>
              </Link>
              <Link to="/">
                <Button variant="ghost">Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Continue Learning</h2>
          <p className="text-gray-600">Pick up where you left off in your French Tahitian journey</p>
        </div>

        {/* Learning Progress */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <span>Lessons Completed</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">12</div>
              <CardDescription>Out of 50 total lessons</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-green-500" />
                <span>Study Time</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">24h</div>
              <CardDescription>Total time spent learning</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <span>Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">8</div>
              <CardDescription>Badges earned</CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Current Lesson */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Lesson: Basic Greetings</CardTitle>
            <CardDescription>Learn essential French and Tahitian greetings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
                <p className="text-sm text-gray-600">Progress: 60% complete</p>
              </div>
              <Button className="ml-4">
                <Play className="h-4 w-4 mr-2" />
                Continue Lesson
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Available Lessons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>French Basics</CardTitle>
              <CardDescription>Foundation of French language</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Start Learning</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tahitian Culture</CardTitle>
              <CardDescription>Explore Polynesian traditions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Explore Culture</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pronunciation Practice</CardTitle>
              <CardDescription>Perfect your accent</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Practice Speaking</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};