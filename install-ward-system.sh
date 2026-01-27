#!/bin/bash

# Ward Management System Installation Script
# This script installs dependencies and sets up the ward management system

echo "================================================"
echo "Ward Management System - Installation Script"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18.x or higher.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js and npm are installed${NC}"
echo ""

# Install required dependencies
echo "Installing required dependencies..."
echo ""

echo "📦 Installing core dependencies..."
npm install @google/generative-ai @radix-ui/react-switch recharts next-themes

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo ""

# Check for .env.local file
echo "Checking environment configuration..."
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠ .env.local file not found${NC}"
    echo "Creating .env.local from template..."

    cat > .env.local << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Map Provider
NEXT_PUBLIC_MAPTILER_API_KEY=your_maptiler_key

# AI Integration (Google Gemini)
GEMINI_API_KEY=your_google_gemini_api_key
EOF

    echo -e "${GREEN}✓ .env.local template created${NC}"
    echo -e "${YELLOW}⚠ Please update .env.local with your actual API keys${NC}"
else
    echo -e "${GREEN}✓ .env.local file exists${NC}"

    # Check if GEMINI_API_KEY is present
    if ! grep -q "GEMINI_API_KEY" .env.local; then
        echo -e "${YELLOW}⚠ GEMINI_API_KEY not found in .env.local${NC}"
        echo "Adding GEMINI_API_KEY to .env.local..."
        echo "" >> .env.local
        echo "# AI Integration (Google Gemini)" >> .env.local
        echo "GEMINI_API_KEY=your_google_gemini_api_key" >> .env.local
        echo -e "${GREEN}✓ GEMINI_API_KEY added to .env.local${NC}"
        echo -e "${YELLOW}⚠ Please update GEMINI_API_KEY with your actual API key${NC}"
    else
        echo -e "${GREEN}✓ GEMINI_API_KEY found in .env.local${NC}"
    fi
fi

echo ""

# Database setup reminder
echo "================================================"
echo "Database Setup Required"
echo "================================================"
echo ""
echo "Please run the following SQL scripts in your Supabase SQL Editor:"
echo ""
echo "1. supabase/schema.sql (if not already run)"
echo "2. supabase/ward_management_schema.sql (new - required)"
echo ""
echo -e "${YELLOW}This will create the ward management tables and sample data.${NC}"
echo ""

# Get Gemini API Key instructions
echo "================================================"
echo "Get Your Gemini API Key"
echo "================================================"
echo ""
echo "1. Visit: https://makersuite.google.com/app/apikey"
echo "2. Sign in with your Google account"
echo "3. Click 'Create API Key'"
echo "4. Copy the API key"
echo "5. Update GEMINI_API_KEY in .env.local"
echo ""
echo -e "${YELLOW}Note: The system will work without Gemini API using fallback analysis.${NC}"
echo ""

# Final instructions
echo "================================================"
echo "Next Steps"
echo "================================================"
echo ""
echo "1. Update .env.local with your actual API keys"
echo "2. Run database migrations in Supabase SQL Editor"
echo "3. Start the development server: npm run dev"
echo "4. Navigate to /admin/wards to access the ward management system"
echo ""
echo -e "${GREEN}Installation complete! 🎉${NC}"
echo ""
echo "For detailed setup instructions, see:"
echo "  - SETUP_WARD_MANAGEMENT.md"
echo "  - IMPLEMENTATION_SUMMARY.md"
echo ""
echo "================================================"
