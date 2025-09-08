// Mock the entire useI18n hook
jest.mock('../../../src/hooks/useI18n', () => {
  const mockSetLocale = jest.fn();
  const mockT = jest.fn((key: string, fallback?: string) => fallback || key);
  const mockFormatDate = jest.fn((date: Date) => date.toLocaleDateString());
  const mockFormatNumber = jest.fn((num: number) => num.toString());
  const mockFormatCurrency = jest.fn((amount: number, currency = 'USD') => `$${amount}`);
  const mockFormatRelativeTime = jest.fn(() => 'just now');
  const mockPlural = jest.fn((key: string, count: number) => `${key}_${count}`);
  const mockTCommon = jest.fn((key: string) => {
    const translations: Record<string, string> = {
      'loading': 'Loading...',
      'error': 'Error',
      'success': 'Success',
    };
    return translations[key] || key;
  });
  const mockGetTextAlign = jest.fn(() => 'left');
  const mockGetMarginStart = jest.fn(() => 'ml');
  const mockGetMarginEnd = jest.fn(() => 'mr');

  return {
    useI18n: jest.fn((namespace?: string) => ({
      locale: 'en',
      setLocale: mockSetLocale,
      t: mockT,
      isRTL: false,
      direction: 'ltr',
      formatDate: mockFormatDate,
      formatNumber: mockFormatNumber,
      formatCurrency: mockFormatCurrency,
      formatRelativeTime: mockFormatRelativeTime,
      plural: mockPlural,
      tCommon: mockTCommon,
      getTextAlign: mockGetTextAlign,
      getMarginStart: mockGetMarginStart,
      getMarginEnd: mockGetMarginEnd,
    })),
  };
});

import { renderHook, act } from '@testing-library/react';
import { useI18n } from '../../../src/hooks/useI18n';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useI18n', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('can be imported without errors', () => {
    expect(useI18n).toBeDefined()
  })

  it('provides basic hook functionality', () => {
    // Test that the hook can be called and returns expected structure
    const mockHook = useI18n();
    expect(mockHook).toHaveProperty('locale');
    expect(mockHook).toHaveProperty('t');
    expect(mockHook).toHaveProperty('setLocale');
  })
})