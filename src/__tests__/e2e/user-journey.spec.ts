import { test, expect, Page } from '@playwright/test';

// Test configuration
test.describe.configure({ mode: 'serial' });

const TEST_USER = {
  email: 'test.user@example.com',
  password: 'TestPassword123!',
  name: 'Test User',
};

const ADMIN_USER = {
  email: 'admin@example.com',
  password: 'AdminPassword123!',
};

class AuthPage {
  constructor(private page: Page) {}

  async navigateToLogin() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToRegister() {
    await this.page.goto('/register');
    await this.page.waitForLoadState('networkidle');
  }

  async fillLoginForm(email: string, password: string) {
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
  }

  async fillRegisterForm(name: string, email: string, password: string) {
    await this.page.fill('[data-testid="name-input"]', name);
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.fill('[data-testid="confirm-password-input"]', password);
  }

  async submitForm() {
    await this.page.click('[data-testid="submit-button"]');
  }

  async logout() {
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('[data-testid="logout-button"]');
    await this.page.waitForURL('/login');
  }
}

class DashboardPage {
  constructor(private page: Page) {}

  async waitForDashboard() {
    await this.page.waitForURL('/dashboard');
    await expect(this.page.locator('[data-testid="dashboard-title"]')).toBeVisible();
  }

  async navigateToCourses() {
    await this.page.click('[data-testid="courses-nav"]');
    await this.page.waitForURL('/courses');
  }

  async navigateToProfile() {
    await this.page.click('[data-testid="profile-nav"]');
    await this.page.waitForURL('/profile');
  }
}

class CoursePage {
  constructor(private page: Page) {}

  async selectCourse(courseTitle: string) {
    await this.page.click(`[data-testid="course-card"]:has-text("${courseTitle}")`);
  }

  async startLesson() {
    await this.page.click('[data-testid="start-lesson-button"]');
  }

  async completeLesson() {
    // Simulate lesson completion
    await this.page.click('[data-testid="lesson-content"]');
    await this.page.click('[data-testid="complete-lesson-button"]');
  }

  async checkProgress() {
    const progressElement = this.page.locator('[data-testid="course-progress"]');
    return await progressElement.textContent();
  }
}

class AdminPage {
  constructor(private page: Page) {}

  async navigateToAdmin() {
    await this.page.goto('/admin');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToUserManagement() {
    await this.page.click('[data-testid="users-nav"]');
    await this.page.waitForURL('/admin/users');
  }

  async navigateToCourseManagement() {
    await this.page.click('[data-testid="courses-nav"]');
    await this.page.waitForURL('/admin/courses');
  }

  async searchUser(email: string) {
    await this.page.fill('[data-testid="user-search"]', email);
    await this.page.press('[data-testid="user-search"]', 'Enter');
  }

  async updateUserRole(email: string, newRole: string) {
    await this.searchUser(email);
    await this.page.click(`[data-testid="user-row"]:has-text("${email}") [data-testid="edit-button"]`);
    await this.page.selectOption('[data-testid="role-select"]', newRole);
    await this.page.click('[data-testid="save-button"]');
  }

  async createCourse(title: string, description: string, level: string) {
    await this.page.click('[data-testid="create-course-button"]');
    await this.page.fill('[data-testid="course-title-input"]', title);
    await this.page.fill('[data-testid="course-description-input"]', description);
    await this.page.selectOption('[data-testid="course-level-select"]', level);
    await this.page.click('[data-testid="create-button"]');
  }
}

test.describe('Complete User Journey E2E Tests', () => {
  let authPage: AuthPage;
  let dashboardPage: DashboardPage;
  let coursePage: CoursePage;
  let adminPage: AdminPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    dashboardPage = new DashboardPage(page);
    coursePage = new CoursePage(page);
    adminPage = new AdminPage(page);
  });

  test.describe('User Registration and Authentication Flow', () => {
    test('should complete full registration and login flow', async ({ page }) => {
      // Registration
      await authPage.navigateToRegister();
      await authPage.fillRegisterForm(TEST_USER.name, TEST_USER.email, TEST_USER.password);
      await authPage.submitForm();

      // Should redirect to dashboard after successful registration
      await dashboardPage.waitForDashboard();
      await expect(page.locator('[data-testid="welcome-message"]')).toContainText(TEST_USER.name);

      // Logout
      await authPage.logout();

      // Login with registered credentials
      await authPage.navigateToLogin();
      await authPage.fillLoginForm(TEST_USER.email, TEST_USER.password);
      await authPage.submitForm();

      // Should redirect to dashboard
      await dashboardPage.waitForDashboard();
    });

    test('should handle login validation errors', async ({ page }) => {
      await authPage.navigateToLogin();
      await authPage.fillLoginForm('invalid@email.com', 'wrongpassword');
      await authPage.submitForm();

      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
    });

    test('should handle registration validation errors', async ({ page }) => {
      await authPage.navigateToRegister();
      await authPage.fillRegisterForm('', 'invalid-email', '123');
      await authPage.submitForm();

      await expect(page.locator('[data-testid="name-error"]')).toContainText('Name is required');
      await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email format');
      await expect(page.locator('[data-testid="password-error"]')).toContainText('Password must be at least 8 characters');
    });
  });

  test.describe('Course Learning Journey', () => {
    test.beforeEach(async ({ page }) => {
      // Login as test user
      await authPage.navigateToLogin();
      await authPage.fillLoginForm(TEST_USER.email, TEST_USER.password);
      await authPage.submitForm();
      await dashboardPage.waitForDashboard();
    });

    test('should complete a full course learning flow', async ({ page }) => {
      // Navigate to courses
      await dashboardPage.navigateToCourses();

      // Select a course
      await coursePage.selectCourse('Basic Tahitian');
      await expect(page.locator('[data-testid="course-title"]')).toContainText('Basic Tahitian');

      // Start first lesson
      await coursePage.startLesson();
      await expect(page.locator('[data-testid="lesson-content"]')).toBeVisible();

      // Complete lesson
      await coursePage.completeLesson();
      await expect(page.locator('[data-testid="lesson-completed"]')).toBeVisible();

      // Check progress update
      const progress = await coursePage.checkProgress();
      expect(progress).toContain('10%'); // Assuming 10 lessons total

      // Navigate back to dashboard
      await page.click('[data-testid="dashboard-nav"]');
      await dashboardPage.waitForDashboard();

      // Verify progress is reflected on dashboard
      await expect(page.locator('[data-testid="recent-progress"]')).toContainText('Basic Tahitian');
    });

    test('should track learning streaks and achievements', async ({ page }) => {
      await dashboardPage.navigateToCourses();
      await coursePage.selectCourse('Basic Tahitian');

      // Complete multiple lessons to trigger achievements
      for (let i = 0; i < 3; i++) {
        await coursePage.startLesson();
        await coursePage.completeLesson();
        await page.click('[data-testid="next-lesson-button"]');
      }

      // Check for achievement notification
      await expect(page.locator('[data-testid="achievement-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="streak-counter"]')).toContainText('3');
    });
  });

  test.describe('User Profile Management', () => {
    test.beforeEach(async ({ page }) => {
      await authPage.navigateToLogin();
      await authPage.fillLoginForm(TEST_USER.email, TEST_USER.password);
      await authPage.submitForm();
      await dashboardPage.waitForDashboard();
    });

    test('should update user profile information', async ({ page }) => {
      await dashboardPage.navigateToProfile();

      // Update profile information
      await page.fill('[data-testid="display-name-input"]', 'Updated Test User');
      await page.selectOption('[data-testid="language-preference"]', 'fr');
      await page.click('[data-testid="save-profile-button"]');

      // Verify success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Profile updated successfully');

      // Verify changes are persisted
      await page.reload();
      await expect(page.locator('[data-testid="display-name-input"]')).toHaveValue('Updated Test User');
      await expect(page.locator('[data-testid="language-preference"]')).toHaveValue('fr');
    });

    test('should change password successfully', async ({ page }) => {
      await dashboardPage.navigateToProfile();

      // Navigate to security settings
      await page.click('[data-testid="security-tab"]');

      // Change password
      await page.fill('[data-testid="current-password"]', TEST_USER.password);
      await page.fill('[data-testid="new-password"]', 'NewPassword123!');
      await page.fill('[data-testid="confirm-new-password"]', 'NewPassword123!');
      await page.click('[data-testid="change-password-button"]');

      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Password changed successfully');

      // Test login with new password
      await authPage.logout();
      await authPage.navigateToLogin();
      await authPage.fillLoginForm(TEST_USER.email, 'NewPassword123!');
      await authPage.submitForm();
      await dashboardPage.waitForDashboard();
    });
  });

  test.describe('Admin Management Workflows', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin
      await authPage.navigateToLogin();
      await authPage.fillLoginForm(ADMIN_USER.email, ADMIN_USER.password);
      await authPage.submitForm();
    });

    test('should manage users effectively', async ({ page }) => {
      await adminPage.navigateToAdmin();
      await adminPage.navigateToUserManagement();

      // Search for test user
      await adminPage.searchUser(TEST_USER.email);
      await expect(page.locator(`[data-testid="user-row"]:has-text("${TEST_USER.email}")`)).toBeVisible();

      // Update user role
      await adminPage.updateUserRole(TEST_USER.email, 'instructor');
      await expect(page.locator('[data-testid="success-message"]')).toContainText('User role updated successfully');

      // Verify role change
      await page.reload();
      await adminPage.searchUser(TEST_USER.email);
      await expect(page.locator(`[data-testid="user-row"]:has-text("${TEST_USER.email}") [data-testid="user-role"]`)).toContainText('instructor');
    });

    test('should create and manage courses', async ({ page }) => {
      await adminPage.navigateToAdmin();
      await adminPage.navigateToCourseManagement();

      // Create new course
      await adminPage.createCourse(
        'Advanced Tahitian Conversation',
        'Learn advanced conversation skills in Tahitian',
        'advanced'
      );

      await expect(page.locator('[data-testid="success-message"]')).toContainText('Course created successfully');

      // Verify course appears in list
      await expect(page.locator('[data-testid="course-list"]')).toContainText('Advanced Tahitian Conversation');

      // Publish course
      await page.click('[data-testid="course-row"]:has-text("Advanced Tahitian Conversation") [data-testid="publish-button"]');
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Course published successfully');
    });

    test('should view analytics and reports', async ({ page }) => {
      await adminPage.navigateToAdmin();

      // Check dashboard analytics
      await expect(page.locator('[data-testid="total-users-metric"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-courses-metric"]')).toBeVisible();
      await expect(page.locator('[data-testid="completion-rate-metric"]')).toBeVisible();

      // Navigate to detailed analytics
      await page.click('[data-testid="analytics-nav"]');
      await page.waitForURL('/admin/analytics');

      // Verify charts and reports are loaded
      await expect(page.locator('[data-testid="user-growth-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="course-completion-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="engagement-metrics"]')).toBeVisible();
    });
  });

  test.describe('Responsive Design and Accessibility', () => {
    test('should work correctly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await authPage.navigateToLogin();
      await authPage.fillLoginForm(TEST_USER.email, TEST_USER.password);
      await authPage.submitForm();

      // Verify mobile navigation
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
      await page.click('[data-testid="mobile-menu-button"]');
      await expect(page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible();

      // Test course interaction on mobile
      await page.click('[data-testid="courses-nav-mobile"]');
      await coursePage.selectCourse('Basic Tahitian');
      await expect(page.locator('[data-testid="course-content"]')).toBeVisible();
    });

    test('should meet accessibility standards', async ({ page }) => {
      await authPage.navigateToLogin();

      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="email-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="password-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="submit-button"]')).toBeFocused();

      // Test ARIA labels and roles
      await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute('aria-label', 'Email address');
      await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('aria-label', 'Password');
      await expect(page.locator('[data-testid="submit-button"]')).toHaveAttribute('role', 'button');
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());

      await authPage.navigateToLogin();
      await authPage.fillLoginForm(TEST_USER.email, TEST_USER.password);
      await authPage.submitForm();

      // Should show network error message
      await expect(page.locator('[data-testid="network-error"]')).toContainText('Network error. Please try again.');
    });

    test('should handle session expiration', async ({ page }) => {
      // Login first
      await authPage.navigateToLogin();
      await authPage.fillLoginForm(TEST_USER.email, TEST_USER.password);
      await authPage.submitForm();
      await dashboardPage.waitForDashboard();

      // Simulate session expiration
      await page.evaluate(() => {
        localStorage.removeItem('auth_token');
        sessionStorage.clear();
      });

      // Try to access protected route
      await page.goto('/profile');

      // Should redirect to login
      await expect(page).toHaveURL('/login');
      await expect(page.locator('[data-testid="session-expired-message"]')).toContainText('Session expired. Please log in again.');
    });
  });
});