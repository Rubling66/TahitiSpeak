const http = require("http");

async function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const req = http.request({
      hostname: "localhost",
      port: 3001,
      path: path,
      method: "GET",
      headers: { "Content-Type": "application/json" }
    }, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => {
        const endTime = Date.now();
        resolve({
          statusCode: res.statusCode,
          body: body,
          responseTime: endTime - startTime
        });
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function runTests() {
  console.log(" Starting Application Tests...\n");
  
  const tests = [
    { name: "Health Check", path: "/api/health" },
    { name: "Stories API", path: "/api/stories?limit=3" },
    { name: "Debug Endpoint", path: "/api/debug" },
    { name: "Error Handling", path: "/api/stories/invalid-id-999" }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      console.log(` Testing ${test.name}...`);
      const response = await makeRequest(test.path);
      const status = response.statusCode >= 200 && response.statusCode < 400 ? "PASS" : "FAIL";
      
      console.log(` ${test.name}: ${status} (${response.responseTime}ms) - Status: ${response.statusCode}`);
      
      results.push({
        test: test.name,
        status: status,
        statusCode: response.statusCode,
        responseTime: response.responseTime,
        path: test.path
      });
    } catch (error) {
      console.log(` ${test.name}: FAIL - ${error.message}`);
      results.push({
        test: test.name,
        status: "FAIL",
        error: error.message,
        path: test.path
      });
    }
  }
  
  console.log("\n TEST SUMMARY");
  console.log("================");
  const passed = results.filter(r => r.status === "PASS").length;
  const total = results.length;
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${total - passed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  require("fs").writeFileSync("test-results.json", JSON.stringify({
    summary: {
      totalTests: total,
      passedTests: passed,
      failedTests: total - passed,
      successRate: ((passed / total) * 100).toFixed(1),
      timestamp: new Date().toISOString()
    },
    results: results
  }, null, 2));
  
  console.log("\n Results saved to test-results.json");
  
  return results;
}

runTests().catch(console.error);
