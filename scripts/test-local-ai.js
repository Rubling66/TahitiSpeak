// Simple test script to debug local AI service
const { LocalAIService } = require('./src/lib/local-ai/LocalAIService.ts');
const { getLocalAIConfig } = require('./src/lib/local-ai/config.ts');

async function testLocalAI() {
  try {
    console.log('Testing Local AI Service...');
    
    // Test config
    const config = getLocalAIConfig();
    console.log('Config:', config);
    
    // Test service
    const service = LocalAIService.getInstance();
    console.log('Service created successfully');
    
    // Test connection
    console.log('Testing connection...');
    const isConnected = await service.testConnection();
    console.log('Connection result:', isConnected);
    
  } catch (error) {
    console.error('Test failed:', error);
    console.error('Stack:', error.stack);
  }
}

testLocalAI();