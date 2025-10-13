'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { notificationService } from '../../src/services/NotificationService';
import { errorRecoveryService } from '../../src/services/ErrorRecoveryService';
import { reportError } from '../../src/utils/errorHandler';
import { logger } from '../../src/services/LoggingService';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRecovery?: boolean;
  recoveryStrategies?: string[];
  component?: string;
  level?: 'page' | 'section' | 'component';
  showErrorDetails?: boolean;
  allowRetry?: boolean;
  maxRetries?: number;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRecovering: boolean;
  recoveryAttempted: boolean;
  errorId: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false,
      recoveryAttempted: false,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, component = 'Unknown', enableRecovery = true } = this.props;
    
    // Update state with error info
    this.setState({ errorInfo });

    // Log the error
    logger.error('Error boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      component,
      errorId: this.state.errorId
    });

    // Report error to global handler
    reportError(error, {
      component: `ErrorBoundary-${component}`,
      action: 'component_error',
      metadata: {
        componentStack: errorInfo.componentStack,
        errorBoundaryLevel: this.props.level || 'component',
        retryCount: this.state.retryCount
      }
    });

    // Call custom error handler if provided
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (handlerError) {
        logger.error('Error in custom error handler', { handlerError });
      }
    }

    // Attempt automatic recovery if enabled
    if (enableRecovery && !this.state.recoveryAttempted) {
      this.attemptRecovery(error);
    }

    // Show user notification
    this.showErrorNotification(error);
  }

  private async attemptRecovery(error: Error): Promise<void> {
    const { component = 'Unknown' } = this.props;
    
    this.setState({ isRecovering: true, recoveryAttempted: true });

    try {
      await errorRecoveryService.attemptRecovery(error, {
        component: `ErrorBoundary-${component}`,
        action: 'automatic_recovery',
        retryCount: this.state.retryCount,
        metadata: {
          errorBoundaryLevel: this.props.level || 'component'
        }
      });

      // If recovery succeeds, reset error state
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRecovering: false,
        recoveryAttempted: false
      });

      notificationService.success('Error recovered', {
        description: 'The component has been automatically restored.',
        duration: 3000
      });

    } catch (recoveryError) {
      logger.error('Automatic recovery failed', { recoveryError });
      this.setState({ isRecovering: false });
    }
  }

  private showErrorNotification(error: Error): void {
    const { level = 'component' } = this.props;
    
    const severity = this.getErrorSeverity(level);
    const title = this.getErrorTitle(level);
    const description = this.getErrorDescription(error, level);

    notificationService.error(title, {
      description,
      severity,
      duration: severity === 'critical' ? 0 : 8000, // Critical errors don't auto-dismiss
      action: {
        label: 'Retry',
        onClick: () => this.handleRetry()
      }
    });
  }

  private getErrorSeverity(level: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (level) {
      case 'page': return 'critical';
      case 'section': return 'high';
      case 'component': return 'medium';
      default: return 'medium';
    }
  }

  private getErrorTitle(level: string): string {
    switch (level) {
      case 'page': return 'Page Error';
      case 'section': return 'Section Error';
      case 'component': return 'Component Error';
      default: return 'Application Error';
    }
  }

  private getErrorDescription(error: Error, level: string): string {
    const baseMessage = level === 'page' 
      ? 'This page encountered an error and cannot be displayed.'
      : 'A component on this page encountered an error.';
    
    return `${baseMessage} ${error.message ? `Error: ${error.message}` : ''}`;
  }

  private handleRetry = (): void => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      notificationService.warning('Max retries reached', {
        description: 'Please refresh the page or contact support if the problem persists.',
        duration: 6000
      });
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      isRecovering: false,
      recoveryAttempted: false
    }));

    logger.info('Error boundary retry attempted', {
      retryCount: this.state.retryCount + 1,
      component: this.props.component
    });
  };

  private handleRefreshPage = (): void => {
    window.location.reload();
  };

  private handleGoHome = (): void => {
    window.location.href = '/';
  };

  private handleReportBug = (): void => {
    const { error, errorInfo, errorId } = this.state;
    const { component } = this.props;

    const bugReport = {
      errorId,
      component,
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    // Copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(bugReport, null, 2))
      .then(() => {
        notificationService.success('Bug report copied', {
          description: 'Error details have been copied to your clipboard.',
          duration: 3000
        });
      })
      .catch(() => {
        notificationService.error('Failed to copy bug report', {
          description: 'Please manually copy the error details from the console.',
          duration: 5000
        });
        console.error('Bug Report:', bugReport);
      });
  };

  render(): ReactNode {
    const { hasError, error, isRecovering } = this.state;
    const { children, fallback, allowRetry = true, showErrorDetails = false, level = 'component' } = this.props;

    if (!hasError) {
      return children;
    }

    // Show custom fallback if provided
    if (fallback) {
      return fallback;
    }

    // Show recovery spinner
    if (isRecovering) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Attempting to recover...</p>
          </div>
        </div>
      );
    }

    // Render error UI based on level
    return this.renderErrorUI(level, error);
  }

  private renderErrorUI(level: string, error: Error | null): ReactNode {
    const { allowRetry, showErrorDetails } = this.props;
    const { retryCount } = this.state;

    if (level === 'page') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Error</h1>
            <p className="text-gray-600 mb-6">
              This page encountered an error and cannot be displayed.
            </p>
            
            {showErrorDetails && error && (
              <div className="bg-gray-100 rounded p-4 mb-6 text-left">
                <p className="text-sm font-mono text-gray-800">{error.message}</p>
              </div>
            )}

            <div className="space-y-3">
              {allowRetry && (
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry {retryCount > 0 && `(${retryCount})`}
                </button>
              )}
              
              <button
                onClick={this.handleRefreshPage}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Page
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Home className="h-4 w-4" />
                Go Home
              </button>
              
              <button
                onClick={this.handleReportBug}
                className="w-full bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
              >
                <Bug className="h-4 w-4" />
                Report Bug
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (level === 'section') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-red-500 mt-1 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Section Error</h3>
              <p className="text-red-700 mb-4">
                This section encountered an error and cannot be displayed.
              </p>
              
              {showErrorDetails && error && (
                <div className="bg-red-100 rounded p-3 mb-4">
                  <p className="text-sm font-mono text-red-800">{error.message}</p>
                </div>
              )}

              <div className="flex gap-2">
                {allowRetry && (
                  <button
                    onClick={this.handleRetry}
                    className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retry {retryCount > 0 && `(${retryCount})`}
                  </button>
                )}
                
                <button
                  onClick={this.handleReportBug}
                  className="bg-orange-600 text-white px-4 py-2 rounded text-sm hover:bg-orange-700 transition-colors flex items-center gap-2"
                >
                  <Bug className="h-4 w-4" />
                  Report
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Component level error
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 m-2">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
          <div className="flex-1">
            <p className="text-yellow-800 text-sm">
              Component error occurred.
            </p>
            
            {showErrorDetails && error && (
              <p className="text-xs font-mono text-yellow-700 mt-1">{error.message}</p>
            )}
          </div>
          
          {allowRetry && (
            <button
              onClick={this.handleRetry}
              className="bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700 transition-colors flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  componentWillUnmount(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }
}

// Higher-order component for easy error boundary wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Specialized error boundaries for different use cases
export const PageErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'level'>> = (props) => (
  <ErrorBoundary {...props} level="page" enableRecovery={true} maxRetries={2} />
);

export const SectionErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'level'>> = (props) => (
  <ErrorBoundary {...props} level="section" enableRecovery={true} maxRetries={3} />
);

export const ComponentErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'level'>> = (props) => (
  <ErrorBoundary {...props} level="component" enableRecovery={true} maxRetries={5} />
);