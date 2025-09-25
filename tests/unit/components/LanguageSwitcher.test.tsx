import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageSwitcher } from '../../../src/components/ui/LanguageSwitcher';

// Mock the logger
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}))

// Mock RTL utilities
jest.mock('../../../src/utils/rtl', () => ({
  isRTLLocale: jest.fn(() => false),
  getTextDirection: jest.fn(() => 'ltr')
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/test',
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

// Mock the useI18n hook
jest.mock('../../../src/hooks/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    formatMessage: (key: string) => key,
  }),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should import without errors', () => {
    expect(LanguageSwitcher).toBeDefined()
  })

  it('should be a valid React component', () => {
    expect(typeof LanguageSwitcher).toBe('function')
  })
})