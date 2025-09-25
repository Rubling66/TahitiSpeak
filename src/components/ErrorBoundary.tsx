'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { performanceMonitoring } from '@/services/PerformanceMonitoringService';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component' } = this.props;
    
    // Log error to performance monitoring
    performanceMonitoring.logError({
      message: error.message,
      stack: error.stack,
      level: level === 'critical' ? 'error' : 'warn',
      metadata: {
        componentStack: errorInfo.componentStack,
        errorBoundaryLevel: level,
        retryCount: this.retryCount,
        errorId: this.state.errorId,
      },
    });

    // Update state with error info
    this.setState({ errorInfo });

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }

    // Report to external error tracking service
    this.reportError(error, errorInfo);
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // In a real application, send to error tracking service
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Error ID:', this.state.errorId);
      console.groupEnd();
    }
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      
      performanceMonitoring.recordMetric({
        name: 'error_boundary_retry',
        value: this.retryCount,
        unit: 'count',
        category: 'custom',
        metadata: {
          errorId: this.state.errorId,
          level: this.props.level,
        },
      });

      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
      });
    }
  };

  private handleReload = () => {
    performanceMonitoring.recordMetric({
      name: 'error_boundary_reload',
      value: 1,
      unit: 'count',
      category: 'custom',
      metadata: {
        errorId: this.state.errorId,
        level: this.props.level,
      },
    });

    window.location.reload();
  };

  private handleGoHome = () => {
    performanceMonitoring.recordMetric({
      name: 'error_boundary_home',
      value: 1,
      unit: 'count',
      category: 'custom',
      metadata: {
        errorId: this.state.errorId,
        level: this.props.level,
      },
    });

    window.location.href = '/';
  };

  private renderErrorDetails() {
    const { error, errorInfo, errorId } = this.state;
    
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }

    return (
      <details className="mt-4 p-4 bg-gray-50 rounded-lg border">
        <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
          <Bug className="inline w-4 h-4 mr-2" />
          Technical Details (Development Mode)
        </summary>
        
        <div className="mt-3 space-y-3 text-sm">
          <div>
            <strong className="text-gray-700">Error ID:</strong>
            <code className="ml-2 px-2 py-1 bg-gray-200 rounded text-xs">
              {errorId}
            </code>
          </div>
          
          <div>
            <strong className="text-gray-700">Error Message:</strong>
            <pre className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-red-800 overflow-x-auto">
              {error?.message}
            </pre>
          </div>
          
          {error?.stack && (
            <div>
              <strong className="text-gray-700">Stack Trace:</strong>
              <pre className="mt-1 p-2 bg-gray-100 border rounded text-xs overflow-x-auto max-h-40">
                {error.stack}
              </pre>
            </div>
          )}
          
          {errorInfo?.componentStack && (
            <div>
              <strong className="text-gray-700">Component Stack:</strong>
              <pre className="mt-1 p-2 bg-blue-50 border border-blue-200 rounded text-xs overflow-x-auto max-h-40">
                {errorInfo.componentStack}
              </pre>
            </div>
          )}
        </div>
      </details>
    );
  }

  private renderErrorUI() {
    const { level = 'component' } = this.props;
    const canRetry = this.retryCount < this.maxRetries;
    
    const errorMessages = {
      critical: {
        title: 'Critical System Error',
        description: 'A critical error has occurred that prevents the application from functioning properly.',
        icon: <AlertTriangle className="w-12 h-12 text-red-500" />,
      },
      page: {
        title: 'Page Error',
        description: 'This page encountered an error and could not be displayed properly.',
        icon: <AlertTriangle className="w-10 h-10 text-orange-500" />,
      },
      component: {
        title: 'Component Error',
        description: 'A component on this page encountered an error.',
        icon: <AlertTriangle className="w-8 h-8 text-yellow-500" />,
      },
    };

    const config = errorMessages[level];
    
    return (
      <div className={`
        flex flex-col items-center justify-center p-8 text-center
        ${level === 'critical' ? 'min-h-screen bg-red-50' : ''}
        ${level === 'page' ? 'min-h-96 bg-orange-50 rounded-lg border border-orange-200' : ''}
        ${level === 'component' ? 'min-h-32 bg-yellow-50 rounded border border-yellow-200' : ''}
      `}>
        {config.icon}
        
        <h2 className={`
          mt-4 font-bold
          ${level === 'critical' ? 'text-2xl text-red-800' : ''}
          ${level === 'page' ? 'text-xl text-orange-800' : ''}
          ${level === 'component' ? 'text-lg text-yellow-800' : ''}
        `}>
          {config.title}
        </h2>
        
        <p className={`
          mt-2 max-w-md
          ${level === 'critical' ? 'text-red-600' : ''}
          ${level === 'page' ? 'text-orange-600' : ''}
          ${level === 'component' ? 'text-yellow-600' : ''}
        `}>
          {config.description}
        </p>

        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          {canRetry && (
            <button
              onClick={this.handleRetry}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again ({this.maxRetries - this.retryCount} left)
            </button>
          )}
          
          {level !== 'component' && (
            <button
              onClick={this.handleReload}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Page
            </button>
          )}
          
          {level === 'critical' && (
            <button
              onClick={this.handleGoHome}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </button>
          )}
        </div>

        {this.renderErrorDetails()}
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return this.renderErrorUI();
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for manual error reporting
export function useErrorHandler() {
  return (error: Error, errorInfo?: any) => {
    performanceMonitoring.logError({
      message: error.message,
      stack: error.stack,
      level: 'error',
      metadata: {
        source: 'manual',
        errorInfo,
      },
    });
  };
}