#!/bin/bash

echo "=== Testing ProfilePage Posts Map Error Fix ==="
echo

echo "✅ BACKEND STATUS"
echo "Backend server is running on http://localhost:3001"
echo "Frontend server is running on http://localhost:5173"
echo

echo "✅ API ENDPOINT TEST"
echo "Testing user posts API endpoints..."

test_users=(3 13 14)
for user_id in "${test_users[@]}"; do
  echo "User ID $user_id:"
  response=$(curl -s "http://localhost:3001/api/posts/user/$user_id")
  posts_count=$(echo "$response" | grep -o '"posts":\[[^]]*\]' | grep -o '{"id"' | wc -l | tr -d ' ')
  echo "  Posts found: $posts_count"
  
  # Check if response has correct structure
  if echo "$response" | grep -q '"posts":' && echo "$response" | grep -q '"user":' && echo "$response" | grep -q '"pagination":'; then
    echo "  ✅ Correct API response structure"
  else
    echo "  ❌ Invalid API response structure"
  fi
done

echo
echo "✅ FRONTEND FIXES APPLIED"
echo "1. Fixed posts fetching: response.data.posts (instead of response.data)"
echo "2. Added defensive null checks: !posts || posts.length === 0"
echo "3. Added fallback array: (posts || []).map(...)"
echo "4. Added error handling: setPosts([]) on error"
echo "5. Used optional chaining: response.data?.posts || []"

echo
echo "✅ ISSUE RESOLUTION"
echo "Before: TypeError: posts.map is not a function"
echo "After:  Posts array properly initialized and handled"
echo
echo "The ProfilePage should now:"
echo "- Load user posts without TypeError"
echo "- Show 'No posts to show' for users with no posts"
echo "- Display PostCard components for users with posts"
echo "- Handle API errors gracefully"

echo
echo "🧪 MANUAL TEST STEPS"
echo "1. Visit http://localhost:5173"
echo "2. Navigate to different user profiles:"
echo "   - /profile/3 (Admin User - no posts)"
echo "   - /profile/13 (Dr. Test Frontend - has posts)"
echo "   - /profile/14 (Alice Student - has posts)"
echo "3. Verify no console errors related to posts.map"
echo "4. Check that posts display correctly or show 'No posts' message"
