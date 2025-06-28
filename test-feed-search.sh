#!/bin/bash

# Test script for feed search functionality
echo "🔍 Testing Feed Search Functionality"
echo "====================================="

API_URL="http://localhost:3001/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    
    echo -e "\n${BLUE}Testing: $description${NC}"
    echo "Endpoint: $method $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X GET "$endpoint" \
                      -H "Authorization: Bearer $TOKEN" \
                      -H "Content-Type: application/json")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" "$endpoint" \
                      -H "Authorization: Bearer $TOKEN" \
                      -H "Content-Type: application/json" \
                      -d "$data")
    fi
    
    http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo "$response" | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ Status: $http_code (Expected: $expected_status)${NC}"
        if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
            echo "Response preview: $(echo "$body" | jq -r '. | keys[]' 2>/dev/null || echo "$body" | head -c 100)"
        fi
    else
        echo -e "${RED}✗ Status: $http_code (Expected: $expected_status)${NC}"
        echo "Response: $body"
        return 1
    fi
}

# Check if backend is running
echo "Checking if backend is running..."
if ! curl -s "$API_URL/health" > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend server is not running on port 3001${NC}"
    echo "Please start the backend server with: cd backend && npm start"
    exit 1
fi

echo -e "${GREEN}✓ Backend server is running${NC}"

# Login as admin to get token
echo -e "\n${BLUE}Logging in as admin...${NC}"
login_response=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@metrouniversity.com","password":"Admin123!@#"}')

TOKEN=$(echo "$login_response" | jq -r '.token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo -e "${RED}❌ Failed to login as admin${NC}"
    echo "Response: $login_response"
    exit 1
fi

echo -e "${GREEN}✓ Successfully logged in as admin${NC}"

# Test 1: Get regular feed (no search)
test_endpoint "GET" "$API_URL/posts?page=1&limit=5" "" 200 "Get regular feed"

# Test 2: Search posts with query
test_endpoint "GET" "$API_URL/posts?page=1&limit=5&q=test" "" 200 "Search posts with 'test' query"

# Test 3: Search posts with another query
test_endpoint "GET" "$API_URL/posts?page=1&limit=5&q=computer" "" 200 "Search posts with 'computer' query"

# Test 4: Search posts with department
test_endpoint "GET" "$API_URL/posts?page=1&limit=5&q=CSE" "" 200 "Search posts with 'CSE' query"

# Test 5: Search posts with empty query (should return all posts)
test_endpoint "GET" "$API_URL/posts?page=1&limit=5&q=" "" 200 "Search posts with empty query"

# Test 6: Search posts with special characters
test_endpoint "GET" "$API_URL/posts?page=1&limit=5&q=java%20programming" "" 200 "Search posts with 'java programming' query"

echo -e "\n${GREEN}🎉 Feed search tests completed!${NC}"
echo -e "\n${BLUE}Frontend Testing Instructions:${NC}"
echo "1. Open http://localhost:5173 in your browser"
echo "2. Login with admin credentials:"
echo "   Email: admin@metrouniversity.com"
echo "   Password: Admin123!@#"
echo "3. Navigate to the Feed page"
echo "4. Test the search bar with different queries:"
echo "   - Search by content keywords"
echo "   - Search by author names"
echo "   - Search by department (CSE, EEE, etc.)"
echo "   - Search by batch year"
echo "5. Verify that search results update in real-time"
echo "6. Verify that clearing the search returns to normal feed"
echo "7. Test edge cases like empty searches, special characters"

echo -e "\n${BLUE}Key Features to Test:${NC}"
echo "• Real-time search with 300ms debounce"
echo "• Search across post content, author, department, and batch"
echo "• Clear search functionality"
echo "• Proper loading states during search"
echo "• Search results counter"
echo "• No pagination during search mode"
echo "• Fallback to regular feed when search is cleared"
