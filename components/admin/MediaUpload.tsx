'use client';

import React, { useState, useRef, useCallback } from 'react';
import type { MediaAsset } from '@/types';
import {
  Upload,
  X,
  FileText,
  Image,
  Music,
  Video,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MediaUploadProps {
  onFilesUploaded: (assets: MediaAsset[]) => void;
  onFileRemoved: (assetId: string | number) => void;
  existingAssets?: MediaAsset[];
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  maxFiles?: number;
  className?: string;
}

interface UploadProgress {
  [key: string]: {
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
  };
}

const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'video/mp4',
  'video/webm',
  'video/ogg',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

const DEFAULT_MAX_FILE_SIZE = 50; // 50MB
const DEFAULT_MAX_FILES = 10;

export default function MediaUpload({
  onFilesUploaded,
  onFileRemoved,
  existingAssets = [],
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  maxFiles = DEFAULT_MAX_FILES,
  className = ''
}: MediaUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File "${file.name}" is too large. Maximum size is ${maxFileSize}MB.`;
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return `File "${file.name}" has an unsupported format.`;
    }

    // Check if file already exists
    if (existingAssets.some(asset => asset.filename === file.name)) {
      return `File "${file.name}" already exists.`;
    }

    return null;
  };

  const getFileType = (file: File): MediaAsset['type'] => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
  };

  const getFileIcon = (type: MediaAsset['type']) => {
    switch (type) {
      case 'image': return <Image className="h-5 w-5" />;
      case 'audio': return <Music className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const simulateUpload = async (file: File): Promise<MediaAsset> => {
    const fileId = `${Date.now()}-${Math.random()}`;
    
    // Initialize progress
    setUploadProgress(prev => ({
      ...prev,
      [fileId]: { progress: 0, status: 'uploading' }
    }));

    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setUploadProgress(prev => ({
        ...prev,
        [fileId]: { progress, status: 'uploading' }
      }));
    }

    // Complete upload
    setUploadProgress(prev => ({
      ...prev,
      [fileId]: { progress: 100, status: 'completed' }
    }));

    // Create media asset
    const asset: MediaAsset = {
      id: fileId,
      type: getFileType(file),
      url: URL.createObjectURL(file),
      filename: file.name,
      size: file.size,
      uploadedAt: Date.now()
    };

    // Clean up progress after a delay
    setTimeout(() => {
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });
    }, 2000);

    return asset;
  };

  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    const newErrors: string[] = [];
    const validFiles: File[] = [];

    // Check total file limit
    if (existingAssets.length + fileArray.length > maxFiles) {
      newErrors.push(`Cannot upload more than ${maxFiles} files total.`);
      setErrors(newErrors);
      return;
    }

    // Validate each file
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    setErrors(newErrors);

    if (validFiles.length === 0) return;

    try {
      // Upload files
      const uploadPromises = validFiles.map(file => simulateUpload(file));
      const uploadedAssets = await Promise.all(uploadPromises);
      
      onFilesUploaded(uploadedAssets);
    } catch (error) {
      console.error('Upload error:', error);
      setErrors(prev => [...prev, 'Failed to upload some files. Please try again.']);
    }
  }, [existingAssets, maxFiles, onFilesUploaded]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input value to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  const clearErrors = () => {
    setErrors([]);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        <Upload className={`mx-auto h-12 w-12 ${
          isDragOver ? 'text-blue-500' : 'text-gray-400'
        }`} />
        
        <div className="mt-4">
          <p className="text-lg font-medium text-gray-900">
            {isDragOver ? 'Drop files here' : 'Upload media files'}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Drag and drop files here, or{' '}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              browse
            </button>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Supported: Images, Audio, Video, Documents (max {maxFileSize}MB each)
          </p>
          <p className="text-xs text-gray-500">
            Maximum {maxFiles} files total
          </p>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Upload Errors</h3>
              <ul className="mt-2 text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
              <Button
                variant="outline"
                size="sm"
                onClick={clearErrors}
                className="mt-3 text-red-700 border-red-300 hover:bg-red-100"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Uploading Files</h4>
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">
                  Uploading file...
                </span>
                <div className="flex items-center space-x-2">
                  {progress.status === 'uploading' && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  )}
                  {progress.status === 'completed' && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  {progress.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm text-gray-600">
                    {progress.progress}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    progress.status === 'completed'
                      ? 'bg-green-600'
                      : progress.status === 'error'
                      ? 'bg-red-600'
                      : 'bg-blue-600'
                  }`}
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              {progress.error && (
                <p className="text-sm text-red-600 mt-2">{progress.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Existing Files */}
      {existingAssets.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">
            Uploaded Files ({existingAssets.length}/{maxFiles})
          </h4>
          <div className="space-y-2">
            {existingAssets.map(asset => (
              <div
                key={asset.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-gray-500">
                    {getFileIcon(asset.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {asset.filename}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        {asset.type}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatFileSize(asset.size || 0)}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFileRemoved(asset.id)}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Limits Info */}
      <div className="text-xs text-gray-500 bg-gray-50 rounded-md p-3">
        <p><strong>Upload Guidelines:</strong></p>
        <ul className="mt-1 space-y-1">
          <li>• Maximum file size: {maxFileSize}MB per file</li>
          <li>• Maximum files: {maxFiles} total</li>
          <li>• Supported formats: Images (JPEG, PNG, GIF, WebP), Audio (MP3, WAV, OGG), Video (MP4, WebM, OGG), Documents (PDF, DOC, DOCX, TXT)</li>
          <li>• Files are automatically optimized for web delivery</li>
        </ul>
      </div>
    </div>
  );
}