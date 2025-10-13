'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Custom Skeleton component since it might not exist in the UI library
const Skeleton = ({ 
  className = "", 
  style = {} 
}: { 
  className?: string; 
  style?: React.CSSProperties; 
}) => (
  <div 
    className={`animate-pulse bg-gray-200 rounded ${className}`} 
    style={style}
  />
);

// Generic skeleton component
export const SkeletonBox = ({ 
  width = "100%", 
  height = "20px", 
  className = "" 
}: { 
  width?: string; 
  height?: string; 
  className?: string; 
}) => (
  <Skeleton 
    className={`${className}`} 
    style={{ width, height }} 
  />
);

// Dashboard card skeleton
export const DashboardCardSkeleton = () => (
  <Card className="animate-pulse">
    <CardHeader className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </CardHeader>
    <CardContent className="space-y-3">
      <Skeleton className="h-8 w-full" />
      <div className="flex space-x-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </CardContent>
  </Card>
);

// Rich Editor skeleton
export const RichEditorSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {/* Toolbar skeleton */}
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-8" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>

    {/* Settings panel skeleton */}
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Analytics dashboard skeleton
export const AnalyticsSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {/* Header with filters */}
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-48" />
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>

    {/* Metrics cards */}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Charts */}
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>

    {/* Table */}
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex space-x-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Lesson Builder skeleton
export const LessonBuilderSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {/* Header */}
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-56" />
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>

    {/* Lesson info */}
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-20 w-full" />
        </div>
      </CardContent>
    </Card>

    {/* Lesson components */}
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 border rounded">
              <Skeleton className="h-8 w-8" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-6" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  </div>
);

// Batch Operations skeleton
export const BatchOperationsSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {/* Header */}
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-8 w-32" />
    </div>

    {/* Operation cards */}
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-8 w-full mt-4" />
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Progress section */}
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

// Content Management skeleton
export const ContentManagementSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {/* Tabs */}
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-24" />
      ))}
    </div>

    {/* Search and filters */}
    <Card>
      <CardContent className="p-6">
        <div className="flex gap-4">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
      </CardContent>
    </Card>

    {/* Content grid */}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-20" />
                <div className="flex space-x-1">
                  <Skeleton className="h-6 w-6" />
                  <Skeleton className="h-6 w-6" />
                  <Skeleton className="h-6 w-6" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

// Generic loading spinner
export const LoadingSpinner = ({ 
  size = "md", 
  text = "Loading..." 
}: { 
  size?: "sm" | "md" | "lg"; 
  text?: string; 
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`} />
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  );
};

// Error fallback component
export const ErrorFallback = ({ 
  error, 
  resetError 
}: { 
  error?: Error; 
  resetError?: () => void; 
}) => (
  <div className="flex flex-col items-center justify-center p-8 space-y-4">
    <div className="text-red-500 text-4xl">⚠️</div>
    <h3 className="text-lg font-semibold text-gray-900">Something went wrong</h3>
    <p className="text-sm text-gray-600 text-center max-w-md">
      {error?.message || "An unexpected error occurred while loading this component."}
    </p>
    {resetError && (
      <button
        onClick={resetError}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Try again
      </button>
    )}
  </div>
);

export default {
  SkeletonBox,
  DashboardCardSkeleton,
  RichEditorSkeleton,
  AnalyticsSkeleton,
  LessonBuilderSkeleton,
  BatchOperationsSkeleton,
  ContentManagementSkeleton,
  LoadingSpinner,
  ErrorFallback
};