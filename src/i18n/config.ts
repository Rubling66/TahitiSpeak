import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
export const locales = ['en', 'fr', 'ty'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

// Locale display names
export const localeNames: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  ty: 'Reo Tahiti',
};

// RTL languages (none for our current locales, but structure for future)
export const rtlLocales: Locale[] = [];

// Locale-specific formatting options
export const localeConfig: Record<Locale, {
  dateFormat: string;
  timeFormat: string;
  numberFormat: Intl.NumberFormatOptions;
  currencyFormat: Intl.NumberFormatOptions;
}> = {
  en: {
    dateFormat: 'MM/dd/yyyy',
    timeFormat: 'h:mm a',
    numberFormat: {},
    currencyFormat: { style: 'currency', currency: 'USD' },
  },
  fr: {
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    numberFormat: {},
    currencyFormat: { style: 'currency', currency: 'EUR' },
  },
  ty: {
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    numberFormat: {}, // French Polynesia
    currencyFormat: { style: 'currency', currency: 'XPF' }, // CFP Franc
  },
};

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) notFound();

  return {
    locale: locale as string,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});

function getTimeZoneForLocale(locale: Locale): string {
  switch (locale) {
    case 'en':
      return 'America/New_York'; // Default to EST
    case 'fr':
      return 'Europe/Paris';
    case 'ty':
      return 'Pacific/Tahiti';
    default:
      return 'UTC';
  }
}

// Helper function to check if locale is RTL
export function isRTL(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

// Helper function to get locale direction
export function getLocaleDirection(locale: Locale): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

// Helper function to get browser locale
export function getBrowserLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  
  const browserLang = navigator.language.split('-')[0] as Locale;
  return locales.includes(browserLang) ? browserLang : defaultLocale;
}

// Helper function to validate locale
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}