import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display login form', async ({ page }) => {
    // Navigate to login page
    await page.click('text=Login')
    
    // Check if login form is visible
    await expect(page.locator('form')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.click('text=Login')
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Check for validation errors
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.click('text=Login')
    
    // Fill form with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Check for error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible()
  })

  test('should navigate to registration page', async ({ page }) => {
    await page.click('text=Login')
    await page.click('text=Sign up')
    
    // Check if registration form is visible
    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
  })

  test('should register new user successfully', async ({ page }) => {
    await page.click('text=Login')
    await page.click('text=Sign up')
    
    // Fill registration form
    const timestamp = Date.now()
    await page.fill('input[name="name"]', `Test User ${timestamp}`)
    await page.fill('input[name="email"]', `test${timestamp}@example.com`)
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Check for success message or redirect
    await expect(page.locator('text=Registration successful')).toBeVisible()
  })

  test('should login with valid credentials', async ({ page }) => {
    // First register a user
    await page.click('text=Login')
    await page.click('text=Sign up')
    
    const timestamp = Date.now()
    const email = `test${timestamp}@example.com`
    const password = 'TestPassword123!'
    
    await page.fill('input[name="name"]', `Test User ${timestamp}`)
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', password)
    await page.fill('input[name="confirmPassword"]', password)
    await page.click('button[type="submit"]')
    
    // Wait for registration to complete
    await page.waitForTimeout(1000)
    
    // Now login with the same credentials
    await page.click('text=Login')
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    await page.click('button[type="submit"]')
    
    // Check if redirected to dashboard or home
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // Login first (assuming we have a test user)
    await page.click('text=Login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password')
    await page.click('button[type="submit"]')
    
    // Wait for login to complete
    await page.waitForTimeout(1000)
    
    // Logout
    await page.click('[data-testid="user-menu"]')
    await page.click('text=Logout')
    
    // Check if redirected to home page
    await expect(page.locator('text=Login')).toBeVisible()
  })
})