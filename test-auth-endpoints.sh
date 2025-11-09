#!/bin/bash

# CityPulse Authentication Endpoint Test Script
# Tests all authentication and database-related endpoints

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3000"
TEST_EMAIL="test_$(date +%s)@example.com"
TEST_PASSWORD="TestPass123"
TEST_NAME="Test User"

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     CityPulse Authentication Endpoint Test Suite            ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print test results
print_test() {
    if [ "$1" = "pass" ]; then
        echo -e "${GREEN}✅ PASS${NC} - $2"
    elif [ "$1" = "fail" ]; then
        echo -e "${RED}❌ FAIL${NC} - $2"
    elif [ "$1" = "skip" ]; then
        echo -e "${YELLOW}⊘ SKIP${NC} - $2"
    else
        echo -e "${BLUE}ℹ️ INFO${NC} - $2"
    fi
}

print_header() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Check if server is running
print_header "Prerequisite Check"

if ! curl -s "$BASE_URL/api/health" > /dev/null 2>&1; then
    print_test "fail" "Server is not running at $BASE_URL"
    echo ""
    echo "Please start the development server first:"
    echo "  npm run dev"
    echo ""
    exit 1
fi

print_test "pass" "Server is running at $BASE_URL"

# Test 1: Health Check
print_header "Test 1: Health Check Endpoint"

HEALTH_RESPONSE=$(curl -s "$BASE_URL/api/health")
HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"success":true' || echo "")

if [ -n "$HEALTH_STATUS" ]; then
    print_test "pass" "Health endpoint responding"

    DB_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"status":"up"' || echo "")
    if [ -n "$DB_STATUS" ]; then
        print_test "pass" "Database connection is UP"
    else
        print_test "fail" "Database connection is DOWN"
        echo "Response: $HEALTH_RESPONSE"
    fi
else
    print_test "fail" "Health endpoint not responding correctly"
    echo "Response: $HEALTH_RESPONSE"
fi

# Test 2: User Signup
print_header "Test 2: User Registration (Signup)"

echo "Testing with: $TEST_EMAIL"

SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"$TEST_NAME\",
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\",
        \"confirmPassword\": \"$TEST_PASSWORD\"
    }")

SIGNUP_SUCCESS=$(echo "$SIGNUP_RESPONSE" | grep -o '"success":true' || echo "")

if [ -n "$SIGNUP_SUCCESS" ]; then
    print_test "pass" "User registration successful"

    # Extract token
    TOKEN=$(echo "$SIGNUP_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

    if [ -n "$TOKEN" ]; then
        print_test "pass" "JWT token received"
        echo "Token: ${TOKEN:0:50}..."
    else
        print_test "fail" "No JWT token in response"
    fi

    # Extract user ID
    USER_ID=$(echo "$SIGNUP_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$USER_ID" ]; then
        print_test "pass" "User ID received: $USER_ID"
    fi
else
    print_test "fail" "User registration failed"
    echo "Response: $SIGNUP_RESPONSE"
    TOKEN=""
fi

# Test 3: Login with newly created user
print_header "Test 3: User Login"

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
    }")

LOGIN_SUCCESS=$(echo "$LOGIN_RESPONSE" | grep -o '"success":true' || echo "")

if [ -n "$LOGIN_SUCCESS" ]; then
    print_test "pass" "User login successful"

    LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

    if [ -n "$LOGIN_TOKEN" ]; then
        print_test "pass" "JWT token received on login"
        # Use login token for subsequent tests
        TOKEN="$LOGIN_TOKEN"
    fi
else
    print_test "fail" "User login failed"
    echo "Response: $LOGIN_RESPONSE"
fi

# Test 4: Duplicate Email Registration (Should Fail)
print_header "Test 4: Duplicate Email Prevention"

DUP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"Another User\",
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\",
        \"confirmPassword\": \"$TEST_PASSWORD\"
    }")

DUP_ERROR=$(echo "$DUP_RESPONSE" | grep -o '"success":false' || echo "")

if [ -n "$DUP_ERROR" ]; then
    print_test "pass" "Duplicate email correctly rejected"
else
    print_test "fail" "Duplicate email was not rejected"
    echo "Response: $DUP_RESPONSE"
fi

# Test 5: Create Issue (Authenticated)
print_header "Test 5: Create Issue (Authenticated Request)"

if [ -z "$TOKEN" ]; then
    print_test "skip" "No auth token available, skipping authenticated tests"
else
    ISSUE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/issues" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d '{
            "title": "Test Issue - Broken Streetlight",
            "description": "This is a test issue created by the test script",
            "category": "streetlight",
            "location": "Test Street, Panjim",
            "latitude": 15.4909,
            "longitude": 73.8278,
            "priority": "medium"
        }')

    ISSUE_SUCCESS=$(echo "$ISSUE_RESPONSE" | grep -o '"success":true' || echo "")

    if [ -n "$ISSUE_SUCCESS" ]; then
        print_test "pass" "Issue created successfully"

        ISSUE_ID=$(echo "$ISSUE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [ -n "$ISSUE_ID" ]; then
            print_test "pass" "Issue ID received: $ISSUE_ID"
        fi
    else
        print_test "fail" "Issue creation failed"
        echo "Response: $ISSUE_RESPONSE"
    fi
fi

# Test 6: Get All Issues (Public)
print_header "Test 6: Get All Issues (Public Access)"

ISSUES_RESPONSE=$(curl -s "$BASE_URL/api/issues")
ISSUES_SUCCESS=$(echo "$ISSUES_RESPONSE" | grep -o '"success":true' || echo "")

if [ -n "$ISSUES_SUCCESS" ]; then
    print_test "pass" "Issues retrieved successfully"

    ISSUE_COUNT=$(echo "$ISSUES_RESPONSE" | grep -o '"id":"[^"]*"' | wc -l)
    print_test "info" "Total issues in database: $ISSUE_COUNT"
else
    print_test "fail" "Failed to retrieve issues"
    echo "Response: $ISSUES_RESPONSE"
fi

# Test 7: Unauthorized Request (No Token)
print_header "Test 7: Unauthorized Access Prevention"

UNAUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/issues" \
    -H "Content-Type: application/json" \
    -d '{
        "title": "Unauthorized Issue",
        "description": "This should fail",
        "category": "other",
        "location": "Test",
        "latitude": 15.4909,
        "longitude": 73.8278
    }')

UNAUTH_ERROR=$(echo "$UNAUTH_RESPONSE" | grep -o '"success":false' || echo "")
UNAUTH_MSG=$(echo "$UNAUTH_RESPONSE" | grep -o '"error":"[^"]*"' || echo "")

if [ -n "$UNAUTH_ERROR" ]; then
    print_test "pass" "Unauthorized request correctly rejected"
    echo "Error message: $UNAUTH_MSG"
else
    print_test "fail" "Unauthorized request was not rejected"
    echo "Response: $UNAUTH_RESPONSE"
fi

# Test 8: Invalid Login Credentials
print_header "Test 8: Invalid Login Credentials"

INVALID_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "nonexistent@example.com",
        "password": "wrongpassword"
    }')

INVALID_ERROR=$(echo "$INVALID_LOGIN" | grep -o '"success":false' || echo "")

if [ -n "$INVALID_ERROR" ]; then
    print_test "pass" "Invalid credentials correctly rejected"
else
    print_test "fail" "Invalid credentials were accepted"
    echo "Response: $INVALID_LOGIN"
fi

# Test 9: Validation - Missing Required Fields
print_header "Test 9: Input Validation"

MISSING_FIELDS=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "",
        "email": "test@test.com",
        "password": ""
    }')

VALIDATION_ERROR=$(echo "$MISSING_FIELDS" | grep -o '"success":false' || echo "")

if [ -n "$VALIDATION_ERROR" ]; then
    print_test "pass" "Missing fields correctly rejected"
else
    print_test "fail" "Missing fields were accepted"
    echo "Response: $MISSING_FIELDS"
fi

# Test 10: Password Mismatch
print_header "Test 10: Password Confirmation Validation"

PASSWORD_MISMATCH=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Test User",
        "email": "mismatch@test.com",
        "password": "Password123",
        "confirmPassword": "DifferentPassword123"
    }')

MISMATCH_ERROR=$(echo "$PASSWORD_MISMATCH" | grep -o '"success":false' || echo "")

if [ -n "$MISMATCH_ERROR" ]; then
    print_test "pass" "Password mismatch correctly rejected"
else
    print_test "fail" "Password mismatch was accepted"
    echo "Response: $PASSWORD_MISMATCH"
fi

# Summary
print_header "Test Summary"

echo "Test suite completed!"
echo ""
echo -e "${BLUE}Test User Created:${NC}"
echo "  Email: $TEST_EMAIL"
echo "  Password: $TEST_PASSWORD"
echo ""
echo -e "${YELLOW}Note:${NC} Check your Supabase database to verify data persistence:"
echo "  1. Go to Supabase Dashboard → Table Editor"
echo "  2. Open 'users' table"
echo "  3. Look for user: $TEST_EMAIL"
echo "  4. Check 'issues' table for test issues"
echo ""
echo -e "${GREEN}If all tests passed:${NC}"
echo "  ✅ Authentication is working correctly"
echo "  ✅ User registration saves to database"
echo "  ✅ Login generates valid JWT tokens"
echo "  ✅ Protected routes enforce authentication"
echo "  ✅ Data persists in Supabase"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
