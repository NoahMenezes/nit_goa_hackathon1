#!/bin/bash

echo "🔍 Testing Admin Login and Map Configuration..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
if ! curl -s http://localhost:3000/api/health > /dev/null; then
    echo -e "${RED}❌ Server is not running on port 3000${NC}"
    echo "Please start the server with: npm run dev"
    exit 1
fi

echo -e "${GREEN}✓ Server is running${NC}"
echo ""

# Test 1: Check MapTiler API Key
echo "📍 Test 1: MapTiler API Key Configuration"
echo "----------------------------------------"

if grep -q "NEXT_PUBLIC_MAPTILER_API_KEY" .env.local 2>/dev/null; then
    MAPTILER_KEY=$(grep "NEXT_PUBLIC_MAPTILER_API_KEY" .env.local | cut -d'=' -f2 | tr -d ' ')
    if [ -n "$MAPTILER_KEY" ]; then
        echo -e "${GREEN}✓ MapTiler API key is set in .env.local${NC}"
        echo "  Key: ${MAPTILER_KEY:0:10}..."
    else
        echo -e "${RED}❌ MapTiler API key is empty${NC}"
    fi
else
    echo -e "${RED}❌ MapTiler API key not found in .env.local${NC}"
fi
echo ""

# Test 2: Check Admin Database Configuration
echo "🔐 Test 2: Admin Database Configuration"
echo "----------------------------------------"

ADMIN_URL=$(grep "NEXT_PUBLIC_SUPABASE_ADMIN_URL" .env.local 2>/dev/null | cut -d'=' -f2 | tr -d ' ')
ADMIN_ANON=$(grep "NEXT_PUBLIC_SUPABASE_ADMIN_ANON_KEY" .env.local 2>/dev/null | cut -d'=' -f2 | tr -d ' ')
ADMIN_SERVICE=$(grep "SUPABASE_ADMIN_SERVICE_ROLE_KEY" .env.local 2>/dev/null | cut -d'=' -f2 | tr -d ' ')

if [ -n "$ADMIN_URL" ] && [ -n "$ADMIN_ANON" ] && [ -n "$ADMIN_SERVICE" ]; then
    echo -e "${GREEN}✓ Admin database configuration found${NC}"
    echo "  URL: $ADMIN_URL"
    echo "  Anon Key: ${ADMIN_ANON:0:20}..."
    echo "  Service Key: ${ADMIN_SERVICE:0:20}..."
else
    echo -e "${RED}❌ Admin database configuration incomplete${NC}"
    [ -z "$ADMIN_URL" ] && echo "  Missing: NEXT_PUBLIC_SUPABASE_ADMIN_URL"
    [ -z "$ADMIN_ANON" ] && echo "  Missing: NEXT_PUBLIC_SUPABASE_ADMIN_ANON_KEY"
    [ -z "$ADMIN_SERVICE" ] && echo "  Missing: SUPABASE_ADMIN_SERVICE_ROLE_KEY"
fi
echo ""

# Test 3: Check Health Endpoint
echo "💚 Test 3: Health Check"
echo "----------------------------------------"

HEALTH=$(curl -s http://localhost:3000/api/health)
ADMIN_CONFIGURED=$(echo $HEALTH | grep -o '"admin":{[^}]*"configured":[^,]*' | grep -o 'configured":[^,]*' | cut -d':' -f2 | tr -d ' ')

if [ "$ADMIN_CONFIGURED" = "true" ]; then
    echo -e "${GREEN}✓ Admin database is configured in the app${NC}"
else
    echo -e "${RED}❌ Admin database is NOT configured in the app${NC}"
    echo "  Please restart the server after setting env variables"
fi
echo ""

# Test 4: Test Admin Login
echo "🔓 Test 4: Admin Login Test"
echo "----------------------------------------"

# Check if we have test credentials
if [ -z "$ADMIN_URL" ]; then
    echo -e "${YELLOW}⚠ Skipping admin login test - database not configured${NC}"
else
    echo "Testing admin login with: vibhuporobo@gmail.com"

    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"vibhuporobo@gmail.com","password":"test123","userType":"admin"}')

    if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ Admin login successful${NC}"
        USER_NAME=$(echo $LOGIN_RESPONSE | grep -o '"name":"[^"]*"' | cut -d':' -f2 | tr -d '"')
        echo "  Logged in as: $USER_NAME"
    elif echo "$LOGIN_RESPONSE" | grep -q "User not found"; then
        echo -e "${RED}❌ Admin user not found in database${NC}"
        echo "  Response: $(echo $LOGIN_RESPONSE | grep -o '"error":"[^"]*"' | cut -d':' -f2)"
        echo ""
        echo -e "${YELLOW}💡 ACTION REQUIRED:${NC}"
        echo "  1. Go to your Admin Supabase project"
        echo "  2. Go to SQL Editor"
        echo "  3. Run this SQL to create an admin user:"
        echo ""
        echo "  INSERT INTO users (name, email, password, role) VALUES"
        echo "    ('Admin User', 'vibhuporobo@gmail.com', '\$2b\$10\$P0XqvSRbQhS6Xy5hnp3g/OH5Qce90q1aq810DJJYOW5rRk7evX4Hy', 'admin');"
        echo ""
        echo "  (Password will be: password123)"
    elif echo "$LOGIN_RESPONSE" | grep -q "Invalid email or password"; then
        echo -e "${RED}❌ Invalid password${NC}"
        echo "  User exists but password is incorrect"
    else
        echo -e "${RED}❌ Login failed${NC}"
        echo "  Response: $LOGIN_RESPONSE"
    fi
fi
echo ""

# Test 5: Check Map Page
echo "🗺️  Test 5: Map Page Accessibility"
echo "----------------------------------------"

MAP_PAGE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/map)

if [ "$MAP_PAGE" = "200" ] || [ "$MAP_PAGE" = "307" ]; then
    echo -e "${GREEN}✓ Map page is accessible${NC}"
    echo "  Visit: http://localhost:3000/map"
else
    echo -e "${RED}❌ Map page returned status: $MAP_PAGE${NC}"
fi
echo ""

# Summary
echo "================================================"
echo "📊 Summary"
echo "================================================"
echo ""

ISSUES=0

if [ -z "$MAPTILER_KEY" ]; then
    echo -e "${RED}⚠ MapTiler API key not configured${NC}"
    ISSUES=$((ISSUES + 1))
fi

if [ -z "$ADMIN_URL" ] || [ -z "$ADMIN_ANON" ] || [ -z "$ADMIN_SERVICE" ]; then
    echo -e "${RED}⚠ Admin database not fully configured${NC}"
    ISSUES=$((ISSUES + 1))
fi

if [ "$ADMIN_CONFIGURED" != "true" ]; then
    echo -e "${YELLOW}⚠ Server needs restart to pick up new env variables${NC}"
    ISSUES=$((ISSUES + 1))
fi

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo -e "${YELLOW}⚠ Found $ISSUES issue(s) to fix${NC}"
fi

echo ""
echo "Done! 🎉"
