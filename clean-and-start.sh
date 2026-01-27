#!/bin/bash
echo "🧹 Cleaning all Next.js caches..."
rm -rf .next
rm -rf .turbo
rm -rf node_modules/.cache
rm -rf out
echo "✅ Cache cleaned successfully!"
echo "🚀 Starting development server..."
npm run dev
