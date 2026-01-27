#!/bin/bash

# Endpoint Testing Script for OurStreet/CityPulse
# Tests all API endpoints to verify database connectivity and proper responses

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
API_URL="${BASE_URL}/api"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test results array
declare -a FAILED_ENDPOINTS

# Helper function to print colored output
print_status() {
    local status=$1
    local message=$2
    if [ "$status" == "PASS" ]; then
        echo -e "${GREEN}✓${NC} $message"
        ((PASSED_TESTS++))
    elif [ "$status" == "FAIL" ]; then
        echo -e "${RED}✗${NC} $message"
        ((FAILED_TESTS++))
    elif [ "$status" == "WARN" ]; then
        echo -e "${YELLOW}⚠${NC} $message"
    elif [ "$status" == "INFO" ]; then
        echo -e "${BLUE}ℹ${NC} $message"
    fi
}

# Function to test an endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    local data=$5
    local token=$6

    ((TOTAL_TESTS++))

    local full_url="${API_URL}${endpoint}"
    local response
    local status_code

    # Build curl command
    local curl_cmd="curl -s -w '\n%{http_code}' -X ${method} '${full_url}'"

    if [ -n "$token" ]; then
        curl_cmd="${curl_cmd} -H 'Authorization: Bearer ${token}'"
    fi

    if [ -n "$data" ]; then
        curl_cmd="${curl_cmd} -H 'Content-Type: application/json' -d '${data}'"
    fi

    # Execute request
    response=$(eval ${curl_cmd})
    status_code=$(echo "$response" | tail -n1)

    # Check status code
    if [ "$status_code" == "$expected_status" ]; then
        print_status "PASS" "$description (${method} ${endpoint})"
        return 0
    else
        print_status "FAIL" "$description (${method} ${endpoint}) - Expected ${expected_status}, got ${status_code}"
        FAILED_ENDPOINTS+=("${method} ${endpoint} - Expected ${expected_status}, got ${status_code}")
        return 1
    fi
}

# Function to extract token from response
extract_token() {
    local response=$1
    echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4
}

# Function to extract user ID from response
extract_user_id() {
    local response=$1
    echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  OurStreet API Endpoint Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${INFO}INFO${NC} Testing endpoints at: ${BASE_URL}"
echo ""

# ============================================================================
# 1. HEALTH CHECK
# ============================================================================

echo -e "${BLUE}[1/10] Health Check Endpoints${NC}"
test_endpoint "GET" "/health" "200" "Health check endpoint"
echo ""

# ============================================================================
# 2. PUBLIC STATS
# ============================================================================

echo -e "${BLUE}[2/10] Public Stats Endpoints${NC}"
test_endpoint "GET" "/public/stats" "200" "Public statistics (unauthenticated)"
echo ""

# ============================================================================
# 3. AUTHENTICATION - SIGNUP
# ============================================================================

echo -e "${BLUE}[3/10] Authentication - Signup${NC}"

# Generate unique email for testing
TIMESTAMP=$(date +%s)
TEST_EMAIL="test${TIMESTAMP}@example.com"
TEST_ADMIN_EMAIL="admin${TIMESTAMP}@example.com"

# Test citizen signup
SIGNUP_DATA="{\"name\":\"Test User\",\"email\":\"${TEST_EMAIL}\",\"password\":\"Test1234\",\"confirmPassword\":\"Test1234\",\"role\":\"citizen\"}"
SIGNUP_RESPONSE=$(curl -s -X POST "${API_URL}/auth/signup" \
    -H "Content-Type: application/json" \
    -d "${SIGNUP_DATA}")

if echo "$SIGNUP_RESPONSE" | grep -q '"success":true'; then
    print_status "PASS" "Citizen signup"
    CITIZEN_TOKEN=$(extract_token "$SIGNUP_RESPONSE")
    CITIZEN_USER_ID=$(extract_user_id "$SIGNUP_RESPONSE")
    print_status "INFO" "Citizen Token: ${CITIZEN_TOKEN:0:20}..."
else
    print_status "FAIL" "Citizen signup"
    FAILED_ENDPOINTS+=("POST /auth/signup (citizen)")
    ((TOTAL_TESTS++))
    ((FAILED_TESTS++))
fi

# Test admin signup
ADMIN_SIGNUP_DATA="{\"name\":\"Test Admin\",\"email\":\"${TEST_ADMIN_EMAIL}\",\"password\":\"Admin1234\",\"confirmPassword\":\"Admin1234\",\"role\":\"admin\"}"
ADMIN_SIGNUP_RESPONSE=$(curl -s -X POST "${API_URL}/auth/signup" \
    -H "Content-Type: application/json" \
    -d "${ADMIN_SIGNUP_DATA}")

if echo "$ADMIN_SIGNUP_RESPONSE" | grep -q '"success":true'; then
    print_status "PASS" "Admin signup"
    ADMIN_TOKEN=$(extract_token "$ADMIN_SIGNUP_RESPONSE")
    ADMIN_USER_ID=$(extract_user_id "$ADMIN_SIGNUP_RESPONSE")
    print_status "INFO" "Admin Token: ${ADMIN_TOKEN:0:20}..."
else
    print_status "FAIL" "Admin signup"
    FAILED_ENDPOINTS+=("POST /auth/signup (admin)")
    ((TOTAL_TESTS++))
    ((FAILED_TESTS++))
fi

# Test duplicate signup (should fail)
DUPLICATE_RESPONSE=$(curl -s -w '\n%{http_code}' -X POST "${API_URL}/auth/signup" \
    -H "Content-Type: application/json" \
    -d "${SIGNUP_DATA}")
DUPLICATE_STATUS=$(echo "$DUPLICATE_RESPONSE" | tail -n1)

((TOTAL_TESTS++))
if [ "$DUPLICATE_STATUS" == "409" ]; then
    print_status "PASS" "Duplicate signup rejection"
else
    print_status "FAIL" "Duplicate signup should return 409, got ${DUPLICATE_STATUS}"
    FAILED_ENDPOINTS+=("POST /auth/signup (duplicate)")
    ((FAILED_TESTS++))
fi

echo ""

# ============================================================================
# 4. AUTHENTICATION - LOGIN
# ============================================================================

echo -e "${BLUE}[4/10] Authentication - Login${NC}"

LOGIN_DATA="{\"email\":\"${TEST_EMAIL}\",\"password\":\"Test1234\"}"
test_endpoint "POST" "/auth/login" "200" "User login with valid credentials" "${LOGIN_DATA}"

INVALID_LOGIN="{\"email\":\"${TEST_EMAIL}\",\"password\":\"WrongPassword\"}"
test_endpoint "POST" "/auth/login" "401" "Login with invalid password" "${INVALID_LOGIN}"

echo ""

# ============================================================================
# 5. USER ENDPOINTS
# ============================================================================

echo -e "${BLUE}[5/10] User Endpoints${NC}"

if [ -n "$CITIZEN_TOKEN" ]; then
    test_endpoint "GET" "/user" "200" "Get authenticated user profile" "" "$CITIZEN_TOKEN"
else
    print_status "WARN" "Skipping user endpoints (no auth token)"
fi

echo ""

# ============================================================================
# 6. ISSUES ENDPOINTS
# ============================================================================

echo -e "${BLUE}[6/10] Issues Endpoints${NC}"

# Test GET all issues (public)
test_endpoint "GET" "/issues" "200" "Get all issues (public)"

# Test CREATE issue (authenticated)
if [ -n "$CITIZEN_TOKEN" ]; then
    ISSUE_DATA="{\"title\":\"Test Issue ${TIMESTAMP}\",\"description\":\"Test description\",\"category\":\"pothole\",\"location\":\"Test Location\",\"latitude\":15.4909,\"longitude\":73.8278,\"priority\":\"medium\"}"

    CREATE_ISSUE_RESPONSE=$(curl -s -X POST "${API_URL}/issues" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${CITIZEN_TOKEN}" \
        -d "${ISSUE_DATA}")

    ((TOTAL_TESTS++))
    if echo "$CREATE_ISSUE_RESPONSE" | grep -q '"success":true'; then
        print_status "PASS" "Create new issue (authenticated)"
        ISSUE_ID=$(echo "$CREATE_ISSUE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        print_status "INFO" "Created Issue ID: $ISSUE_ID"
    else
        print_status "FAIL" "Create new issue failed"
        FAILED_ENDPOINTS+=("POST /issues")
        ((FAILED_TESTS++))
    fi
else
    print_status "WARN" "Skipping issue creation (no auth token)"
fi

# Test GET specific issue
if [ -n "$ISSUE_ID" ]; then
    test_endpoint "GET" "/issues/${ISSUE_ID}" "200" "Get specific issue by ID"
fi

echo ""

# ============================================================================
# 7. COMMENTS ENDPOINTS
# ============================================================================

echo -e "${BLUE}[7/10] Comments Endpoints${NC}"

if [ -n "$ISSUE_ID" ] && [ -n "$CITIZEN_TOKEN" ]; then
    COMMENT_DATA="{\"content\":\"Test comment ${TIMESTAMP}\"}"

    CREATE_COMMENT_RESPONSE=$(curl -s -X POST "${API_URL}/issues/${ISSUE_ID}/comments" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${CITIZEN_TOKEN}" \
        -d "${COMMENT_DATA}")

    ((TOTAL_TESTS++))
    if echo "$CREATE_COMMENT_RESPONSE" | grep -q '"success":true'; then
        print_status "PASS" "Create comment on issue"
    else
        print_status "FAIL" "Create comment failed"
        FAILED_ENDPOINTS+=("POST /issues/${ISSUE_ID}/comments")
        ((FAILED_TESTS++))
    fi

    # Test GET comments
    test_endpoint "GET" "/issues/${ISSUE_ID}/comments" "200" "Get issue comments"
else
    print_status "WARN" "Skipping comments tests (no issue ID or auth token)"
fi

echo ""

# ============================================================================
# 8. VOTING ENDPOINTS
# ============================================================================

echo -e "${BLUE}[8/10] Voting Endpoints${NC}"

if [ -n "$ISSUE_ID" ] && [ -n "$CITIZEN_TOKEN" ]; then
    VOTE_RESPONSE=$(curl -s -X POST "${API_URL}/issues/${ISSUE_ID}/vote" \
        -H "Authorization: Bearer ${CITIZEN_TOKEN}")

    ((TOTAL_TESTS++))
    if echo "$VOTE_RESPONSE" | grep -q '"success":true'; then
        print_status "PASS" "Vote on issue"
    else
        print_status "FAIL" "Vote on issue failed"
        FAILED_ENDPOINTS+=("POST /issues/${ISSUE_ID}/vote")
        ((FAILED_TESTS++))
    fi
else
    print_status "WARN" "Skipping voting tests (no issue ID or auth token)"
fi

echo ""

# ============================================================================
# 9. DASHBOARD ENDPOINTS
# ============================================================================

echo -e "${BLUE}[9/10] Dashboard Endpoints${NC}"

if [ -n "$CITIZEN_TOKEN" ]; then
    test_endpoint "GET" "/dashboard" "200" "Get dashboard stats (authenticated)" "" "$CITIZEN_TOKEN"
else
    # Dashboard should work without auth too
    test_endpoint "GET" "/dashboard" "200" "Get dashboard stats (public)"
fi

echo ""

# ============================================================================
# 10. ADMIN ENDPOINTS
# ============================================================================

echo -e "${BLUE}[10/10] Admin Endpoints${NC}"

if [ -n "$ADMIN_TOKEN" ]; then
    test_endpoint "GET" "/admin/stats" "200" "Get admin statistics" "" "$ADMIN_TOKEN"
    test_endpoint "GET" "/admin/users" "200" "Get all users (admin)" "" "$ADMIN_TOKEN"
    test_endpoint "GET" "/admin/issues" "200" "Get all issues (admin)" "" "$ADMIN_TOKEN"

    # Test admin access control - citizen should NOT access admin endpoints
    if [ -n "$CITIZEN_TOKEN" ]; then
        test_endpoint "GET" "/admin/stats" "403" "Citizen blocked from admin endpoint" "" "$CITIZEN_TOKEN"
    fi
else
    print_status "WARN" "Skipping admin endpoint tests (no admin token)"
fi

echo ""

# ============================================================================
# CLEANUP (Optional - comment out to keep test data)
# ============================================================================

echo -e "${BLUE}Cleanup${NC}"
print_status "INFO" "Test data created:"
print_status "INFO" "  - Citizen user: ${TEST_EMAIL}"
print_status "INFO" "  - Admin user: ${TEST_ADMIN_EMAIL}"
if [ -n "$ISSUE_ID" ]; then
    print_status "INFO" "  - Test issue ID: ${ISSUE_ID}"
fi
print_status "INFO" "You can manually delete these from the database if needed"

echo ""

# ============================================================================
# SUMMARY
# ============================================================================

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Test Results Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Total Tests:  ${TOTAL_TESTS}"
echo -e "${GREEN}Passed:       ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed:       ${FAILED_TESTS}${NC}"
echo ""

if [ ${FAILED_TESTS} -gt 0 ]; then
    echo -e "${RED}Failed Endpoints:${NC}"
    for endpoint in "${FAILED_ENDPOINTS[@]}"; do
        echo -e "  ${RED}✗${NC} $endpoint"
    done
    echo ""
    echo -e "${RED}❌ Some tests failed. Please check the errors above.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo -e "${GREEN}Your database and all API endpoints are working correctly!${NC}"
    exit 0
fi
