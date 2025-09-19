'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/hooks/useI18n';
import { isRTLLocale, getTextDirection } from '@/utils/rtl';
import { logger } from '@/utils/logger';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
}

const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    rtl: false
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    rtl: false
  },
  {
    code: 'ty',
    name: 'Tahitian',
    nativeName: 'Reo Tahiti',
    flag: '🇵🇫',
    rtl: false
  }
];

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact' | 'inline';
  className?: string;
  showFlag?: boolean;
  showNativeName?: boolean;
  onLanguageChange?: (locale: string) => void;
}

export function LanguageSwitcher({
  variant = 'default',
  className,
  showFlag = true,
  showNativeName = true,
  onLanguageChange
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();
  const { t } = useI18n();

  const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLocale) || SUPPORTED_LANGUAGES[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          break;
        case 'ArrowDown':
        case 'ArrowUp':
          event.preventDefault();
          // Focus management for keyboard navigation
          break;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleLanguageChange = async (newLocale: string) => {
    if (newLocale === currentLocale || isLoading) return;

    try {
      setIsLoading(true);
      logger.info('Language change initiated', { from: currentLocale, to: newLocale });

      // Store user preference
      localStorage.setItem('preferred-locale', newLocale);
      
      // Update document direction for RTL languages
      const isRTL = isRTLLocale(newLocale);
      document.documentElement.dir = getTextDirection(newLocale);
      document.documentElement.lang = newLocale;
      
      // Add RTL class to body if needed
      if (isRTL) {
        document.body.classList.add('rtl');
      } else {
        document.body.classList.remove('rtl');
      }

      // Call external handler if provided
      onLanguageChange?.(newLocale);

      // Navigate to the same page with new locale
      const newPath = pathname ? pathname.replace(/^\/[a-z]{2}/, `/${newLocale}`) : `/${newLocale}`;
      router.push(newPath);
      
      setIsOpen(false);
      
      logger.info('Language change completed', { locale: newLocale, path: newPath });
    } catch (error) {
      logger.error('Language change failed', { error, locale: newLocale });
    } finally {
      setIsLoading(false);
    }
  };

  const renderLanguageOption = (language: Language, isCurrent: boolean) => {
    const baseClasses = "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors";
    const stateClasses = isCurrent 
      ? "bg-primary/10 text-primary" 
      : "hover:bg-gray-100 dark:hover:bg-gray-800";
    
    return (
      <div
        key={language.code}
        className={cn(baseClasses, stateClasses)}
        onClick={() => handleLanguageChange(language.code)}
        role="option"
        aria-selected={isCurrent}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleLanguageChange(language.code);
          }
        }}
      >
        {showFlag && (
          <span className="text-lg" role="img" aria-label={`${language.name} flag`}>
            {language.flag}
          </span>
        )}
        <div className="flex flex-col">
          <span className="font-medium">{language.name}</span>
          {showNativeName && language.nativeName !== language.name && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {language.nativeName}
            </span>
          )}
        </div>
        {isCurrent && (
          <Check className="w-4 h-4 ml-auto text-primary" />
        )}
      </div>
    );
  };

  if (variant === 'inline') {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('common.language')}
        </label>
        <div className="grid grid-cols-1 gap-1">
          {SUPPORTED_LANGUAGES.map(language => 
            renderLanguageOption(language, language.code === currentLocale)
          )}
        </div>
      </div>
    );
  }

  const triggerClasses = cn(
    "flex items-center gap-2 px-3 py-2 rounded-md border transition-colors",
    "hover:bg-gray-50 dark:hover:bg-gray-800",
    "focus:outline-none focus:ring-2 focus:ring-primary/20",
    variant === 'compact' ? "text-sm" : "text-base",
    isLoading && "opacity-50 cursor-not-allowed",
    className
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className={triggerClasses}
        onClick={() => !isLoading && setIsOpen(!isOpen)}
        disabled={isLoading}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t('common.selectLanguage', { current: currentLanguage.name })}
      >
        {showFlag && (
          <span className="text-lg" role="img" aria-label={`${currentLanguage.name} flag`}>
            {currentLanguage.flag}
          </span>
        )}
        {variant !== 'compact' && (
          <span className="font-medium">
            {showNativeName ? currentLanguage.nativeName : currentLanguage.name}
          </span>
        )}
        <ChevronDown 
          className={cn(
            "w-4 h-4 transition-transform",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {isOpen && (
        <div 
          className={cn(
            "absolute top-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700",
            "rounded-md shadow-lg z-50 min-w-[200px]",
            "animate-in fade-in-0 zoom-in-95 duration-100"
          )}
          role="listbox"
          aria-label={t('common.languageOptions')}
        >
          {SUPPORTED_LANGUAGES.map(language => 
            renderLanguageOption(language, language.code === currentLocale)
          )}
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;