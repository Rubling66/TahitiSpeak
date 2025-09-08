'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAdminService } from '@/lib/hooks/useAdminService';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/AlertDialog';
import { toast } from 'sonner';
import { ArrowLeft, Eye, Play, Volume2, Image, FileText, Globe, Clock, Users, Tag, CheckCircle, AlertTriangle, Edit } from 'lucide-react';
import type { Course, Lesson, MediaAsset } from '@/types';

export default function CoursePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const { getCourse, updateCourse, isLoading, error } = useAdminService();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [previewMode, setPreviewMode] = useState<'student' | 'admin'>('student');

  const courseId = parseInt(params.id as string);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    if (!courseId) return;
    
    const courseData = await getCourse(courseId);
    if (courseData) {
      setCourse(courseData);
      if (courseData.lessons && courseData.lessons.length > 0) {
        setSelectedLesson(courseData.lessons[0]);
      }
    }
  };

  const handlePublishCourse = async () => {
    if (!course) return;
    
    setIsPublishing(true);
    try {
      const updated = await updateCourse(courseId, { status: 'published' });
      if (updated) {
        toast.success('Course published successfully!');
        setCourse({ ...course, status: 'published' });
      }
    } catch (err) {
      toast.error('Failed to publish course');
    } finally {
      setIsPublishing(false);
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'audio': return <Volume2 className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Play className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const validateCourse = () => {
    if (!course) return { isValid: false, issues: ['Course not found'] };
    
    const issues: string[] = [];
    
    if (!course.title.en || !course.title.fr) {
      issues.push('Missing title in English or French');
    }
    
    if (!course.description.en || !course.description.fr) {
      issues.push('Missing description in English or French');
    }
    
    if (!course.lessons || course.lessons.length === 0) {
      issues.push('Course must have at least one lesson');
    }
    
    if (!course.mediaAssets || course.mediaAssets.length === 0) {
      issues.push('Course should have media assets');
    }
    
    if (!course.learningObjectives || course.learningObjectives.length === 0) {
      issues.push('Learning objectives are required');
    }
    
    return { isValid: issues.length === 0, issues };
  };

  const validation = validateCourse();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading course preview...</p>
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
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Eye className="h-6 w-6 mr-2" />
                Preview: {course.title.en}
              </h1>
              <p className="text-gray-600">
                Review course content before publishing
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">View as:</span>
              <Button
                variant={previewMode === 'student' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('student')}
              >
                Student
              </Button>
              <Button
                variant={previewMode === 'admin' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('admin')}
              >
                Admin
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/courses/${courseId}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Course
            </Button>
            {course.status !== 'published' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={!validation.isValid || isPublishing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isPublishing ? 'Publishing...' : 'Publish Course'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Publish Course?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will make the course available to all students. 
                      Make sure you have reviewed all content and it meets quality standards.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handlePublishCourse}
                      disabled={isPublishing}
                    >
                      {isPublishing ? 'Publishing...' : 'Publish Course'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Validation Status */}
        {!validation.isValid && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Course Validation Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {validation.issues.map((issue, index) => (
                  <li key={index} className="text-red-700 text-sm flex items-start">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    {issue}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {validation.isValid && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center text-green-800">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">Course is ready for publishing</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
            <TabsTrigger value="media">Media Assets</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Course Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <Globe className="h-5 w-5 mr-2" />
                        Course Information
                      </CardTitle>
                      <Badge className={getStatusColor(course.status)}>
                        {course.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{course.title.en}</h3>
                      <h4 className="font-medium text-gray-700 mb-2">{course.title.fr}</h4>
                      <p className="text-gray-600">{course.description.en}</p>
                      <p className="text-gray-600 text-sm mt-2 italic">{course.description.fr}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Level:</span>
                        <p className="text-gray-900">{course.level}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Category:</span>
                        <p className="text-gray-900">{course.category}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Duration:</span>
                        <p className="text-gray-900 flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {course.duration} minutes
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Lessons:</span>
                        <p className="text-gray-900 flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          {course.lessons?.length || 0}
                        </p>
                      </div>
                    </div>
                    
                    {course.tags && course.tags.length > 0 && (
                      <div className="pt-4 border-t">
                        <span className="text-sm font-medium text-gray-700 mb-2 block">Tags:</span>
                        <div className="flex flex-wrap gap-2">
                          {course.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Learning Objectives</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {course.learningObjectives && course.learningObjectives.length > 0 ? (
                      <ul className="space-y-2">
                        {course.learningObjectives.map((objective, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            {objective}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm">No learning objectives defined</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="lessons" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lesson List */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Lessons ({course.lessons?.length || 0})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {course.lessons && course.lessons.length > 0 ? (
                      <div className="space-y-2">
                        {course.lessons.map((lesson, index) => (
                          <button
                            key={lesson.id}
                            onClick={() => setSelectedLesson(lesson)}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${
                              selectedLesson?.id === lesson.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">
                                Lesson {index + 1}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {lesson.level}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {lesson.title.en}
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No lessons available</p>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Lesson Detail */}
              <div className="lg:col-span-2">
                {selectedLesson ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>{selectedLesson.title.en}</CardTitle>
                      <CardDescription>{selectedLesson.title.fr}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Description:</h4>
                        <p className="text-gray-700 text-sm">{selectedLesson.description.en}</p>
                        <p className="text-gray-600 text-sm italic mt-1">{selectedLesson.description.fr}</p>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Level:</span>
                          <p className="text-gray-900">{selectedLesson.level}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Duration:</span>
                          <p className="text-gray-900">{selectedLesson.duration} min</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Exercises:</span>
                          <p className="text-gray-900">{selectedLesson.exercises?.length || 0}</p>
                        </div>
                      </div>
                      
                      {selectedLesson.vocabulary && selectedLesson.vocabulary.length > 0 && (
                        <div className="pt-4 border-t">
                          <h4 className="font-medium mb-2">Vocabulary ({selectedLesson.vocabulary.length}):</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {selectedLesson.vocabulary.slice(0, 6).map((vocab, index) => (
                              <div key={index} className="bg-gray-50 p-2 rounded">
                                <span className="font-medium">{vocab.tahitian}</span>
                                <span className="text-gray-600 ml-2">- {vocab.english}</span>
                              </div>
                            ))}
                            {selectedLesson.vocabulary.length > 6 && (
                              <div className="text-gray-500 text-xs col-span-2">
                                +{selectedLesson.vocabulary.length - 6} more items
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Select a lesson to view details</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Media Assets ({course.mediaAssets?.length || 0})</CardTitle>
                <CardDescription>
                  Audio files, images, and videos used in this course
                </CardDescription>
              </CardHeader>
              <CardContent>
                {course.mediaAssets && course.mediaAssets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {course.mediaAssets.map((asset, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            {getMediaIcon(asset.type)}
                            <span className="ml-2 font-medium text-sm">{asset.type}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {asset.size || 'Unknown size'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 truncate mb-2">{asset.filename}</p>
                        <p className="text-xs text-gray-500">{asset.url}</p>
                        {asset.type === 'audio' && (
                          <audio controls className="w-full mt-2" preload="none">
                            <source src={asset.url} />
                            Your browser does not support audio playback.
                          </audio>
                        )}
                        {asset.type === 'image' && (
                          <img 
                            src={asset.url} 
                            alt={asset.filename}
                            className="w-full h-24 object-cover rounded mt-2"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No media assets uploaded</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Settings</CardTitle>
                <CardDescription>
                  Publishing and visibility settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status:</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(course.status)}>
                        {course.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Visibility:</label>
                    <p className="text-gray-900 mt-1">
                      {course.status === 'published' ? 'Public' : 'Private'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Created:</label>
                    <p className="text-gray-900 mt-1">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Updated:</label>
                    <p className="text-gray-900 mt-1">
                      {new Date(course.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}