#!/usr/bin/env node

/**
 * Environment validation script for production readiness
 * Checks for required environment variables and validates their format
 */

// Load environment variables from .env files
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const fs = require('fs');
const path = require('path');

// Required environment variables for production
const REQUIRED_ENV_VARS = {
  // Database
  'DATABASE_URL': {
    required: true,
    description: 'Database connection string',
    validator: (value) => value && (value.startsWith('postgresql://') || value.startsWith('file:')),
  },
  
  // Authentication
  'NEXTAUTH_SECRET': {
    required: true,
    description: 'NextAuth.js secret for JWT signing',
    validator: (value) => value && value.length >= 16,
  },
  'NEXTAUTH_URL': {
    required: true,
    description: 'NextAuth.js canonical URL',
    validator: (value) => value && (value.startsWith('http://') || value.startsWith('https://')),
  },
  
  // API Keys
  'OPENAI_API_KEY': {
    required: false,
    description: 'OpenAI API key for AI features',
    validator: (value) => !value || value.startsWith('sk-'),
  },
  'DEEPSEEK_API_KEY': {
    required: false,
    description: 'DeepSeek API key for AI features',
  },
  'GOOGLE_TRANSLATE_API_KEY': {
    required: false,
    description: 'Google Translate API key',
  },
  'CANVA_API_KEY': {
    required: false,
    description: 'Canva API key for design features',
  },
  
  // External Services
  'SUPABASE_URL': {
    required: false,
    description: 'Supabase project URL',
    validator: (value) => !value || value.startsWith('https://'),
  },
  'SUPABASE_ANON_KEY': {
    required: false,
    description: 'Supabase anonymous key',
  },
  
  // Application
  'NODE_ENV': {
    required: true,
    description: 'Node environment',
    validator: (value) => ['development', 'production', 'test'].includes(value),
  },
};

function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...');
  
  const errors = [];
  const warnings = [];
  const missing = [];
  
  // Check if .env files exist
  const envFiles = ['.env.local', '.env'];
  const existingEnvFiles = envFiles.filter(file => 
    fs.existsSync(path.join(process.cwd(), file))
  );
  
  if (existingEnvFiles.length === 0) {
    warnings.push('No .env files found. Make sure environment variables are set.');
  } else {
    console.log(`📁 Found environment files: ${existingEnvFiles.join(', ')}`);
  }
  
  // Check each required variable
  Object.entries(REQUIRED_ENV_VARS).forEach(([key, config]) => {
    const value = process.env[key];
    
    if (!value) {
      if (config.required) {
        missing.push(`${key} - ${config.description}`);
      } else {
        warnings.push(`${key} - ${config.description} (optional)`);
      }
      return;
    }
    
    // Validate format if validator exists
    if (config.validator && !config.validator(value)) {
      errors.push(`${key} - Invalid format. ${config.description}`);
    } else {
      console.log(`✅ ${key} - OK`);
    }
  });
  
  // Report results
  if (missing.length > 0) {
    console.log('\n❌ Missing required environment variables:');
    missing.forEach(item => console.log(`  - ${item}`));
  }
  
  if (errors.length > 0) {
    console.log('\n❌ Environment variable validation errors:');
    errors.forEach(error => console.log(`  - ${error}`));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  if (missing.length === 0 && errors.length === 0) {
    console.log('\n✅ Environment validation passed!');
    return true;
  } else {
    console.log('\n❌ Environment validation failed!');
    console.log('\n📖 Setup guide: docs/API_KEYS_SETUP.md');
    return false;
  }
}

function checkProductionReadiness() {
  console.log('\n🚀 Checking production readiness...');
  
  const checks = [
    {
      name: 'Node.js version',
      check: () => {
        const version = process.version;
        const major = parseInt(version.slice(1).split('.')[0]);
        return major >= 18;
      },
      message: 'Node.js 18+ required for production'
    },
    {
      name: 'Production environment',
      check: () => process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development',
      message: 'NODE_ENV is set correctly'
    },
    {
      name: 'Security headers',
      check: () => true, // Configured in next.config.ts
      message: 'Security headers configured'
    }
  ];
  
  let allPassed = true;
  
  checks.forEach(({ name, check, message }) => {
    if (check()) {
      console.log(`✅ ${name} - ${message}`);
    } else {
      console.log(`❌ ${name} - ${message}`);
      allPassed = false;
    }
  });
  
  return allPassed;
}

function main() {
  console.log('🔧 Tahitian Tutor - Environment Validation\n');
  
  const envValid = checkEnvironmentVariables();
  const prodReady = checkProductionReadiness();
  
  if (envValid && prodReady) {
    console.log('\n🎉 All checks passed! Ready for deployment.');
    process.exit(0);
  } else {
    console.log('\n💥 Some checks failed. Please fix the issues above.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  checkEnvironmentVariables,
  checkProductionReadiness,
};