#!/bin/bash

echo "🧪 Testing Backend CORS Fix..."

# Get your Railway backend URL (replace with your actual URL)
BACKEND_URL="https://metriuni-production.up.railway.app"

echo "Testing backend health endpoint..."
curl -v "$BACKEND_URL/api/health" 2>&1 | grep -E "(HTTP|origin|access-control)"

echo ""
echo "Testing CORS preflight (OPTIONS request)..."
curl -v -X OPTIONS "$BACKEND_URL/api/auth/login" \
  -H "Origin: https://wondrous-souffle-ff83f7.netlify.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  2>&1 | grep -E "(HTTP|origin|access-control)"

echo ""
echo "✅ If you see 'access-control-allow-origin' headers and 200 status codes, CORS is fixed!"
echo "❌ If you see 500 status codes, the deployment might still be in progress."
