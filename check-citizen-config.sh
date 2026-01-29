#!/bin/bash

echo "======================================================================"
echo "🔍 Citizen Database Configuration Checker"
echo "======================================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local file NOT FOUND!${NC}"
    echo ""
    echo "Please create .env.local from the template:"
    echo "  cp COPY_TO_ENV_LOCAL.txt .env.local"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ .env.local file exists${NC}"
echo ""

# Check each required variable
echo "Checking Citizen Database Configuration:"
echo "----------------------------------------------------------------------"

# URL Check
if grep -q "^NEXT_PUBLIC_SUPABASE_CITIZEN_URL=https://" .env.local 2>/dev/null; then
    URL=$(grep "^NEXT_PUBLIC_SUPABASE_CITIZEN_URL=" .env.local | cut -d'=' -f2)
    if [ "$URL" != "your_citizen_supabase_project_url_here" ] && [ ! -z "$URL" ]; then
        echo -e "${GREEN}✅ NEXT_PUBLIC_SUPABASE_CITIZEN_URL${NC} is configured"
    else
        echo -e "${RED}❌ NEXT_PUBLIC_SUPABASE_CITIZEN_URL${NC} - placeholder value detected"
    fi
elif grep -q "^NEXT_PUBLIC_SUPABASE_CITIZEN_URL=" .env.local 2>/dev/null; then
    echo -e "${YELLOW}⚠️  NEXT_PUBLIC_SUPABASE_CITIZEN_URL${NC} - exists but may be invalid"
else
    echo -e "${RED}❌ NEXT_PUBLIC_SUPABASE_CITIZEN_URL${NC} - NOT SET"
fi

# Anon Key Check
if grep -q "^NEXT_PUBLIC_SUPABASE_CITIZEN_ANON_KEY=" .env.local 2>/dev/null; then
    ANON=$(grep "^NEXT_PUBLIC_SUPABASE_CITIZEN_ANON_KEY=" .env.local | cut -d'=' -f2)
    if [ "$ANON" != "your_citizen_supabase_anon_key_here" ] && [ ! -z "$ANON" ]; then
        echo -e "${GREEN}✅ NEXT_PUBLIC_SUPABASE_CITIZEN_ANON_KEY${NC} is configured"
    else
        echo -e "${RED}❌ NEXT_PUBLIC_SUPABASE_CITIZEN_ANON_KEY${NC} - placeholder value detected"
    fi
else
    echo -e "${RED}❌ NEXT_PUBLIC_SUPABASE_CITIZEN_ANON_KEY${NC} - NOT SET"
fi

# Service Role Key Check (THE CRITICAL ONE)
if grep -q "^SUPABASE_CITIZEN_SERVICE_ROLE_KEY=" .env.local 2>/dev/null; then
    SERVICE=$(grep "^SUPABASE_CITIZEN_SERVICE_ROLE_KEY=" .env.local | cut -d'=' -f2)
    if [ "$SERVICE" != "your_citizen_supabase_service_role_key_here" ] && [ ! -z "$SERVICE" ]; then
        echo -e "${GREEN}✅ SUPABASE_CITIZEN_SERVICE_ROLE_KEY${NC} is configured"
    else
        echo -e "${RED}❌ SUPABASE_CITIZEN_SERVICE_ROLE_KEY${NC} - placeholder value detected"
        echo -e "   ${YELLOW}⚠️  THIS IS THE PROBLEM - SIGNUPS WON'T WORK!${NC}"
    fi
else
    echo -e "${RED}❌ SUPABASE_CITIZEN_SERVICE_ROLE_KEY${NC} - NOT SET"
    echo -e "   ${YELLOW}⚠️  THIS IS THE PROBLEM - SIGNUPS WON'T WORK!${NC}"
fi

echo ""
echo "----------------------------------------------------------------------"
echo ""

# Check other important variables
echo "Checking Other Required Configuration:"
echo "----------------------------------------------------------------------"

if grep -q "^JWT_SECRET=" .env.local 2>/dev/null; then
    JWT=$(grep "^JWT_SECRET=" .env.local | cut -d'=' -f2)
    if [ ! -z "$JWT" ] && [ "$JWT" != "citypulse-secret-key-change-in-production-use-openssl-rand-base64-32" ]; then
        echo -e "${GREEN}✅ JWT_SECRET${NC} is configured"
    else
        echo -e "${YELLOW}⚠️  JWT_SECRET${NC} - using default (change in production!)"
    fi
else
    echo -e "${RED}❌ JWT_SECRET${NC} - NOT SET"
fi

if grep -q "^NEXT_PUBLIC_APP_URL=" .env.local 2>/dev/null; then
    echo -e "${GREEN}✅ NEXT_PUBLIC_APP_URL${NC} is set"
else
    echo -e "${YELLOW}⚠️  NEXT_PUBLIC_APP_URL${NC} - NOT SET (optional for localhost)"
fi

echo ""
echo "======================================================================"
echo ""

# Summary
CITIZEN_URL_OK=$(grep -q "^NEXT_PUBLIC_SUPABASE_CITIZEN_URL=https://" .env.local 2>/dev/null && echo "yes" || echo "no")
CITIZEN_ANON_OK=$(grep -q "^NEXT_PUBLIC_SUPABASE_CITIZEN_ANON_KEY=eyJ" .env.local 2>/dev/null && echo "yes" || echo "no")
CITIZEN_SERVICE_OK=$(grep -q "^SUPABASE_CITIZEN_SERVICE_ROLE_KEY=eyJ" .env.local 2>/dev/null && echo "yes" || echo "no")

if [ "$CITIZEN_URL_OK" = "yes" ] && [ "$CITIZEN_ANON_OK" = "yes" ] && [ "$CITIZEN_SERVICE_OK" = "yes" ]; then
    echo -e "${GREEN}✅ CITIZEN DATABASE FULLY CONFIGURED!${NC}"
    echo ""
    echo "You should now be able to:"
    echo "  • Sign up as a citizen"
    echo "  • Create issues"
    echo "  • Login successfully"
    echo ""
    echo "Next steps:"
    echo "  1. Restart your dev server: npm run dev"
    echo "  2. Test signup at: http://localhost:3000/signup"
    echo "  3. Check health endpoint: http://localhost:3000/api/health"
else
    echo -e "${RED}❌ CITIZEN DATABASE NOT FULLY CONFIGURED${NC}"
    echo ""
    echo -e "${YELLOW}To fix the issue:${NC}"
    echo ""
    echo "1. Go to: https://supabase.com/dashboard"
    echo "2. Select your CITIZEN database project"
    echo "3. Go to Settings → API"
    echo "4. Copy the following keys to .env.local:"
    echo ""

    if [ "$CITIZEN_URL_OK" != "yes" ]; then
        echo "   NEXT_PUBLIC_SUPABASE_CITIZEN_URL=<Project URL>"
    fi

    if [ "$CITIZEN_ANON_OK" != "yes" ]; then
        echo "   NEXT_PUBLIC_SUPABASE_CITIZEN_ANON_KEY=<anon/public key>"
    fi

    if [ "$CITIZEN_SERVICE_OK" != "yes" ]; then
        echo -e "   ${RED}SUPABASE_CITIZEN_SERVICE_ROLE_KEY=<service_role key>${NC} ⚠️ CRITICAL!"
    fi

    echo ""
    echo "5. Restart your development server"
    echo ""
    echo -e "${YELLOW}⚠️  The service_role key is CRITICAL for signups to work!${NC}"
fi

echo ""
echo "======================================================================"
echo ""
echo "For detailed help, see: CITIZEN_SIGNUP_FIX.md"
echo ""
