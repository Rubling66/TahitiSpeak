import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceMonitor } from '../../services/PerformanceMonitor';

// Mock performance APIs
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000,
  },
  navigation: {
    type: 1,
    redirectCount: 0,
  },
  timing: {
    navigationStart: Date.now() - 5000,
    loadEventEnd: Date.now() - 1000,
    domContentLoadedEventEnd: Date.now() - 2000,
    responseEnd: Date.now() - 3000,
    requestStart: Date.now() - 4000,
  },
};

const mockNavigator = {
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
  },
  deviceMemory: 8,
  hardwareConcurrency: 4,
};

// Mock PerformanceObserver
const mockPerformanceObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
}));

// Mock ResizeObserver
const mockResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

beforeEach(() => {
  global.performance = mockPerformance as any;
  global.navigator = { ...global.navigator, ...mockNavigator } as any;
  global.PerformanceObserver = mockPerformanceObserver as any;
  global.ResizeObserver = mockResizeObserver as any;
  
  // Mock console methods
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor({
      enableCoreWebVitals: true,
      enableMemoryMonitoring: true,
      enableNetworkMonitoring: true,
      enableRenderingMetrics: true,
      alertThresholds: {
        lcp: 2500,
        fid: 100,
        cls: 0.1,
        memoryUsage: 0.8,
        errorRate: 0.05,
      },
      reportingInterval: 1000,
    });
  });

  afterEach(() => {
    monitor.stop();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultMonitor = new PerformanceMonitor();
      expect(defaultMonitor).toBeInstanceOf(PerformanceMonitor);
    });

    it('should start monitoring when initialized', () => {
      expect(mockPerformanceObserver).toHaveBeenCalled();
    });

    it('should setup performance observers', () => {
      const observerCalls = mockPerformanceObserver.mock.calls;
      expect(observerCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Core Web Vitals', () => {
    it('should track LCP (Largest Contentful Paint)', async () => {
      const lcpEntry = {
        name: 'largest-contentful-paint',
        entryType: 'largest-contentful-paint',
        startTime: 1500,
        renderTime: 1500,
        loadTime: 1500,
        size: 1000,
        id: 'main-image',
        url: 'https://example.com/image.jpg',
      };

      // Simulate LCP observation
      const observerCallback = mockPerformanceObserver.mock.calls.find(
        call => call[0].toString().includes('largest-contentful-paint')
      )?.[0];

      if (observerCallback) {
        observerCallback({ getEntries: () => [lcpEntry] });
      }

      const metrics = await monitor.getMetrics();
      expect(metrics.coreWebVitals.lcp).toBe(1500);
    });

    it('should track FID (First Input Delay)', async () => {
      const fidEntry = {
        name: 'first-input',
        entryType: 'first-input',
        startTime: 1000,
        processingStart: 1050,
        processingEnd: 1100,
        duration: 50,
        cancelable: true,
      };

      // Simulate FID observation
      const observerCallback = mockPerformanceObserver.mock.calls.find(
        call => call[0].toString().includes('first-input')
      )?.[0];

      if (observerCallback) {
        observerCallback({ getEntries: () => [fidEntry] });
      }

      const metrics = await monitor.getMetrics();
      expect(metrics.coreWebVitals.fid).toBe(50);
    });

    it('should track CLS (Cumulative Layout Shift)', async () => {
      const clsEntry = {
        name: '',
        entryType: 'layout-shift',
        startTime: 1000,
        value: 0.05,
        hadRecentInput: false,
        lastInputTime: 0,
        sources: [],
      };

      // Simulate CLS observation
      const observerCallback = mockPerformanceObserver.mock.calls.find(
        call => call[0].toString().includes('layout-shift')
      )?.[0];

      if (observerCallback) {
        observerCallback({ getEntries: () => [clsEntry] });
      }

      const metrics = await monitor.getMetrics();
      expect(metrics.coreWebVitals.cls).toBeGreaterThan(0);
    });
  });

  describe('Memory Monitoring', () => {
    it('should track memory usage', async () => {
      const metrics = await monitor.getMetrics();
      
      expect(metrics.memory.usedJSHeapSize).toBe(1000000);
      expect(metrics.memory.totalJSHeapSize).toBe(2000000);
      expect(metrics.memory.jsHeapSizeLimit).toBe(4000000);
      expect(metrics.memory.usagePercentage).toBe(0.5);
    });

    it('should detect memory leaks', async () => {
      // Simulate increasing memory usage
      mockPerformance.memory.usedJSHeapSize = 3500000; // 87.5% usage

      const metrics = await monitor.getMetrics();
      expect(metrics.memory.usagePercentage).toBeGreaterThan(0.8);
    });
  });

  describe('Network Monitoring', () => {
    it('should track network information', async () => {
      const metrics = await monitor.getMetrics();
      
      expect(metrics.network.effectiveType).toBe('4g');
      expect(metrics.network.downlink).toBe(10);
      expect(metrics.network.rtt).toBe(50);
      expect(metrics.network.saveData).toBe(false);
    });

    it('should handle missing network API', async () => {
      // Remove connection API
      delete (global.navigator as any).connection;

      const metrics = await monitor.getMetrics();
      expect(metrics.network.effectiveType).toBe('unknown');
    });
  });

  describe('Rendering Metrics', () => {
    it('should track frame rate', async () => {
      // Mock requestAnimationFrame
      let frameCallback: FrameRequestCallback;
      global.requestAnimationFrame = vi.fn((callback) => {
        frameCallback = callback;
        return 1;
      });

      // Simulate frame rendering
      const startTime = performance.now();
      for (let i = 0; i < 60; i++) {
        mockPerformance.now.mockReturnValue(startTime + (i * 16.67)); // 60 FPS
        if (frameCallback!) {
          frameCallback(startTime + (i * 16.67));
        }
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const metrics = await monitor.getMetrics();
      expect(metrics.rendering.fps).toBeGreaterThan(50);
    });

    it('should detect frame drops', async () => {
      // Mock slow frames
      let frameCallback: FrameRequestCallback;
      global.requestAnimationFrame = vi.fn((callback) => {
        frameCallback = callback;
        return 1;
      });

      const startTime = performance.now();
      for (let i = 0; i < 10; i++) {
        mockPerformance.now.mockReturnValue(startTime + (i * 50)); // 20 FPS (slow)
        if (frameCallback!) {
          frameCallback(startTime + (i * 50));
        }
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const metrics = await monitor.getMetrics();
      expect(metrics.rendering.frameDrops).toBeGreaterThan(0);
    });
  });

  describe('Performance Timing', () => {
    it('should calculate page load metrics', async () => {
      const metrics = await monitor.getMetrics();
      
      expect(metrics.timing.pageLoadTime).toBeGreaterThan(0);
      expect(metrics.timing.domContentLoaded).toBeGreaterThan(0);
      expect(metrics.timing.timeToFirstByte).toBeGreaterThan(0);
    });

    it('should track resource loading', () => {
      const resourceEntry = {
        name: 'https://example.com/script.js',
        entryType: 'resource',
        startTime: 1000,
        responseEnd: 1200,
        transferSize: 50000,
        encodedBodySize: 45000,
        decodedBodySize: 120000,
        initiatorType: 'script',
      };

      mockPerformance.getEntriesByType.mockReturnValue([resourceEntry]);

      monitor.trackResourceTiming();

      // Verify resource was tracked
      expect(mockPerformance.getEntriesByType).toHaveBeenCalledWith('resource');
    });
  });

  describe('Custom Metrics', () => {
    it('should track custom metrics', async () => {
      monitor.trackCustomMetric('api_response_time', 150);
      monitor.trackCustomMetric('user_interaction_delay', 25);

      const metrics = await monitor.getMetrics();
      
      expect(metrics.custom.api_response_time).toBe(150);
      expect(metrics.custom.user_interaction_delay).toBe(25);
    });

    it('should aggregate custom metrics', async () => {
      monitor.trackCustomMetric('api_response_time', 100);
      monitor.trackCustomMetric('api_response_time', 200);
      monitor.trackCustomMetric('api_response_time', 150);

      const metrics = await monitor.getMetrics();
      
      // Should track the latest value or average depending on implementation
      expect(metrics.custom.api_response_time).toBeGreaterThan(0);
    });
  });

  describe('Alerting System', () => {
    it('should trigger alerts for threshold violations', async () => {
      const alertCallback = vi.fn();
      monitor.onAlert(alertCallback);

      // Simulate high LCP
      const lcpEntry = {
        name: 'largest-contentful-paint',
        entryType: 'largest-contentful-paint',
        startTime: 3000, // Above threshold of 2500
        renderTime: 3000,
        loadTime: 3000,
        size: 1000,
        id: 'main-image',
        url: 'https://example.com/image.jpg',
      };

      // Trigger LCP observation
      const observerCallback = mockPerformanceObserver.mock.calls.find(
        call => call[0].toString().includes('largest-contentful-paint')
      )?.[0];

      if (observerCallback) {
        observerCallback({ getEntries: () => [lcpEntry] });
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(alertCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'performance',
          metric: 'lcp',
          value: 3000,
          threshold: 2500,
          severity: 'high',
        })
      );
    });

    it('should not trigger alerts for values within thresholds', async () => {
      const alertCallback = vi.fn();
      monitor.onAlert(alertCallback);

      // Simulate good LCP
      const lcpEntry = {
        name: 'largest-contentful-paint',
        entryType: 'largest-contentful-paint',
        startTime: 1500, // Below threshold of 2500
        renderTime: 1500,
        loadTime: 1500,
        size: 1000,
        id: 'main-image',
        url: 'https://example.com/image.jpg',
      };

      // Trigger LCP observation
      const observerCallback = mockPerformanceObserver.mock.calls.find(
        call => call[0].toString().includes('largest-contentful-paint')
      )?.[0];

      if (observerCallback) {
        observerCallback({ getEntries: () => [lcpEntry] });
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(alertCallback).not.toHaveBeenCalled();
    });
  });

  describe('Reporting', () => {
    it('should generate performance reports', async () => {
      // Add some metrics
      monitor.trackCustomMetric('test_metric', 100);
      
      const report = await monitor.generateReport('1h');
      
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('coreWebVitals');
      expect(report).toHaveProperty('memory');
      expect(report).toHaveProperty('network');
      expect(report).toHaveProperty('rendering');
      expect(report).toHaveProperty('timing');
      expect(report).toHaveProperty('custom');
      expect(report).toHaveProperty('alerts');
      expect(report).toHaveProperty('recommendations');
    });

    it('should provide performance recommendations', async () => {
      // Simulate poor performance
      mockPerformance.memory.usedJSHeapSize = 3500000; // High memory usage

      const report = await monitor.generateReport('1h');
      
      expect(report.recommendations).toContain(
        expect.stringContaining('memory')
      );
    });

    it('should export metrics in different formats', async () => {
      const csvData = await monitor.exportMetrics('csv');
      const jsonData = await monitor.exportMetrics('json');

      expect(typeof csvData).toBe('string');
      expect(csvData).toContain('timestamp');
      
      expect(typeof jsonData).toBe('string');
      const parsedJson = JSON.parse(jsonData);
      expect(parsedJson).toHaveProperty('metrics');
    });
  });

  describe('Error Handling', () => {
    it('should handle PerformanceObserver errors gracefully', () => {
      // Mock PerformanceObserver to throw
      mockPerformanceObserver.mockImplementation(() => {
        throw new Error('PerformanceObserver not supported');
      });

      expect(() => {
        new PerformanceMonitor();
      }).not.toThrow();

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('PerformanceObserver')
      );
    });

    it('should handle missing performance APIs', async () => {
      // Remove performance API
      delete (global as any).performance;

      const metrics = await monitor.getMetrics();
      
      // Should return default values
      expect(metrics.memory.usedJSHeapSize).toBe(0);
      expect(metrics.timing.pageLoadTime).toBe(0);
    });

    it('should handle observer callback errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Simulate observer callback error
      const observerCallback = mockPerformanceObserver.mock.calls[0]?.[0];
      
      if (observerCallback) {
        // Call with invalid data to trigger error
        expect(() => {
          observerCallback({ getEntries: () => { throw new Error('Test error'); } });
        }).not.toThrow();
      }

      consoleSpy.mockRestore();
    });
  });

  describe('Configuration', () => {
    it('should respect configuration options', () => {
      const config = (monitor as any).config;
      
      expect(config.enableCoreWebVitals).toBe(true);
      expect(config.enableMemoryMonitoring).toBe(true);
      expect(config.enableNetworkMonitoring).toBe(true);
      expect(config.enableRenderingMetrics).toBe(true);
      expect(config.alertThresholds.lcp).toBe(2500);
      expect(config.reportingInterval).toBe(1000);
    });

    it('should use default configuration when not provided', () => {
      const defaultMonitor = new PerformanceMonitor();
      const config = (defaultMonitor as any).config;
      
      expect(config.enableCoreWebVitals).toBe(true);
      expect(config.enableMemoryMonitoring).toBe(true);
      expect(config.reportingInterval).toBe(30000);
    });
  });

  describe('Lifecycle Management', () => {
    it('should start and stop monitoring', () => {
      monitor.start();
      expect(mockPerformanceObserver).toHaveBeenCalled();

      monitor.stop();
      // Verify observers are disconnected
      const observerInstances = mockPerformanceObserver.mock.results;
      observerInstances.forEach(result => {
        if (result.value && result.value.disconnect) {
          expect(result.value.disconnect).toHaveBeenCalled();
        }
      });
    });

    it('should clear metrics history', async () => {
      monitor.trackCustomMetric('test_metric', 100);
      
      let metrics = await monitor.getMetrics();
      expect(metrics.custom.test_metric).toBe(100);

      monitor.clearMetrics();
      
      metrics = await monitor.getMetrics();
      expect(metrics.custom.test_metric).toBeUndefined();
    });
  });
});