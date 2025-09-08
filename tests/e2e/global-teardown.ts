import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  try {
    console.log('Starting global teardown...')
    
    // Clean up test data
    // For example, removing test users, cleaning database, etc.
    
    // You can add any cleanup logic here
    
    console.log('Global teardown completed successfully')
  } catch (error) {
    console.error('Global teardown failed:', error)
    // Don't throw error in teardown to avoid masking test failures
  }
}

export default globalTeardown;