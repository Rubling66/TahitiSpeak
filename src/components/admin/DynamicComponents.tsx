'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Loading components
const ComponentSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-32" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const ChartSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-40" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-64 w-full" />
    </CardContent>
  </Card>
);

// Dynamic imports for heavy components
export const DynamicAnalyticsDashboard = dynamic(
  () => import('./analytics/AnalyticsDashboard'),
  {
    loading: () => <ComponentSkeleton />,
    ssr: false
  }
);

export const DynamicEnhancedAnalyticsDashboard = dynamic(
  () => import('./analytics/EnhancedAnalyticsDashboard'),
  {
    loading: () => <ComponentSkeleton />,
    ssr: false
  }
);

export const DynamicTahitianRichEditor = dynamic(
  () => import('./editor/TahitianRichEditor'),
  {
    loading: () => <ComponentSkeleton />,
    ssr: false
  }
);

export const DynamicVisualLessonBuilder = dynamic(
  () => import('./content/VisualLessonBuilder'),
  {
    loading: () => <ComponentSkeleton />,
    ssr: false
  }
);

export const DynamicVirtualizedLessonList = dynamic(
  () => import('./content/VirtualizedLessonList'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
);

// Chart components (heavy recharts library)
export const DynamicBarChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.BarChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
);

export const DynamicLineChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.LineChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
);

export const DynamicPieChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.PieChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
);

// Wrapper component with Suspense
export const DynamicComponentWrapper = ({ 
  children, 
  fallback = <ComponentSkeleton /> 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => (
  <Suspense fallback={fallback}>
    {children}
  </Suspense>
);

export default {
  DynamicAnalyticsDashboard,
  DynamicEnhancedAnalyticsDashboard,
  DynamicTahitianRichEditor,
  DynamicVisualLessonBuilder,
  DynamicVirtualizedLessonList,
  DynamicBarChart,
  DynamicLineChart,
  DynamicPieChart,
  DynamicComponentWrapper
};