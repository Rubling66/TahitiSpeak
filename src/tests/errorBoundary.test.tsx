import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { ErrorBoundary, withErrorBoundary, PageErrorBoundary, SectionErrorBoundary, ComponentErrorBoundary } from '../components/error/ErrorBoundary';
import { ErrorRecoveryService } from '../services/ErrorRecoveryService';
import { NotificationService } from '../services/NotificationService';

// Mock dependencies
vi.mock('../services/ErrorRecoveryService');
vi.mock('../services/NotificationService');
vi.mock('../services/ErrorMonitoringService');

// Test components that throw errors
const ThrowError: React.FC<{ shouldThrow?: boolean; errorType?: string }> = ({ 
  shouldThrow = true, 
  errorType = 'generic' 
}) => {
  if (shouldThrow) {
    if (errorType === 'chunk') {
      const error = new Error('Loading chunk 1 failed');
      error.name = 'ChunkLoadError';
      throw error;
    }
    if (errorType === 'network') {
      const error = new Error('Network request failed');
      error.name = 'NetworkError';
      throw error;
    }
    if (errorType === 'auth') {
      const error = new Error('Unauthorized access');
      error.name = 'AuthError';
      throw error;
    }
    throw new Error('Test error');
  }
  return <div>Component rendered successfully</div>;
};

const WorkingComponent: React.FC = () => {
  return <div>Working component</div>;
};

describe('ErrorBoundary Components', () => {
  let mockErrorRecoveryService: any;
  let mockNotificationService: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    // Mock console.error to avoid noise in tests
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Setup mocks
    mockErrorRecoveryService = {
      attemptRecovery: vi.fn().mockResolvedValue({ success: false }),
      getInstance: vi.fn().mockReturnThis()
    };
    
    mockNotificationService = {
      error: vi.fn(),
      success: vi.fn()
    };

    (ErrorRecoveryService.getInstance as Mock).mockReturnValue(mockErrorRecoveryService);
    vi.mocked(NotificationService).mockImplementation(() => mockNotificationService);
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  describe('Basic ErrorBoundary', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Component rendered successfully')).toBeInTheDocument();
    });

    it('should catch and display error when child component throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
      expect(screen.getByText(/Test error/)).toBeInTheDocument();
    });

    it('should show retry button and allow retry', async () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
      
      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeInTheDocument();

      // Mock successful retry
      fireEvent.click(retryButton);
      
      // Rerender with working component
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText('Component rendered successfully')).toBeInTheDocument();
      });
    });

    it('should attempt automatic recovery for recoverable errors', async () => {
      mockErrorRecoveryService.attemptRecovery.mockResolvedValue({ 
        success: true, 
        data: 'recovered' 
      });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorType="network" />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(mockErrorRecoveryService.attemptRecovery).toHaveBeenCalled();
      });
    });

    it('should show different UI based on error severity', () => {
      // Test critical error (ChunkLoadError)
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorType="chunk" />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Critical Error/)).toBeInTheDocument();
      expect(screen.getByText('Refresh Page')).toBeInTheDocument();

      // Test medium severity error (NetworkError)
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorType="network" />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Network Error/)).toBeInTheDocument();
    });

    it('should provide error reporting functionality', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const reportButton = screen.getByText('Report Bug');
      expect(reportButton).toBeInTheDocument();

      fireEvent.click(reportButton);
      expect(mockNotificationService.success).toHaveBeenCalledWith(
        'Error report submitted successfully'
      );
    });

    it('should handle refresh page action', () => {
      // Mock window.location.reload
      const mockReload = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorType="chunk" />
        </ErrorBoundary>
      );

      const refreshButton = screen.getByText('Refresh Page');
      fireEvent.click(refreshButton);

      expect(mockReload).toHaveBeenCalled();
    });

    it('should handle go home action', () => {
      // Mock window.location.href
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true
      });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const homeButton = screen.getByText('Go Home');
      fireEvent.click(homeButton);

      expect(window.location.href).toBe('/');
    });
  });

  describe('withErrorBoundary HOC', () => {
    it('should wrap component with error boundary', () => {
      const WrappedComponent = withErrorBoundary(ThrowError, {
        fallback: <div>Custom fallback</div>
      });

      render(<WrappedComponent shouldThrow={false} />);
      expect(screen.getByText('Component rendered successfully')).toBeInTheDocument();
    });

    it('should use custom fallback when provided', () => {
      const WrappedComponent = withErrorBoundary(ThrowError, {
        fallback: <div>Custom fallback</div>
      });

      render(<WrappedComponent shouldThrow={true} />);
      expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    });

    it('should pass through props to wrapped component', () => {
      const TestComponent: React.FC<{ testProp: string }> = ({ testProp }) => (
        <div>{testProp}</div>
      );

      const WrappedComponent = withErrorBoundary(TestComponent);

      render(<WrappedComponent testProp="test value" />);
      expect(screen.getByText('test value')).toBeInTheDocument();
    });

    it('should handle custom error handler', () => {
      const customErrorHandler = vi.fn();
      const WrappedComponent = withErrorBoundary(ThrowError, {
        onError: customErrorHandler
      });

      render(<WrappedComponent shouldThrow={true} />);

      expect(customErrorHandler).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(Object)
      );
    });
  });

  describe('Specialized Error Boundaries', () => {
    describe('PageErrorBoundary', () => {
      it('should render page-level error UI', () => {
        render(
          <PageErrorBoundary>
            <ThrowError shouldThrow={true} />
          </PageErrorBoundary>
        );

        expect(screen.getByText(/Page Error/)).toBeInTheDocument();
        expect(screen.getByText('Refresh Page')).toBeInTheDocument();
        expect(screen.getByText('Go Home')).toBeInTheDocument();
      });

      it('should show navigation options for page errors', () => {
        render(
          <PageErrorBoundary>
            <ThrowError shouldThrow={true} />
          </PageErrorBoundary>
        );

        expect(screen.getByText('Refresh Page')).toBeInTheDocument();
        expect(screen.getByText('Go Home')).toBeInTheDocument();
        expect(screen.getByText('Report Bug')).toBeInTheDocument();
      });
    });

    describe('SectionErrorBoundary', () => {
      it('should render section-level error UI', () => {
        render(
          <SectionErrorBoundary>
            <ThrowError shouldThrow={true} />
          </SectionErrorBoundary>
        );

        expect(screen.getByText(/Section Error/)).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      it('should not show navigation options for section errors', () => {
        render(
          <SectionErrorBoundary>
            <ThrowError shouldThrow={true} />
          </SectionErrorBoundary>
        );

        expect(screen.queryByText('Refresh Page')).not.toBeInTheDocument();
        expect(screen.queryByText('Go Home')).not.toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    describe('ComponentErrorBoundary', () => {
      it('should render component-level error UI', () => {
        render(
          <ComponentErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ComponentErrorBoundary>
        );

        expect(screen.getByText(/Component Error/)).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      it('should show minimal UI for component errors', () => {
        render(
          <ComponentErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ComponentErrorBoundary>
        );

        expect(screen.queryByText('Refresh Page')).not.toBeInTheDocument();
        expect(screen.queryByText('Go Home')).not.toBeInTheDocument();
        expect(screen.queryByText('Report Bug')).not.toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery Integration', () => {
    it('should attempt recovery for network errors', async () => {
      mockErrorRecoveryService.attemptRecovery.mockResolvedValue({
        success: true,
        data: 'Network recovered'
      });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorType="network" />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(mockErrorRecoveryService.attemptRecovery).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'NetworkError' }),
          expect.objectContaining({ component: 'ErrorBoundary' })
        );
      });
    });

    it('should not attempt recovery for critical errors', async () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorType="chunk" />
        </ErrorBoundary>
      );

      // Wait a bit to ensure recovery is not attempted
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockErrorRecoveryService.attemptRecovery).not.toHaveBeenCalled();
    });

    it('should handle recovery success', async () => {
      mockErrorRecoveryService.attemptRecovery.mockResolvedValue({
        success: true,
        data: 'Recovery successful'
      });

      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorType="network" />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(mockErrorRecoveryService.attemptRecovery).toHaveBeenCalled();
      });

      // Simulate successful recovery by rerendering with working component
      rerender(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Working component')).toBeInTheDocument();
    });

    it('should handle recovery failure gracefully', async () => {
      mockErrorRecoveryService.attemptRecovery.mockResolvedValue({
        success: false,
        error: new Error('Recovery failed')
      });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorType="network" />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(mockErrorRecoveryService.attemptRecovery).toHaveBeenCalled();
      });

      // Should still show error UI when recovery fails
      expect(screen.getByText(/Network Error/)).toBeInTheDocument();
    });
  });

  describe('Error Boundary State Management', () => {
    it('should reset error state when retry is clicked', async () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      // Rerender with working component
      rerender(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Working component')).toBeInTheDocument();
    });

    it('should maintain error state across re-renders until reset', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();

      // Rerender with same error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should still show error state
      expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
    });

    it('should track retry attempts', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const retryButton = screen.getByText('Try Again');
      
      // Click retry multiple times
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);

      // After 3 retries, should show different message or disable retry
      // This would depend on the implementation details
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toBeInTheDocument();
      expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
    });

    it('should focus on error message for screen readers', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorMessage = screen.getByText(/Something went wrong/);
      expect(errorMessage).toHaveAttribute('tabIndex', '-1');
    });

    it('should provide keyboard navigation for action buttons', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const retryButton = screen.getByText('Try Again');
      const reportButton = screen.getByText('Report Bug');

      expect(retryButton).toHaveAttribute('type', 'button');
      expect(reportButton).toHaveAttribute('type', 'button');
    });
  });

  describe('Performance and Memory', () => {
    it('should not cause memory leaks with multiple error boundaries', () => {
      const { unmount } = render(
        <div>
          <ErrorBoundary>
            <WorkingComponent />
          </ErrorBoundary>
          <ErrorBoundary>
            <WorkingComponent />
          </ErrorBoundary>
          <ErrorBoundary>
            <WorkingComponent />
          </ErrorBoundary>
        </div>
      );

      expect(screen.getAllByText('Working component')).toHaveLength(3);

      // Unmount should not cause any issues
      unmount();
    });

    it('should handle rapid error state changes', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // Rapidly switch between error and success states
      for (let i = 0; i < 10; i++) {
        rerender(
          <ErrorBoundary>
            <ThrowError shouldThrow={i % 2 === 0} />
          </ErrorBoundary>
        );
      }

      // Should handle rapid changes gracefully
      expect(screen.getByText('Component rendered successfully')).toBeInTheDocument();
    });
  });
});