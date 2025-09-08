import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');

  // Launch browser for cleanup
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to the application
    await page.goto('http://localhost:3000');

    // Clean up test data
    await cleanupTestData(page);

    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error to avoid failing the test suite
  } finally {
    await browser.close();
  }
}

async function cleanupTestData(page: any) {
  console.log('🗑️ Cleaning up test data...');

  try {
    await page.evaluate(() => {
      // Clear test data from localStorage
      localStorage.removeItem('test_users');
      localStorage.removeItem('test_courses');
      localStorage.removeItem('test_setup_complete');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_preferences');
      localStorage.removeItem('course_progress');
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear any test-related cookies
      document.cookie.split(';').forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        if (name.trim().startsWith('test_')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      });
    });

    console.log('✅ Test data cleanup completed');
  } catch (error) {
    console.warn('⚠️ Test data cleanup failed:', error);
  }
}

export default globalT