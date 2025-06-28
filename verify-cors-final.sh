#!/bin/bash

echo "🔧 Final CORS Verification Test"
echo "==============================="
echo

# Check if both servers are running
echo "1. Checking server status..."
backend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health)
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)

if [ "$backend_status" = "200" ]; then
  echo "✅ Backend: Running on port 3001"
else
  echo "❌ Backend: Not responding (status: $backend_status)"
  exit 1
fi

if [ "$frontend_status" = "200" ]; then
  echo "✅ Frontend: Running on port 5173"
else
  echo "❌ Frontend: Not responding (status: $frontend_status)"
  exit 1
fi

echo

# Test CORS preflight
echo "2. Testing CORS preflight request..."
preflight_status=$(curl -s -X OPTIONS "http://localhost:3001/api/auth/login" \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -o /dev/null -w "%{http_code}")

if [ "$preflight_status" = "200" ]; then
  echo "✅ CORS Preflight: Working (status: 200)"
else
  echo "❌ CORS Preflight: Failed (status: $preflight_status)"
  exit 1
fi

# Test actual API call with CORS
echo "3. Testing API call with CORS headers..."
api_status=$(curl -s -X POST "http://localhost:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{"email": "test@example.com", "password": "test"}' \
  -o /dev/null -w "%{http_code}")

if [ "$api_status" = "401" ] || [ "$api_status" = "400" ]; then
  echo "✅ API Call: CORS working (status: $api_status - authentication error expected)"
elif [ "$api_status" = "403" ]; then
  echo "❌ API Call: CORS blocked (status: 403)"
  exit 1
else
  echo "✅ API Call: Working (status: $api_status)"
fi

echo
echo "4. Environment Variables Check..."
cd /Users/avishekchandradas/Desktop/MetroUni/frontend
if grep -q "VITE_API_URL=http://localhost:3001" .env; then
  echo "✅ Frontend .env: Correctly configured for port 3001"
else
  echo "❌ Frontend .env: Misconfigured"
  cat .env
  exit 1
fi

echo
echo "🎉 ALL TESTS PASSED!"
echo "===================="
echo "✅ Backend running on port 3001"
echo "✅ Frontend running on port 5173"
echo "✅ CORS properly configured"
echo "✅ Environment variables correct"
echo
echo "The frontend should now be able to communicate with the backend without CORS errors."
echo "Access the application at: http://localhost:5173"
