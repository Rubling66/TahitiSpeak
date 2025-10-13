'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Course, Lesson, BulkImportJob } from '@/types';
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  RefreshCw,
  FileJson,
  FileSpreadsheet
} from 'lucide-react';

interface ImportResult {
  success: boolean;
  courses?: Course[];
  errors?: string[];
  warnings?: string[];
  summary?: {
    totalCourses: number;
    validCourses: number;
    invalidCourses: number;
    totalLessons: number;
  };
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

const SAMPLE_JSON_STRUCTURE = {
  courses: [
    {
      title: {
        en: "Basic Greetings",
        fr: "Salutations de Base",
        tah: "Te Hoê Tamaraa"
      },
      description: "Learn essential Tahitian greetings and polite expressions",
      level: "Beginner",
      category: "Communication",
      tags: ["greetings", "basic", "communication"],
      estimatedDuration: 30,
      learningObjectives: [
        "Master basic greetings",
        "Understand cultural context"
      ],
      lessons: [
        {
          title: {
            en: "Hello and Goodbye",
            fr: "Bonjour et Au revoir",
            tah: "Ia Ora Na e Nana"
          },
          content: "Lesson content here...",
          vocabulary: [
            {
              tahitian: "Ia ora na",
              french: "Bonjour",
              english: "Hello",
              pronunciation: "ee-ah OH-rah nah",
              audioUrl: "/audio/ia-ora-na.mp3"
            }
          ]
        }
      ]
    }
  ]
};

const CSV_HEADERS = [
  'title_en', 'title_fr', 'title_tah', 'description', 'level', 'category',
  'tags', 'estimatedDuration', 'learningObjectives', 'status'
];

export default function BulkImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [importJobs, setImportJobs] = useState<BulkImportJob[]>([]);

  const validateCourseData = (courseData: any, index: number): ValidationError[] => {
    const errors: ValidationError[] = [];
    const row = index + 1;

    // Required fields validation
    if (!courseData.title?.en) {
      errors.push({ row, field: 'title.en', message: 'English title is required' });
    }
    if (!courseData.title?.fr) {
      errors.push({ row, field: 'title.fr', message: 'French title is required' });
    }
    if (!courseData.title?.tah) {
      errors.push({ row, field: 'title.tah', message: 'Tahitian title is required' });
    }
    if (!courseData.description) {
      errors.push({ row, field: 'description', message: 'Description is required' });
    }
    if (!courseData.level) {
      errors.push({ row, field: 'level', message: 'Level is required' });
    }
    if (!courseData.category) {
      errors.push({ row, field: 'category', message: 'Category is required' });
    }

    // Level validation
    const validLevels = ['Beginner', 'Intermediate', 'Advanced'];
    if (courseData.level && !validLevels.includes(courseData.level)) {
      errors.push({
        row,
        field: 'level',
        message: `Invalid level. Must be one of: ${validLevels.join(', ')}`,
        value: courseData.level
      });
    }

    // Duration validation
    if (courseData.estimatedDuration) {
      const duration = Number(courseData.estimatedDuration);
      if (isNaN(duration) || duration < 5 || duration > 300) {
        errors.push({
          row,
          field: 'estimatedDuration',
          message: 'Duration must be a number between 5 and 300 minutes',
          value: courseData.estimatedDuration
        });
      }
    }

    // Description length validation
    if (courseData.description && courseData.description.length < 20) {
      errors.push({
        row,
        field: 'description',
        message: 'Description must be at least 20 characters long',
        value: courseData.description.length
      });
    }

    return errors;
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV must have at least a header row and one data row');

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const courses: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const course: any = {
        title: { en: '', fr: '', tah: '' },
        tags: [],
        learningObjectives: []
      };

      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        switch (header) {
          case 'title_en':
            course.title.en = value;
            break;
          case 'title_fr':
            course.title.fr = value;
            break;
          case 'title_tah':
            course.title.tah = value;
            break;
          case 'tags':
            course.tags = value ? value.split(';').map(t => t.trim()) : [];
            break;
          case 'learningObjectives':
            course.learningObjectives = value ? value.split(';').map(o => o.trim()) : [];
            break;
          case 'estimatedDuration':
            course.estimatedDuration = value ? parseInt(value) : 30;
            break;
          default:
            course[header] = value;
        }
      });

      courses.push(course);
    }

    return courses;
  };

  const processFile = async (file: File): Promise<ImportResult> => {
    const text = await file.text();
    let coursesData: any[];

    try {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const jsonData = JSON.parse(text);
        coursesData = jsonData.courses || [jsonData];
      } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        coursesData = parseCSV(text);
      } else {
        throw new Error('Unsupported file format. Please use JSON or CSV.');
      }
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }

    // Validate all courses
    const allErrors: ValidationError[] = [];
    const validCourses: Course[] = [];
    const warnings: string[] = [];

    coursesData.forEach((courseData, index) => {
      const errors = validateCourseData(courseData, index);
      allErrors.push(...errors);

      if (errors.length === 0) {
        // Transform to Course object
        const course: Course = {
          id: Date.now() + index,
          title: courseData.title,
          description: courseData.description,
          level: courseData.level,
          category: courseData.category,
          tags: courseData.tags || [],
          estimatedDuration: courseData.estimatedDuration || 30,
          learningObjectives: courseData.learningObjectives || [],
          status: courseData.status || 'draft',
          authorId: 1, // Current admin
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: 1,
          lessons: courseData.lessons || [],
          mediaAssets: courseData.mediaAssets || []
        };
        validCourses.push(course);
      }
    });

    setValidationErrors(allErrors);

    return {
      success: allErrors.length === 0,
      courses: validCourses,
      errors: allErrors.map(e => `Row ${e.row}, ${e.field}: ${e.message}`),
      warnings,
      summary: {
        totalCourses: coursesData.length,
        validCourses: validCourses.length,
        invalidCourses: coursesData.length - validCourses.length,
        totalLessons: validCourses.reduce((sum, course) => sum + (course.lessons?.length || 0), 0)
      }
    };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
      setValidationErrors([]);
      setPreviewData(null);
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const result = await processFile(selectedFile);
      setPreviewData(result);
    } catch (error) {
      console.error('Preview error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !previewData?.courses) return;

    setIsProcessing(true);
    
    try {
      // Create import job
      const job: BulkImportJob = {
        id: Date.now().toString(),
        filename: selectedFile.name,
        status: 'processing',
        totalItems: previewData.courses.length,
        processedItems: 0,
        errors: [],
        createdAt: Date.now(),
        completedAt: undefined
      };

      setImportJobs(prev => [job, ...prev]);

      // Simulate processing
      for (let i = 0; i < previewData.courses.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setImportJobs(prev => prev.map(j => 
          j.id === job.id 
            ? { ...j, processedItems: i + 1 }
            : j
        ));
      }

      // Complete job
      const completedJob = {
        ...job,
        status: 'completed' as const,
        processedItems: previewData.courses.length,
        completedAt: Date.now()
      };

      setImportJobs(prev => prev.map(j => 
        j.id === job.id ? completedJob : j
      ));

      setImportResult({
        success: true,
        courses: previewData.courses,
        summary: previewData.summary
      });

      // Reset form
      setSelectedFile(null);
      setPreviewData(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        errors: ['Import failed. Please try again.']
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSampleJSON = () => {
    const blob = new Blob([JSON.stringify(SAMPLE_JSON_STRUCTURE, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-courses.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSampleCSV = () => {
    const csvContent = [
      CSV_HEADERS.join(','),
      '"Basic Greetings","Salutations de Base","Te Hoê Tamaraa","Learn essential Tahitian greetings and polite expressions","Beginner","Communication","greetings;basic;communication",30,"Master basic greetings;Understand cultural context","draft"'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-courses.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Bulk Import Courses</h1>
          <p className="mt-1 text-sm text-gray-600">
            Import multiple courses from JSON or CSV files
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Import Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload */}
            <Card className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Upload File</h2>
              
              <div className="space-y-4">
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.csv"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Supported formats: JSON, CSV (max 10MB)
                  </p>
                </div>

                {selectedFile && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center space-x-2">
                      {selectedFile.name.endsWith('.json') ? (
                        <FileJson className="h-5 w-5 text-blue-600" />
                      ) : (
                        <FileSpreadsheet className="h-5 w-5 text-green-600" />
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        {selectedFile.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({Math.round(selectedFile.size / 1024)} KB)
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreview}
                        disabled={isProcessing}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Preview Results */}
            {previewData && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Import Preview</h2>
                  {previewData.success && (
                    <Button onClick={handleImport} disabled={isProcessing}>
                      {isProcessing ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Import Courses
                    </Button>
                  )}
                </div>

                {/* Summary */}
                {previewData.summary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {previewData.summary.totalCourses}
                      </p>
                      <p className="text-sm text-blue-600">Total Courses</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {previewData.summary.validCourses}
                      </p>
                      <p className="text-sm text-green-600">Valid</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">
                        {previewData.summary.invalidCourses}
                      </p>
                      <p className="text-sm text-red-600">Invalid</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">
                        {previewData.summary.totalLessons}
                      </p>
                      <p className="text-sm text-purple-600">Lessons</p>
                    </div>
                  </div>
                )}

                {/* Errors */}
                {previewData.errors && previewData.errors.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-red-800 mb-2">Validation Errors</h3>
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 max-h-40 overflow-y-auto">
                      <ul className="text-sm text-red-700 space-y-1">
                        {previewData.errors.map((error, index) => (
                          <li key={index} className="flex items-start">
                            <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Valid Courses Preview */}
                {previewData.courses && previewData.courses.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-green-800 mb-2">
                      Valid Courses ({previewData.courses.length})
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {previewData.courses.slice(0, 5).map((course, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                          <div>
                            <p className="text-sm font-medium text-green-900">
                              {course.title.en}
                            </p>
                            <p className="text-xs text-green-700">
                              {course.level} • {course.category} • {course.estimatedDuration}min
                            </p>
                          </div>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                      ))}
                      {previewData.courses.length > 5 && (
                        <p className="text-xs text-gray-500 text-center py-2">
                          ... and {previewData.courses.length - 5} more courses
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Import Results */}
            {importResult && (
              <Card className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  {importResult.success ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  )}
                  <h2 className="text-lg font-medium text-gray-900">
                    Import {importResult.success ? 'Successful' : 'Failed'}
                  </h2>
                </div>

                {importResult.success && importResult.summary && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <p className="text-sm text-green-800">
                      Successfully imported {importResult.summary.validCourses} courses 
                      with {importResult.summary.totalLessons} lessons.
                    </p>
                  </div>
                )}

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <ul className="text-sm text-red-700 space-y-1">
                      {importResult.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sample Files */}
            <Card className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Sample Files</h2>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={downloadSampleJSON}
                  className="w-full justify-start"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download JSON Sample
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadSampleCSV}
                  className="w-full justify-start"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV Sample
                </Button>
              </div>
            </Card>

            {/* Import History */}
            <Card className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Imports</h2>
              {importJobs.length === 0 ? (
                <p className="text-sm text-gray-500">No recent imports</p>
              ) : (
                <div className="space-y-3">
                  {importJobs.slice(0, 5).map(job => (
                    <div key={job.id} className="p-3 border border-gray-200 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {job.filename}
                        </p>
                        <Badge className={
                          job.status === 'completed' ? 'bg-green-100 text-green-800' :
                          job.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {job.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        {job.processedItems}/{job.totalItems} items
                      </div>
                      {job.status === 'processing' && (
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${(job.processedItems / job.totalItems) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Help */}
            <Card className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Import Guidelines</h2>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Required Fields:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Title (English, French, Tahitian)</li>
                  <li>Description (min 20 characters)</li>
                  <li>Level (Beginner/Intermediate/Advanced)</li>
                  <li>Category</li>
                </ul>
                <p className="mt-3"><strong>Optional Fields:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Tags (semicolon-separated)</li>
                  <li>Learning objectives</li>
                  <li>Estimated duration (5-300 minutes)</li>
                  <li>Status (draft/review/published)</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}