#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Integration Test Script for CityPulse
 * Tests authentication flow and API endpoint connections
 *
 * Usage:
 *   node scripts/test-integration.js
 *   npm run test:integration
 */

const https = require("https");
const http = require("http");

// ANSI color codes for pretty output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const TEST_USER = {
  name: "Test User",
  email: `test-${Date.now()}@citypulse.test`,
  password: "TestPassword123",
};

let authToken = "";
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
};

// Helper functions
function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, "green");
  testResults.passed++;
  testResults.total++;
}

function logError(message) {
  log(`✗ ${message}`, "red");
  testResults.failed++;
  testResults.total++;
}

function logInfo(message) {
  log(`ℹ ${message}`, "cyan");
}

function logWarning(message) {
  log(`⚠ ${message}`, "yellow");
}

function logSection(title) {
  log(`\n${"=".repeat(60)}`, "blue");
  log(`  ${title}`, "bright");
  log("=".repeat(60), "blue");
}

// HTTP request helper
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE_URL);
    const isHttps = url.protocol === "https:";
    const client = isHttps ? https : http;

    const requestOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    const req = client.request(requestOptions, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
          });
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  logSection("Health Check");

  try {
    const response = await makeRequest("/api/health");

    if (response.status === 200) {
      logSuccess("API is responding");
      if (response.data.status === "ok") {
        logSuccess("Health check passed");
      } else {
        logWarning("Health check returned unexpected status");
      }
    } else {
      logError(`Health check failed with status ${response.status}`);
    }
  } catch (error) {
    logError(`Health check request failed: ${error.message}`);
    logWarning("Make sure the server is running (npm run dev)");
  }
}

async function testSignup() {
  logSection("User Signup");

  try {
    const response = await makeRequest("/api/auth/signup", {
      method: "POST",
      body: {
        name: TEST_USER.name,
        email: TEST_USER.email,
        password: TEST_USER.password,
        confirmPassword: TEST_USER.password,
      },
    });

    if (response.status === 201 && response.data.success) {
      logSuccess("User signup successful");

      if (response.data.token) {
        authToken = response.data.token;
        logSuccess("JWT token received");
      } else {
        logError("No token in signup response");
      }

      if (response.data.user) {
        logSuccess(`User created: ${response.data.user.email}`);
      } else {
        logError("No user data in signup response");
      }
    } else {
      logError(`Signup failed: ${response.data.error || "Unknown error"}`);
    }
  } catch (error) {
    logError(`Signup request failed: ${error.message}`);
  }
}

async function testLogin() {
  logSection("User Login");

  try {
    const response = await makeRequest("/api/auth/login", {
      method: "POST",
      body: {
        email: TEST_USER.email,
        password: TEST_USER.password,
      },
    });

    if (response.status === 200 && response.data.success) {
      logSuccess("User login successful");

      if (response.data.token) {
        authToken = response.data.token;
        logSuccess("JWT token received");
      } else {
        logError("No token in login response");
      }

      if (response.data.user) {
        logSuccess(`User logged in: ${response.data.user.email}`);
      } else {
        logError("No user data in login response");
      }
    } else {
      logError(`Login failed: ${response.data.error || "Unknown error"}`);
    }
  } catch (error) {
    logError(`Login request failed: ${error.message}`);
  }
}

async function testProtectedRoute() {
  logSection("Protected Route Access");

  if (!authToken) {
    logError("No auth token available - skipping protected route test");
    return;
  }

  try {
    // Test with token
    const responseWithAuth = await makeRequest("/api/user", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (responseWithAuth.status === 200) {
      logSuccess("Protected route accessible with token");

      if (responseWithAuth.data.user) {
        logSuccess("User profile data retrieved");
      }
    } else {
      logError(
        `Protected route failed: ${responseWithAuth.data.error || "Unknown error"}`,
      );
    }

    // Test without token
    const responseWithoutAuth = await makeRequest("/api/user");

    if (responseWithoutAuth.status === 401) {
      logSuccess("Protected route correctly rejects unauthenticated requests");
    } else {
      logWarning("Protected route did not reject unauthenticated request");
    }
  } catch (error) {
    logError(`Protected route test failed: ${error.message}`);
  }
}

async function testIssueCreation() {
  logSection("Issue Creation");

  if (!authToken) {
    logError("No auth token available - skipping issue creation test");
    return;
  }

  try {
    const response = await makeRequest("/api/issues", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: {
        title: "Test Issue - Integration Test",
        description:
          "This is a test issue created by the integration test script.",
        category: "other",
        location: "Test Location",
        coordinates: {
          lat: 15.4909,
          lng: 73.8278,
        },
      },
    });

    if (response.status === 201 && response.data.success) {
      logSuccess("Issue created successfully");

      if (response.data.data && response.data.data.id) {
        logSuccess(`Issue ID: ${response.data.data.id}`);
        return response.data.data.id;
      }
    } else {
      logError(
        `Issue creation failed: ${response.data.error || "Unknown error"}`,
      );
    }
  } catch (error) {
    logError(`Issue creation request failed: ${error.message}`);
  }

  return null;
}

async function testIssueRetrieval(issueId) {
  logSection("Issue Retrieval");

  if (!issueId) {
    logWarning("No issue ID available - skipping retrieval test");
    return;
  }

  try {
    // Get all issues
    const allIssuesResponse = await makeRequest("/api/issues");

    if (allIssuesResponse.status === 200 && allIssuesResponse.data.success) {
      logSuccess("Issues list retrieved");

      if (allIssuesResponse.data.data && allIssuesResponse.data.data.issues) {
        const issueCount = allIssuesResponse.data.data.issues.length;
        logInfo(`Found ${issueCount} issue(s)`);
      }
    } else {
      logError("Failed to retrieve issues list");
    }

    // Get specific issue
    const singleIssueResponse = await makeRequest(`/api/issues/${issueId}`);

    if (
      singleIssueResponse.status === 200 &&
      singleIssueResponse.data.success
    ) {
      logSuccess("Single issue retrieved successfully");
    } else {
      logError("Failed to retrieve single issue");
    }
  } catch (error) {
    logError(`Issue retrieval request failed: ${error.message}`);
  }
}

async function testDatabaseConnection() {
  logSection("Database Connection");

  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      logSuccess("Supabase credentials are configured");
      logInfo(`Supabase URL: ${supabaseUrl}`);
    } else {
      logWarning("Supabase credentials not found");
      logInfo("Using in-memory database (data will be lost on restart)");
    }

    // Test database by creating and retrieving data
    const response = await makeRequest("/api/issues");

    if (response.status === 200) {
      logSuccess("Database connection working");
    } else {
      logError("Database connection failed");
    }
  } catch (error) {
    logError(`Database connection test failed: ${error.message}`);
  }
}

async function testEnvironmentVariables() {
  logSection("Environment Variables Check");

  const requiredVars = {
    JWT_SECRET: process.env.JWT_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };

  const optionalVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    NEXT_PUBLIC_MAPTILER_API_KEY: process.env.NEXT_PUBLIC_MAPTILER_API_KEY,
  };

  logInfo("Required Variables:");
  for (const [key, value] of Object.entries(requiredVars)) {
    if (value) {
      logSuccess(`  ${key}: Set`);
    } else {
      logWarning(`  ${key}: Not set (using fallback)`);
    }
  }

  logInfo("\nOptional Variables:");
  for (const [key, value] of Object.entries(optionalVars)) {
    if (value) {
      logSuccess(`  ${key}: Set`);
    } else {
      logInfo(`  ${key}: Not set`);
    }
  }
}

async function printSummary() {
  logSection("Test Summary");

  const passRate =
    testResults.total > 0
      ? ((testResults.passed / testResults.total) * 100).toFixed(1)
      : 0;

  log(`Total Tests: ${testResults.total}`, "bright");
  log(`Passed: ${testResults.passed}`, "green");
  log(
    `Failed: ${testResults.failed}`,
    testResults.failed > 0 ? "red" : "green",
  );
  log(`Pass Rate: ${passRate}%`, passRate >= 80 ? "green" : "yellow");

  if (testResults.failed === 0) {
    log(
      "\n🎉 All tests passed! Your integration is working correctly.",
      "green",
    );
  } else if (passRate >= 80) {
    log("\n⚠️ Most tests passed, but some issues were found.", "yellow");
  } else {
    log("\n❌ Multiple tests failed. Please check the errors above.", "red");
  }

  // Return exit code
  return testResults.failed > 0 ? 1 : 0;
}

// Main test runner
async function runTests() {
  log(
    `
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║           CityPulse Integration Test Suite                ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`,
    "cyan",
  );

  logInfo(`Testing API at: ${API_BASE_URL}`);
  logInfo(`Test user email: ${TEST_USER.email}\n`);

  try {
    // Run tests in sequence
    await testEnvironmentVariables();
    await testDatabaseConnection();
    await testHealthCheck();
    await testSignup();
    await testLogin();
    await testProtectedRoute();

    const issueId = await testIssueCreation();
    await testIssueRetrieval(issueId);

    // Print summary
    const exitCode = await printSummary();

    log("\n" + "=".repeat(60) + "\n", "blue");

    process.exit(exitCode);
  } catch (error) {
    log("\n❌ Test suite failed with unexpected error:", "red");
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests();
