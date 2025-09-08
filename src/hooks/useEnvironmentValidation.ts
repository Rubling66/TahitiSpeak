// React hook for environment validation and API key management

import { useState, useEffect, useCallback } from 'react';
import { 
  validateEnvironment, 
  validateApiKey, 
  getEnvironmentStatus, 
  getEnvironmentByCategory,
  isProductionReady,
  EnvValidationResult,
  ApiKeyConfig
} from '../utils/envValidation';

export interface EnvironmentHookState {
  validation: EnvValidationResult | null;
  status: Record<string, any>;
  categories: Record<string, ApiKeyConfig[]>;
  productionReady: { ready: boolean; issues: string[] };
  isLoading: boolean;
  lastChecked: Date | null;
}

export interface EnvironmentHookActions {
  validateAll: () => Promise<void>;
  validateSingle: (keyName: string, value: string) => Promise<{ isValid: boolean; error?: string }>;
  refreshStatus: () => Promise<void>;
  testConnection: (keyName: string) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Hook for managing environment validation and API key status
 */
export function useEnvironmentValidation(): EnvironmentHookState & EnvironmentHookActions {
  const [state, setState] = useState<EnvironmentHookState>({
    validation: null,
    status: {},
    categories: {},
    productionReady: { ready: false, issues: [] },
    isLoading: true,
    lastChecked: null
  });

  /**
   * Validates all environment variables
   */
  const validateAll = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const validation = validateEnvironment();
      const status = getEnvironmentStatus();
      const categories = getEnvironmentByCategory();
      const productionReady = isProductionReady();
      
      setState(prev => ({
        ...prev,
        validation,
        status,
        categories,
        productionReady,
        isLoading: false,
        lastChecked: new Date()
      }));
    } catch (error) {
      console.error('Error validating environment:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  /**
   * Validates a single API key
   */
  const validateSingle = useCallback(async (keyName: string, value: string) => {
    try {
      const result = validateApiKey(keyName, value);
      
      // Update the status for this specific key
      setState(prev => ({
        ...prev,
        status: {
          ...prev.status,
          [keyName]: {
            ...prev.status[keyName],
            configured: !!value,
            valid: result.isValid
          }
        }
      }));
      
      return result;
    } catch (error) {
      console.error(`Error validating ${keyName}:`, error);
      return { isValid: false, error: 'Validation failed' };
    }
  }, []);

  /**
   * Refreshes the environment status
   */
  const refreshStatus = useCallback(async () => {
    await validateAll();
  }, [validateAll]);

  /**
   * Tests connection for a specific API key
   */
  const testConnection = useCallback(async (keyName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const value = process.env[keyName];
      if (!value) {
        return { success: false, error: 'API key not configured' };
      }

      // Test connection based on the API type
      switch (keyName) {
        case 'OPENAI_API_KEY':
          return await testOpenAIConnection(value);
        case 'DEEPSEEK_API_KEY':
          return await testDeepSeekConnection(value);
        case 'GOOGLE_TRANSLATE_API_KEY':
          return await testGoogleTranslateConnection(value);
        case 'CANVA_API_KEY':
          return await testCanvaConnection(value);
        case 'SUPABASE_URL':
          return await testSupabaseConnection(value);
        default:
          return { success: true }; // Default to success for unknown APIs
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Connection test failed' };
    }
  }, []);

  // Initialize validation on mount
  useEffect(() => {
    validateAll();
  }, [validateAll]);

  return {
    ...state,
    validateAll,
    validateSingle,
    refreshStatus,
    testConnection
  };
}

/**
 * Test OpenAI API connection
 */
async function testOpenAIConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      return { success: true };
    } else {
      const error = await response.text();
      return { success: false, error: `OpenAI API error: ${response.status}` };
    }
  } catch (error) {
    return { success: false, error: 'Failed to connect to OpenAI API' };
  }
}

/**
 * Test DeepSeek API connection
 */
async function testDeepSeekConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    // DeepSeek API test - adjust endpoint as needed
    const response = await fetch('https://api.deepseek.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: `DeepSeek API error: ${response.status}` };
    }
  } catch (error) {
    return { success: false, error: 'Failed to connect to DeepSeek API' };
  }
}

/**
 * Test Google Translate API connection
 */
async function testGoogleTranslateConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2/languages?key=${apiKey}`);
    
    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: `Google Translate API error: ${response.status}` };
    }
  } catch (error) {
    return { success: false, error: 'Failed to connect to Google Translate API' };
  }
}

/**
 * Test Canva API connection
 */
async function testCanvaConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Canva API test - adjust endpoint as needed
    const response = await fetch('https://api.canva.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: `Canva API error: ${response.status}` };
    }
  } catch (error) {
    return { success: false, error: 'Failed to connect to Canva API' };
  }
}

/**
 * Test Supabase connection
 */
async function testSupabaseConnection(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200 || response.status === 401) {
      // 401 is expected without proper auth, but means the endpoint is reachable
      return { success: true };
    } else {
      return { success: false, error: `Supabase connection error: ${response.status}` };
    }
  } catch (error) {
    return { success: false, error: 'Failed to connect to Supabase' };
  }
}

/**
 * Hook for monitoring environment changes
 */
export function useEnvironmentMonitor(intervalMs: number = 30000) {
  const { validateAll, validation } = useEnvironmentValidation();
  
  useEffect(() => {
    const interval = setInterval(() => {
      validateAll();
    }, intervalMs);
    
    return () => clearInterval(interval);
  }, [validateAll, intervalMs]);
  
  return validation;
}