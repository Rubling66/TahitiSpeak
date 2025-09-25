import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use
  
  // Launch browser for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Wait for the application to be ready
    console.log('Waiting for application to be ready...')
    await page.goto(baseURL!)
    await page.waitForLoadState('networkidle')
    
    // Create test users if needed
    console.log('Setting up test data...')
    
    // You can add any global setup logic here
    // For example, creating test users, seeding database, etc.
    
    console.log('Global setup completed successfully')
  } catch (error) {
    console.error('Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup