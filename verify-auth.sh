#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  CityPulse Authentication Verification${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if .env.local exists
echo -e "${YELLOW}[1/5]${NC} Checking environment file..."
if [ ! -f .env.local ]; then
    echo -e "${RED}✗ .env.local not found!${NC}"
    echo -e "${YELLOW}→ Create .env.local with your Supabase credentials${NC}\n"
    exit 1
else
    echo -e "${GREEN}✓ .env.local exists${NC}\n"
fi

# Check required environment variables
echo -e "${YELLOW}[2/5]${NC} Checking environment variables..."
source .env.local 2>/dev/null

MISSING_VARS=()

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    MISSING_VARS+=("NEXT_PUBLIC_SUPABASE_URL")
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    MISSING_VARS+=("NEXT_PUBLIC_SUPABASE_ANON_KEY")
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    MISSING_VARS+=("SUPABASE_SERVICE_ROLE_KEY")
fi

if [ -z "$JWT_SECRET" ]; then
    MISSING_VARS+=("JWT_SECRET")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}✗ Missing required variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo -e "  ${RED}- $var${NC}"
    done
    echo ""
    exit 1
else
    echo -e "${GREEN}✓ All required environment variables present${NC}\n"
fi

# Check if server is running
echo -e "${YELLOW}[3/5]${NC} Checking if server is running..."
APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
if curl -s "$APP_URL/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Server is running at $APP_URL${NC}\n"
else
    echo -e "${RED}✗ Server is not running!${NC}"
    echo -e "${YELLOW}→ Start server with: npm run dev${NC}\n"
    exit 1
fi

# Test signup endpoint
echo -e "${YELLOW}[4/5]${NC} Testing signup endpoint..."
TIMESTAMP=$(date +%s)
TEST_EMAIL="testuser${TIMESTAMP}@example.com"
TEST_PASSWORD="TestPassword123!"

SIGNUP_RESPONSE=$(curl -s -X POST "$APP_URL/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"Test User\",
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\",
        \"confirmPassword\": \"$TEST_PASSWORD\",
        \"role\": \"citizen\"
    }")

SIGNUP_SUCCESS=$(echo $SIGNUP_RESPONSE | grep -o '"success":true' || echo "")

if [ -n "$SIGNUP_SUCCESS" ]; then
    echo -e "${GREEN}✓ Signup successful${NC}"
    TOKEN=$(echo $SIGNUP_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo -e "  ${BLUE}→ Token received${NC}\n"
else
    echo -e "${RED}✗ Signup failed${NC}"
    echo -e "${RED}Response: $SIGNUP_RESPONSE${NC}\n"
    exit 1
fi

# Test login endpoint
echo -e "${YELLOW}[5/5]${NC} Testing login endpoint..."
LOGIN_RESPONSE=$(curl -s -X POST "$APP_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
    }")

LOGIN_SUCCESS=$(echo $LOGIN_RESPONSE | grep -o '"success":true' || echo "")

if [ -n "$LOGIN_SUCCESS" ]; then
    echo -e "${GREEN}✓ Login successful${NC}"
    echo -e "  ${BLUE}→ User authenticated correctly${NC}\n"
else
    echo -e "${RED}✗ Login failed${NC}"
    echo -e "${RED}Response: $LOGIN_RESPONSE${NC}\n"
    exit 1
fi

# Success summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✓ Authentication is working!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${BLUE}Test Results:${NC}"
echo -e "  • Environment: ${GREEN}Configured${NC}"
echo -e "  • Server: ${GREEN}Running${NC}"
echo -e "  • Signup: ${GREEN}Working${NC}"
echo -e "  • Login: ${GREEN}Working${NC}"
echo -e "  • Test User: ${BLUE}$TEST_EMAIL${NC}\n"

echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Try the UI: ${BLUE}$APP_URL/signup${NC}"
echo -e "  2. Create an admin account for full access"
echo -e "  3. Test issue reporting and commenting\n"

echo -e "${GREEN}You're all set! 🚀${NC}\n"
