#!/bin/bash
echo "Testing AI Categorization API..."
curl -X POST http://localhost:3000/api/ai/categorize \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Street light not working",
    "description": "The street light on MG Road has been broken for 3 days. Very dark at night."
  }' | jq .
