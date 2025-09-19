import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { translationService, TranslationLoadOptions, TranslationUpdateOptions } from '../services/TranslationService';
import { logger } from '../services/LoggingService';

export interface TranslationManagerState {
  isLoading: boolean;
  error: string | null;
  loadedNamespaces: Set<string>;
  lastUpdated: Date | null;
}

export interface TranslationManagerOptions {
  autoLoad?: boolean;
  preloadNamespaces?: string[];
  enableCache?: boolean;
  fallbackEnabled?: boolean;
}

export interface UseTranslationManagerReturn {
  // State
  state: TranslationManagerState;
  
  // Translation functions
  t: (key: string, values?: Record<string, any>) => string;
  loadNamespace: (namespace: string, options?: Partial<TranslationLoadOptions>) => Promise<void>;
  updateTranslation: (key: string, value: string, options?: Partial<TranslationUpdateOptions>) => Promise<void>;
  
  // Utility functions
  isNamespaceLoaded: (namespace: string) => boolean;
  getAvailableLocales: () => string[];
  getAvailableNamespaces: () => string[];
  preloadTranslations: (namespaces: string[]) => Promise<void>;
  clearCache: () => void;
  
  // Advanced features
  formatMessage: (key: string, values?: Record<string, any>, options?: { fallback?: string; plural?: number }) => string;
  hasTranslation: (key: string, namespace?: string) => boolean;
  getTranslationMetadata: (key: string) => any;
}

/**
 * Hook for managing dynamic translations with loading, caching, and updates
 */
export function useTranslationManager(
  defaultNamespace: string = 'common',
  options: TranslationManagerOptions = {}
): UseTranslationManagerReturn {
  const {
    autoLoad = true,
    preloadNamespaces = [],
    enableCache = true,
    fallbackEnabled = true
  } = options;

  const locale = useLocale();
  const t = useTranslations(defaultNamespace);
  
  const [state, setState] = useState<TranslationManagerState>({
    isLoading: false,
    error: null,
    loadedNamespaces: new Set(),
    lastUpdated: null
  });

  const dynamicTranslations = useRef<Record<string, Record<string, any>>>({});
  const loadingPromises = useRef<Map<string, Promise<void>>>(new Map());

  /**
   * Update state helper
   */
  const updateState = useCallback((updates: Partial<TranslationManagerState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Load a specific namespace
   */
  const loadNamespace = useCallback(async (
    namespace: string,
    loadOptions: Partial<TranslationLoadOptions> = {}
  ): Promise<void> => {
    const cacheKey = `${locale}:${namespace}`;
    
    // Check if already loading
    if (loadingPromises.current.has(cacheKey)) {
      return loadingPromises.current.get(cacheKey)!;
    }

    // Check if already loaded
    if (state.loadedNamespaces.has(namespace) && dynamicTranslations.current[namespace]) {
      return;
    }

    updateState({ isLoading: true, error: null });

    const loadPromise = translationService.loadTranslations({
      locale,
      namespace,
      cache: enableCache,
      fallback: fallbackEnabled,
      ...loadOptions
    })
    .then(translations => {
      dynamicTranslations.current[namespace] = translations;
      updateState({
        isLoading: false,
        loadedNamespaces: new Set([...state.loadedNamespaces, namespace]),
        lastUpdated: new Date()
      });
      
      logger.info('Namespace loaded successfully', { locale, namespace });
    })
    .catch(error => {
      updateState({ 
        isLoading: false, 
        error: `Failed to load namespace '${namespace}': ${error.message}` 
      });
      
      logger.error('Failed to load namespace', { locale, namespace, error });
      throw error;
    })
    .finally(() => {
      loadingPromises.current.delete(cacheKey);
    });

    loadingPromises.current.set(cacheKey, loadPromise);
    return loadPromise;
  }, [locale, state.loadedNamespaces, enableCache, fallbackEnabled]);

  /**
   * Update a translation
   */
  const updateTranslation = useCallback(async (
    key: string,
    value: string,
    updateOptions: Partial<TranslationUpdateOptions> = {}
  ): Promise<void> => {
    try {
      updateState({ isLoading: true, error: null });

      await translationService.updateTranslation({
        locale,
        namespace: defaultNamespace,
        key,
        value,
        ...updateOptions
      });

      // Update local cache
      const namespace = updateOptions.namespace || defaultNamespace;
      if (dynamicTranslations.current[namespace]) {
        dynamicTranslations.current[namespace][key] = value;
      }

      updateState({ 
        isLoading: false, 
        lastUpdated: new Date() 
      });
      
      logger.info('Translation updated successfully', { locale, key, namespace });
    } catch (error) {
      updateState({ 
        isLoading: false, 
        error: `Failed to update translation '${key}': ${error instanceof Error ? error.message : String(error)}` 
      });
      
      logger.error('Failed to update translation', { locale, key, error });
      throw error;
    }
  }, [locale, defaultNamespace]);

  /**
   * Check if namespace is loaded
   */
  const isNamespaceLoaded = useCallback((namespace: string): boolean => {
    return state.loadedNamespaces.has(namespace) && !!dynamicTranslations.current[namespace];
  }, [state.loadedNamespaces]);

  /**
   * Get available locales
   */
  const getAvailableLocales = useCallback((): string[] => {
    return translationService.getAvailableLocales();
  }, []);

  /**
   * Get available namespaces
   */
  const getAvailableNamespaces = useCallback((): string[] => {
    return translationService.getAvailableNamespaces();
  }, []);

  /**
   * Preload multiple namespaces
   */
  const preloadTranslations = useCallback(async (namespaces: string[]): Promise<void> => {
    try {
      updateState({ isLoading: true, error: null });
      
      const preloadList = namespaces.map(namespace => ({ locale, namespace }));
      await translationService.preloadTranslations(preloadList);
      
      // Update loaded namespaces
      const newLoadedNamespaces = new Set([...state.loadedNamespaces, ...namespaces]);
      updateState({ 
        isLoading: false, 
        loadedNamespaces: newLoadedNamespaces,
        lastUpdated: new Date()
      });
      
      logger.info('Namespaces preloaded successfully', { locale, namespaces });
    } catch (error) {
      updateState({ 
        isLoading: false, 
        error: `Failed to preload namespaces: ${error instanceof Error ? error.message : String(error)}` 
      });
      
      logger.error('Failed to preload namespaces', { locale, namespaces, error });
      throw error;
    }
  }, [locale, state.loadedNamespaces]);

  /**
   * Clear translation cache
   */
  const clearCache = useCallback((): void => {
    translationService.clearCache();
    dynamicTranslations.current = {};
    updateState({ 
      loadedNamespaces: new Set(),
      lastUpdated: new Date()
    });
    
    logger.info('Translation cache cleared', { locale });
  }, [locale]);

  /**
   * Format message with advanced options
   */
  const formatMessage = useCallback((
    key: string,
    values: Record<string, any> = {},
    options: { fallback?: string; plural?: number } = {}
  ): string => {
    try {
      // Try next-intl first
      const message = t(key, values);
      if (message && message !== key) {
        return message;
      }

      // Try dynamic translations
      const [namespace, ...keyParts] = key.split('.');
      const translationKey = keyParts.join('.');
      
      if (dynamicTranslations.current[namespace]?.[translationKey]) {
        let message = dynamicTranslations.current[namespace][translationKey];
        
        // Simple interpolation
        Object.entries(values).forEach(([placeholder, value]) => {
          message = message.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), String(value));
        });
        
        return message;
      }

      // Return fallback or key
      return options.fallback || key;
    } catch (error) {
      logger.warn('Failed to format message', { key, error });
      return options.fallback || key;
    }
  }, [t]);

  /**
   * Check if translation exists
   */
  const hasTranslation = useCallback((
    key: string,
    namespace?: string
  ): boolean => {
    try {
      // Check next-intl
      const message = t(key);
      if (message && message !== key) {
        return true;
      }

      // Check dynamic translations
      if (namespace && dynamicTranslations.current[namespace]?.[key]) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }, [t]);

  /**
   * Get translation metadata
   */
  const getTranslationMetadata = useCallback((key: string): any => {
    // This would typically come from the translation service
    // For now, return basic info
    return {
      key,
      locale,
      lastModified: state.lastUpdated,
      source: 'dynamic'
    };
  }, [locale, state.lastUpdated]);

  // Auto-load default namespace on mount
  useEffect(() => {
    if (autoLoad && !isNamespaceLoaded(defaultNamespace)) {
      loadNamespace(defaultNamespace).catch(() => {
        // Error already handled in loadNamespace
      });
    }
  }, [autoLoad, defaultNamespace, isNamespaceLoaded, loadNamespace]);

  // Preload specified namespaces
  useEffect(() => {
    if (preloadNamespaces.length > 0) {
      const namespacesToLoad = preloadNamespaces.filter(ns => !isNamespaceLoaded(ns));
      if (namespacesToLoad.length > 0) {
        preloadTranslations(namespacesToLoad).catch(() => {
          // Error already handled in preloadTranslations
        });
      }
    }
  }, [preloadNamespaces, isNamespaceLoaded, preloadTranslations]);

  return {
    state,
    t: formatMessage,
    loadNamespace,
    updateTranslation,
    isNamespaceLoaded,
    getAvailableLocales,
    getAvailableNamespaces,
    preloadTranslations,
    clearCache,
    formatMessage,
    hasTranslation,
    getTranslationMetadata
  };
}

export default useTranslationManager;