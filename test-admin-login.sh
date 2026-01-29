#!/bin/bash

# Quick Admin Login Test
# Tests admin login with the configured credentials

echo "🔐 Testing Admin Login..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Test credentials
EMAIL="vibhuporobo@gmail.com"
PASSWORD="admin123"

echo "Testing with credentials:"
echo "  Email: $EMAIL"
echo "  Password: $PASSWORD"
echo "  Database: Admin"
echo ""

# Attempt login
echo "Attempting login..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"userType\":\"admin\"}")

echo ""

# Check response
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ LOGIN SUCCESSFUL!${NC}"
    echo ""

    # Extract user info
    NAME=$(echo $RESPONSE | grep -o '"name":"[^"]*"' | cut -d':' -f2 | tr -d '"')
    ROLE=$(echo $RESPONSE | grep -o '"role":"[^"]*"' | cut -d':' -f2 | tr -d '"')

    echo "Logged in as:"
    echo "  Name: $NAME"
    echo "  Role: $ROLE"
    echo ""
    echo -e "${GREEN}🎉 Admin authentication is working!${NC}"

elif echo "$RESPONSE" | grep -q "User not found"; then
    echo -e "${RED}❌ USER NOT FOUND IN ADMIN DATABASE${NC}"
    echo ""
    echo -e "${YELLOW}The admin user doesn't exist yet.${NC}"
    echo ""
    echo "To fix this:"
    echo "1. Go to your Admin Supabase project"
    echo "   URL: https://yrhyovyefqgjdysuayqa.supabase.co"
    echo ""
    echo "2. Open SQL Editor (left sidebar)"
    echo ""
    echo "3. Paste and run this SQL:"
    echo ""
    echo -e "${BLUE}-- Delete existing user if exists"
    echo "DELETE FROM users WHERE email = '$EMAIL';"
    echo ""
    echo "-- Insert admin user"
    echo "INSERT INTO users (name, email, password, role, created_at, updated_at)"
    echo "VALUES ('Vibhu Poro Admin', '$EMAIL', '\$2b\$10\$NMkpUM/dMkQGnkRIDHiRzOx56IL8C6lfZnjOy96AbmI6sNiYli6wC', 'admin', NOW(), NOW());"
    echo ""
    echo "-- Create profile"
    echo "INSERT INTO user_profiles (user_id, city, state, bio, created_at, updated_at)"
    echo "VALUES ((SELECT id FROM users WHERE email = '$EMAIL'), 'Goa', 'Goa', 'System Administrator', NOW(), NOW());"
    echo ""
    echo "-- Verify"
    echo "SELECT id, name, email, role, created_at FROM users WHERE email = '$EMAIL';${NC}"
    echo ""
    echo "4. Run this script again after executing the SQL"

elif echo "$RESPONSE" | grep -q "Invalid email or password"; then
    echo -e "${RED}❌ INVALID PASSWORD${NC}"
    echo ""
    echo "The user exists but the password is incorrect."
    echo ""
    echo "To reset the password to 'admin123':"
    echo "1. Go to your Admin Supabase project"
    echo "2. Run this SQL:"
    echo ""
    echo -e "${BLUE}UPDATE users"
    echo "SET password = '\$2b\$10\$NMkpUM/dMkQGnkRIDHiRzOx56IL8C6lfZnjOy96AbmI6sNiYli6wC'"
    echo "WHERE email = '$EMAIL';${NC}"

elif echo "$RESPONSE" | grep -q "Rate limit"; then
    echo -e "${YELLOW}⚠️  RATE LIMIT EXCEEDED${NC}"
    echo ""
    echo "Too many login attempts. Please wait a moment and try again."

else
    echo -e "${RED}❌ LOGIN FAILED${NC}"
    echo ""
    echo "Response:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    echo ""
    echo "Possible issues:"
    echo "  • Admin database not configured"
    echo "  • Server error"
    echo "  • Network issue"
    echo ""
    echo "Check server logs for more details."
fi

echo ""
echo "Done!"
