#!/bin/bash

echo "🧹 Cleaning Next.js development environment..."

# Kill any processes on port 3000
echo "📌 Checking for processes on port 3000..."
PORT_PID=$(netstat -ano | grep ":3000" | awk '{print $5}' | head -n 1)
if [ ! -z "$PORT_PID" ]; then
  echo "   Killing process $PORT_PID on port 3000..."
  taskkill //F //PID $PORT_PID 2>/dev/null || true
fi

# Kill any processes on port 3001
echo "📌 Checking for processes on port 3001..."
PORT_PID=$(netstat -ano | grep ":3001" | awk '{print $5}' | head -n 1)
if [ ! -z "$PORT_PID" ]; then
  echo "   Killing process $PORT_PID on port 3001..."
  taskkill //F //PID $PORT_PID 2>/dev/null || true
fi

# Remove lock file if exists
echo "🔓 Removing Next.js lock file..."
rm -f .next/dev/lock

# Clean .next directory
echo "🗑️  Removing .next directory..."
rm -rf .next

# Clean node_modules/.cache if exists
echo "🗑️  Cleaning node_modules cache..."
rm -rf node_modules/.cache

echo "✅ Environment cleaned!"
echo ""
echo "To start the dev server, run: npm run dev"
