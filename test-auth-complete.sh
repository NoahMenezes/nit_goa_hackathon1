#!/bin/bash
EMAIL="authtest$(date +%s)@example.com"

echo "1. Creating user..."
SIGNUP_RESULT=$(curl -s -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Auth Test\",\"email\":\"$EMAIL\",\"password\":\"TestPass123!\",\"confirmPassword\":\"TestPass123!\",\"role\":\"citizen\"}")

echo "$SIGNUP_RESULT" | python3 -m json.tool
echo ""

if echo "$SIGNUP_RESULT" | grep -q '"success":true'; then
  echo "✅ Signup successful"
  echo ""
  echo "2. Logging in..."
  LOGIN_RESULT=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"TestPass123!\",\"userType\":\"citizen\"}")
  
  echo "$LOGIN_RESULT" | python3 -m json.tool
  
  if echo "$LOGIN_RESULT" | grep -q '"success":true'; then
    echo ""
    echo "✅ Login successful"
  else
    echo ""
    echo "❌ Login failed"
  fi
else
  echo "❌ Signup failed"
fi
