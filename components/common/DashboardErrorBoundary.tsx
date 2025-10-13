'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import TahitianErrorMessage from './TahitianErrorMessage';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

// Error logging service
const logErrorToService = async (error: Error, errorInfo: ErrorInfo, errorId: string) => {
  try {
    // In a real application, this would send to an error tracking service
    // like Sentry, LogRocket, or a custom analytics endpoint
    const errorData = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('userId') || 'anonymous'
    };

    console.error('Error logged:', errorData);
    
    // Example: Send to analytics service
    // await fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorData)
    // });
    
    // Example: Send to Sentry
    // Sentry.captureException(error, {
    //   contexts: { errorInfo },
    //   tags: { errorId }
    // });
    
  } catch (loggingError) {
    console.error('Failed to log error:', loggingError);
  }
};

class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log error details
    console.error('Dashboard Error Boundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Log to external service
    logErrorToService(error, errorInfo, errorId);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    // Reset error state to retry rendering
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined
    });
  };

  handleGoHome = () => {
    // Navigate to home page
    window.location.href = '/';
  };

  handleContactSupport = () => {
    // Open support contact with error details
    const errorDetails = this.state.errorId 
      ? `Error ID: ${this.state.errorId}\nError: ${this.state.error?.message}`
      : 'Unknown error occurred';
    
    const subject = encodeURIComponent('Dashboard Error Report');
    const body = encodeURIComponent(`
Hello Support Team,

I encountered an error while using the Tahitian Learning Dashboard.

${errorDetails}

Please help me resolve this issue.

Thank you!
    `);
    
    window.open(`mailto:support@tahitianlearning.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI with TahitianErrorMessage
      return (
        <TahitianErrorMessage
          error={this.state.error}
          errorCode="dashboard_error"
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
          onContactSupport={this.handleContactSupport}
          showDetails={process.env.NODE_ENV === 'development'}
        />
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <DashboardErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </DashboardErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook for error reporting in functional components
export const useErrorReporting = () => {
  const reportError = React.useCallback((error: Error, context?: string) => {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const errorInfo: ErrorInfo = {
      componentStack: context || 'Unknown component'
    };
    
    logErrorToService(error, errorInfo, errorId);
    
    return errorId;
  }, []);

  return { reportError };
};

export default DashboardErrorBoundary;