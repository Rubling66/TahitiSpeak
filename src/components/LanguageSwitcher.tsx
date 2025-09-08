'use client';

import React, { useState } from 'react';
import { ChevronDown, Globe, Check } from 'lucide-react';
import { useI18n, useTranslations, type Locale } from '../i18n/provider';
import { locales } from '../i18n/config';

interface LanguageOption {
  code: Locale;
  name: string;
  nativeName: string;
  flag: string;
}

const languageOptions: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
  },
  {
    code: 'ty',
    name: 'Tahitian',
    nativeName: 'Reo Tahiti',
    flag: '🇵🇫',
  },
];

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'inline' | 'compact';
  showFlag?: boolean;
  showNativeName?: boolean;
  className?: string;
}

export function LanguageSwitcher({
  variant = 'dropdown',
  showFlag = true,
  showNativeName = true,
  className = '',
}: LanguageSwitcherProps) {
  const { locale, setLocale, isLoading } = useI18n();
  const { t } = useTranslations();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languageOptions.find(lang => lang.code === locale);

  const handleLanguageChange = async (newLocale: Locale) => {
    if (newLocale !== locale) {
      await setLocale(newLocale);
      setIsOpen(false);
    }
  };

  if (variant === 'inline') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Globe className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">
          {t('common.language')}:
        </span>
        <div className="flex space-x-1">
          {languageOptions.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              disabled={isLoading}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                locale === lang.code
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {showFlag && <span className="mr-1">{lang.flag}</span>}
              {showNativeName ? lang.nativeName : lang.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className={`flex items-center space-x-1 px-2 py-1 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          aria-label={t('common.language')}
        >
          {showFlag && currentLanguage && (
            <span className="text-sm">{currentLanguage.flag}</span>
          )}
          <span className="text-xs font-medium">
            {currentLanguage?.code.toUpperCase()}
          </span>
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
              <div className="py-1">
                {languageOptions.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    disabled={isLoading}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
                      locale === lang.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center space-x-2">
                      {showFlag && <span>{lang.flag}</span>}
                      <span>{showNativeName ? lang.nativeName : lang.name}</span>
                    </div>
                    {locale === lang.code && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('common.language')}
      >
        <div className="flex items-center space-x-2">
          <Globe className="h-4 w-4 text-gray-500" />
          {currentLanguage && (
            <>
              {showFlag && <span>{currentLanguage.flag}</span>}
              <span className="font-medium">
                {showNativeName ? currentLanguage.nativeName : currentLanguage.name}
              </span>
            </>
          )}
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1 w-full min-w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
            <div className="py-1" role="listbox">
              {languageOptions.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
                    locale === lang.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  role="option"
                  aria-selected={locale === lang.code}
                >
                  <div className="flex items-center space-x-2">
                    {showFlag && <span>{lang.flag}</span>}
                    <div className="text-left">
                      <div className="font-medium">
                        {showNativeName ? lang.nativeName : lang.name}
                      </div>
                      {showNativeName && lang.name !== lang.nativeName && (
                        <div className="text-xs text-gray-500">{lang.name}</div>
                      )}
                    </div>
                  </div>
                  {locale === lang.code && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Hook for getting language information
export function useLanguageInfo() {
  const { locale } = useI18n();
  const currentLanguage = languageOptions.find(lang => lang.code === locale);
  
  return {
    currentLanguage,
    availableLanguages: languageOptions,
    isRTL: false, // None of our supported languages are RTL
  };
}

export default LanguageSwitcher;