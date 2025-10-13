import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

// Mock providers for testing
const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

const MockThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div data-theme="light">{children}</div>;
};

// Create a custom render function that includes providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MockAuthProvider>
          <MockThemeProvider>
            {children}
            <Toaster />
          </MockThemeProvider>
        </MockAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Custom testing utilities
export const createMockIntersectionObserver = () => {
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  });
  window.IntersectionObserver = mockIntersectionObserver;
  return mockIntersectionObserver;
};

export const createMockResizeObserver = () => {
  const mockResizeObserver = vi.fn();
  mockResizeObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  });
  window.ResizeObserver = mockResizeObserver;
  return mockResizeObserver;
};

export const mockLocalStorage = () => {
  const store: { [key: string]: string } = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    get store() {
      return { ...store };
    }
  };
};

export const mockSessionStorage = () => {
  const store: { [key: string]: string } = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    get store() {
      return { ...store };
    }
  };
};

export const mockFetch = (response: any, ok = true) => {
  return vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 400,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response)),
    blob: () => Promise.resolve(new Blob([JSON.stringify(response)])),
  });
};

export const mockWebSocket = () => {
  const mockWS = {
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: WebSocket.OPEN,
    CONNECTING: WebSocket.CONNECTING,
    OPEN: WebSocket.OPEN,
    CLOSING: WebSocket.CLOSING,
    CLOSED: WebSocket.CLOSED,
  };

  global.WebSocket = vi.fn().mockImplementation(() => mockWS);
  return mockWS;
};

export const mockGeolocation = () => {
  const mockGeolocation = {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  };

  Object.defineProperty(global.navigator, 'geolocation', {
    value: mockGeolocation,
    writable: true,
  });

  return mockGeolocation;
};

export const mockMediaDevices = () => {
  const mockMediaDevices = {
    getUserMedia: vi.fn(),
    enumerateDevices: vi.fn(),
    getDisplayMedia: vi.fn(),
  };

  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: mockMediaDevices,
    writable: true,
  });

  return mockMediaDevices;
};

export const mockNotification = () => {
  const mockNotification = vi.fn();
  mockNotification.requestPermission = vi.fn().mockResolvedValue('granted');
  mockNotification.permission = 'granted';

  global.Notification = mockNotification;
  return mockNotification;
};

export const createMockFile = (name: string, content: string, type = 'text/plain') => {
  return new File([content], name, { type });
};

export const createMockFileList = (files: File[]) => {
  const fileList = {
    length: files.length,
    item: (index: number) => files[index] || null,
    [Symbol.iterator]: function* () {
      for (const file of files) {
        yield file;
      }
    },
  };

  // Add files as indexed properties
  files.forEach((file, index) => {
    (fileList as any)[index] = file;
  });

  return fileList as FileList;
};

export const mockClipboard = () => {
  const mockClipboard = {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
    write: vi.fn().mockResolvedValue(undefined),
    read: vi.fn().mockResolvedValue([]),
  };

  Object.defineProperty(global.navigator, 'clipboard', {
    value: mockClipboard,
    writable: true,
  });

  return mockClipboard;
};

export const mockPerformance = () => {
  const mockPerformance = {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
    timing: {
      navigationStart: Date.now(),
      loadEventEnd: Date.now() + 1000,
    },
  };

  global.performance = { ...global.performance, ...mockPerformance };
  return mockPerformance;
};

export const mockIndexedDB = () => {
  const mockDB = {
    transaction: vi.fn(() => ({
      objectStore: vi.fn(() => ({
        get: vi.fn(() => ({ onsuccess: null, onerror: null })),
        put: vi.fn(() => ({ onsuccess: null, onerror: null })),
        delete: vi.fn(() => ({ onsuccess: null, onerror: null })),
        clear: vi.fn(() => ({ onsuccess: null, onerror: null })),
        openCursor: vi.fn(() => ({ onsuccess: null, onerror: null })),
        createIndex: vi.fn(),
      })),
    })),
    createObjectStore: vi.fn(() => ({
      createIndex: vi.fn(),
    })),
    close: vi.fn(),
  };

  const mockIDB = {
    open: vi.fn(() => ({
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: mockDB,
    })),
    deleteDatabase: vi.fn(),
  };

  global.indexedDB = mockIDB;
  return { mockIDB, mockDB };
};

// Test data generators
export const generateMockUsers = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    id: `user-${index + 1}`,
    email: `user${index + 1}@example.com`,
    created_at: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
    profile: {
      first_name: `User${index + 1}`,
      last_name: 'Test',
      avatar_url: null,
    },
  }));
};

export const generateMockLessons = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    id: `lesson-${index + 1}`,
    title: `Lesson ${index + 1}`,
    content: `Content for lesson ${index + 1}`,
    difficulty_level: (index % 3) + 1,
    type: 'lesson',
    created_at: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
  }));
};

export const generateMockAnalyticsEvents = (count: number) => {
  const eventTypes = ['page_view', 'lesson_started', 'lesson_completed', 'user_action'];
  
  return Array.from({ length: count }, (_, index) => ({
    id: `event-${index + 1}`,
    user_id: `user-${(index % 10) + 1}`,
    event_type: eventTypes[index % eventTypes.length],
    event_data: {
      page: '/lessons',
      timestamp: Date.now() - index * 60 * 1000,
    },
    session_id: `session-${Math.floor(index / 5) + 1}`,
    created_at: new Date(Date.now() - index * 60 * 1000).toISOString(),
  }));
};

// Async testing utilities
export const waitForElement = async (callback: () => HTMLElement | null, timeout = 1000) => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const element = callback();
    if (element) {
      return element;
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  throw new Error('Element not found within timeout');
};

export const waitForCondition = async (condition: () => boolean, timeout = 1000) => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  throw new Error('Condition not met within timeout');
};

// Performance testing utilities
export const measureRenderTime = async (renderFn: () => void) => {
  const startTime = performance.now();
  renderFn();
  await new Promise(resolve => setTimeout(resolve, 0)); // Wait for next tick
  const endTime = performance.now();
  return endTime - startTime;
};

export const measureAsyncOperation = async (operation: () => Promise<any>) => {
  const startTime = performance.now();
  await operation();
  const endTime = performance.now();
  return endTime - startTime;
};