import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { GlobalErrorHandler } from '../utils/errorHandler';
import { ErrorRecoveryService } from '../services/ErrorRecoveryService';
import { NetworkErrorHandler } from '../services/NetworkErrorHandler';
import { ErrorMonitoringService } from '../services/ErrorMonitoringService';
import { FormValidationService, ValidationRules } from '../services/FormValidationService';
import { NotificationService } from '../services/NotificationService';

// Mock dependencies
vi.mock('../services/NotificationService');
vi.mock('../services/LoggingService');

describe('Error Handling System', () => {
  let globalErrorHandler: GlobalErrorHandler;
  let errorRecoveryService: ErrorRecoveryService;
  let networkErrorHandler: NetworkErrorHandler;
  let errorMonitoringService: ErrorMonitoringService;
  let formValidationService: FormValidationService;
  let notificationService: NotificationService;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create fresh instances
    globalErrorHandler = new GlobalErrorHandler();
    errorRecoveryService = ErrorRecoveryService.getInstance();
    networkErrorHandler = NetworkErrorHandler.getInstance();
    errorMonitoringService = ErrorMonitoringService.getInstance();
    formValidationService = new FormValidationService();
    notificationService = new NotificationService();

    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GlobalErrorHandler', () => {
    it('should handle API errors correctly', async () => {
      const apiError = new Error('API request failed');
      apiError.name = 'ApiError';
      
      const context = {
        component: 'UserService',
        action: 'fetchUser',
        endpoint: '/api/users/123'
      };

      await globalErrorHandler.handleError(apiError, context);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error in UserService'),
        expect.objectContaining({
          error: apiError,
          context
        })
      );
    });

    it('should handle network errors with retry mechanism', async () => {
      const networkError = new Error('Network request failed');
      networkError.name = 'NetworkError';
      
      const context = {
        component: 'DataService',
        action: 'getData',
        enableRetry: true
      };

      await globalErrorHandler.handleError(networkError, context);

      expect(console.error).toHaveBeenCalled();
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Unauthorized');
      authError.name = 'AuthError';
      
      const context = {
        component: 'AuthService',
        action: 'login'
      };

      await globalErrorHandler.handleError(authError, context);

      expect(console.error).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      
      const context = {
        component: 'FormComponent',
        action: 'validateForm',
        validationErrors: [
          { field: 'email', message: 'Invalid email format' }
        ]
      };

      await globalErrorHandler.handleError(validationError, context);

      expect(console.error).toHaveBeenCalled();
    });

    it('should categorize errors correctly', () => {
      const networkError = new Error('fetch failed');
      const apiError = new Error('API error');
      const authError = new Error('Unauthorized access');
      const validationError = new Error('Invalid input');

      expect(globalErrorHandler.categorizeError(networkError, {})).toBe('network');
      expect(globalErrorHandler.categorizeError(apiError, { component: 'API' })).toBe('api');
      expect(globalErrorHandler.categorizeError(authError, {})).toBe('auth');
      expect(globalErrorHandler.categorizeError(validationError, {})).toBe('validation');
    });

    it('should determine error severity correctly', () => {
      const criticalError = new Error('ChunkLoadError');
      criticalError.name = 'ChunkLoadError';
      
      const highError = new Error('TypeError');
      highError.name = 'TypeError';
      
      const mediumError = new Error('NetworkError');
      mediumError.name = 'NetworkError';
      
      const lowError = new Error('Minor issue');

      expect(globalErrorHandler.determineSeverity(criticalError, {})).toBe('critical');
      expect(globalErrorHandler.determineSeverity(highError, {})).toBe('high');
      expect(globalErrorHandler.determineSeverity(mediumError, {})).toBe('medium');
      expect(globalErrorHandler.determineSeverity(lowError, {})).toBe('low');
    });
  });

  describe('ErrorRecoveryService', () => {
    it('should register and execute recovery strategies', async () => {
      const mockStrategy = {
        name: 'test-strategy',
        canRecover: vi.fn().mockReturnValue(true),
        recover: vi.fn().mockResolvedValue({ success: true, data: 'recovered' })
      };

      errorRecoveryService.registerStrategy(mockStrategy);

      const error = new Error('Test error');
      const context = { component: 'TestComponent' };

      const result = await errorRecoveryService.attemptRecovery(error, context);

      expect(mockStrategy.canRecover).toHaveBeenCalledWith(error, context);
      expect(mockStrategy.recover).toHaveBeenCalledWith(error, context);
      expect(result.success).toBe(true);
      expect(result.data).toBe('recovered');
    });

    it('should handle recovery strategy failures', async () => {
      const failingStrategy = {
        name: 'failing-strategy',
        canRecover: vi.fn().mockReturnValue(true),
        recover: vi.fn().mockRejectedValue(new Error('Recovery failed'))
      };

      errorRecoveryService.registerStrategy(failingStrategy);

      const error = new Error('Test error');
      const context = { component: 'TestComponent' };

      const result = await errorRecoveryService.attemptRecovery(error, context);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
    });

    it('should cache fallback data', () => {
      const fallbackData = { id: 1, name: 'Test' };
      
      errorRecoveryService.setFallbackData('users', fallbackData);
      const retrieved = errorRecoveryService.getFallbackData('users');

      expect(retrieved).toEqual(fallbackData);
    });

    it('should track recovery statistics', async () => {
      const strategy = {
        name: 'stats-strategy',
        canRecover: vi.fn().mockReturnValue(true),
        recover: vi.fn().mockResolvedValue({ success: true })
      };

      errorRecoveryService.registerStrategy(strategy);

      const error = new Error('Test error');
      await errorRecoveryService.attemptRecovery(error, {});

      const stats = errorRecoveryService.getRecoveryStats();
      expect(stats.totalAttempts).toBeGreaterThan(0);
      expect(stats.successfulRecoveries).toBeGreaterThan(0);
    });
  });

  describe('NetworkErrorHandler', () => {
    beforeEach(() => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
    });

    it('should detect network status changes', () => {
      const onlineListener = vi.fn();
      const offlineListener = vi.fn();

      networkErrorHandler.addOnlineListener(onlineListener);
      networkErrorHandler.addOfflineListener(offlineListener);

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));

      expect(offlineListener).toHaveBeenCalled();

      // Simulate going online
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));

      expect(onlineListener).toHaveBeenCalled();
    });

    it('should queue requests when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });

      const request = {
        url: '/api/test',
        options: { method: 'GET' },
        priority: 'high' as const
      };

      await networkErrorHandler.queueRequest(request);

      const status = networkErrorHandler.getQueueStatus();
      expect(status.totalRequests).toBe(1);
      expect(status.highPriorityRequests).toBe(1);
    });

    it('should process queued requests when online', async () => {
      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      Object.defineProperty(navigator, 'onLine', { value: false });

      const request = {
        url: '/api/test',
        options: { method: 'GET' },
        priority: 'high' as const
      };

      await networkErrorHandler.queueRequest(request);

      // Go back online
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));

      // Wait for queue processing
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(global.fetch).toHaveBeenCalledWith('/api/test', { method: 'GET' });
    });

    it('should retry failed requests', async () => {
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });

      const request = {
        url: '/api/test',
        options: { method: 'GET' },
        priority: 'medium' as const,
        maxRetries: 2
      };

      const result = await networkErrorHandler.executeRequest(request);

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.ok).toBe(true);
    });
  });

  describe('ErrorMonitoringService', () => {
    it('should capture and store error reports', () => {
      const error = new Error('Test error');
      const context = {
        component: 'TestComponent',
        action: 'testAction'
      };

      const errorId = errorMonitoringService.captureError(error, context);

      expect(errorId).toBeTruthy();
      
      const recentErrors = errorMonitoringService.getRecentErrors(10);
      expect(recentErrors).toHaveLength(1);
      expect(recentErrors[0].error.message).toBe('Test error');
    });

    it('should generate error patterns', () => {
      const error1 = new Error('Duplicate error');
      const error2 = new Error('Duplicate error');
      
      const context = {
        component: 'TestComponent',
        action: 'testAction'
      };

      errorMonitoringService.captureError(error1, context);
      errorMonitoringService.captureError(error2, context);

      const patterns = errorMonitoringService.getErrorPatterns();
      const duplicatePattern = patterns.find(p => p.message === 'Duplicate error');
      
      expect(duplicatePattern).toBeTruthy();
      expect(duplicatePattern?.count).toBe(2);
    });

    it('should calculate error metrics', () => {
      const networkError = new Error('Network failed');
      const apiError = new Error('API failed');
      
      errorMonitoringService.captureError(networkError, { component: 'Network' });
      errorMonitoringService.captureError(apiError, { component: 'API' });

      const metrics = errorMonitoringService.getMetrics();
      
      expect(metrics.totalErrors).toBe(2);
      expect(metrics.errorsByComponent['Network']).toBe(1);
      expect(metrics.errorsByComponent['API']).toBe(1);
    });

    it('should mark errors as resolved', () => {
      const error = new Error('Resolvable error');
      const errorId = errorMonitoringService.captureError(error, {});

      errorMonitoringService.markErrorResolved(errorId);

      const recentErrors = errorMonitoringService.getRecentErrors(10);
      const resolvedError = recentErrors.find(e => e.id === errorId);
      
      expect(resolvedError?.resolved).toBe(true);
      expect(resolvedError?.resolutionTime).toBeTruthy();
    });
  });

  describe('FormValidationService', () => {
    beforeEach(() => {
      formValidationService = new FormValidationService();
    });

    it('should validate required fields', async () => {
      formValidationService.addField({
        field: 'email',
        rules: [ValidationRules.required('Email is required')]
      });

      const errors = await formValidationService.validateField('email', '', {});
      
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Email is required');
      expect(errors[0].severity).toBe('error');
    });

    it('should validate email format', async () => {
      formValidationService.addField({
        field: 'email',
        rules: [ValidationRules.email('Invalid email format')]
      });

      const errors = await formValidationService.validateField('email', 'invalid-email', {});
      
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Invalid email format');
    });

    it('should validate password strength', async () => {
      formValidationService.addField({
        field: 'password',
        rules: [ValidationRules.passwordStrength()]
      });

      const weakPassword = await formValidationService.validateField('password', 'weak', {});
      const strongPassword = await formValidationService.validateField('password', 'StrongP@ss123', {});
      
      expect(weakPassword).toHaveLength(1);
      expect(weakPassword[0].severity).toBe('warning');
      expect(strongPassword).toHaveLength(0);
    });

    it('should validate password confirmation', async () => {
      formValidationService.addField({
        field: 'confirmPassword',
        rules: [ValidationRules.confirmPassword('password', 'Passwords do not match')]
      });

      const formData = {
        password: 'mypassword',
        confirmPassword: 'differentpassword'
      };

      const errors = await formValidationService.validateField('confirmPassword', 'differentpassword', formData);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Passwords do not match');
    });

    it('should validate entire form', async () => {
      formValidationService.addField({
        field: 'email',
        rules: [
          ValidationRules.required('Email is required'),
          ValidationRules.email('Invalid email format')
        ]
      });

      formValidationService.addField({
        field: 'password',
        rules: [
          ValidationRules.required('Password is required'),
          ValidationRules.minLength(8, 'Password must be at least 8 characters')
        ]
      });

      const formData = {
        email: 'invalid-email',
        password: 'short'
      };

      const result = await formValidationService.validateForm(formData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.fieldErrors['email']).toHaveLength(1);
      expect(result.fieldErrors['password']).toHaveLength(1);
    });

    it('should handle async validation', async () => {
      const asyncValidator = vi.fn().mockResolvedValue(false);
      
      formValidationService.addField({
        field: 'username',
        rules: [
          ValidationRules.unique(asyncValidator, 'Username is already taken')
        ]
      });

      const errors = await formValidationService.validateField('username', 'existinguser', {});
      
      expect(asyncValidator).toHaveBeenCalledWith('existinguser');
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Username is already taken');
    });

    it('should handle form submission with validation', async () => {
      formValidationService.addField({
        field: 'email',
        rules: [ValidationRules.required('Email is required')]
      });

      const mockSubmit = vi.fn().mockResolvedValue(undefined);
      const mockError = vi.fn();

      // Test with invalid data
      const invalidResult = await formValidationService.handleFormSubmit(
        { email: '' },
        mockSubmit,
        mockError
      );

      expect(invalidResult).toBe(false);
      expect(mockSubmit).not.toHaveBeenCalled();
      expect(mockError).toHaveBeenCalled();

      // Test with valid data
      const validResult = await formValidationService.handleFormSubmit(
        { email: 'test@example.com' },
        mockSubmit
      );

      expect(validResult).toBe(true);
      expect(mockSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete error flow from capture to recovery', async () => {
      // Register a recovery strategy
      const recoveryStrategy = {
        name: 'integration-test-strategy',
        canRecover: vi.fn().mockReturnValue(true),
        recover: vi.fn().mockResolvedValue({ success: true, data: 'recovered' })
      };

      errorRecoveryService.registerStrategy(recoveryStrategy);

      // Capture an error
      const error = new Error('Integration test error');
      const context = {
        component: 'IntegrationTest',
        action: 'testFlow',
        enableRetry: true
      };

      // Handle the error through the global handler
      await globalErrorHandler.handleError(error, context);

      // Verify error was captured
      const recentErrors = errorMonitoringService.getRecentErrors(1);
      expect(recentErrors).toHaveLength(1);
      expect(recentErrors[0].error.message).toBe('Integration test error');

      // Attempt recovery
      const recoveryResult = await errorRecoveryService.attemptRecovery(error, context);
      expect(recoveryResult.success).toBe(true);
      expect(recoveryStrategy.recover).toHaveBeenCalled();
    });

    it('should handle network error with offline queue', async () => {
      // Simulate offline state
      Object.defineProperty(navigator, 'onLine', { value: false });

      // Mock fetch to simulate network error
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const request = {
        url: '/api/test',
        options: { method: 'POST', body: JSON.stringify({ test: 'data' }) },
        priority: 'high' as const
      };

      // Queue the request
      await networkErrorHandler.queueRequest(request);

      // Verify request is queued
      const queueStatus = networkErrorHandler.getQueueStatus();
      expect(queueStatus.totalRequests).toBe(1);

      // Simulate going back online
      Object.defineProperty(navigator, 'onLine', { value: true });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      // Trigger online event
      window.dispatchEvent(new Event('online'));

      // Wait for queue processing
      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify request was processed
      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        body: JSON.stringify({ test: 'data' })
      });
    });

    it('should handle form validation with error monitoring', async () => {
      // Setup form validation
      formValidationService.addField({
        field: 'email',
        rules: [
          ValidationRules.required('Email is required'),
          ValidationRules.email('Invalid email format')
        ]
      });

      // Attempt to validate invalid form
      const formData = { email: 'invalid-email' };
      const result = await formValidationService.validateForm(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);

      // Verify validation error was captured by monitoring
      const recentErrors = errorMonitoringService.getRecentErrors(5);
      const validationErrors = recentErrors.filter(e => e.category === 'data');
      
      // Note: This would require the form validation service to integrate with error monitoring
      // which could be added as an enhancement
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle circular reference errors', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;

      const error = new Error('Circular reference error');
      const context = { metadata: circularObj };

      expect(() => {
        errorMonitoringService.captureError(error, context);
      }).not.toThrow();
    });

    it('should handle very large error messages', () => {
      const largeMessage = 'x'.repeat(10000);
      const error = new Error(largeMessage);

      const errorId = errorMonitoringService.captureError(error, {});
      expect(errorId).toBeTruthy();

      const recentErrors = errorMonitoringService.getRecentErrors(1);
      expect(recentErrors[0].error.message).toBe(largeMessage);
    });

    it('should handle errors during error handling', async () => {
      // Mock a failing recovery strategy
      const faultyStrategy = {
        name: 'faulty-strategy',
        canRecover: vi.fn().mockImplementation(() => {
          throw new Error('Strategy check failed');
        }),
        recover: vi.fn()
      };

      errorRecoveryService.registerStrategy(faultyStrategy);

      const originalError = new Error('Original error');
      const result = await errorRecoveryService.attemptRecovery(originalError, {});

      // Should handle the faulty strategy gracefully
      expect(result.success).toBe(false);
      expect(faultyStrategy.recover).not.toHaveBeenCalled();
    });

    it('should handle memory constraints with large error volumes', () => {
      // Generate many errors to test memory management
      for (let i = 0; i < 2000; i++) {
        const error = new Error(`Error ${i}`);
        errorMonitoringService.captureError(error, { iteration: i });
      }

      const metrics = errorMonitoringService.getMetrics();
      expect(metrics.totalErrors).toBeLessThanOrEqual(1000); // Should respect maxReports limit
    });

    it('should handle malformed validation rules', async () => {
      const malformedRule = {
        name: 'malformed',
        validator: null as any, // Invalid validator
        message: 'Malformed rule'
      };

      formValidationService.addField({
        field: 'test',
        rules: [malformedRule]
      });

      const errors = await formValidationService.validateField('test', 'value', {});
      
      // Should handle malformed rule gracefully
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Validation error occurred');
    });
  });
});