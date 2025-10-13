'use client';

import React, { Suspense, lazy } from 'react';
import { DashboardErrorBoundary } from './error/DashboardErrorBoundary';
import { 
  RichEditorSkeleton, 
  AnalyticsSkeleton, 
  LessonBuilderSkeleton, 
  BatchOperationsSkeleton,
  ContentManagementSkeleton,
  LoadingSpinner 
} from './loading/LoadingSkeletons';

// Lazy load dashboard components
const TahitianRichEditor = lazy(() => import('./TahitianRichEditor'));
const EnhancedAnalyticsDashboard = lazy(() => import('./AnalyticsDashboard'));
const VisualLessonBuilder = lazy(() => import('./VisualLessonBuilder'));
const BatchOperationsSystem = lazy(() => import('./BatchOperationsSystem'));
const AIContentDashboard = lazy(() => import('./AIContentDashboard'));

// Component mapping for skeleton loaders
const skeletonMap = {
  'TahitianRichEditor': RichEditorSkeleton,
  'EnhancedAnalyticsDashboard': AnalyticsSkeleton,
  'VisualLessonBuilder': LessonBuilderSkeleton,
  'BatchOperationsSystem': BatchOperationsSkeleton,
  'AIContentDashboard': ContentManagementSkeleton,
};

// Generic lazy wrapper with error boundary and loading states
export const LazyWrapper = ({ 
  component, 
  fallback, 
  children, 
  ...props 
}: {
  component: keyof typeof skeletonMap;
  fallback?: React.ComponentType;
  children?: React.ReactNode;
  [key: string]: any;
}) => {
  const Component = {
    'TahitianRichEditor': TahitianRichEditor,
    'EnhancedAnalyticsDashboard': EnhancedAnalyticsDashboard,
    'VisualLessonBuilder': VisualLessonBuilder,
    'BatchOperationsSystem': BatchOperationsSystem,
    'AIContentDashboard': AIContentDashboard,
  }[component];

  const SkeletonComponent = fallback || skeletonMap[component] || LoadingSpinner;

  return (
    <DashboardErrorBoundary>
      <Suspense fallback={<SkeletonComponent />}>
        <Component {...props}>
          {children}
        </Component>
      </Suspense>
    </DashboardErrorBoundary>
  );
};

// Specific lazy components with memoization
export const LazyRichEditor = React.memo((props: any) => (
  <LazyWrapper component="TahitianRichEditor" {...props} />
));

export const LazyAnalyticsDashboard = React.memo((props: any) => (
  <LazyWrapper component="EnhancedAnalyticsDashboard" {...props} />
));

export const LazyLessonBuilder = React.memo((props: any) => (
  <LazyWrapper component="VisualLessonBuilder" {...props} />
));

export const LazyBatchOperations = React.memo((props: any) => (
  <LazyWrapper component="BatchOperationsSystem" {...props} />
));

export const LazyAIContentDashboard = React.memo((props: any) => (
  <LazyWrapper component="AIContentDashboard" {...props} />
));

// Higher-order component for adding lazy loading to any component
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  SkeletonComponent?: React.ComponentType,
  displayName?: string
) => {
  const LazyComponent = lazy(() => Promise.resolve({ default: Component }));
  
  const WrappedComponent = React.memo((props: P) => (
    <DashboardErrorBoundary>
      <Suspense fallback={SkeletonComponent ? <SkeletonComponent /> : <LoadingSpinner />}>
        <LazyComponent {...props} />
      </Suspense>
    </DashboardErrorBoundary>
  ));

  WrappedComponent.displayName = displayName || `LazyLoaded(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Log performance metrics (in development)
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} load time: ${loadTime.toFixed(2)}ms`);
      }
      
      // Send to analytics in production
      if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
        // You can integrate with your analytics service here
        try {
          (window as any).gtag?.('event', 'component_load_time', {
            component_name: componentName,
            load_time: Math.round(loadTime),
          });
        } catch (error) {
          console.warn('Analytics tracking failed:', error);
        }
      }
    };
  }, [componentName]);
};

export default LazyWrapper;