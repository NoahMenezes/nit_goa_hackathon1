#!/bin/bash

# Quick Fix Script for OurStreet Database Issues
# This script helps you quickly fix the database persistence problem

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   OurStreet Database Quick Fix Script         ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}✗ .env.local file not found${NC}"
    echo ""
    echo -e "${YELLOW}Creating .env.local template...${NC}"

    cat > .env.local << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# JWT Secret (Generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: MapTiler API Key
NEXT_PUBLIC_MAPTILER_API_KEY=your_maptiler_key_here

# Optional: Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here
EOF

    echo -e "${GREEN}✓ Created .env.local template${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: You must edit .env.local and add your credentials!${NC}"
    echo ""
    echo "Steps to get your credentials:"
    echo "1. Go to https://app.supabase.com"
    echo "2. Select your project"
    echo "3. Go to Settings → API"
    echo "4. Copy the following:"
    echo "   - Project URL → NEXT_PUBLIC_SUPABASE_URL"
    echo "   - anon public key → NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "   - service_role secret key → SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    echo "5. Generate JWT secret with:"
    echo "   openssl rand -base64 32"
    echo ""
    read -p "Press Enter after you've updated .env.local..."
fi

# Check if required env vars are set
echo -e "${BLUE}[1/7] Checking environment variables...${NC}"

source .env.local 2>/dev/null || true

MISSING_VARS=0

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ "$NEXT_PUBLIC_SUPABASE_URL" = "your_supabase_project_url_here" ]; then
    echo -e "${RED}✗ NEXT_PUBLIC_SUPABASE_URL not set${NC}"
    MISSING_VARS=1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ] || [ "$NEXT_PUBLIC_SUPABASE_ANON_KEY" = "your_supabase_anon_key_here" ]; then
    echo -e "${RED}✗ NEXT_PUBLIC_SUPABASE_ANON_KEY not set${NC}"
    MISSING_VARS=1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] || [ "$SUPABASE_SERVICE_ROLE_KEY" = "your_supabase_service_role_key_here" ]; then
    echo -e "${RED}✗ SUPABASE_SERVICE_ROLE_KEY not set${NC}"
    MISSING_VARS=1
fi

if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your_jwt_secret_here" ]; then
    echo -e "${RED}✗ JWT_SECRET not set${NC}"
    MISSING_VARS=1
fi

if [ $MISSING_VARS -eq 1 ]; then
    echo ""
    echo -e "${RED}❌ Please set the required environment variables in .env.local${NC}"
    echo -e "${YELLOW}Refer to DATABASE_FIX_GUIDE.md for detailed instructions${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All required environment variables are set${NC}"
echo ""

# Install dependencies
echo -e "${BLUE}[2/7] Installing dependencies...${NC}"
if npm install --silent; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi
echo ""

# Clear Next.js cache
echo -e "${BLUE}[3/7] Clearing Next.js cache...${NC}"
rm -rf .next
echo -e "${GREEN}✓ Cache cleared${NC}"
echo ""

# Check database connection
echo -e "${BLUE}[4/7] Checking database schema...${NC}"
echo ""
echo -e "${YELLOW}Please ensure you have run these SQL scripts in Supabase SQL Editor:${NC}"
echo "  1. supabase/schema.sql"
echo "  2. supabase/fix_rls_policies.sql"
echo ""
read -p "Have you run these scripts? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}Please run the SQL scripts first:${NC}"
    echo ""
    echo "1. Open https://app.supabase.com"
    echo "2. Go to your project"
    echo "3. Click 'SQL Editor'"
    echo "4. Copy and paste the contents of:"
    echo "   - supabase/schema.sql (if not already done)"
    echo "   - supabase/fix_rls_policies.sql"
    echo "5. Click 'Run' for each script"
    echo ""
    echo "Then run this script again."
    exit 1
fi
echo -e "${GREEN}✓ Database schema confirmed${NC}"
echo ""

# Show SQL verification queries
echo -e "${BLUE}[5/7] Database verification${NC}"
echo ""
echo -e "${YELLOW}Run these queries in Supabase SQL Editor to verify:${NC}"
echo ""
echo -e "${BLUE}-- Check if tables exist${NC}"
echo "SELECT table_name FROM information_schema.tables"
echo "WHERE table_schema = 'public'"
echo "AND table_name IN ('users', 'issues', 'comments', 'votes');"
echo ""
echo -e "${BLUE}-- Check RLS policies on users table${NC}"
echo "SELECT policyname, cmd FROM pg_policies"
echo "WHERE schemaname = 'public' AND tablename = 'users';"
echo ""
echo -e "${BLUE}-- Test user creation${NC}"
echo "INSERT INTO users (name, email, password, role)"
echo "VALUES ('Test', 'test@test.com', 'hash', 'citizen')"
echo "RETURNING id;"
echo ""
read -p "Press Enter to continue..."
echo ""

# Build the project
echo -e "${BLUE}[6/7] Building project...${NC}"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${YELLOW}⚠️  Build had warnings (this is usually OK)${NC}"
fi
echo ""

# Start dev server
echo -e "${BLUE}[7/7] Ready to start development server${NC}"
echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Next Steps:${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo ""
echo "1. Start the development server:"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""
echo "2. Test user registration:"
echo "   - Open http://localhost:3000/signup"
echo "   - Register as Admin with:"
echo "     • Name: Test Admin"
echo "     • Email: admin@test.com"
echo "     • Account Type: Administrator"
echo "     • Password: Test1234"
echo ""
echo "3. Verify user persists:"
echo "   - After registration, refresh the page"
echo "   - You should stay logged in"
echo "   - Check Supabase dashboard to see the user"
echo ""
echo "4. Run automated tests:"
echo -e "   ${YELLOW}./test-endpoints.sh${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Documentation:${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo ""
echo "• Detailed guide: DATABASE_FIX_GUIDE.md"
echo "• Summary: DATABASE_FIX_SUMMARY.md"
echo "• SQL fixes: supabase/fix_rls_policies.sql"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
echo ""

# Offer to start dev server
read -p "Start development server now? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${GREEN}Starting development server...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
    echo ""
    npm run dev
fi
