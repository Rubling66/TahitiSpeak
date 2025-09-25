import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');

  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for the development server to be ready
    console.log('⏳ Waiting for development server...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    console.log('✅ Development server is ready');

    // Setup test data if needed
    await setupTestData(page);

    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function setupTestData(page: any) {
  console.log('📊 Setting up test data...');

  // Create test admin user if not exists
  try {
    await page.evaluate(() => {
      // Mock API calls for test data setup
      const testUsers = [
        {
          id: 'admin-test',
          email: 'admin@example.com',
          name: 'Test Admin',
          role: 'admin',
          password: 'AdminPassword123!',
        },
        {
          id: 'user-test',
          email: 'test.user@example.com',
          name: 'Test User',
          role: 'student',
          password: 'TestPassword123!',
        },
      ];

      const testCourses = [
        {
          id: 'course-1',
          title: 'Basic Tahitian',
          description: 'Introduction to Tahitian language',
          level: 'beginner',
          status: 'published',
          lessons: [
            {
              id: 'lesson-1',
              title: 'Greetings',
              content: 'Learn basic Tahitian greetings',
              order: 1,
            },
            {
              id: 'lesson-2',
              title: 'Numbers',
              content: 'Learn numbers in Tahitian',
              order: 2,
            },
          ],
        },
        {
          id: 'course-2',
          title: 'Advanced Tahitian',
          description: 'Advanced Tahitian conversation',
          level: 'advanced',
          status: 'published',
          lessons: [],
        },
      ];

      // Store test data in localStorage for mock services
      localStorage.setItem('test_users', JSON.stringify(testUsers));
      localStorage.setItem('test_courses', JSON.stringify(testCourses));
      localStorage.setItem('test_setup_complete', 'true');
    });

    console.log('✅ Test data setup completed');
  } catch (error) {
    console.warn('⚠️ Test data setup failed, continuing with existing data:', error);
  }
}

export default globalSetup;