#!/usr/bin/env node

/**
 * Health check script for production monitoring
 * Tests critical application endpoints and services
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Health check configuration
const HEALTH_CONFIG = {
  timeout: 10000, // 10 seconds
  retries: 3,
  endpoints: [
    {
      name: 'Application Health',
      url: '/api/health',
      method: 'GET',
      expectedStatus: 200,
    },
    {
      name: 'Database Connection',
      url: '/api/health/database',
      method: 'GET',
      expectedStatus: 200,
    },
    {
      name: 'API Keys Status',
      url: '/api/health/keys',
      method: 'GET',
      expectedStatus: 200,
    },
  ],
};

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https://') ? https : http;
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, HEALTH_CONFIG.timeout);
    
    const req = protocol.request(url, {
      method: options.method || 'GET',
      timeout: HEALTH_CONFIG.timeout,
      ...options,
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
    
    req.end();
  });
}

async function checkEndpoint(endpoint, baseUrl) {
  const url = `${baseUrl}${endpoint.url}`;
  
  for (let attempt = 1; attempt <= HEALTH_CONFIG.retries; attempt++) {
    try {
      console.log(`🔍 Checking ${endpoint.name} (attempt ${attempt}/${HEALTH_CONFIG.retries})...`);
      
      const response = await makeRequest(url, {
        method: endpoint.method,
      });
      
      if (response.statusCode === endpoint.expectedStatus) {
        console.log(`✅ ${endpoint.name} - OK (${response.statusCode})`);
        return { success: true, response };
      } else {
        console.log(`❌ ${endpoint.name} - Unexpected status: ${response.statusCode}`);
        if (attempt === HEALTH_CONFIG.retries) {
          return { 
            success: false, 
            error: `Unexpected status: ${response.statusCode}`,
            response 
          };
        }
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name} - Error: ${error.message}`);
      if (attempt === HEALTH_CONFIG.retries) {
        return { success: false, error: error.message };
      }
    }
    
    // Wait before retry
    if (attempt < HEALTH_CONFIG.retries) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

function checkBuildArtifacts() {
  console.log('\n📦 Checking build artifacts...');
  
  const requiredFiles = [
    '.next/BUILD_ID',
    '.next/static',
    'public',
  ];
  
  const missing = [];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
      missing.push(file);
    } else {
      console.log(`✅ ${file} - Found`);
    }
  });
  
  if (missing.length > 0) {
    console.log('❌ Missing build artifacts:');
    missing.forEach(file => console.log(`  - ${file}`));
    return false;
  }
  
  return true;
}

function checkDiskSpace() {
  console.log('\n💾 Checking disk space...');
  
  try {
    const stats = fs.statSync(process.cwd());
    console.log('✅ Disk access - OK');
    return true;
  } catch (error) {
    console.log(`❌ Disk access - Error: ${error.message}`);
    return false;
  }
}

function checkMemoryUsage() {
  console.log('\n🧠 Checking memory usage...');
  
  const usage = process.memoryUsage();
  const formatBytes = (bytes) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };
  
  console.log(`📊 Memory usage:`);
  console.log(`  - RSS: ${formatBytes(usage.rss)}`);
  console.log(`  - Heap Used: ${formatBytes(usage.heapUsed)}`);
  console.log(`  - Heap Total: ${formatBytes(usage.heapTotal)}`);
  console.log(`  - External: ${formatBytes(usage.external)}`);
  
  // Check if memory usage is reasonable (less than 512MB for basic health check)
  const memoryLimitMB = 512;
  const currentUsageMB = usage.heapUsed / 1024 / 1024;
  
  if (currentUsageMB > memoryLimitMB) {
    console.log(`⚠️  High memory usage: ${currentUsageMB.toFixed(2)}MB > ${memoryLimitMB}MB`);
    return false;
  }
  
  console.log('✅ Memory usage - OK');
  return true;
}

async function runHealthChecks() {
  console.log('🏥 Tahitian Tutor - Health Check\n');
  
  // Basic system checks
  const buildOk = checkBuildArtifacts();
  const diskOk = checkDiskSpace();
  const memoryOk = checkMemoryUsage();
  
  // Determine base URL
  const port = process.env.PORT || 3000;
  const baseUrl = process.env.NEXTAUTH_URL || `http://localhost:${port}`;
  
  console.log(`\n🌐 Testing endpoints at: ${baseUrl}`);
  
  // Test endpoints if server is expected to be running
  let endpointResults = [];
  
  if (process.env.NODE_ENV === 'production' || process.argv.includes('--test-endpoints')) {
    console.log('\n🔗 Testing API endpoints...');
    
    for (const endpoint of HEALTH_CONFIG.endpoints) {
      const result = await checkEndpoint(endpoint, baseUrl);
      endpointResults.push(result);
    }
  } else {
    console.log('\n⏭️  Skipping endpoint tests (not in production mode)');
    console.log('   Use --test-endpoints flag to force endpoint testing');
  }
  
  // Generate report
  console.log('\n📋 Health Check Report:');
  console.log('========================');
  
  const systemChecks = [
    { name: 'Build Artifacts', passed: buildOk },
    { name: 'Disk Access', passed: diskOk },
    { name: 'Memory Usage', passed: memoryOk },
  ];
  
  systemChecks.forEach(check => {
    console.log(`${check.passed ? '✅' : '❌'} ${check.name}`);
  });
  
  if (endpointResults.length > 0) {
    console.log('\nAPI Endpoints:');
    endpointResults.forEach((result, index) => {
      const endpoint = HEALTH_CONFIG.endpoints[index];
      console.log(`${result.success ? '✅' : '❌'} ${endpoint.name}`);
    });
  }
  
  // Overall status
  const systemPassed = systemChecks.every(check => check.passed);
  const endpointsPassed = endpointResults.length === 0 || endpointResults.every(result => result.success);
  const overallPassed = systemPassed && endpointsPassed;
  
  console.log('\n' + '='.repeat(40));
  
  if (overallPassed) {
    console.log('🎉 Overall Status: HEALTHY');
    return true;
  } else {
    console.log('💥 Overall Status: UNHEALTHY');
    return false;
  }
}

async function main() {
  try {
    const healthy = await runHealthChecks();
    process.exit(healthy ? 0 : 1);
  } catch (error) {
    console.error('💥 Health check failed with error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  runHealthChecks,
  checkEndpoint,
  checkBuildArtifacts,
};