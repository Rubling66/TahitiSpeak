#!/usr/bin/env node

/**
 * API testing script for external service validation
 * Tests connectivity and authentication with third-party APIs
 */

const https = require('https');
const http = require('http');

// API test configurations
const API_TESTS = {
  openai: {
    name: 'OpenAI API',
    envKey: 'OPENAI_API_KEY',
    testEndpoint: 'https://api.openai.com/v1/models',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
    validator: (response) => {
      try {
        const data = JSON.parse(response.data);
        return data.data && Array.isArray(data.data);
      } catch {
        return false;
      }
    },
  },
  
  deepseek: {
    name: 'DeepSeek API',
    envKey: 'DEEPSEEK_API_KEY',
    testEndpoint: 'https://api.deepseek.com/v1/models',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
    validator: (response) => {
      return response.statusCode === 200;
    },
  },
  
  googleTranslate: {
    name: 'Google Translate API',
    envKey: 'GOOGLE_TRANSLATE_API_KEY',
    testEndpoint: 'https://translation.googleapis.com/language/translate/v2/languages',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
    }),
    urlParams: (apiKey) => `?key=${apiKey}`,
    validator: (response) => {
      try {
        const data = JSON.parse(response.data);
        return data.data && data.data.languages;
      } catch {
        return false;
      }
    },
  },
  
  canva: {
    name: 'Canva API',
    envKey: 'CANVA_API_KEY',
    testEndpoint: 'https://api.canva.com/rest/v1/users/me',
    headers: (apiKey) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
    validator: (response) => {
      return response.statusCode === 200;
    },
  },
  
  supabase: {
    name: 'Supabase API',
    envKey: 'SUPABASE_URL',
    testEndpoint: (url) => `${url}/rest/v1/`,
    headers: (apiKey) => {
      const anonKey = process.env.SUPABASE_ANON_KEY;
      return {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      };
    },
    validator: (response) => {
      return response.statusCode === 200;
    },
  },
};

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https://') ? https : http;
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout (10s)'));
    }, 10000);
    
    const req = protocol.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 10000,
    }, (res) => {
      clearTimeout(timeout);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
        });
      });
    });
    
    req.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testAPI(apiName, config) {
  console.log(`\n🔍 Testing ${config.name}...`);
  
  // Check if API key exists
  const apiKey = process.env[config.envKey];
  if (!apiKey) {
    console.log(`⏭️  Skipping ${config.name} - No API key found (${config.envKey})`);
    return { skipped: true, reason: 'No API key' };
  }
  
  try {
    // Prepare request
    let endpoint = config.testEndpoint;
    if (typeof endpoint === 'function') {
      endpoint = endpoint(apiKey);
    }
    
    if (config.urlParams) {
      endpoint += config.urlParams(apiKey);
    }
    
    const headers = config.headers ? config.headers(apiKey) : {};
    
    console.log(`📡 Requesting: ${endpoint.replace(apiKey, '[REDACTED]')}`);
    
    // Make request
    const response = await makeRequest(endpoint, {
      method: 'GET',
      headers: headers,
    });
    
    console.log(`📊 Response: ${response.statusCode}`);
    
    // Validate response
    const isValid = config.validator ? config.validator(response) : response.statusCode === 200;
    
    if (isValid) {
      console.log(`✅ ${config.name} - Connection successful`);
      return { success: true, statusCode: response.statusCode };
    } else {
      console.log(`❌ ${config.name} - Invalid response`);
      console.log(`   Status: ${response.statusCode}`);
      if (response.data && response.data.length < 500) {
        console.log(`   Response: ${response.data}`);
      }
      return { success: false, statusCode: response.statusCode, error: 'Invalid response' };
    }
    
  } catch (error) {
    console.log(`❌ ${config.name} - Connection failed`);
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

function checkEnvironmentSetup() {
  console.log('🔧 Checking environment setup...');
  
  const requiredForProduction = [
    'NODE_ENV',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];
  
  const missing = requiredForProduction.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.log('❌ Missing required environment variables:');
    missing.forEach(key => console.log(`   - ${key}`));
    return false;
  }
  
  console.log('✅ Core environment variables - OK');
  return true;
}

function generateReport(results) {
  console.log('\n📋 API Test Report:');
  console.log('===================');
  
  const categories = {
    successful: [],
    failed: [],
    skipped: [],
  };
  
  Object.entries(results).forEach(([apiName, result]) => {
    if (result.skipped) {
      categories.skipped.push({ name: apiName, reason: result.reason });
    } else if (result.success) {
      categories.successful.push({ name: apiName, status: result.statusCode });
    } else {
      categories.failed.push({ name: apiName, error: result.error });
    }
  });
  
  if (categories.successful.length > 0) {
    console.log('\n✅ Successful connections:');
    categories.successful.forEach(({ name, status }) => {
      console.log(`   - ${API_TESTS[name].name} (${status})`);
    });
  }
  
  if (categories.failed.length > 0) {
    console.log('\n❌ Failed connections:');
    categories.failed.forEach(({ name, error }) => {
      console.log(`   - ${API_TESTS[name].name}: ${error}`);
    });
  }
  
  if (categories.skipped.length > 0) {
    console.log('\n⏭️  Skipped (no API key):');
    categories.skipped.forEach(({ name, reason }) => {
      console.log(`   - ${API_TESTS[name].name}: ${reason}`);
    });
  }
  
  // Summary
  const totalTests = Object.keys(results).length;
  const successfulTests = categories.successful.length;
  const failedTests = categories.failed.length;
  const skippedTests = categories.skipped.length;
  
  console.log('\n📊 Summary:');
  console.log(`   Total APIs: ${totalTests}`);
  console.log(`   Successful: ${successfulTests}`);
  console.log(`   Failed: ${failedTests}`);
  console.log(`   Skipped: ${skippedTests}`);
  
  return {
    total: totalTests,
    successful: successfulTests,
    failed: failedTests,
    skipped: skippedTests,
  };
}

async function main() {
  console.log('🧪 Tahitian Tutor - API Testing\n');
  
  // Check basic environment
  const envOk = checkEnvironmentSetup();
  
  if (!envOk) {
    console.log('\n💥 Environment check failed. Please fix the issues above.');
    process.exit(1);
  }
  
  // Test all APIs
  const results = {};
  
  for (const [apiName, config] of Object.entries(API_TESTS)) {
    results[apiName] = await testAPI(apiName, config);
  }
  
  // Generate report
  const summary = generateReport(results);
  
  console.log('\n' + '='.repeat(40));
  
  if (summary.failed === 0) {
    console.log('🎉 All configured APIs are working!');
    if (summary.skipped > 0) {
      console.log('💡 Tip: Configure skipped APIs for full functionality.');
    }
    process.exit(0);
  } else {
    console.log('💥 Some API connections failed.');
    console.log('📖 Check the API_KEYS_SETUP.md guide for configuration help.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  testAPI,
  API_TESTS,
  generateReport,
};