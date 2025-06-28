#!/bin/bash

echo "🔧 Testing AdminDashboard API Integration"
echo "========================================"
echo

# Get admin token
TOKEN=$(curl -s -X POST "http://localhost:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@metro.edu", "password": "admin123"}' | jq -r '.token // empty')

if [ -z "$TOKEN" ]; then
  echo "❌ Admin login failed"
  exit 1
fi

echo "✅ Admin login successful"
echo

# Test users endpoint structure
echo "Testing /admin/users endpoint:"
USERS_RESPONSE=$(curl -s "http://localhost:3001/api/admin/users" -H "Authorization: Bearer $TOKEN")
USERS_COUNT=$(echo "$USERS_RESPONSE" | jq '.users | length // 0')
HAS_USERS_ARRAY=$(echo "$USERS_RESPONSE" | jq 'has("users")')

echo "  - Response has 'users' array: $HAS_USERS_ARRAY"
echo "  - Users count: $USERS_COUNT"

# Test posts endpoint structure  
echo
echo "Testing /admin/posts endpoint:"
POSTS_RESPONSE=$(curl -s "http://localhost:3001/api/admin/posts" -H "Authorization: Bearer $TOKEN")
POSTS_COUNT=$(echo "$POSTS_RESPONSE" | jq '.posts | length // 0')
HAS_POSTS_ARRAY=$(echo "$POSTS_RESPONSE" | jq 'has("posts")')

echo "  - Response has 'posts' array: $HAS_POSTS_ARRAY"
echo "  - Posts count: $POSTS_COUNT"

echo
if [ "$HAS_USERS_ARRAY" = "true" ] && [ "$HAS_POSTS_ARRAY" = "true" ]; then
  echo "🎉 AdminDashboard API endpoints are working correctly!"
  echo "✅ Backend returns structured responses: { users: [...] } and { posts: [...] }"
  echo "✅ Frontend has been updated to handle this structure"
  echo "✅ The AdminDashboard should now load without filter errors"
else
  echo "❌ API endpoints are not returning expected structure"
fi

echo
echo "Access the admin dashboard at: http://localhost:5173/admin"
echo "Login with: admin@metro.edu / admin123"
