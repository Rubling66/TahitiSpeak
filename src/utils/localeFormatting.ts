import { logger } from '../services/LoggingService';

/**
 * Locale-specific formatting configuration
 */
export interface LocaleConfig {
  locale: string;
  currency: string;
  timezone: string;
  dateFormat: 'short' | 'medium' | 'long' | 'full';
  timeFormat: 'short' | 'medium' | 'long' | 'full';
  numberFormat: {
    decimal: string;
    thousand: string;
    precision: number;
  };
  rtl: boolean;
}

/**
 * Default locale configurations
 */
export const LOCALE_CONFIGS: Record<string, LocaleConfig> = {
  'en': {
    locale: 'en-US',
    currency: 'USD',
    timezone: 'America/New_York',
    dateFormat: 'medium',
    timeFormat: 'short',
    numberFormat: {
      decimal: '.',
      thousand: ',',
      precision: 2
    },
    rtl: false
  },
  'en-US': {
    locale: 'en-US',
    currency: 'USD',
    timezone: 'America/New_York',
    dateFormat: 'medium',
    timeFormat: 'short',
    numberFormat: {
      decimal: '.',
      thousand: ',',
      precision: 2
    },
    rtl: false
  },
  'fr': {
    locale: 'fr-FR',
    currency: 'EUR',
    timezone: 'Europe/Paris',
    dateFormat: 'medium',
    timeFormat: 'short',
    numberFormat: {
      decimal: ',',
      thousand: ' ',
      precision: 2
    },
    rtl: false
  },
  'fr-FR': {
    locale: 'fr-FR',
    currency: 'EUR',
    timezone: 'Europe/Paris',
    dateFormat: 'medium',
    timeFormat: 'short',
    numberFormat: {
      decimal: ',',
      thousand: ' ',
      precision: 2
    },
    rtl: false
  },
  'fr-PF': {
    locale: 'fr-PF',
    currency: 'XPF', // CFP Franc (French Polynesia)
    timezone: 'Pacific/Tahiti',
    dateFormat: 'medium',
    timeFormat: 'short',
    numberFormat: {
      decimal: ',',
      thousand: ' ',
      precision: 0 // CFP Franc doesn't use decimal places
    },
    rtl: false
  },
  'ty': {
    locale: 'ty-PF', // Tahitian (French Polynesia)
    currency: 'XPF',
    timezone: 'Pacific/Tahiti',
    dateFormat: 'medium',
    timeFormat: 'short',
    numberFormat: {
      decimal: ',',
      thousand: ' ',
      precision: 0
    },
    rtl: false
  }
};

/**
 * Get locale configuration
 */
export function getLocaleConfig(locale: string): LocaleConfig {
  // Try exact match first
  if (LOCALE_CONFIGS[locale]) {
    return LOCALE_CONFIGS[locale];
  }
  
  // Try language code only
  const languageCode = locale.split('-')[0];
  if (LOCALE_CONFIGS[languageCode]) {
    return LOCALE_CONFIGS[languageCode];
  }
  
  // Fallback to English
  logger.warn('Locale configuration not found, falling back to English', { locale });
  return LOCALE_CONFIGS['en'];
}

/**
 * Format date according to locale
 */
export function formatDate(
  date: Date | string | number,
  locale: string,
  options: Partial<Intl.DateTimeFormatOptions> = {}
): string {
  try {
    const config = getLocaleConfig(locale);
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date');
    }
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      dateStyle: config.dateFormat,
      timeZone: config.timezone,
      ...options
    };
    
    return new Intl.DateTimeFormat(config.locale, defaultOptions).format(dateObj);
  } catch (error) {
    logger.error('Failed to format date', { date, locale, error });
    return String(date);
  }
}

/**
 * Format time according to locale
 */
export function formatTime(
  date: Date | string | number,
  locale: string,
  options: Partial<Intl.DateTimeFormatOptions> = {}
): string {
  try {
    const config = getLocaleConfig(locale);
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date');
    }
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeStyle: config.timeFormat,
      timeZone: config.timezone,
      ...options
    };
    
    return new Intl.DateTimeFormat(config.locale, defaultOptions).format(dateObj);
  } catch (error) {
    logger.error('Failed to format time', { date, locale, error });
    return String(date);
  }
}

/**
 * Format date and time according to locale
 */
export function formatDateTime(
  date: Date | string | number,
  locale: string,
  options: Partial<Intl.DateTimeFormatOptions> = {}
): string {
  try {
    const config = getLocaleConfig(locale);
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date');
    }
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      dateStyle: config.dateFormat,
      timeStyle: config.timeFormat,
      timeZone: config.timezone,
      ...options
    };
    
    return new Intl.DateTimeFormat(config.locale, defaultOptions).format(dateObj);
  } catch (error) {
    logger.error('Failed to format datetime', { date, locale, error });
    return String(date);
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: string,
  baseDate: Date = new Date()
): string {
  try {
    const config = getLocaleConfig(locale);
    const dateObj = new Date(date);
    const baseDateObj = new Date(baseDate);
    
    if (isNaN(dateObj.getTime()) || isNaN(baseDateObj.getTime())) {
      throw new Error('Invalid date');
    }
    
    const diffInSeconds = Math.floor((baseDateObj.getTime() - dateObj.getTime()) / 1000);
    
    const rtf = new Intl.RelativeTimeFormat(config.locale, { numeric: 'auto' });
    
    // Determine the appropriate unit
    const units: Array<[string, number]> = [
      ['year', 31536000],
      ['month', 2592000],
      ['week', 604800],
      ['day', 86400],
      ['hour', 3600],
      ['minute', 60],
      ['second', 1]
    ];
    
    for (const [unit, secondsInUnit] of units) {
      const value = Math.floor(Math.abs(diffInSeconds) / secondsInUnit);
      if (value >= 1) {
        return rtf.format(diffInSeconds > 0 ? -value : value, unit as Intl.RelativeTimeFormatUnit);
      }
    }
    
    return rtf.format(0, 'second');
  } catch (error) {
    logger.error('Failed to format relative time', { date, locale, error });
    return formatDate(date, locale);
  }
}

/**
 * Format number according to locale
 */
export function formatNumber(
  number: number,
  locale: string,
  options: Partial<Intl.NumberFormatOptions> = {}
): string {
  try {
    const config = getLocaleConfig(locale);
    
    if (isNaN(number)) {
      throw new Error('Invalid number');
    }
    
    const defaultOptions: Intl.NumberFormatOptions = {
      minimumFractionDigits: 0,
      maximumFractionDigits: config.numberFormat.precision,
      ...options
    };
    
    return new Intl.NumberFormat(config.locale, defaultOptions).format(number);
  } catch (error) {
    logger.error('Failed to format number', { number, locale, error });
    return String(number);
  }
}

/**
 * Format currency according to locale
 */
export function formatCurrency(
  amount: number,
  locale: string,
  currency?: string,
  options: Partial<Intl.NumberFormatOptions> = {}
): string {
  try {
    const config = getLocaleConfig(locale);
    const currencyCode = currency || config.currency;
    
    if (isNaN(amount)) {
      throw new Error('Invalid amount');
    }
    
    const defaultOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: config.numberFormat.precision,
      maximumFractionDigits: config.numberFormat.precision,
      ...options
    };
    
    return new Intl.NumberFormat(config.locale, defaultOptions).format(amount);
  } catch (error) {
    logger.error('Failed to format currency', { amount, locale, currency, error });
    return `${amount} ${currency || 'USD'}`;
  }
}

/**
 * Format percentage according to locale
 */
export function formatPercentage(
  value: number,
  locale: string,
  options: Partial<Intl.NumberFormatOptions> = {}
): string {
  try {
    const config = getLocaleConfig(locale);
    
    if (isNaN(value)) {
      throw new Error('Invalid value');
    }
    
    const defaultOptions: Intl.NumberFormatOptions = {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
      ...options
    };
    
    return new Intl.NumberFormat(config.locale, defaultOptions).format(value);
  } catch (error) {
    logger.error('Failed to format percentage', { value, locale, error });
    return `${(value * 100).toFixed(1)}%`;
  }
}

/**
 * Format file size according to locale
 */
export function formatFileSize(
  bytes: number,
  locale: string,
  options: { binary?: boolean; precision?: number } = {}
): string {
  try {
    const { binary = false, precision = 1 } = options;
    const config = getLocaleConfig(locale);
    
    if (isNaN(bytes) || bytes < 0) {
      throw new Error('Invalid bytes value');
    }
    
    const base = binary ? 1024 : 1000;
    const units = binary 
      ? ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
      : ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    
    if (bytes === 0) {
      return `0 ${units[0]}`;
    }
    
    const unitIndex = Math.floor(Math.log(bytes) / Math.log(base));
    const value = bytes / Math.pow(base, unitIndex);
    const unit = units[Math.min(unitIndex, units.length - 1)];
    
    const formattedValue = new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: precision
    }).format(value);
    
    return `${formattedValue} ${unit}`;
  } catch (error) {
    logger.error('Failed to format file size', { bytes, locale, error });
    return `${bytes} B`;
  }
}

/**
 * Format duration (in seconds) according to locale
 */
export function formatDuration(
  seconds: number,
  locale: string,
  options: { format?: 'short' | 'long'; showSeconds?: boolean } = {}
): string {
  try {
    const { format = 'short', showSeconds = true } = options;
    const config = getLocaleConfig(locale);
    
    if (isNaN(seconds) || seconds < 0) {
      throw new Error('Invalid seconds value');
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (format === 'long') {
      const parts: string[] = [];
      
      if (hours > 0) {
        const hourFormatter = new Intl.NumberFormat(config.locale);
        parts.push(`${hourFormatter.format(hours)} ${hours === 1 ? 'hour' : 'hours'}`);
      }
      
      if (minutes > 0) {
        const minuteFormatter = new Intl.NumberFormat(config.locale);
        parts.push(`${minuteFormatter.format(minutes)} ${minutes === 1 ? 'minute' : 'minutes'}`);
      }
      
      if (showSeconds && (remainingSeconds > 0 || parts.length === 0)) {
        const secondFormatter = new Intl.NumberFormat(config.locale);
        parts.push(`${secondFormatter.format(remainingSeconds)} ${remainingSeconds === 1 ? 'second' : 'seconds'}`);
      }
      
      return parts.join(', ');
    } else {
      // Short format (HH:MM:SS or MM:SS)
      if (hours > 0) {
        return showSeconds 
          ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
          : `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      } else {
        return showSeconds
          ? `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
          : `${minutes.toString()}`;
      }
    }
  } catch (error) {
    logger.error('Failed to format duration', { seconds, locale, error });
    return `${seconds}s`;
  }
}

/**
 * Format list according to locale
 */
export function formatList(
  items: string[],
  locale: string,
  options: Partial<Intl.ListFormatOptions> = {}
): string {
  try {
    const config = getLocaleConfig(locale);
    
    if (!Array.isArray(items) || items.length === 0) {
      return '';
    }
    
    const defaultOptions: Intl.ListFormatOptions = {
      style: 'long',
      type: 'conjunction',
      ...options
    };
    
    return new Intl.ListFormat(config.locale, defaultOptions).format(items);
  } catch (error) {
    logger.error('Failed to format list', { items, locale, error });
    return items.join(', ');
  }
}

/**
 * Parse number from locale-formatted string
 */
export function parseNumber(value: string, locale: string): number {
  try {
    const config = getLocaleConfig(locale);
    
    // Remove thousand separators and replace decimal separator
    const normalizedValue = value
      .replace(new RegExp(`\\${config.numberFormat.thousand}`, 'g'), '')
      .replace(config.numberFormat.decimal, '.');
    
    const parsed = parseFloat(normalizedValue);
    
    if (isNaN(parsed)) {
      throw new Error('Invalid number format');
    }
    
    return parsed;
  } catch (error) {
    logger.error('Failed to parse number', { value, locale, error });
    throw error;
  }
}

/**
 * Get timezone offset for locale
 */
export function getTimezoneOffset(locale: string, date: Date = new Date()): string {
  try {
    const config = getLocaleConfig(locale);
    
    const formatter = new Intl.DateTimeFormat(config.locale, {
      timeZone: config.timezone,
      timeZoneName: 'short'
    });
    
    const parts = formatter.formatToParts(date);
    const timeZonePart = parts.find(part => part.type === 'timeZoneName');
    
    return timeZonePart?.value || 'UTC';
  } catch (error) {
    logger.error('Failed to get timezone offset', { locale, error });
    return 'UTC';
  }
}

/**
 * Locale formatting utility class
 */
export class LocaleFormatter {
  private locale: string;
  private config: LocaleConfig;
  
  constructor(locale: string) {
    this.locale = locale;
    this.config = getLocaleConfig(locale);
  }
  
  formatDate(date: Date | string | number, options?: Partial<Intl.DateTimeFormatOptions>): string {
    return formatDate(date, this.locale, options);
  }
  
  formatTime(date: Date | string | number, options?: Partial<Intl.DateTimeFormatOptions>): string {
    return formatTime(date, this.locale, options);
  }
  
  formatDateTime(date: Date | string | number, options?: Partial<Intl.DateTimeFormatOptions>): string {
    return formatDateTime(date, this.locale, options);
  }
  
  formatRelativeTime(date: Date | string | number, baseDate?: Date): string {
    return formatRelativeTime(date, this.locale, baseDate);
  }
  
  formatNumber(number: number, options?: Partial<Intl.NumberFormatOptions>): string {
    return formatNumber(number, this.locale, options);
  }
  
  formatCurrency(amount: number, currency?: string, options?: Partial<Intl.NumberFormatOptions>): string {
    return formatCurrency(amount, this.locale, currency, options);
  }
  
  formatPercentage(value: number, options?: Partial<Intl.NumberFormatOptions>): string {
    return formatPercentage(value, this.locale, options);
  }
  
  formatFileSize(bytes: number, options?: { binary?: boolean; precision?: number }): string {
    return formatFileSize(bytes, this.locale, options);
  }
  
  formatDuration(seconds: number, options?: { format?: 'short' | 'long'; showSeconds?: boolean }): string {
    return formatDuration(seconds, this.locale, options);
  }
  
  formatList(items: string[], options?: Partial<Intl.ListFormatOptions>): string {
    return formatList(items, this.locale, options);
  }
  
  parseNumber(value: string): number {
    return parseNumber(value, this.locale);
  }
  
  getTimezoneOffset(date?: Date): string {
    return getTimezoneOffset(this.locale, date);
  }
  
  get currency(): string {
    return this.config.currency;
  }
  
  get timezone(): string {
    return this.config.timezone;
  }
  
  get isRTL(): boolean {
    return this.config.rtl;
  }
}

/**
 * Create locale formatter instance
 */
export function createLocaleFormatter(locale: string): LocaleFormatter {
  return new LocaleFormatter(locale);
}

export default {
  getLocaleConfig,
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatFileSize,
  formatDuration,
  formatList,
  parseNumber,
  getTimezoneOffset,
  LocaleFormatter,
  createLocaleFormatter,
  LOCALE_CONFIGS
};