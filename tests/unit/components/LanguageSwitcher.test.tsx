/**
 * Real render tests for LanguageSwitcher (was import-only: 15% stmts / 0% branches).
 * Mocks only framework edges (next/navigation, next-intl, useI18n, logger, rtl);
 * the component's own open/close, selection, keyboard and variant logic runs for real.
 * Loop 2026-10-16 ~10:40 AM ET.
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LanguageSwitcher } from '../../../src/components/ui/LanguageSwitcher';
import { logger } from '../../../src/utils/logger';
import { isRTLLocale, getTextDirection } from '../../../src/utils/rtl';

jest.mock('../../../src/utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../../src/utils/rtl', () => ({
  isRTLLocale: jest.fn(() => false),
  getTextDirection: jest.fn(() => 'ltr'),
}));

const mockPush = jest.fn();
let mockPathname: string | null = '/en/lessons';
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => mockPathname,
}));

let mockLocale = 'en';
jest.mock('next-intl', () => ({
  useLocale: () => mockLocale,
}));

jest.mock('../../../src/hooks/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    formatMessage: (key: string, values?: Record<string, string>) =>
      values?.current ? `${key}:${values.current}` : key,
  }),
}));

const mockLocalStorage = { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() };
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

const trigger = () => screen.getByRole('button');

describe('LanguageSwitcher (real render)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocale = 'en';
    mockPathname = '/en/lessons';
    (isRTLLocale as jest.Mock).mockReturnValue(false);
    (getTextDirection as jest.Mock).mockReturnValue('ltr');
    document.body.classList.remove('rtl');
  });

  it('renders the default trigger for the current locale, closed', () => {
    render(<LanguageSwitcher />);
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(trigger()).toHaveAttribute('aria-label', 'common.selectLanguage:English');
    expect(screen.getByRole('img', { name: 'English flag' })).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('falls back to English when the locale is unsupported', () => {
    mockLocale = 'de';
    render(<LanguageSwitcher />);
    expect(trigger()).toHaveAttribute('aria-label', 'common.selectLanguage:English');
  });

  it('shows the native name of the current language by default, English name when disabled', () => {
    mockLocale = 'ty';
    const { unmount } = render(<LanguageSwitcher />);
    expect(screen.getByText('Reo Tahiti')).toBeInTheDocument();
    unmount();
    render(<LanguageSwitcher showNativeName={false} />);
    expect(screen.getByText('Tahitian')).toBeInTheDocument();
    expect(screen.queryByText('Reo Tahiti')).not.toBeInTheDocument();
  });

  it('compact variant hides the name; showFlag=false hides the flag', () => {
    render(<LanguageSwitcher variant="compact" showFlag={false} />);
    expect(screen.queryByText('English')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('opens a listbox with all three languages and marks the current one selected', () => {
    render(<LanguageSwitcher />);
    fireEvent.click(trigger());
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(options[1]).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-label', 'common.languageOptions');
  });

  it('closes on Escape and on outside mousedown', () => {
    render(<LanguageSwitcher />);
    fireEvent.click(trigger());
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    fireEvent.click(trigger());
    fireEvent.mouseDown(screen.getByRole('listbox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('switching language stores preference, sets lang/dir, calls handler and navigates', async () => {
    const onLanguageChange = jest.fn();
    render(<LanguageSwitcher onLanguageChange={onLanguageChange} />);
    fireEvent.click(trigger());
    await act(async () => {
      fireEvent.click(screen.getByText('French'));
    });
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('preferred-locale', 'fr');
    expect(document.documentElement.lang).toBe('fr');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.body.classList.contains('rtl')).toBe(false);
    expect(onLanguageChange).toHaveBeenCalledWith('fr');
    expect(mockPush).toHaveBeenCalledWith('/fr/lessons');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(logger.info).toHaveBeenCalledWith('Language change completed', { locale: 'fr', path: '/fr/lessons' });
  });

  it('adds the rtl body class for RTL locales and defaults a null pathname to "/"', async () => {
    (isRTLLocale as jest.Mock).mockReturnValue(true);
    (getTextDirection as jest.Mock).mockReturnValue('rtl');
    mockPathname = null;
    render(<LanguageSwitcher variant="inline" />);
    await act(async () => {
      fireEvent.keyDown(screen.getByText('Tahitian').closest('[role="option"]')!, { key: 'Enter' });
    });
    expect(document.body.classList.contains('rtl')).toBe(true);
    expect(document.documentElement.dir).toBe('rtl');
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('ignores re-selecting the current locale and unrelated keys', async () => {
    render(<LanguageSwitcher variant="inline" />);
    const english = screen.getByText('English').closest('[role="option"]')!;
    await act(async () => {
      fireEvent.click(english);
      fireEvent.keyDown(screen.getByText('French').closest('[role="option"]')!, { key: 'a' });
    });
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
  });

  it('inline variant renders the label and options without a trigger button', () => {
    render(<LanguageSwitcher variant="inline" />);
    expect(screen.getByText('common.language')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(3);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('logs and recovers when the language change throws', async () => {
    mockPush.mockImplementationOnce(() => {
      throw new Error('nav failed');
    });
    render(<LanguageSwitcher variant="inline" />);
    await act(async () => {
      fireEvent.keyDown(screen.getByText('French').closest('[role="option"]')!, { key: ' ' });
    });
    expect(logger.error).toHaveBeenCalledWith(
      'Language change failed',
      expect.objectContaining({ locale: 'fr' })
    );
  });
});
