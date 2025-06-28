#!/bin/bash

# Test Combined Feed Search Implementation
echo "🔍 Testing Combined Feed Search (Posts + Users)"
echo "============================================="

# Test 1: Test backend search endpoint for posts and users
echo "📋 Test 1: Backend search endpoint test"
echo "Testing /api/posts?q=test to get both posts and users..."

# Make a request to the posts endpoint with search
curl -s "http://localhost:3001/api/posts?q=test" | jq '.'

echo ""
echo "✅ Backend search endpoint test complete"
echo ""

# Test 2: Frontend user interface test instructions
echo "📱 Test 2: Frontend UI test instructions"
echo "========================================="
echo ""
echo "To test the combined search UI:"
echo "1. Open http://localhost:5173 in your browser"
echo "2. Log in or register if needed"
echo "3. Navigate to the Feed page"
echo "4. Use the search bar at the top:"
echo "   - Type a search term (e.g., 'student', 'john', 'computer')"
echo "   - Press Enter or click the Search button"
echo "5. Verify that the search results show:"
echo "   - A 'People' section with matching users (if any)"
echo "   - A 'Posts' section with matching posts (if any)"
echo "   - The search results indicator shows both counts"
echo "6. Test the follow/unfollow buttons on user cards"
echo "7. Test clicking on user cards to navigate to profiles"
echo "8. Test clearing the search with the X button"
echo ""

# Test 3: API endpoint validation
echo "📡 Test 3: API endpoint validation"
echo "================================="
echo ""

# Test empty search
echo "Testing empty search (should return all posts, no users):"
curl -s "http://localhost:3001/api/posts" | jq '{posts: (.posts | length), users: (.users | length), hasUsers: (.users != null)}'

echo ""

# Test with search query
echo "Testing search with query 'student':"
curl -s "http://localhost:3001/api/posts?q=student" | jq '{posts: (.posts | length), users: (.users | length), hasUsers: (.users != null)}'

echo ""

# Test with search query for common name
echo "Testing search with query 'john':"
curl -s "http://localhost:3001/api/posts?q=john" | jq '{posts: (.posts | length), users: (.users | length), hasUsers: (.users != null)}'

echo ""
echo "✅ Combined feed search implementation test complete!"
echo ""
echo "🎯 Key Features Implemented:"
echo "- Manual search only (no auto-search)"
echo "- Search returns both posts and users"
echo "- User results displayed with UserCard component"
echo "- Post results displayed with PostCard component"
echo "- Follow/unfollow functionality on user cards"
echo "- Clear search functionality"
echo "- Combined search results indicator"
echo "- Proper separation of regular feed vs search results"
echo ""
echo "🌐 Frontend URL: http://localhost:5173"
echo "🔧 Backend URL: http://localhost:3001"
