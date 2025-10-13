#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const TEST_RESULTS = {
  apiTests: [],
  performanceTests: [],
  errorTests: [],
  userScenarios: []
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        const endTime = Date.now();
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body,
          responseTime: endTime - startTime
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test 1: Health Check
async function testHealthEndpoint() {
  console.log('🔍 Testing Health Endpoint...');
  try {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };

    const response = await makeRequest(options);
    const result = {
      test: 'Health Endpoint',
      status: response.statusCode === 200 ? 'PASS' : 'FAIL',
      responseTime: response.responseTime,
      details: JSON.parse(response.body)
    };
    
    TEST_RESULTS.apiTests.push(result);
    console.log(`✅ Health Check: ${result.status} (${result.responseTime}ms)`);
    return result;
  } catch (error) {
    console.log(`❌ Health Check Failed: ${error.message}`);
    TEST_RESULTS.apiTests.push({
      test: 'Health Endpoint',
      status: 'FAIL',
      error: error.message
    });
  }
}

// Test 2: Stories API
async function testStoriesAPI() {
  console.log('🔍 Testing Stories API...');
  try {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/stories?limit=3',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };

    const response = await makeRequest(options);
    const data = JSON.parse(response.body);
    const result = {
      test: 'Stories API',
      status: response.statusCode === 200 && data.stories ? 'PASS' : 'FAIL',
      responseTime: response.responseTime,
      storiesCount: data.stories ? data.stories.length : 0,
      details: data
    };
    
    TEST_RESULTS.apiTests.push(result);
    console.log(`✅ Stories API: ${result.status} (${result.responseTime}ms, ${result.storiesCount} stories)`);
    return result;
  } catch (error) {
    console.log(`❌ Stories API Failed: ${error.message}`);
    TEST_RESULTS.apiTests.push({
      test: 'Stories API',
      status: 'FAIL',
      error: error.message
    });
  }
}

// Test 3: Individual Story
async function testIndividualStory() {
  console.log('🔍 Testing Individual Story...');
  try {
    // First get a story ID
    const storiesResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/stories?limit=1',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const storiesData = JSON.parse(storiesResponse.body);
    if (!storiesData.stories || storiesData.stories.length === 0) {
      throw new Error('No stories available for testing');
    }

    const storyId = storiesData.stories[0].id;
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api/stories/${storyId}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };

    const response = await makeRequest(options);
    const data = JSON.parse(response.body);
    const result = {
      test: 'Individual Story',
      status: response.statusCode === 200 && data.story ? 'PASS' : 'FAIL',
      responseTime: response.responseTime,
      storyId: storyId,
      hasAnnotations: data.annotations && data.annotations.length > 0
    };
    
    TEST_RESULTS.apiTests.push(result);
    console.log(`✅ Individual Story: ${result.status} (${result.responseTime}ms)`);
    return result;
  } catch (error) {
    console.log(`❌ Individual Story Failed: ${error.message}`);
    TEST_RESULTS.apiTests.push({
      test: 'Individual Story',
      status: 'FAIL',
      error: error.message
    });
  }
}

// Test 4: Error Handling - Invalid Story ID
async function testErrorHandling() {
  console.log('🔍 Testing Error Handling...');
  try {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/stories/invalid-story-id-999999',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };

    const response = await makeRequest(options);
    const result = {
      test: 'Error Handling (Invalid Story)',
      status: response.statusCode === 404 ? 'PASS' : 'FAIL',
      responseTime: response.responseTime,
      statusCode: response.statusCode,
      errorMessage: response.body
    };
    
    TEST_RESULTS.errorTests.push(result);
    console.log(`✅ Error Handling: ${result.status} (${result.responseTime}ms)`);
    return result;
  } catch (error) {
    console.log(`❌ Error Handling Failed: ${error.message}`);
    TEST_RESULTS.errorTests.push({
      test: 'Error Handling',
      status: 'FAIL',
      error: error.message
    });
  }
}

// Test 5: Performance Test - Multiple Concurrent Requests
async function testPerformance() {
  console.log('🔍 Testing Performance (Concurrent Requests)...');
  const concurrentRequests = 5;
  const promises = [];

  for (let i = 0; i < concurrentRequests; i++) {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };
    promises.push(makeRequest(options));
  }

  try {
    const startTime = Date.now();
    const responses = await Promise.all(promises);
    const endTime = Date.now();
    
    const avgResponseTime = responses.reduce((sum, res) => sum + res.responseTime, 0) / responses.length;
    const totalTime = endTime - startTime;
    
    const result = {
      test: 'Performance Test',
      status: avgResponseTime < 1000 ? 'PASS' : 'FAIL',
      concurrentRequests: concurrentRequests,
      averageResponseTime: avgResponseTime,
      totalTime: totalTime,
      allSuccessful: responses.every(res => res.statusCode === 200)
    };
    
    TEST_RESULTS.performanceTests.push(result);
    console.log(`✅ Performance Test: ${result.status} (Avg: ${avgResponseTime.toFixed(2)}ms)`);
    return result;
  } catch (error) {
    console.log(`❌ Performance Test Failed: ${error.message}`);
    TEST_RESULTS.performanceTests.push({
      test: 'Performance Test',
      status: 'FAIL',
      error: error.message
    });
  }
}

// User Scenario Test: Browse Stories
async function testUserScenarioBrowseStories() {
  console.log('🔍 Testing User Scenario: Browse Stories...');
  try {
    // Step 1: Get stories list
    const listResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/stories',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    // Step 2: Select first story
    const listData = JSON.parse(listResponse.body);
    if (!listData.stories || listData.stories.length === 0) {
      throw new Error('No stories available');
    }

    const storyId = listData.stories[0].id;
    const storyResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: `/api/stories/${storyId}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = {
      test: 'User Scenario: Browse Stories',
      status: listResponse.statusCode === 200 && storyResponse.statusCode === 200 ? 'PASS' : 'FAIL',
      steps: [
        { action: 'List Stories', responseTime: listResponse.responseTime, status: listResponse.statusCode },
        { action: 'View Story', responseTime: storyResponse.responseTime, status: storyResponse.statusCode }
      ],
      totalTime: listResponse.responseTime + storyResponse.responseTime
    };
    
    TEST_RESULTS.userScenarios.push(result);
    console.log(`✅ Browse Stories Scenario: ${result.status} (${result.totalTime}ms total)`);
    return result;
  } catch (error) {
    console.log(`❌ Browse Stories Scenario Failed: ${error.message}`);
    TEST_RESULTS.userScenarios.push({
      test: 'User Scenario: Browse Stories',
      status: 'FAIL',
      error: error.message
    });
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Application Testing...\n');
  
  const startTime = Date.now();
  
  // Run all tests
  await testHealthEndpoint();
  await testStoriesAPI();
  await testIndividualStory();
  await testErrorHandling();
  await testPerformance();
  await testUserScenarioBrowseStories();
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  // Generate summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  
  const allTests = [
    ...TEST_RESULTS.apiTests,
    ...TEST_RESULTS.performanceTests,
    ...TEST_RESULTS.errorTests,
    ...TEST_RESULTS.userScenarios
  ];
  
  const passedTests = allTests.filter(test => test.status === 'PASS').length;
  const totalTests = allTests.length;
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log(`Total Execution Time: ${totalTime}ms`);
  
  // Save detailed results
  const detailedResults = {
    summary: {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      successRate: ((passedTests / totalTests) * 100).toFixed(1),
      totalExecutionTime: totalTime,
      timestamp: new Date().toISOString()
    },
    results: TEST_RESULTS
  };
  
  require('fs').writeFileSync('test-results.json', JSON.stringify(detailedResults, null, 2));
  console.log('\n📄 Detailed results saved to test-results.json');
  
  return detailedResults;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, TEST_RESULTS };