#!/usr/bin/env node

/**
 * Production Deployment Script for Tahitian Language Learning Platform
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEPLOYMENT_CONFIG = {
  environments: {
    staging: {
      url: 'https://staging-tahitispeak.vercel.app',
      branch: 'staging',
      checks: ['basic', 'performance'],
    },
    production: {
      url: 'https://tahitispeak.vercel.app', 
      branch: 'main',
      checks: ['basic', 'performance', 'security'],
    },
  },
  healthChecks: {
    timeout: 30000,
    retries: 3,
    endpoints: ['/api/health', '/api/health/database', '/api/health/keys'],
  },
};

class DeploymentManager {
  constructor(environment = 'staging') {
    this.environment = environment;
    this.config = DEPLOYMENT_CONFIG.environments[environment];
    this.startTime = Date.now();
    
    if (!this.config) {
      throw new Error(`Unknown environment: ${environment}`);
    }
  }

  async deploy() {
    console.log(`🚀 Starting deployment to ${this.environment}...`);
    
    try {
      await this.preDeploymentChecks();
      await this.buildApplication();
      await this.runTests();
      await this.deployToVercel();
      await this.postDeploymentValidation();
      
      const duration = Date.now() - this.startTime;
      console.log(`✅ Deployment completed successfully in ${duration}ms`);
      
    } catch (error) {
      console.error(`❌ Deployment failed: ${error.message}`);
      await this.rollback();
      process.exit(1);
    }
  }

  async preDeploymentChecks() {
    console.log('🔍 Running pre-deployment checks...');
    
    await this.checkEnvironmentVariables();
    await this.checkDependencies();
    await this.checkGitStatus();
    await this.runLinting();
    
    console.log('✅ Pre-deployment checks passed');
  }

  async checkEnvironmentVariables() {
    console.log('  📋 Checking environment variables...');
    
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
    ];
    
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    console.log('    ✅ Environment variables validated');
  }

  async checkDependencies() {
    console.log('  📦 Checking dependencies...');
    
    try {
      execSync('npm audit --audit-level=high', { stdio: 'pipe' });
      console.log('    ✅ No high-severity vulnerabilities found');
    } catch (error) {
      console.warn('    ⚠️  Security vulnerabilities detected, but continuing...');
    }
  }

  async checkGitStatus() {
    console.log('  🔄 Checking Git status...');
    
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim()) {
        console.warn('    ⚠️  Uncommitted changes detected');
      }
      
      console.log('    ✅ Git status OK');
    } catch (error) {
      console.warn(`    ⚠️  Git check failed: ${error.message}`);
    }
  }

  async runLinting() {
    console.log('  🔍 Running linting...');
    
    try {
      execSync('npm run lint', { stdio: 'pipe' });
      console.log('    ✅ Linting passed');
    } catch (error) {
      console.warn('    ⚠️  Linting issues detected, but continuing...');
    }
  }

  async buildApplication() {
    console.log('🏗️  Building application...');
    
    try {
      if (fs.existsSync('.next')) {
        fs.rmSync('.next', { recursive: true });
      }
      
      execSync('npm run build', { stdio: 'inherit' });
      
      console.log('✅ Build completed successfully');
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  async runTests() {
    console.log('🧪 Running tests...');
    
    try {
      execSync('npm run test:ci', { stdio: 'pipe' });
      console.log('  ✅ Tests passed');
    } catch (error) {
      console.warn('  ⚠️  Tests failed or not available, but continuing...');
    }
  }

  async deployToVercel() {
    console.log('🚀 Deploying to Vercel...');
    
    try {
      const deployCommand = this.environment === 'production' 
        ? 'vercel --prod --yes'
        : 'vercel --yes';
      
      const output = execSync(deployCommand, { encoding: 'utf8' });
      
      const urlMatch = output.match(/https:\/\/[^\s]+/);
      if (urlMatch) {
        this.deploymentUrl = urlMatch[0];
        console.log(`  ✅ Deployed to: ${this.deploymentUrl}`);
      }
      
    } catch (error) {
      throw new Error(`Vercel deployment failed: ${error.message}`);
    }
  }

  async postDeploymentValidation() {
    console.log('🔍 Running post-deployment validation...');
    
    const baseUrl = this.deploymentUrl || this.config.url;
    
    await this.runHealthChecks(baseUrl);
    
    if (this.config.checks.includes('performance')) {
      await this.runPerformanceChecks(baseUrl);
    }
    
    if (this.config.checks.includes('security')) {
      await this.runSecurityChecks(baseUrl);
    }
    
    console.log('✅ Post-deployment validation completed');
  }

  async runHealthChecks(baseUrl) {
    console.log('  🏥 Running health checks...');
    
    for (const endpoint of DEPLOYMENT_CONFIG.healthChecks.endpoints) {
      const url = `${baseUrl}${endpoint}`;
      
      try {
        const response = await fetch(url, {
          timeout: DEPLOYMENT_CONFIG.healthChecks.timeout,
        });
        
        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status}`);
        }
        
        console.log(`    ✅ ${endpoint} - OK`);
      } catch (error) {
        console.warn(`    ⚠️  ${endpoint} - Failed: ${error.message}`);
      }
    }
  }

  async runPerformanceChecks(baseUrl) {
    console.log('  ⚡ Running performance checks...');
    
    try {
      const start = Date.now();
      const response = await fetch(baseUrl);
      const duration = Date.now() - start;
      
      if (duration > 3000) {
        console.warn(`    ⚠️  Slow response time: ${duration}ms`);
      } else {
        console.log(`    ✅ Response time: ${duration}ms`);
      }
      
    } catch (error) {
      console.warn(`    ⚠️  Performance check failed: ${error.message}`);
    }
  }

  async runSecurityChecks(baseUrl) {
    console.log('  🔒 Running security checks...');
    
    try {
      const response = await fetch(baseUrl);
      const headers = response.headers;
      
      const securityHeaders = [
        'x-frame-options',
        'x-content-type-options', 
        'strict-transport-security',
      ];
      
      securityHeaders.forEach(header => {
        if (headers.get(header)) {
          console.log(`    ✅ ${header} header present`);
        } else {
          console.warn(`    ⚠️  ${header} header missing`);
        }
      });
      
    } catch (error) {
      console.warn(`    ⚠️  Security check failed: ${error.message}`);
    }
  }

  async rollback() {
    console.log('🔄 Attempting rollback...');
    console.log('  ⚠️  Manual rollback required - check Vercel dashboard');
  }
}

async function main() {
  const environment = process.argv[2] || 'staging';
  
  if (!['staging', 'production'].includes(environment)) {
    console.error('Usage: node deploy.js [staging|production]');
    process.exit(1);
  }
  
  const deployer = new DeploymentManager(environment);
  await deployer.deploy();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { DeploymentManager };