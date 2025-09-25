#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive Test Validation Script
 * Runs all test suites and validates production readiness
 */

class TestValidator {
  constructor() {
    this.results = {
      unit: { passed: false, error: null },
      build: { passed: false, error: null },
      lint: { passed: false, error: null },
      typecheck: { passed: false, error: null },
      coverage: { passed: false, percentage: 0 }
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]}${message}${colors.reset}`);
  }

  async runCommand(command, description) {
    this.log(`\n🔄 ${description}...`, 'info');
    try {
      const output = execSync(command, { 
        encoding: 'utf8', 
        stdio: 'pipe',
        cwd: process.cwd()
      });
      this.log(`✅ ${description} - PASSED`, 'success');
      return { success: true, output };
    } catch (error) {
      this.log(`❌ ${description} - FAILED`, 'error');
      this.log(`Error: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async validateUnitTests() {
    const result = await this.runCommand(
      'npm run test:unit -- --watchAll=false',
      'Running Unit Tests'
    );
    this.results.unit = { 
      passed: result.success, 
      error: result.error 
    };
    return result.success;
  }

  async validateBuild() {
    const result = await this.runCommand(
      'npm run build',
      'Building Application'
    );
    this.results.build = { 
      passed: result.success, 
      error: result.error 
    };
    return result.success;
  }

  async validateLinting() {
    const result = await this.runCommand(
      'npm run lint',
      'Running ESLint'
    );
    this.results.lint = { 
      passed: result.success, 
      error: result.error 
    };
    return result.success;
  }

  async validateTypeCheck() {
    const result = await this.runCommand(
      'npm run type-check',
      'Running TypeScript Check'
    );
    this.results.typecheck = { 
      passed: result.success, 
      error: result.error 
    };
    return result.success;
  }

  async validateCoverage() {
    const result = await this.runCommand(
      'npm run test:ci',
      'Running Coverage Analysis'
    );
    
    if (result.success) {
      // Try to read coverage summary
      try {
        const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
        if (fs.existsSync(coveragePath)) {
          const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
          const totalCoverage = coverage.total.lines.pct;
          this.results.coverage = {
            passed: totalCoverage >= 80,
            percentage: totalCoverage
          };
          this.log(`📊 Code Coverage: ${totalCoverage}%`, totalCoverage >= 80 ? 'success' : 'warning');
        }
      } catch (error) {
        this.log(`⚠️  Could not read coverage report: ${error.message}`, 'warning');
      }
    }
    
    return result.success;
  }

  async validateEnvironment() {
    this.log('\n🔍 Validating Environment Configuration...', 'info');
    
    const requiredFiles = [
      '.env.local',
      'next.config.js',
      'package.json',
      'tsconfig.json'
    ];
    
    let allFilesExist = true;
    for (const file of requiredFiles) {
      if (fs.existsSync(path.join(process.cwd(), file))) {
        this.log(`✅ ${file} exists`, 'success');
      } else {
        this.log(`❌ ${file} missing`, 'error');
        allFilesExist = false;
      }
    }
    
    return allFilesExist;
  }

  async validateI18n() {
    this.log('\n🌐 Validating Internationalization...', 'info');
    
    const localesDir = path.join(process.cwd(), 'src', 'locales');
    const requiredLocales = ['en', 'fr', 'ty'];
    
    let allLocalesExist = true;
    for (const locale of requiredLocales) {
      const localePath = path.join(localesDir, `${locale}.json`);
      if (fs.existsSync(localePath)) {
        this.log(`✅ ${locale} locale exists`, 'success');
      } else {
        this.log(`❌ ${locale} locale missing`, 'error');
        allLocalesExist = false;
      }
    }
    
    return allLocalesExist;
  }

  generateReport() {
    this.log('\n📋 TEST VALIDATION REPORT', 'info');
    this.log('=' .repeat(50), 'info');
    
    const tests = [
      { name: 'Unit Tests', result: this.results.unit },
      { name: 'Build Process', result: this.results.build },
      { name: 'Linting', result: this.results.lint },
      { name: 'Type Checking', result: this.results.typecheck },
      { name: 'Code Coverage', result: this.results.coverage }
    ];
    
    let allPassed = true;
    
    tests.forEach(test => {
      const status = test.result.passed ? '✅ PASS' : '❌ FAIL';
      const color = test.result.passed ? 'success' : 'error';
      this.log(`${test.name}: ${status}`, color);
      
      if (test.name === 'Code Coverage' && test.result.percentage) {
        this.log(`  Coverage: ${test.result.percentage}%`, color);
      }
      
      if (!test.result.passed) {
        allPassed = false;
        if (test.result.error) {
          this.log(`  Error: ${test.result.error}`, 'error');
        }
      }
    });
    
    this.log('=' .repeat(50), 'info');
    
    if (allPassed) {
      this.log('🎉 ALL TESTS PASSED - PRODUCTION READY!', 'success');
      return true;
    } else {
      this.log('⚠️  SOME TESTS FAILED - REVIEW REQUIRED', 'warning');
      return false;
    }
  }

  async run() {
    this.log('🚀 Starting Comprehensive Test Validation...', 'info');
    
    // Run all validations
    await this.validateEnvironment();
    await this.validateI18n();
    await this.validateLinting();
    await this.validateTypeCheck();
    await this.validateUnitTests();
    await this.validateCoverage();
    await this.validateBuild();
    
    // Generate final report
    const success = this.generateReport();
    
    process.exit(success ? 0 : 1);
  }
}

// Run the validator
if (require.main === module) {
  const validator = new TestValidator();
  validator.run().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

module.exports = TestValidator;