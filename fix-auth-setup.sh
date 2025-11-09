#!/bin/bash

# CityPulse Authentication & Database Fix Script
# This script helps diagnose and fix authentication and database connection issues

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     CityPulse Authentication & Database Fix Script          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ "$1" = "success" ]; then
        echo -e "${GREEN}✅ $2${NC}"
    elif [ "$1" = "error" ]; then
        echo -e "${RED}❌ $2${NC}"
    elif [ "$1" = "warning" ]; then
        echo -e "${YELLOW}⚠️  $2${NC}"
    elif [ "$1" = "info" ]; then
        echo -e "${BLUE}ℹ️  $2${NC}"
    fi
}

# Step 1: Check if .env.local exists
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Checking Environment Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -f .env.local ]; then
    print_status "warning" ".env.local does not exist"
    echo ""
    echo "Would you like to create .env.local from the example? (y/n)"
    read -r response

    if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
        if [ -f .env.local.example ]; then
            cp .env.local.example .env.local
            print_status "success" ".env.local created from example"
        else
            print_status "error" ".env.local.example not found"
            exit 1
        fi
    else
        print_status "error" "Cannot proceed without .env.local"
        exit 1
    fi
else
    print_status "success" ".env.local exists"
fi

echo ""

# Step 2: Check environment variables
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Verifying Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Load .env.local
export $(cat .env.local | grep -v '^#' | xargs)

MISSING_VARS=0

# Check JWT_SECRET
if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your_secure_jwt_secret_here_change_in_production" ]; then
    print_status "error" "JWT_SECRET is not set or using default value"
    echo "   Generate a secure secret with: openssl rand -base64 32"
    MISSING_VARS=1
else
    print_status "success" "JWT_SECRET is configured"
fi

# Check NEXT_PUBLIC_SUPABASE_URL
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    print_status "error" "NEXT_PUBLIC_SUPABASE_URL is not set"
    MISSING_VARS=1
else
    print_status "success" "NEXT_PUBLIC_SUPABASE_URL is configured"
fi

# Check NEXT_PUBLIC_SUPABASE_ANON_KEY
if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ] || [ "$NEXT_PUBLIC_SUPABASE_ANON_KEY" = "your_supabase_anon_key_here" ]; then
    print_status "error" "NEXT_PUBLIC_SUPABASE_ANON_KEY is not set or using default value"
    echo "   Get from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api"
    MISSING_VARS=1
else
    print_status "success" "NEXT_PUBLIC_SUPABASE_ANON_KEY is configured"
fi

# Check SUPABASE_SERVICE_ROLE_KEY
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    print_status "warning" "SUPABASE_SERVICE_ROLE_KEY is not set"
    echo "   This is CRITICAL for user registration to work!"
    echo "   Get from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api"
    MISSING_VARS=1
else
    print_status "success" "SUPABASE_SERVICE_ROLE_KEY is configured"
fi

echo ""

if [ $MISSING_VARS -eq 1 ]; then
    print_status "error" "Some environment variables are missing or need to be updated"
    echo ""
    echo "Please edit .env.local and add the missing values:"
    echo "  1. Open .env.local in your editor"
    echo "  2. Replace placeholder values with actual credentials"
    echo "  3. Generate JWT_SECRET: openssl rand -base64 32"
    echo "  4. Get Supabase keys from: https://supabase.com/dashboard"
    echo ""
    echo "After updating, run this script again."
    exit 1
fi

# Step 3: Generate JWT secret if needed
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: JWT Secret Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$JWT_SECRET" = "your_secure_jwt_secret_here_change_in_production" ]; then
    echo "Would you like to generate a secure JWT secret? (y/n)"
    read -r response

    if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
        NEW_SECRET=$(openssl rand -base64 32)
        sed -i.bak "s|JWT_SECRET=.*|JWT_SECRET=$NEW_SECRET|g" .env.local
        print_status "success" "Generated new JWT_SECRET"
        echo "   Secret: $NEW_SECRET"
    fi
else
    print_status "success" "JWT_SECRET is already configured"
fi

echo ""

# Step 4: Test database connection
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Testing Database Connection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_status "info" "Starting development server to test connection..."
echo ""

# Kill any existing process on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start the dev server in background
npm run dev > /tmp/citypulse-dev.log 2>&1 &
DEV_PID=$!

# Wait for server to start
sleep 5

# Test health endpoint
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health || echo "failed")

if echo "$HEALTH_RESPONSE" | grep -q "\"status\":\"up\""; then
    print_status "success" "Database connection is working!"
    DB_STATUS="connected"
else
    print_status "error" "Database connection failed"
    print_status "info" "Check if you're using in-memory storage (data won't persist)"
    DB_STATUS="not_connected"
fi

# Stop the dev server
kill $DEV_PID 2>/dev/null || true

echo ""

# Step 5: Summary and next steps
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary & Next Steps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$DB_STATUS" = "connected" ]; then
    print_status "success" "Environment is properly configured!"
    echo ""
    echo "Your application should now:"
    echo "  ✅ Save user data to Supabase"
    echo "  ✅ Persist data across restarts"
    echo "  ✅ Handle authentication correctly"
    echo ""
    echo "To start the development server:"
    echo "  npm run dev"
    echo ""
    echo "To test user registration:"
    echo "  curl -X POST http://localhost:3000/api/auth/signup \\"
    echo "    -H \"Content-Type: application/json\" \\"
    echo "    -d '{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"Test1234\",\"confirmPassword\":\"Test1234\"}'"
else
    print_status "warning" "Database connection issues detected"
    echo ""
    echo "Possible issues:"
    echo "  1. Supabase credentials are incorrect"
    echo "  2. SUPABASE_SERVICE_ROLE_KEY is missing"
    echo "  3. Database tables haven't been created"
    echo ""
    echo "Next steps:"
    echo "  1. Verify credentials in .env.local"
    echo "  2. Run database schema in Supabase SQL Editor:"
    echo "     - Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/editor"
    echo "     - Run the SQL from: supabase/schema.sql"
    echo "  3. Run this script again to verify"
    echo ""
    echo "For detailed instructions, see: SETUP_GUIDE.md"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
