'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { locales, defaultLocale, getLocaleDirection } from './config';

// Import message files
import enMessages from '../messages/en.json';
import frMessages from '../messages/fr.json';
import tyMessages from '../messages/ty.json';

type Locale = 'en' | 'fr' | 'ty';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  direction: 'ltr' | 'rtl';
  messages: Record<string, any>;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const messageMap: Record<Locale, Record<string, any>> = {
  en: enMessages,
  fr: frMessages,
  ty: tyMessages,
};

interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (initialLocale) return initialLocale;
    
    // Check localStorage for saved preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('preferred-locale') as Locale;
      if (saved && locales.includes(saved)) {
        return saved;
      }
      
      // Check browser language
      const browserLang = navigator.language.split('-')[0] as Locale;
      if (locales.includes(browserLang)) {
        return browserLang;
      }
    }
    
    return defaultLocale as Locale;
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState(() => messageMap[locale]);
  const [direction, setDirection] = useState(() => getLocaleDirection(locale));

  const setLocale = async (newLocale: Locale) => {
    if (newLocale === locale) return;
    
    setIsLoading(true);
    
    try {
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('preferred-locale', newLocale);
      }
      
      // Update state
      setLocaleState(newLocale);
      setMessages(messageMap[newLocale]);
      setDirection(getLocaleDirection(newLocale));
      
      // Update document direction and lang
      if (typeof document !== 'undefined') {
        document.documentElement.dir = getLocaleDirection(newLocale);
        document.documentElement.lang = newLocale;
      }
    } catch (error) {
      console.error('Failed to change locale:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Set initial document attributes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = direction;
      document.documentElement.lang = locale;
    }
  }, [locale, direction]);

  const contextValue: I18nContextType = {
    locale,
    setLocale,
    direction,
    messages,
    isLoading,
  };

  return (
    <I18nContext.Provider value={contextValue}>
      <IntlProvider
        locale={locale}
        messages={messages}
        defaultLocale={defaultLocale}
        onError={(error) => {
          // Only log missing translation errors in development
          if (process.env.NODE_ENV === 'development') {
            console.warn('Translation error:', error);
          }
        }}
      >
        {children}
      </IntlProvider>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Hook for getting translated messages with type safety
export function useTranslations() {
  const { messages } = useI18n();
  
  const t = (key: string, values?: Record<string, any>): string => {
    const keys = key.split('.');
    let result: any = messages;
    
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key; // Return the key if translation is not found
      }
    }
    
    if (typeof result !== 'string') {
      console.warn(`Translation key does not resolve to string: ${key}`);
      return key;
    }
    
    // Simple variable substitution
    if (values) {
      return result.replace(/\{(\w+)\}/g, (match, variable) => {
        return values[variable] !== undefined ? String(values[variable]) : match;
      });
    }
    
    return result;
  };
  
  return { t };
}

// Hook for formatting numbers, dates, etc.
export function useFormatters() {
  const { locale } = useI18n();
  
  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(locale, options).format(value);
  };
  
  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions) => {
    return new Intl.DateTimeFormat(locale, options).format(date);
  };
  
  const formatRelativeTime = (value: number, unit: Intl.RelativeTimeFormatUnit) => {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(value, unit);
  };
  
  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(value);
  };
  
  return {
    formatNumber,
    formatDate,
    formatRelativeTime,
    formatCurrency,
  };
}

// Export types for external use
export type { Locale, I18nContextType };