const fetch = require('node-fetch');

async function testRegistration() {
  try {
    const response = await fetch('http://localhost:3002/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test3@example.com',
        password: 'TestPass123',
        name: 'Test User 3',
        role: 'student'
      })
    });
    
    const data = await response.text();
    console.log('Registration Response:', response.status, data);
  } catch (error) {
    console.error('Registration Error:', error.message);
  }
}

async function testLogin() {
  try {
    const response = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test3@example.com',
        password: 'TestPass123'
      })
    });
    
    const data = await response.text();
    console.log('Login Response:', response.status, data);
  } catch (error) {
    console.error('Login Error:', error.message);
  }
}

async function testHealth() {
  try {
    const response = await fetch('http://localhost:3002/api/health');
    const data = await response.text();
    console.log('Health Response:', response.status, data);
  } catch (error) {
    console.error('Health Error:', error.message);
  }
}

async function runTests() {
  console.log('Testing health endpoint...');
  await testHealth();
  
  console.log('\nTesting registration...');
  await testRegistration();
  
  console.log('\nTesting login...');
  await testLogin();
}

runTests();