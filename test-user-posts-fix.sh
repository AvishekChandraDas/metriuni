#!/bin/bash

echo "=== Testing User Posts API Endpoint ==="
echo

# Test with different user IDs that were causing 404 errors
test_users=(3 13 14)

echo "Backend server should be running on http://localhost:3001"
echo "Testing /api/posts/user/:userId endpoint..."
echo

for user_id in "${test_users[@]}"; do
  echo "Testing user ID: $user_id"
  echo "Request: GET http://localhost:3001/api/posts/user/$user_id"
  
  response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "http://localhost:3001/api/posts/user/$user_id" -H "Content-Type: application/json")
  
  # Extract HTTP status code
  http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
  response_body=$(echo "$response" | sed '$d')
  
  echo "HTTP Status: $http_status"
  
  if [ "$http_status" = "200" ]; then
    echo "✅ SUCCESS - User posts endpoint working"
    # Parse and display user info
    user_name=$(echo "$response_body" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
    posts_count=$(echo "$response_body" | grep -o '"posts":\[[^]]*\]' | grep -o '{"id"' | wc -l | tr -d ' ')
    echo "   User: $user_name"
    echo "   Posts count: $posts_count"
  else
    echo "❌ FAILED - HTTP $http_status"
    echo "   Response: $response_body"
  fi
  
  echo "----------------------------------------"
done

echo
echo "=== Frontend Test ==="
echo "Frontend should be running on http://localhost:5173"
echo "You can now test the ProfilePage in your browser:"
echo "- Go to http://localhost:5173"
echo "- Navigate to user profiles (e.g., /profile/3, /profile/13, /profile/14)"
echo "- Check that posts load without 404 errors in browser console"
echo
echo "=== Expected Results ==="
echo "✅ No more 404 errors for /posts/user/:userId"
echo "✅ ProfilePage should load user posts successfully"
echo "✅ Console should be clean of AxiosError messages"
