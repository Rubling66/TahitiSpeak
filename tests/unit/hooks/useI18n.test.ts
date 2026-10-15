/**
 * Real unit tests for useI18n (not a self-mock).
 * Mocks next-intl + LoggingService; exercises LocaleFormatter / RTLUtils for real.
 * Loop 2026-10-15 ~6:35 PM ET — raises coverage on src/hooks/useI18n.ts (was 0% via self-mock).
 */
import { renderHook } from '@testing-library/react';
import { useI18n, useScopedI18n, useFormI18n } from '../../../src/hooks/useI18n';

const mockT = jest.fn((key: string) => `t:${key}`);
(mockT as any).rich = jest.fn((key: string) => `rich:${key}`);

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => mockT),
  useLocale: jest.fn(() => 'en'),
}));

jest.mock('../../../src/services/LoggingService', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('useI18n (real hook)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockT.mockImplementation((key: string) => `t:${key}`);
    (mockT as any).rich.mockImplementation((key: string) => `rich:${key}`);
  });

  it('returns locale and core translate helpers', () => {
    const { result } = renderHook(() => useI18n());
    expect(result.current.locale).toBe('en');
    expect(result.current.t('nav.home')).toBe('t:nav.home');
    expect(result.current.translate('common.ok')).toBe('t:common.ok');
    expect(result.current.translateRich('rich.key')).toBe('rich:rich.key');
    expect(mockT).toHaveBeenCalled();
  });

  it('formats dates, numbers, and currency via LocaleFormatter', () => {
    const { result } = renderHook(() => useI18n());
    const d = new Date('2026-10-15T12:00:00Z');
    expect(typeof result.current.formatDate(d)).toBe('string');
    expect(typeof result.current.formatTime(d)).toBe('string');
    expect(typeof result.current.formatDateTime(d)).toBe('string');
    expect(typeof result.current.formatNumber(1234.5)).toBe('string');
    expect(typeof result.current.formatCurrency(10, 'USD')).toBe('string');
    expect(typeof result.current.formatPercentage(0.25)).toBe('string');
    expect(typeof result.current.formatFileSize(1024)).toBe('string');
    expect(typeof result.current.formatDuration(90)).toBe('string');
    expect(typeof result.current.formatList(['a', 'b'])).toBe('string');
  });

  it('exposes LTR defaults for English locale', () => {
    const { result } = renderHook(() => useI18n());
    expect(result.current.isRTL).toBe(false);
    expect(result.current.getTextDirection()).toBe('ltr');
    expect(result.current.localeInfo.locale).toBe('en');
    expect(result.current.localeInfo.direction).toBe('ltr');
    expect(result.current.getRTLStyles()).toEqual(expect.any(Object));
  });

  it('builds common/nav/errors/success shortcut maps', () => {
    const { result } = renderHook(() => useI18n());
    expect(result.current.common.loading).toBe('t:common.loading');
    expect(result.current.nav.home).toBe('t:nav.home');
    expect(result.current.errors.notFound).toBe('t:errors.notFound');
    expect(result.current.success.saved).toBe('t:success.saved');
  });

  it('falls back to the key when translate throws', () => {
    const { result } = renderHook(() => useI18n());
    mockT.mockImplementation((key: string) => {
      if (key === 'missing.key') throw new Error('missing');
      return `t:${key}`;
    });
    expect(result.current.t('missing.key')).toBe('missing.key');
  });
});

describe('useScopedI18n', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockT.mockImplementation((key: string) => `t:${key}`);
  });

  it('returns scoped translate + locale', () => {
    const { result } = renderHook(() => useScopedI18n('auth'));
    expect(result.current.scope).toBe('auth');
    expect(result.current.locale).toBe('en');
    expect(result.current.t('login')).toBe('t:login');
  });
});

describe('useFormI18n', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockT.mockImplementation((key: string) => `t:${key}`);
  });

  it('exposes validation and form shortcuts', () => {
    const { result } = renderHook(() => useFormI18n());
    expect(result.current.validation.email).toBe('t:validation.email');
    expect(result.current.form.submit).toBe('t:form.submit');
    expect(result.current.validation.required('Email')).toBe('t:validation.required');
  });
});
