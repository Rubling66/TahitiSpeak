'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Course, LessonLevel, MediaAsset } from '@/types';
import {
  Save,
  Eye,
  Upload,
  X,
  Plus,
  FileText,
  Image,
  Music,
  Video,
  AlertCircle
} from 'lucide-react';

interface CourseFormData {
  title: {
    fr: string;
    en: string;
    tah: string;
  };
  description: string;
  level: LessonLevel;
  category: string;
  tags: string[];
  estimatedDuration: number;
  learningObjectives: string[];
  status: 'draft' | 'review' | 'published';
}

interface FormErrors {
  [key: string]: string;
}

const CATEGORIES = [
  'Communication',
  'Grammar',
  'Vocabulary',
  'Culture',
  'Pronunciation',
  'Writing',
  'Reading',
  'Listening'
];

const LEVELS: LessonLevel[] = ['Beginner', 'Intermediate', 'Advanced'];

export default function NewCoursePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [newTag, setNewTag] = useState('');
  const [newObjective, setNewObjective] = useState('');
  
  const [formData, setFormData] = useState<CourseFormData>({
    title: {
      fr: '',
      en: '',
      tah: ''
    },
    description: '',
    level: 'Beginner',
    category: 'Communication',
    tags: [],
    estimatedDuration: 30,
    learningObjectives: [],
    status: 'draft'
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Title validation
    if (!formData.title.en.trim()) {
      newErrors.titleEn = 'English title is required';
    }
    if (!formData.title.fr.trim()) {
      newErrors.titleFr = 'French title is required';
    }
    if (!formData.title.tah.trim()) {
      newErrors.titleTah = 'Tahitian title is required';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    // Duration validation
    if (formData.estimatedDuration < 5) {
      newErrors.estimatedDuration = 'Duration must be at least 5 minutes';
    } else if (formData.estimatedDuration > 300) {
      newErrors.estimatedDuration = 'Duration cannot exceed 300 minutes';
    }

    // Learning objectives validation
    if (formData.learningObjectives.length === 0) {
      newErrors.learningObjectives = 'At least one learning objective is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleTitleChange = (lang: 'fr' | 'en' | 'tah', value: string) => {
    setFormData(prev => ({
      ...prev,
      title: {
        ...prev.title,
        [lang]: value
      }
    }));
    
    // Clear title errors
    const errorKey = `title${lang.charAt(0).toUpperCase() + lang.slice(1)}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addObjective = () => {
    if (newObjective.trim() && !formData.learningObjectives.includes(newObjective.trim())) {
      setFormData(prev => ({
        ...prev,
        learningObjectives: [...prev.learningObjectives, newObjective.trim()]
      }));
      setNewObjective('');
      
      // Clear objectives error
      if (errors.learningObjectives) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.learningObjectives;
          return newErrors;
        });
      }
    }
  };

  const removeObjective = (objectiveToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter(obj => obj !== objectiveToRemove)
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const asset: MediaAsset = {
        id: Date.now() + Math.random(),
        type: file.type.startsWith('image/') ? 'image' : 
              file.type.startsWith('audio/') ? 'audio' : 
              file.type.startsWith('video/') ? 'video' : 'document',
        url: URL.createObjectURL(file),
        filename: file.name,
        size: file.size,
        uploadedAt: Date.now()
      };
      
      setMediaAssets(prev => [...prev, asset]);
    });
  };

  const removeMediaAsset = (assetId: number | string) => {
    setMediaAssets(prev => prev.filter(asset => asset.id !== assetId));
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const handleSubmit = async (status: 'draft' | 'review' | 'published') => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const courseData: Partial<Course> = {
        ...formData,
        status,
        authorId: 1, // Current admin user
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        lessons: [],
        mediaAssets
      };

      // In production, this would be an API call
      console.log('Creating course:', courseData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to course list or edit page
      router.push('/admin/courses');
    } catch (error) {
      console.error('Error creating course:', error);
      setErrors({ submit: 'Failed to create course. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = () => {
    if (!validateForm()) {
      return;
    }
    // In production, this would open a preview modal or page
    console.log('Preview course:', formData);
  };

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
          <p className="mt-1 text-sm text-gray-600">
            Add a new course to the Tahitian French Tutor platform
          </p>
        </div>

        {/* Form */}
        <div className="space-y-8">
          {/* Basic Information */}
          <Card className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h2>
            
            {/* Titles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  English Title *
                </label>
                <input
                  type="text"
                  value={formData.title.en}
                  onChange={(e) => handleTitleChange('en', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.titleEn ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter English title"
                />
                {errors.titleEn && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.titleEn}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  French Title *
                </label>
                <input
                  type="text"
                  value={formData.title.fr}
                  onChange={(e) => handleTitleChange('fr', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.titleFr ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter French title"
                />
                {errors.titleFr && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.titleFr}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tahitian Title *
                </label>
                <input
                  type="text"
                  value={formData.title.tah}
                  onChange={(e) => handleTitleChange('tah', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.titleTah ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter Tahitian title"
                />
                {errors.titleTah && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.titleTah}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Describe what students will learn in this course"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.description}
                </p>
              )}
            </div>

            {/* Level, Category, Duration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => handleInputChange('level', e.target.value as LessonLevel)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={formData.estimatedDuration}
                  onChange={(e) => handleInputChange('estimatedDuration', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.estimatedDuration ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.estimatedDuration && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.estimatedDuration}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Tags */}
          <Card className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Tags</h2>
            
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a tag"
                />
                <Button onClick={addTag} disabled={!newTag.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <Badge key={tag} className="bg-blue-100 text-blue-800 flex items-center gap-1">
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-blue-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </Card>

          {/* Learning Objectives */}
          <Card className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Learning Objectives *</h2>
            
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a learning objective"
                />
                <Button onClick={addObjective} disabled={!newObjective.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {errors.learningObjectives && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.learningObjectives}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              {formData.learningObjectives.map((objective, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <span className="text-sm text-gray-900">{objective}</span>
                  <button
                    onClick={() => removeObjective(objective)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Media Assets */}
          <Card className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Media Assets</h2>
            
            <div className="mb-4">
              <label className="block">
                <input
                  type="file"
                  multiple
                  accept="image/*,audio/*,video/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Click to upload files or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    Images, audio, video, and documents
                  </p>
                </div>
              </label>
            </div>
            
            {mediaAssets.length > 0 && (
              <div className="space-y-2">
                {mediaAssets.map(asset => (
                  <div key={asset.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center space-x-3">
                      <div className="text-gray-500">
                        {getMediaIcon(asset.type)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{asset.filename}</p>
                        <p className="text-xs text-gray-500">
                          {asset.type} • {Math.round((asset.size || 0) / 1024)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeMediaAsset(asset.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {errors.submit}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={isLoading}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleSubmit('draft')}
                disabled={isLoading}
              >
                <Save className="mr-2 h-4 w-4" />
                Save as Draft
              </Button>
              
              <Button
                onClick={() => handleSubmit('review')}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Submit for Review
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}