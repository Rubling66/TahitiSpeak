'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useCallback, useMemo } from 'react';
import { LocaleFormatter, createLocaleFormatter } from '../utils/localeFormatting';
import { RTLUtils } from '../utils/rtl';
import { logger } from '../services/LoggingService';

/**
 * Comprehensive i18n hook that provides translations, formatting, and locale utilities
 */
export function useI18n() {
  const t = useTranslations();
  const locale = useLocale();
  
  // Create memoized formatter instance
  const formatter = useMemo(() => {
    try {
      return createLocaleFormatter(locale);
    } catch (error) {
      logger.error('Failed to create locale formatter', { locale, error });
      return createLocaleFormatter('en'); // Fallback to English
    }
  }, [locale]);
  
  // Create memoized RTL utilities
  const rtlUtils = useMemo(() => {
    try {
      return new RTLUtils(locale);
    } catch (error) {
      logger.error('Failed to create RTL utils', { locale, error });
      return new RTLUtils('en'); // Fallback to English
    }
  }, [locale]);
  
  // Translation function with fallback
  const translate = useCallback((key: string, values?: Record<string, any>) => {
    try {
      return t(key, values);
    } catch (error) {
      logger.warn('Translation key not found', { key, locale, error });
      return key; // Return key as fallback
    }
  }, [t, locale]);
  
  // Rich translation function for complex content
  const translateRich = useCallback((key: string, values?: Record<string, any>) => {
    try {
      return t.rich(key, values);
    } catch (error) {
      logger.warn('Rich translation key not found', { key, locale, error });
      return key; // Return key as fallback
    }
  }, [t, locale]);
  
  // Date formatting functions
  const formatDate = useCallback((date: Date | string | number, options?: Partial<Intl.DateTimeFormatOptions>) => {
    return formatter.formatDate(date, options);
  }, [formatter]);
  
  const formatTime = useCallback((date: Date | string | number, options?: Partial<Intl.DateTimeFormatOptions>) => {
    return formatter.formatTime(date, options);
  }, [formatter]);
  
  const formatDateTime = useCallback((date: Date | string | number, options?: Partial<Intl.DateTimeFormatOptions>) => {
    return formatter.formatDateTime(date, options);
  }, [formatter]);
  
  const formatRelativeTime = useCallback((date: Date | string | number, baseDate?: Date) => {
    return formatter.formatRelativeTime(date, baseDate);
  }, [formatter]);
  
  // Number formatting functions
  const formatNumber = useCallback((number: number, options?: Partial<Intl.NumberFormatOptions>) => {
    return formatter.formatNumber(number, options);
  }, [formatter]);
  
  const formatCurrency = useCallback((amount: number, currency?: string, options?: Partial<Intl.NumberFormatOptions>) => {
    return formatter.formatCurrency(amount, currency, options);
  }, [formatter]);
  
  const formatPercentage = useCallback((value: number, options?: Partial<Intl.NumberFormatOptions>) => {
    return formatter.formatPercentage(value, options);
  }, [formatter]);
  
  // Utility formatting functions
  const formatFileSize = useCallback((bytes: number, options?: { binary?: boolean; precision?: number }) => {
    return formatter.formatFileSize(bytes, options);
  }, [formatter]);
  
  const formatDuration = useCallback((seconds: number, options?: { format?: 'short' | 'long'; showSeconds?: boolean }) => {
    return formatter.formatDuration(seconds, options);
  }, [formatter]);
  
  const formatList = useCallback((items: string[], options?: Partial<Intl.ListFormatOptions>) => {
    return formatter.formatList(items, options);
  }, [formatter]);
  
  // Parsing functions
  const parseNumber = useCallback((value: string) => {
    return formatter.parseNumber(value);
  }, [formatter]);
  
  // RTL functions
  const isRTL = useMemo(() => rtlUtils.isRTL, [rtlUtils]);
  const getTextDirection = useCallback(() => rtlUtils.direction, [rtlUtils]);
  const getRTLStyles = useCallback(() => rtlUtils.getCSSProperties(), [rtlUtils]);
  const applyRTLStyles = useCallback((styles: Record<string, any>) => rtlUtils.applyStyles(styles), [rtlUtils]);
  
  // Locale information
  const localeInfo = useMemo(() => ({
    locale,
    currency: formatter.currency,
    timezone: formatter.timezone,
    isRTL: formatter.isRTL,
    direction: rtlUtils.direction
  }), [locale, formatter, rtlUtils]);
  
  // Common translation shortcuts
  const common = useMemo(() => ({
    yes: translate('common.yes'),
    no: translate('common.no'),
    ok: translate('common.ok'),
    cancel: translate('common.cancel'),
    save: translate('common.save'),
    delete: translate('common.delete'),
    edit: translate('common.edit'),
    add: translate('common.add'),
    remove: translate('common.remove'),
    loading: translate('common.loading'),
    error: translate('common.error'),
    success: translate('common.success'),
    warning: translate('common.warning'),
    info: translate('common.info')
  }), [translate]);
  
  // Navigation translations
  const nav = useMemo(() => ({
    home: translate('nav.home'),
    dashboard: translate('nav.dashboard'),
    lessons: translate('nav.lessons'),
    community: translate('nav.community'),
    profile: translate('nav.profile'),
    admin: translate('nav.admin'),
    settings: translate('nav.settings'),
    logout: translate('nav.logout')
  }), [translate]);
  
  // Error translations
  const errors = useMemo(() => ({
    general: translate('errors.general'),
    network: translate('errors.network'),
    validation: translate('errors.validation'),
    unauthorized: translate('errors.unauthorized'),
    forbidden: translate('errors.forbidden'),
    notFound: translate('errors.notFound'),
    serverError: translate('errors.serverError')
  }), [translate]);
  
  // Success messages
  const success = useMemo(() => ({
    saved: translate('success.saved'),
    deleted: translate('success.deleted'),
    updated: translate('success.updated'),
    created: translate('success.created'),
    uploaded: translate('success.uploaded')
  }), [translate]);
  
  return {
    // Core translation functions
    t: translate,
    translate,
    translateRich,
    
    // Locale information
    locale,
    localeInfo,
    
    // Formatting functions
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
    
    // RTL functions
    isRTL,
    getTextDirection,
    getRTLStyles,
    applyRTLStyles,
    
    // Common translations
    common,
    nav,
    errors,
    success,
    
    // Utility objects
    formatter,
    rtlUtils
  };
}

/**
 * Hook for scoped translations (e.g., for a specific component or page)
 */
export function useScopedI18n(scope: string) {
  const t = useTranslations(scope);
  const locale = useLocale();
  
  const translate = useCallback((key: string, values?: Record<string, any>) => {
    try {
      return t(key, values);
    } catch (error) {
      logger.warn('Scoped translation key not found', { scope, key, locale, error });
      return key;
    }
  }, [t, scope, locale]);
  
  const translateRich = useCallback((key: string, values?: Record<string, any>) => {
    try {
      return t.rich(key, values);
    } catch (error) {
      logger.warn('Scoped rich translation key not found', { scope, key, locale, error });
      return key;
    }
  }, [t, scope, locale]);
  
  return {
    t: translate,
    translate,
    translateRich,
    locale,
    scope
  };
}

/**
 * Hook for form-specific translations and validation messages
 */
export function useFormI18n() {
  const { translate } = useI18n();
  
  const validation = useMemo(() => ({
    required: (field: string) => translate('validation.required', { field }),
    email: translate('validation.email'),
    password: translate('validation.password'),
    passwordConfirm: translate('validation.passwordConfirm'),
    minLength: (min: number) => translate('validation.minLength', { min }),
    maxLength: (max: number) => translate('validation.maxLength', { max }),
    pattern: translate('validation.pattern'),
    numeric: translate('validation.numeric'),
    url: translate('validation.url'),
    phone: translate('validation.phone')
  }), [translate]);
  
  const form = useMemo(() => ({
    submit: translate('form.submit'),
    reset: translate('form.reset'),
    clear: translate('form.clear'),
    search: translate('form.search'),
    filter: translate('form.filter'),
    sort: translate('form.sort'),
    upload: translate('form.upload'),
    download: translate('form.download')
  }), [translate]);
  
  return {
    validation,
    form,
    translate
  };
}

/**
 * Hook for date and time specific translations
 */
export function useDateTimeI18n() {
  const { translate, formatDate, formatTime, formatDateTime, formatRelativeTime } = useI18n();
  
  const dateTime = useMemo(() => ({
    today: translate('dateTime.today'),
    yesterday: translate('dateTime.yesterday'),
    tomorrow: translate('dateTime.tomorrow'),
    now: translate('dateTime.now'),
    never: translate('dateTime.never'),
    always: translate('dateTime.always'),
    weekdays: [
      translate('dateTime.weekdays.sunday'),
      translate('dateTime.weekdays.monday'),
      translate('dateTime.weekdays.tuesday'),
      translate('dateTime.weekdays.wednesday'),
      translate('dateTime.weekdays.thursday'),
      translate('dateTime.weekdays.friday'),
      translate('dateTime.weekdays.saturday')
    ],
    months: [
      translate('dateTime.months.january'),
      translate('dateTime.months.february'),
      translate('dateTime.months.march'),
      translate('dateTime.months.april'),
      translate('dateTime.months.may'),
      translate('dateTime.months.june'),
      translate('dateTime.months.july'),
      translate('dateTime.months.august'),
      translate('dateTime.months.september'),
      translate('dateTime.months.october'),
      translate('dateTime.months.november'),
      translate('dateTime.months.december')
    ]
  }), [translate]);
  
  return {
    dateTime,
    formatDate,
    formatTime,
    formatDateTime,
    formatRelativeTime,
    translate
  };
}

export default useI18n;