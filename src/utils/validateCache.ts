import { validateCacheSystem } from '../tests/CacheSystem.test';

/**
 * Simple cache validation runner
 */
export async function runCacheValidation(): Promise<boolean> {
  try {
    console.log('🚀 Starting cache system validation...');
    
    const results = await validateCacheSystem();
    
    console.log('\n📊 Cache Validation Results:');
    console.log('================================');
    console.log(`✅ Basic Operations: ${results.basicOperations ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Expiration: ${results.expiration ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Service Integration: ${results.serviceIntegration ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Performance: ${results.performance ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Automatic Cleanup: ${results.automaticCleanup ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Statistics: ${results.stats ? 'PASS' : 'FAIL'}`);
    
    const allPassed = Object.values(results).every(result => result === true);
    
    if (allPassed) {
      console.log('\n🎉 All cache system tests PASSED!');
      console.log('Cache system is working properly.');
    } else {
      console.log('\n⚠️ Some cache system tests FAILED.');
      console.log('Please check the detailed logs above.');
    }
    
    return allPassed;
  } catch (error) {
    console.error('❌ Cache validation failed with error:', error);
    return false;
  }
}

// Export for use in other modules
export { validateCacheSystem };