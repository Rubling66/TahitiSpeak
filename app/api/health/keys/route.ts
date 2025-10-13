import { NextRequest, NextResponse } from 'next/server';

/**
 * API Keys health check endpoint
 * Tests the availability and basic validation of configured API keys
 */

interface ApiKeyStatus {
  configured: boolean;
  valid?: boolean;
  error?: string;
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  apiKeys: Record<string, ApiKeyStatus>;
  summary: {
    total: number;
    configured: number;
    valid: number;
    errors: number;
  };
}

// API key validation patterns
const API_KEY_PATTERNS = {
  OPENAI_API_KEY: /^sk-[a-zA-Z0-9]{48,}$/,
  DEEPSEEK_API_KEY: /^sk-[a-zA-Z0-9-_]{20,}$/,
  GOOGLE_TRANSLATE_API_KEY: /^[a-zA-Z0-9-_]{20,}$/,
  CANVA_API_KEY: /^[a-zA-Z0-9-_]{20,}$/,
  SUPABASE_ANON_KEY: /^eyJ[a-zA-Z0-9-_=]+\.[a-zA-Z0-9-_=]+\.[a-zA-Z0-9-_=]+$/,
  NEXTAUTH_SECRET: /.{32,}/, // At least 32 characters
};

// Required vs optional API keys
const REQUIRED_KEYS = [
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
];

const OPTIONAL_KEYS = [
  'OPENAI_API_KEY',
  'DEEPSEEK_API_KEY',
  'GOOGLE_TRANSLATE_API_KEY',
  'CANVA_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
];

function validateApiKey(key: string, value: string | undefined): ApiKeyStatus {
  if (!value) {
    return { configured: false };
  }

  // Check for placeholder values
  const placeholders = [
    'your-api-key-here',
    'sk-xxx',
    'your-key',
    'replace-me',
    'todo',
    'changeme',
  ];
  
  if (placeholders.some(placeholder => 
    value.toLowerCase().includes(placeholder.toLowerCase())
  )) {
    return {
      configured: true,
      valid: false,
      error: 'Placeholder value detected',
    };
  }

  // Validate format if pattern exists
  const pattern = API_KEY_PATTERNS[key as keyof typeof API_KEY_PATTERNS];
  if (pattern && !pattern.test(value)) {
    return {
      configured: true,
      valid: false,
      error: 'Invalid format',
    };
  }

  return {
    configured: true,
    valid: true,
  };
}

function checkEnvironmentUrls(): Record<string, ApiKeyStatus> {
  const urls = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
  };

  const results: Record<string, ApiKeyStatus> = {};

  Object.entries(urls).forEach(([key, value]) => {
    if (!value) {
      results[key] = { configured: false };
      return;
    }

    try {
      const url = new URL(value);
      const isValidProtocol = ['http:', 'https:'].includes(url.protocol);
      
      results[key] = {
        configured: true,
        valid: isValidProtocol && url.hostname.length > 0,
        error: !isValidProtocol ? 'Invalid protocol' : undefined,
      };
    } catch (error) {
      results[key] = {
        configured: true,
        valid: false,
        error: 'Invalid URL format',
      };
    }
  });

  return results;
}

export async function GET(request: NextRequest) {
  try {
    const results: Record<string, ApiKeyStatus> = {};
    
    // Check all API keys
    [...REQUIRED_KEYS, ...OPTIONAL_KEYS].forEach(key => {
      if (key.includes('URL')) {
        // URLs are handled separately
        return;
      }
      
      const value = process.env[key];
      results[key] = validateApiKey(key, value);
    });

    // Check URLs separately
    const urlResults = checkEnvironmentUrls();
    Object.assign(results, urlResults);

    // Calculate summary
    const summary = {
      total: Object.keys(results).length,
      configured: Object.values(results).filter(r => r.configured).length,
      valid: Object.values(results).filter(r => r.valid).length,
      errors: Object.values(results).filter(r => r.configured && !r.valid).length,
    };

    // Determine overall status
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    
    // Check if required keys are missing or invalid
    const requiredKeyIssues = REQUIRED_KEYS.some(key => {
      const result = results[key];
      return !result?.configured || !result?.valid;
    });

    if (requiredKeyIssues) {
      status = 'unhealthy';
    } else if (summary.errors > 0) {
      status = 'degraded';
    }

    const response: HealthResponse = {
      status,
      timestamp: new Date().toISOString(),
      apiKeys: results,
      summary,
    };

    // Return appropriate HTTP status
    const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
    
    return NextResponse.json(response, { status: httpStatus });
    
  } catch (error) {
    console.error('API keys health check error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        apiKeys: {},
        summary: {
          total: 0,
          configured: 0,
          valid: 0,
          errors: 1,
        },
      },
      { status: 500 }
    );
  }
}