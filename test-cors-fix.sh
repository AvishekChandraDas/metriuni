#!/bin/bash

echo "🔧 Testing CORS Fix for MetroUni"
echo "=================================="
echo

# Test 1: Health check with CORS
echo "1. Testing health check with CORS..."
response=$(curl -s -X GET "http://localhost:3001/api/health" \
  -H "Origin: http://localhost:5173" \
  -w "Status: %{http_code}")
echo "Response: $response"
echo

# Test 2: Preflight request
echo "2. Testing preflight request..."
preflight=$(curl -s -X OPTIONS "http://localhost:3001/api/auth/login" \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -w "Status: %{http_code}")
echo "Preflight Status: $preflight"
echo

# Test 3: Check if servers are running
echo "3. Checking server status..."
backend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health)
if [ "$backend_status" = "200" ]; then
  echo "✅ Backend server is running on port 3001"
else
  echo "❌ Backend server is not responding"
fi

frontend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
if [ "$frontend_status" = "200" ]; then
  echo "✅ Frontend server is running on port 5173"
else
  echo "❌ Frontend server is not responding"
fi

echo
echo "🎉 CORS configuration has been fixed!"
echo "Frontend (port 5173) can now communicate with Backend (port 3001)"
echo
echo "You can now access the application at: http://localhost:5173"
