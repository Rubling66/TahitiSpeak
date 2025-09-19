// Environment validation utilities for API key management

export interface EnvValidationResult {
  isValid: boolean;
  missingKeys: string[];
  invalidKeys: string[];
  warnings: string[];
  errors: string[];
}

export interface ApiKeyConfig {
  key: string;
  required: boolean;
  validator?: (value: string) => boolean;
  description: string;
  category: string;
}

// Define all API key configurations
export const API_KEY_CONFIGS: Record<string, ApiKeyConfig> = {
  // AI & Language Processing
  OPENAI_API_KEY: {
    key: 'OPENAI_API_KEY',
    required: true,
    validator: (value) => value.startsWith('sk-') && value.length > 20,
    description: 'OpenAI API key for AI content creation and cultural tutoring',
    category: 'AI & Language Processing'
  },
  DEEPSEEK_API_KEY: {
    key: 'DEEPSEEK_API_KEY',
    required: false,
    validator: (value) => value.startsWith('sk-') && value.length > 20,
    description: 'DeepSeek API key for enhanced AI features',
    category: 'AI & Language Processing'
  },

  // Translation Services
  GOOGLE_TRANSLATE_API_KEY: {
    key: 'GOOGLE_TRANSLATE_API_KEY',
    required: false,
    validator: (value) => value.length > 10 && !value.includes('your-'),
    description: 'Google Translate API key for real-time translation',
    category: 'Translation Services'
  },
  AZURE_TRANSLATE_API_KEY: {
    key: 'AZURE_TRANSLATE_API_KEY',
    required: false,
    validator: (value) => value.length > 10 && !value.includes('your-'),
    description: 'Azure Translator API key',
    category: 'Translation Services'
  },
  DEEPL_API_KEY: {
    key: 'DEEPL_API_KEY',
    required: false,
    validator: (value) => value.length > 10 && !value.includes('your-'),
    description: 'DeepL API key for high-quality translation',
    category: 'Translation Services'
  },
  AWS_TRANSLATE_ACCESS_KEY: {
    key: 'AWS_TRANSLATE_ACCESS_KEY',
    required: false,
    validator: (value) => value.length > 10 && !value.includes('your-'),
    description: 'AWS Translate access key',
    category: 'Translation Services'
  },

  // Design & Content Creation
  CANVA_API_KEY: {
    key: 'CANVA_API_KEY',
    required: false,
    validator: (value) => value.length > 10 && !value.includes('your-'),
    description: 'Canva API key for design integration',
    category: 'Design & Content Creation'
  },
  CANVA_CLIENT_ID: {
    key: 'CANVA_CLIENT_ID',
    required: false,
    validator: (value) => value.length > 10 && !value.includes('your-'),
    description: 'Canva Client ID for OAuth integration',
    category: 'Design & Content Creation'
  },

  // Authentication & SSO
  GOOGLE_SSO_CLIENT_ID: {
    key: 'GOOGLE_SSO_CLIENT_ID',
    required: false,
    validator: (value) => value.includes('.googleusercontent.com') || (value.length > 20 && !value.includes('your-')),
    description: 'Google SSO Client ID for authentication',
    category: 'Authentication & SSO'
  },
  NEXTAUTH_SECRET: {
    key: 'NEXTAUTH_SECRET',
    required: true,
    validator: (value) => value.length >= 32 && !value.includes('your-'),
    description: 'NextAuth secret for session encryption',
    category: 'Authentication & SSO'
  },

  // Database & Storage
  SUPABASE_URL: {
    key: 'SUPABASE_URL',
    required: true,
    validator: (value) => value.startsWith('https://') && value.includes('.supabase.co'),
    description: 'Supabase project URL',
    category: 'Database & Storage'
  },
  SUPABASE_ANON_KEY: {
    key: 'SUPABASE_ANON_KEY',
    required: true,
    validator: (value) => value.startsWith('eyJ') && value.length > 100,
    description: 'Supabase anonymous key',
    category: 'Database & Storage'
  },

  // LMS & Educational Integrations
  CANVAS_LTI_CONSUMER_KEY: {
    key: 'CANVAS_LTI_CONSUMER_KEY',
    required: false,
    validator: (value) => value.length > 10 && !value.includes('your-'),
    description: 'Canvas LTI consumer key',
    category: 'LMS & Educational Integrations'
  },

  // Communication & Notifications
  SENDGRID_API_KEY: {
    key: 'SENDGRID_API_KEY',
    required: false,
    validator: (value) => value.startsWith('SG.') && value.length > 20,
    description: 'SendGrid API key for email services',
    category: 'Communication & Notifications'
  }
};

/**
 * Validates all environment variables
 * Safe for client-side usage - returns default state
 */
export function validateEnvironment(): EnvValidationResult {
  const result: EnvValidationResult = {
    isValid: false,
    missingKeys: [],
    invalidKeys: [],
    warnings: [],
    errors: []
  };

  // For client-side, return default state
  // Actual validation should be done server-side via API
  Object.values(API_KEY_CONFIGS).forEach(config => {
    if (config.required) {
      result.missingKeys.push(config.key);
      result.errors.push(`Environment validation should be done server-side: ${config.key}`);
    }
  });

  return result;
}

/**
 * Validates a specific API key
 */
export function validateApiKey(keyName: string, value: string): { isValid: boolean; error?: string } {
  const config = API_KEY_CONFIGS[keyName];
  
  if (!config) {
    return { isValid: false, error: `Unknown API key: ${keyName}` };
  }
  
  if (!value) {
    return { isValid: false, error: `${keyName} is required` };
  }
  
  if (config.validator && !config.validator(value)) {
    return { isValid: false, error: `Invalid format for ${keyName}` };
  }
  
  if (value.includes('your-') || value.includes('replace-') || value.includes('example')) {
    return { isValid: false, error: `${keyName} appears to contain a placeholder value` };
  }
  
  return { isValid: true };
}

/**
 * Gets environment variables grouped by category
 */
export function getEnvironmentByCategory(): Record<string, ApiKeyConfig[]> {
  const categories: Record<string, ApiKeyConfig[]> = {};
  
  Object.values(API_KEY_CONFIGS).forEach(config => {
    if (!categories[config.category]) {
      categories[config.category] = [];
    }
    categories[config.category].push(config);
  });
  
  return categories;
}

/**
 * Gets the current status of all environment variables
 * Safe for client-side usage - doesn't access process.env directly
 */
export function getEnvironmentStatus(): Record<string, {
  configured: boolean;
  valid: boolean;
  required: boolean;
  value?: string;
  maskedValue?: string;
}> {
  const status: Record<string, any> = {};
  
  Object.values(API_KEY_CONFIGS).forEach(config => {
    // For client-side, we'll initialize with default values
    // Actual values should be fetched from API endpoints
    status[config.key] = {
      configured: false,
      valid: false,
      required: config.required,
      maskedValue: undefined
    };
  });
  
  return status;
}

/**
 * Masks an API key for display purposes
 */
export function maskApiKey(key: string): string {
  if (key.length <= 8) {
    return '*'.repeat(key.length);
  }
  
  const start = key.substring(0, 4);
  const end = key.substring(key.length - 4);
  const middle = '*'.repeat(key.length - 8);
  
  return `${start}${middle}${end}`;
}

/**
 * Checks if the application is properly configured for production
 * Safe for client-side usage - returns default state
 */
export function isProductionReady(): { ready: boolean; issues: string[] } {
  const validation = validateEnvironment();
  const issues: string[] = [];
  
  // Check for required keys
  if (validation.missingKeys.length > 0) {
    issues.push(`Missing required API keys: ${validation.missingKeys.join(', ')}`);
  }
  
  // Check for invalid keys
  if (validation.invalidKeys.length > 0) {
    issues.push(`Invalid API keys: ${validation.invalidKeys.join(', ')}`);
  }
  
  // For client-side, we can't check NODE_ENV reliably
  issues.push('Production readiness should be checked server-side');
  
  return {
    ready: false,
    issues
  };
}

/**
 * Logs environment validation results
 * Safe for client-side usage - logs default state
 */
export function logEnvironmentStatus(): void {
  const validation = validateEnvironment();
  
  console.log('🔧 Environment Validation Results (Client-side):');
  console.log(`✅ Valid: ${validation.isValid}`);
  
  if (validation.errors.length > 0) {
    console.log('❌ Errors:');
    validation.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  if (validation.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    validation.warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  const categories = getEnvironmentByCategory();
  Object.entries(categories).forEach(([category, configs]) => {
    console.log(`\n📁 ${category}:`);
    configs.forEach(config => {
      const status = config.required ? '❌' : '⚠️';
      console.log(`  ${status} ${config.key} ${config.required ? '(required)' : '(optional)'} - Check server-side`);
    });
  });
}