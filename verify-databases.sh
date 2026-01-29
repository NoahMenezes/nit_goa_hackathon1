#!/bin/bash

# Database Verification Script
# Verifies that citizen and admin databases are properly separated

echo "🔍 Verifying Database Configuration..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Load environment variables
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local file not found${NC}"
    exit 1
fi

source .env.local 2>/dev/null || true

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}STEP 1: DATABASE CONFIGURATION CHECK${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Extract project IDs from URLs
if [ -n "$NEXT_PUBLIC_SUPABASE_CITIZEN_URL" ]; then
    CITIZEN_PROJECT=$(echo $NEXT_PUBLIC_SUPABASE_CITIZEN_URL | sed 's/https:\/\/\([^.]*\).*/\1/')
    echo -e "${GREEN}✓ Citizen Database Configured${NC}"
    echo "  Project ID: $CITIZEN_PROJECT"
    echo "  URL: $NEXT_PUBLIC_SUPABASE_CITIZEN_URL"
else
    echo -e "${RED}✗ Citizen database URL not set${NC}"
fi

echo ""

if [ -n "$NEXT_PUBLIC_SUPABASE_ADMIN_URL" ]; then
    ADMIN_PROJECT=$(echo $NEXT_PUBLIC_SUPABASE_ADMIN_URL | sed 's/https:\/\/\([^.]*\).*/\1/')
    echo -e "${GREEN}✓ Admin Database Configured${NC}"
    echo "  Project ID: $ADMIN_PROJECT"
    echo "  URL: $NEXT_PUBLIC_SUPABASE_ADMIN_URL"
else
    echo -e "${RED}✗ Admin database URL not set${NC}"
fi

echo ""

# Check if they're the same
if [ "$CITIZEN_PROJECT" = "$ADMIN_PROJECT" ]; then
    echo -e "${RED}⚠️  WARNING: Both databases point to the SAME Supabase project!${NC}"
    echo ""
    echo "This means:"
    echo "  • Citizen and admin users are stored in the same database"
    echo "  • There is NO separation between user types"
    echo "  • You need to create TWO separate Supabase projects"
    echo ""
    echo "Action required:"
    echo "  1. Create a second Supabase project at https://supabase.com"
    echo "  2. Update .env.local with the new project's credentials"
    echo "  3. Run the schema.sql in BOTH projects"
    SAME_DB=true
else
    echo -e "${GREEN}✓ Databases are separate (different Supabase projects)${NC}"
    SAME_DB=false
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}STEP 2: API KEY VERIFICATION${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check citizen keys
if [ -n "$NEXT_PUBLIC_SUPABASE_CITIZEN_ANON_KEY" ]; then
    CITIZEN_ANON_PREFIX=$(echo $NEXT_PUBLIC_SUPABASE_CITIZEN_ANON_KEY | cut -c1-20)
    echo -e "${GREEN}✓ Citizen anon key set${NC} (${CITIZEN_ANON_PREFIX}...)"
else
    echo -e "${RED}✗ Citizen anon key missing${NC}"
fi

if [ -n "$SUPABASE_CITIZEN_SERVICE_ROLE_KEY" ]; then
    CITIZEN_SERVICE_PREFIX=$(echo $SUPABASE_CITIZEN_SERVICE_ROLE_KEY | cut -c1-20)
    echo -e "${GREEN}✓ Citizen service role key set${NC} (${CITIZEN_SERVICE_PREFIX}...)"
else
    echo -e "${RED}✗ Citizen service role key missing${NC}"
fi

echo ""

# Check admin keys
if [ -n "$NEXT_PUBLIC_SUPABASE_ADMIN_ANON_KEY" ]; then
    ADMIN_ANON_PREFIX=$(echo $NEXT_PUBLIC_SUPABASE_ADMIN_ANON_KEY | cut -c1-20)
    echo -e "${GREEN}✓ Admin anon key set${NC} (${ADMIN_ANON_PREFIX}...)"
else
    echo -e "${RED}✗ Admin anon key missing${NC}"
fi

if [ -n "$SUPABASE_ADMIN_SERVICE_ROLE_KEY" ]; then
    ADMIN_SERVICE_PREFIX=$(echo $SUPABASE_ADMIN_SERVICE_ROLE_KEY | cut -c1-20)
    echo -e "${GREEN}✓ Admin service role key set${NC} (${ADMIN_SERVICE_PREFIX}...)"
else
    echo -e "${RED}✗ Admin service role key missing${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}STEP 3: LIVE USER COUNT TEST${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -f "node_modules/@supabase/supabase-js/dist/module/index.js" ]; then
    echo -e "${YELLOW}⚠️  Supabase JS not installed, skipping live test${NC}"
else
    echo "Querying databases for user counts..."
    echo ""

    # Create a temp Node script to query both databases
    cat > /tmp/query-dbs.js << 'EOFSCRIPT'
const { createClient } = require('@supabase/supabase-js');

async function queryDatabases() {
    const citizenUrl = process.env.NEXT_PUBLIC_SUPABASE_CITIZEN_URL;
    const citizenKey = process.env.SUPABASE_CITIZEN_SERVICE_ROLE_KEY;
    const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_ADMIN_URL;
    const adminKey = process.env.SUPABASE_ADMIN_SERVICE_ROLE_KEY;

    console.log('Citizen Database:');
    if (citizenUrl && citizenKey) {
        const citizen = createClient(citizenUrl, citizenKey);
        const { data, error, count } = await citizen.from('users').select('email, role', { count: 'exact', head: false });
        if (error) {
            console.log('  Error:', error.message);
        } else {
            console.log('  Total users:', count);
            const citizens = data?.filter(u => u.role === 'citizen').length || 0;
            const admins = data?.filter(u => u.role === 'admin').length || 0;
            console.log('  Citizens:', citizens);
            console.log('  Admins:', admins);
            if (admins > 0) {
                console.log('  ⚠️  WARNING: Admin users found in citizen database!');
            }
        }
    } else {
        console.log('  Not configured');
    }

    console.log('');
    console.log('Admin Database:');
    if (adminUrl && adminKey) {
        const admin = createClient(adminUrl, adminKey);
        const { data, error, count } = await admin.from('users').select('email, role', { count: 'exact', head: false });
        if (error) {
            console.log('  Error:', error.message);
        } else {
            console.log('  Total users:', count);
            const citizens = data?.filter(u => u.role === 'citizen').length || 0;
            const admins = data?.filter(u => u.role === 'admin').length || 0;
            console.log('  Citizens:', citizens);
            console.log('  Admins:', admins);
            if (citizens > 0) {
                console.log('  ⚠️  WARNING: Citizen users found in admin database!');
            }
        }
    } else {
        console.log('  Not configured');
    }
}

queryDatabases().catch(console.error);
EOFSCRIPT

    node /tmp/query-dbs.js
    rm /tmp/query-dbs.js
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}STEP 4: SIGNUP FLOW TEST${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Server not running, skipping signup test${NC}"
    echo "Start server with: npm run dev"
else
    echo "Testing signup flow..."
    TIMESTAMP=$(date +%s)
    TEST_EMAIL="verify${TIMESTAMP}@test.com"

    echo ""
    echo "Creating test citizen account: $TEST_EMAIL"
    RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/signup \
      -H "Content-Type: application/json" \
      -d "{\"name\":\"Test User\",\"email\":\"$TEST_EMAIL\",\"password\":\"Test123456\",\"confirmPassword\":\"Test123456\",\"role\":\"citizen\"}")

    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ Signup successful${NC}"
        USER_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | cut -d':' -f2 | tr -d '"')
        echo "  User ID: $USER_ID"

        # Test login
        echo ""
        echo "Testing login..."
        LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
          -H "Content-Type: application/json" \
          -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"Test123456\",\"userType\":\"citizen\"}")

        if echo "$LOGIN" | grep -q '"success":true'; then
            echo -e "${GREEN}✓ Login successful${NC}"
        else
            echo -e "${RED}✗ Login failed${NC}"
            echo "$LOGIN" | jq '.error' 2>/dev/null || echo "$LOGIN"
        fi
    else
        echo -e "${RED}✗ Signup failed${NC}"
        echo "$RESPONSE" | jq '.error' 2>/dev/null || echo "$RESPONSE"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}SUMMARY & RECOMMENDATIONS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$SAME_DB" = true ]; then
    echo -e "${RED}⚠️  CRITICAL ISSUE: Same database being used for both citizen and admin${NC}"
    echo ""
    echo "To fix:"
    echo "1. Create a new Supabase project at https://supabase.com"
    echo "2. Copy supabase/schema.sql and run it in BOTH projects"
    echo "3. Update your .env.local with separate credentials:"
    echo ""
    echo "   # Citizen Database (Project 1)"
    echo "   NEXT_PUBLIC_SUPABASE_CITIZEN_URL=<project1-url>"
    echo "   NEXT_PUBLIC_SUPABASE_CITIZEN_ANON_KEY=<project1-anon-key>"
    echo "   SUPABASE_CITIZEN_SERVICE_ROLE_KEY=<project1-service-key>"
    echo ""
    echo "   # Admin Database (Project 2)"
    echo "   NEXT_PUBLIC_SUPABASE_ADMIN_URL=<project2-url>"
    echo "   NEXT_PUBLIC_SUPABASE_ADMIN_ANON_KEY=<project2-anon-key>"
    echo "   SUPABASE_ADMIN_SERVICE_ROLE_KEY=<project2-service-key>"
    echo ""
else
    echo -e "${GREEN}✅ Databases are properly separated${NC}"
    echo ""
    echo "Your setup:"
    echo "  • Citizen DB: $CITIZEN_PROJECT"
    echo "  • Admin DB: $ADMIN_PROJECT"
    echo ""
    echo "Users are correctly stored in separate databases."
fi

echo ""
echo "Done! 🎉"
