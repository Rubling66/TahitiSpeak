'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAdminService } from '@/lib/hooks/useAdminService';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/AlertDialog';
import { toast } from 'sonner';
import { ArrowLeft, Clock, User, RotateCcw, Eye, Download, AlertTriangle } from 'lucide-react';
import type { Course, CourseVersion } from '@/types';

interface CourseVersionWithDetails extends CourseVersion {
  changes: string[];
  author: string;
  size: string;
}

export default function CourseVersionsPage() {
  const params = useParams();
  const router = useRouter();
  const { getCourse, createCourseVersion, restoreCourseVersion, isLoading, error } = useAdminService();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [versions, setVersions] = useState<CourseVersionWithDetails[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const courseId = parseInt(params.id as string);

  useEffect(() => {
    loadCourseAndVersions();
  }, [courseId]);

  const loadCourseAndVersions = async () => {
    if (!courseId) return;
    
    const courseData = await getCourse(courseId);
    if (courseData) {
      setCourse(courseData);
      
      // Mock version data - in real implementation, this would come from the API
      const mockVersions: CourseVersionWithDetails[] = [
        {
          id: 1,
          courseId,
          version: 3,
          data: courseData,
          createdAt: new Date('2024-01-15T10:30:00Z'),
          changes: ['Updated lesson 3 audio', 'Fixed pronunciation exercises', 'Added cultural notes'],
          author: 'Admin User',
          size: '2.4 MB'
        },
        {
          id: 2,
          courseId,
          version: 2,
          data: courseData,
          createdAt: new Date('2024-01-10T14:20:00Z'),
          changes: ['Added new vocabulary items', 'Updated course description'],
          author: 'Content Manager',
          size: '2.1 MB'
        },
        {
          id: 3,
          courseId,
          version: 1,
          data: courseData,
          createdAt: new Date('2024-01-05T09:15:00Z'),
          changes: ['Initial course creation'],
          author: 'Admin User',
          size: '1.8 MB'
        }
      ];
      
      setVersions(mockVersions);
    }
  };

  const handleCreateVersion = async () => {
    if (!course) return;
    
    setIsCreatingVersion(true);
    try {
      const newVersion = await createCourseVersion(courseId, versions.length + 1);
      if (newVersion) {
        toast.success('New version created successfully');
        await loadCourseAndVersions();
      }
    } catch (err) {
      toast.error('Failed to create version');
    } finally {
      setIsCreatingVersion(false);
    }
  };

  const handleRestoreVersion = async (version: number) => {
    setIsRestoring(true);
    try {
      const restored = await restoreCourseVersion(courseId, version);
      if (restored) {
        toast.success(`Course restored to version ${version}`);
        await loadCourseAndVersions();
        setSelectedVersion(null);
      }
    } catch (err) {
      toast.error('Failed to restore version');
    } finally {
      setIsRestoring(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getVersionBadgeColor = (version: number) => {
    if (version === Math.max(...versions.map(v => v.version))) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading course versions...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !course) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Course Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The requested course could not be found.'}</p>
          <Button onClick={() => router.push('/admin/courses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/courses')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Version History: {course.title.en}
              </h1>
              <p className="text-gray-600">
                Manage and restore previous versions of this course
              </p>
            </div>
          </div>
          <Button
            onClick={handleCreateVersion}
            disabled={isCreatingVersion}
          >
            {isCreatingVersion ? 'Creating...' : 'Create New Version'}
          </Button>
        </div>

        {/* Course Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Course</span>
              <Badge className={getVersionBadgeColor(Math.max(...versions.map(v => v.version)))}>
                Version {Math.max(...versions.map(v => v.version))}
              </Badge>
            </CardTitle>
            <CardDescription>
              {course.description.en}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Level:</span>
                <p className="text-gray-600">{course.level}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Category:</span>
                <p className="text-gray-600">{course.category}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                  {course.status}
                </Badge>
              </div>
              <div>
                <span className="font-medium text-gray-700">Last Updated:</span>
                <p className="text-gray-600">{formatDate(new Date(course.updatedAt))}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Version History */}
        <Card>
          <CardHeader>
            <CardTitle>Version History</CardTitle>
            <CardDescription>
              View and restore previous versions of this course
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    selectedVersion === version.version
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Badge className={getVersionBadgeColor(version.version)}>
                        Version {version.version}
                      </Badge>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDate(version.createdAt)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="h-4 w-4 mr-1" />
                        {version.author}
                      </div>
                      <span className="text-sm text-gray-500">{version.size}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedVersion(
                          selectedVersion === version.version ? null : version.version
                        )}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {selectedVersion === version.version ? 'Hide' : 'View'}
                      </Button>
                      {version.version !== Math.max(...versions.map(v => v.version)) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Restore
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Restore Version {version.version}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will restore the course to version {version.version}. 
                                The current version will be preserved in the history. 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRestoreVersion(version.version)}
                                disabled={isRestoring}
                              >
                                {isRestoring ? 'Restoring...' : 'Restore Version'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                    </div>
                  </div>
                  
                  {/* Changes List */}
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Changes:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {version.changes.map((change, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Version Details (Expandable) */}
                  {selectedVersion === version.version && (
                    <div className="border-t pt-3 mt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Version Details:</h4>
                      <div className="bg-gray-50 rounded p-3 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium">Lessons:</span>
                            <span className="ml-2">{course.lessons?.length || 0}</span>
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span>
                            <span className="ml-2">{course.duration} minutes</span>
                          </div>
                          <div>
                            <span className="font-medium">Media Assets:</span>
                            <span className="ml-2">{course.mediaAssets?.length || 0}</span>
                          </div>
                          <div>
                            <span className="font-medium">Tags:</span>
                            <span className="ml-2">{course.tags?.join(', ') || 'None'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}