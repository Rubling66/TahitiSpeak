import { test, expect } from '@playwright/test'

test.describe('Navigation and Course Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display main navigation', async ({ page }) => {
    // Check if main navigation elements are visible
    await expect(page.locator('nav')).toBeVisible()
    await expect(page.locator('text=Home')).toBeVisible()
    await expect(page.locator('text=Lessons')).toBeVisible()
    await expect(page.locator('text=Community')).toBeVisible()
  })

  test('should navigate to lessons page', async ({ page }) => {
    await page.click('text=Lessons')
    
    // Check if lessons page is loaded
    await expect(page.locator('h1')).toContainText('Lessons')
    await expect(page.locator('[data-testid="lesson-card"]')).toBeVisible()
  })

  test('should display lesson categories', async ({ page }) => {
    await page.click('text=Lessons')
    
    // Check for lesson categories
    await expect(page.locator('text=Greetings')).toBeVisible()
    await expect(page.locator('text=Family')).toBeVisible()
    await expect(page.locator('text=Numbers')).toBeVisible()
  })

  test('should open lesson detail page', async ({ page }) => {
    await page.click('text=Lessons')
    
    // Click on first lesson
    await page.click('[data-testid="lesson-card"]:first-child')
    
    // Check if lesson detail page is loaded
    await expect(page.locator('[data-testid="lesson-content"]')).toBeVisible()
    await expect(page.locator('[data-testid="lesson-audio"]')).toBeVisible()
    await expect(page.locator('button:has-text("Practice")')).toBeVisible()
  })

  test('should play lesson audio', async ({ page }) => {
    await page.click('text=Lessons')
    await page.click('[data-testid="lesson-card"]:first-child')
    
    // Click play button
    await page.click('[data-testid="play-audio"]')
    
    // Check if audio controls are visible
    await expect(page.locator('[data-testid="audio-controls"]')).toBeVisible()
  })

  test('should navigate to community page', async ({ page }) => {
    await page.click('text=Community')
    
    // Check if community page is loaded
    await expect(page.locator('h1')).toContainText('Community')
    await expect(page.locator('[data-testid="community-posts"]')).toBeVisible()
  })

  test('should display language switcher', async ({ page }) => {
    // Check if language switcher is visible
    await expect(page.locator('[data-testid="language-switcher"]')).toBeVisible()
  })

  test('should switch language', async ({ page }) => {
    // Click language switcher
    await page.click('[data-testid="language-switcher"]')
    
    // Select English
    await page.click('text=English')
    
    // Check if language changed
    await expect(page.locator('text=Home')).toBeVisible()
    
    // Switch to French
    await page.click('[data-testid="language-switcher"]')
    await page.click('text=Français')
    
    // Check if language changed to French
    await expect(page.locator('text=Accueil')).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check if mobile menu button is visible
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]')
    
    // Check if mobile menu is open
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
    await expect(page.locator('[data-testid="mobile-menu"] text=Home')).toBeVisible()
    await expect(page.locator('[data-testid="mobile-menu"] text=Lessons')).toBeVisible()
  })

  test('should search for lessons', async ({ page }) => {
    await page.click('text=Lessons')
    
    // Use search functionality
    await page.fill('[data-testid="lesson-search"]', 'greetings')
    
    // Check if search results are filtered
    await expect(page.locator('[data-testid="lesson-card"]')).toContainText('Greetings')
  })

  test('should filter lessons by difficulty', async ({ page }) => {
    await page.click('text=Lessons')
    
    // Click difficulty filter
    await page.click('[data-testid="difficulty-filter"]')
    await page.click('text=Beginner')
    
    // Check if lessons are filtered
    await expect(page.locator('[data-testid="lesson-card"][data-difficulty="beginner"]')).toBeVisible()
  })
})