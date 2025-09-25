'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AdminDashboardStats, AdminActivity, Course } from '@/types';
import {
  BookOpen,
  Users,
  TrendingUp,
  Plus,
  Upload,
  Eye,
  Edit,
  Calendar,
  Clock,
  Brain,
  GitBranch,
  Shield,
  FolderTree,
  Zap,
  Activity,
  Globe,
  ArrowRight
} from 'lucide-react';

// Mock data - in production, this would come from an API
const mockStats: AdminDashboardStats = {
  totalCourses: 12,
  totalLessons: 48,
  totalUsers: 1247,
  publishedCourses: 8,
  draftCourses: 4,
  recentActivity: [
    {
      id: '1',
      type: 'course_created',
      description: 'Created new course "Advanced Tahitian Grammar"',
      userId: 1,
      userName: 'Admin User',
      timestamp: Date.now() - 2 * 60 * 60 * 1000 // 2 hours ago
    },
    {
      id: '2',
      type: 'course_published',
      description: 'Published course "Basic Greetings"',
      userId: 2,
      userName: 'Course Manager',
      timestamp: Date.now() - 5 * 60 * 60 * 1000 // 5 hours ago
    },
    {
      id: '3',
      type: 'bulk_import',
      description: 'Imported 15 lessons from CSV file',
      userId: 1,
      userName: 'Admin User',
      timestamp: Date.now() - 24 * 60 * 60 * 1000 // 1 day ago
    },
    {
      id: '4',
      type: 'user_registered',
      description: '23 new users registered today',
      userId: 1,
      userName: 'System',
      timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000 // 2 days ago
    }
  ]
};

const mockRecentCourses: Course[] = [
  {
    id: 1,
    title: { fr: 'Salutations de Base', en: 'Basic Greetings', tah: 'Te Hoê Tamaraa' },
    description: 'Learn essential Tahitian greetings and polite expressions',
    level: 'Beginner',
    category: 'Communication',
    tags: ['greetings', 'basic', 'communication'],
    estimatedDuration: 30,
    learningObjectives: ['Master basic greetings', 'Understand cultural context'],
    status: 'published',
    authorId: 1,
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    publishedAt: Date.now() - 24 * 60 * 60 * 1000,
    version: 1,
    lessons: [],
    mediaAssets: []
  },
  {
    id: 2,
    title: { fr: 'Grammaire Avancée', en: 'Advanced Grammar', tah: 'Te Reo Maoro' },
    description: 'Deep dive into complex Tahitian grammatical structures',
    level: 'Advanced',
    category: 'Grammar',
    tags: ['grammar', 'advanced', 'structure'],
    estimatedDuration: 90,
    learningObjectives: ['Master complex grammar', 'Understand sentence structure'],
    status: 'draft',
    authorId: 1,
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
    updatedAt: Date.now() - 30 * 60 * 1000,
    version: 1,
    lessons: [],
    mediaAssets: []
  },
  {
    id: 3,
    title: { fr: 'Culture Polynésienne', en: 'Polynesian Culture', tah: 'Te Haapiiraa Maaohi' },
    description: 'Explore the rich cultural heritage of French Polynesia',
    level: 'Intermediate',
    category: 'Culture',
    tags: ['culture', 'history', 'traditions'],
    estimatedDuration: 60,
    learningObjectives: ['Understand cultural context', 'Learn traditions'],
    status: 'review',
    authorId: 2,
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    version: 2,
    lessons: [],
    mediaAssets: []
  }
];

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'published': return 'bg-green-100 text-green-800';
    case 'draft': return 'bg-gray-100 text-gray-800';
    case 'review': return 'bg-yellow-100 text-yellow-800';
    case 'archived': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'course_created': return <BookOpen className="h-4 w-4" />;
    case 'course_published': return <TrendingUp className="h-4 w-4" />;
    case 'bulk_import': return <Upload className="h-4 w-4" />;
    case 'user_registered': return <Users className="h-4 w-4" />;
    default: return <Calendar className="h-4 w-4" />;
  }
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats>(mockStats);
  const [recentCourses, setRecentCourses] = useState<Course[]>(mockRecentCourses);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // In production, fetch real data from API
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Overview of your Tahitian French Tutor administration
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Lessons</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLessons}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">{stats.publishedCourses}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Advanced Features Quick Access */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Advanced Admin Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/ai-content">
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <Brain className="h-6 w-6 text-purple-600 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">AI Content Tools</h3>
                    <p className="text-xs text-gray-500">Auto-generate content</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </div>
              </Card>
            </Link>
            
            <Link href="/admin/collaboration">
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <GitBranch className="h-6 w-6 text-blue-600 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Collaboration</h3>
                    <p className="text-xs text-gray-500">Team workflows</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </div>
              </Card>
            </Link>
            
            <Link href="/admin/accessibility">
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <Shield className="h-6 w-6 text-green-600 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Accessibility</h3>
                    <p className="text-xs text-gray-500">WCAG compliance</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </div>
              </Card>
            </Link>
            
            <Link href="/admin/content-management">
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <FolderTree className="h-6 w-6 text-orange-600 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Content Hub</h3>
                    <p className="text-xs text-gray-500">Smart management</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </div>
              </Card>
            </Link>
            
            <Link href="/admin/integrations">
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <Zap className="h-6 w-6 text-yellow-600 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Integrations</h3>
                    <p className="text-xs text-gray-500">API & webhooks</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </div>
              </Card>
            </Link>
            
            <Link href="/admin/performance">
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <Activity className="h-6 w-6 text-red-600 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Performance</h3>
                    <p className="text-xs text-gray-500">System monitoring</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </div>
              </Card>
            </Link>
            
            <Link href="/admin/localization">
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <Globe className="h-6 w-6 text-indigo-600 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Localization</h3>
                    <p className="text-xs text-gray-500">Multi-language</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </div>
              </Card>
            </Link>
            
            <Link href="/admin/analytics">
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <TrendingUp className="h-6 w-6 text-teal-600 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Analytics</h3>
                    <p className="text-xs text-gray-500">Advanced reports</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </div>
              </Card>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Courses */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">Recent Courses</h2>
              <Link href="/admin/courses">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {recentCourses.map((course) => (
                <div key={course.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {course.title.en}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {course.level} • {course.category}
                    </p>
                    <div className="flex items-center mt-2">
                      <Badge className={getStatusColor(course.status)}>
                        {course.status}
                      </Badge>
                      <span className="ml-2 text-xs text-gray-500">
                        <Clock className="inline h-3 w-3 mr-1" />
                        {course.estimatedDuration}min
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <Link href="/admin/courses/new">
                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Course
                </Button>
              </Link>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Recent Activity</h2>
            
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600">
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      by {activity.userName} • {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <Link href="/admin/import">
                  <Button variant="outline" className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    Bulk Import
                  </Button>
                </Link>
                <Link href="/admin/analytics">
                  <Button variant="outline" className="w-full">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Analytics
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}