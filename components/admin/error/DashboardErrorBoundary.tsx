'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, Bug, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  locale?: 'en' | 'fr' | 'ty';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

// Error messages in multiple languages
const errorMessages = {
  en: {
    title: 'Something went wrong',
    description: 'An unexpected error occurred while loading this component.',
    details: 'Error Details',
    retry: 'Try Again',
    home: 'Go to Dashboard',
    report: 'Report Issue',
    offline: 'You appear to be offline. Please check your connection.',
    networkError: 'Network error occurred. Please try again.',
    permissionError: 'You don\'t have permission to access this resource.',
    notFound: 'The requested resource was not found.',
    serverError: 'Server error occurred. Please try again later.',
    genericError: 'An unexpected error occurred. Please try again.'
  },
  fr: {
    title: 'Une erreur s\'est produite',
    description: 'Une erreur inattendue s\'est produite lors du chargement de ce composant.',
    details: 'Détails de l\'erreur',
    retry: 'Réessayer',
    home: 'Aller au tableau de bord',
    report: 'Signaler un problème',
    offline: 'Vous semblez être hors ligne. Veuillez vérifier votre connexion.',
    networkError: 'Erreur réseau. Veuillez réessayer.',
    permissionError: 'Vous n\'avez pas la permission d\'accéder à cette ressource.',
    notFound: 'La ressource demandée n\'a pas été trouvée.',
    serverError: 'Erreur serveur. Veuillez réessayer plus tard.',
    genericError: 'Une erreur inattendue s\'est produite. Veuillez réessayer.'
  },
  ty: {
    title: 'Ua rahi te hape',
    description: 'Ua rahi te hape i te taime nei i te hopoi\'anga i teie mea.',
    details: 'Te mau mea o te hape',
    retry: 'Hopoi hou',
    home: 'Haere i te papa haamaitai',
    report: 'Haapii i te hape',
    offline: 'E ore roa oe i te ravea internet. Amui i to ravea.',
    networkError: 'Hape ravea. Hopoi hou.',
    permissionError: 'Aore to \'oe e nehenehe ai e \'ite i teie mea.',
    notFound: 'Aore i \'ite\'hia te mea i ninauhia.',
    serverError: 'Hape no te server. Hopoi hou i muri ae.',
    genericError: 'Ua rahi te hape. Hopoi hou.'
  }
};

// Error logging service
class ErrorLogger {
  static async logError(error: Error, errorInfo: ErrorInfo, errorId: string) {
    try {
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

      if (process.env.NODE_ENV === 'development') {
        console.group(`🚨 Error Boundary Caught Error [${errorId}]`);
        console.error('Error:', error);
        console.error('Error Info:', errorInfo);
        console.error('Error Data:', errorData);
        console.groupEnd();
      }

      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorData)
        }).catch(() => {
          const storedErrors = JSON.parse(localStorage.getItem('pendingErrors') || '[]');
          storedErrors.push(errorData);
          localStorage.setItem('pendingErrors', JSON.stringify(storedErrors.slice(-10)));
        });
      }
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  }
}

export class DashboardErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { errorId } = this.state;
    
    this.setState({ errorInfo });

    if (errorId) {
      ErrorLogger.logError(error, errorInfo, errorId);
    }

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    toast.error('An error occurred. Please try refreshing the page.');
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/admin/dashboard';
  };

  handleReportIssue = () => {
    const { error, errorId } = this.state;
    const subject = encodeURIComponent(`Error Report - ${errorId}`);
    const body = encodeURIComponent(`
Error ID: ${errorId}
Error Message: ${error?.message || 'Unknown error'}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:
[Your description here]
    `);
    
    window.open(`mailto:support@tahitispeak.com?subject=${subject}&body=${body}`);
  };

  getErrorType(error: Error): keyof typeof errorMessages['en'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'networkError';
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'permissionError';
    }
    if (message.includes('not found') || message.includes('404')) {
      return 'notFound';
    }
    if (message.includes('server') || message.includes('500')) {
      return 'serverError';
    }
    if (!navigator.onLine) {
      return 'offline';
    }
    
    return 'genericError';
  }

  render() {
    if (this.state.hasError) {
      const locale = this.props.locale || 'en';
      const messages = errorMessages[locale];
      const { error, errorInfo, errorId } = this.state;
      
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorType = error ? this.getErrorType(error) : 'genericError';
      const errorMessage = messages[errorType];

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl text-red-700">
                {messages.title}
              </CardTitle>
              <CardDescription className="text-base">
                {errorMessage}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-3 justify-center">
                <Button onClick={this.handleRetry} className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  {messages.retry}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={this.handleGoHome}
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  {messages.home}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={this.handleReportIssue}
                  className="flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  {messages.report}
                </Button>
              </div>

              {(this.props.showDetails || process.env.NODE_ENV === 'development') && error && (
                <Alert className="text-left">
                  <Bug className="h-4 w-4" />
                  <AlertDescription>
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium mb-2">
                        {messages.details} (ID: {errorId})
                      </summary>
                      <div className="space-y-2 text-sm font-mono bg-gray-50 p-3 rounded">
                        <div>
                          <strong>Message:</strong> {error.message}
                        </div>
                        {error.stack && (
                          <div>
                            <strong>Stack:</strong>
                            <pre className="whitespace-pre-wrap text-xs mt-1">
                              {error.stack}
                            </pre>
                          </div>
                        )}
                        {errorInfo?.componentStack && (
                          <div>
                            <strong>Component Stack:</strong>
                            <pre className="whitespace-pre-wrap text-xs mt-1">
                              {errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  </AlertDescription>
                </Alert>
              )}

              {!navigator.onLine && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    {messages.offline}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <DashboardErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </DashboardErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default DashboardErrorBoundary;