#!/bin/bash

# Comprehensive Signup Test Script
# Tests user signup for both citizen and admin databases

echo "🔐 Testing User Signup..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if server is running
if ! curl -s http://localhost:3000/api/health > /dev/null; then
    echo -e "${RED}❌ Server is not running${NC}"
    echo ""
    echo "Please start the server:"
    echo "  npm run dev"
    exit 1
fi

echo -e "${GREEN}✓ Server is running${NC}"
echo ""

# Generate random email to avoid conflicts
TIMESTAMP=$(date +%s)
CITIZEN_EMAIL="testcitizen${TIMESTAMP}@test.com"
ADMIN_EMAIL="testadmin${TIMESTAMP}@test.com"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}TEST 1: CITIZEN SIGNUP${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Creating test citizen account..."
echo "  Email: $CITIZEN_EMAIL"
echo "  Password: Test123456"
echo "  Role: citizen"
echo ""

CITIZEN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Citizen\",
    \"email\": \"$CITIZEN_EMAIL\",
    \"password\": \"Test123456\",
    \"confirmPassword\": \"Test123456\",
    \"role\": \"citizen\"
  }")

echo "Response:"
echo "$CITIZEN_RESPONSE" | jq '.' 2>/dev/null || echo "$CITIZEN_RESPONSE"
echo ""

if echo "$CITIZEN_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ CITIZEN SIGNUP SUCCESSFUL!${NC}"
    CITIZEN_ID=$(echo $CITIZEN_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d':' -f2 | tr -d '"')
    CITIZEN_TOKEN=$(echo $CITIZEN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d':' -f2 | tr -d '"')
    echo "  User ID: $CITIZEN_ID"
    echo "  Token: ${CITIZEN_TOKEN:0:20}..."
    echo ""

    # Verify user can login
    echo "Verifying citizen can login..."
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$CITIZEN_EMAIL\",\"password\":\"Test123456\",\"userType\":\"citizen\"}")

    if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ Citizen login verified${NC}"
    else
        echo -e "${RED}✗ Citizen login failed${NC}"
        echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
    fi
else
    echo -e "${RED}❌ CITIZEN SIGNUP FAILED${NC}"
    ERROR_MSG=$(echo $CITIZEN_RESPONSE | grep -o '"error":"[^"]*"' | cut -d':' -f2 | tr -d '"')
    echo "  Error: $ERROR_MSG"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}TEST 2: ADMIN SIGNUP${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Creating test admin account..."
echo "  Email: $ADMIN_EMAIL"
echo "  Password: Admin123456"
echo "  Role: admin"
echo ""

ADMIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Admin\",
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"Admin123456\",
    \"confirmPassword\": \"Admin123456\",
    \"role\": \"admin\"
  }")

echo "Response:"
echo "$ADMIN_RESPONSE" | jq '.' 2>/dev/null || echo "$ADMIN_RESPONSE"
echo ""

if echo "$ADMIN_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ ADMIN SIGNUP SUCCESSFUL!${NC}"
    ADMIN_ID=$(echo $ADMIN_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d':' -f2 | tr -d '"')
    ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d':' -f2 | tr -d '"')
    echo "  User ID: $ADMIN_ID"
    echo "  Token: ${ADMIN_TOKEN:0:20}..."
    echo ""

    # Verify admin can login
    echo "Verifying admin can login..."
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"Admin123456\",\"userType\":\"admin\"}")

    if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ Admin login verified${NC}"
    else
        echo -e "${RED}✗ Admin login failed${NC}"
        echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
    fi
else
    echo -e "${RED}❌ ADMIN SIGNUP FAILED${NC}"
    ERROR_MSG=$(echo $ADMIN_RESPONSE | grep -o '"error":"[^"]*"' | cut -d':' -f2 | tr -d '"')
    echo "  Error: $ERROR_MSG"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}TEST 3: DATABASE SEPARATION${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Testing that citizen and admin databases are separate..."
echo ""

# Try to login as citizen with admin credentials in citizen DB
echo "1. Trying to login to CITIZEN DB with admin email..."
CROSSTEST1=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"Admin123456\",\"userType\":\"citizen\"}")

if echo "$CROSSTEST1" | grep -q "User not found"; then
    echo -e "${GREEN}✓ Admin user correctly NOT found in citizen database${NC}"
else
    echo -e "${RED}✗ Admin user found in citizen database (databases not separated!)${NC}"
fi

echo ""

# Try to login as admin with citizen credentials in admin DB
echo "2. Trying to login to ADMIN DB with citizen email..."
CROSSTEST2=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$CITIZEN_EMAIL\",\"password\":\"Test123456\",\"userType\":\"admin\"}")

if echo "$CROSSTEST2" | grep -q "User not found"; then
    echo -e "${GREEN}✓ Citizen user correctly NOT found in admin database${NC}"
else
    echo -e "${RED}✗ Citizen user found in admin database (databases not separated!)${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}TEST 4: DUPLICATE EMAIL HANDLING${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Testing duplicate email detection..."
echo ""

# Try to signup with same citizen email again
echo "1. Attempting duplicate citizen signup..."
DUPLICATE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Duplicate Test\",
    \"email\": \"$CITIZEN_EMAIL\",
    \"password\": \"Test123456\",
    \"confirmPassword\": \"Test123456\",
    \"role\": \"citizen\"
  }")

if echo "$DUPLICATE_RESPONSE" | grep -q "already exists"; then
    echo -e "${GREEN}✓ Duplicate detection working correctly${NC}"
else
    echo -e "${RED}✗ Duplicate signup was allowed (should have been rejected)${NC}"
    echo "$DUPLICATE_RESPONSE" | jq '.' 2>/dev/null || echo "$DUPLICATE_RESPONSE"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}TEST 5: VALIDATION CHECKS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test short password
echo "1. Testing short password rejection..."
SHORT_PW=$(curl -s -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"short","confirmPassword":"short","role":"citizen"}')

if echo "$SHORT_PW" | grep -q "at least 8 characters"; then
    echo -e "${GREEN}✓ Short password rejected${NC}"
else
    echo -e "${RED}✗ Short password accepted${NC}"
fi

# Test password mismatch
echo "2. Testing password mismatch rejection..."
MISMATCH=$(curl -s -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"Password123","confirmPassword":"Different123","role":"citizen"}')

if echo "$MISMATCH" | grep -q "do not match"; then
    echo -e "${GREEN}✓ Password mismatch detected${NC}"
else
    echo -e "${RED}✗ Password mismatch not detected${NC}"
fi

# Test invalid email
echo "3. Testing invalid email rejection..."
INVALID_EMAIL=$(curl -s -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"notanemail","password":"Test123456","confirmPassword":"Test123456","role":"citizen"}')

if echo "$INVALID_EMAIL" | grep -q "Invalid email"; then
    echo -e "${GREEN}✓ Invalid email rejected${NC}"
else
    echo -e "${RED}✗ Invalid email accepted${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}SUMMARY${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ISSUES=0

if ! echo "$CITIZEN_RESPONSE" | grep -q '"success":true'; then
    echo -e "${RED}⚠ Citizen signup failed${NC}"
    ISSUES=$((ISSUES + 1))
fi

if ! echo "$ADMIN_RESPONSE" | grep -q '"success":true'; then
    echo -e "${RED}⚠ Admin signup failed${NC}"
    ISSUES=$((ISSUES + 1))
fi

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ ALL SIGNUP TESTS PASSED!${NC}"
    echo ""
    echo "Test accounts created:"
    echo "  Citizen: $CITIZEN_EMAIL / Test123456"
    echo "  Admin:   $ADMIN_EMAIL / Admin123456"
else
    echo -e "${YELLOW}⚠ Found $ISSUES issue(s)${NC}"
    echo ""
    echo "Check server logs for details:"
    echo "  Look for errors in terminal where 'npm run dev' is running"
fi

echo ""
echo "Done! 🎉"
