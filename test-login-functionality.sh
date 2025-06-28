#!/bin/bash

echo "🔍 Testing MetroUni Login Functionality"
echo "======================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if server is running
check_server() {
    local url=$1
    local name=$2
    
    if curl -s $url > /dev/null; then
        echo -e "${GREEN}✓ $name is running${NC}"
        return 0
    else
        echo -e "${RED}✗ $name is not running${NC}"
        return 1
    fi
}

# Function to test API endpoint
test_endpoint() {
    local method=$1
    local url=$2
    local data=$3
    local description=$4
    local expected_status=$5
    
    echo -e "\n${YELLOW}Testing: $description${NC}"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method -H "Content-Type: application/json" -d "$data" $url)
    else
        response=$(curl -s -w "\n%{http_code}" -X $method $url)
    fi
    
    # Split response and status code
    body=$(echo "$response" | head -n -1)
    status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ Status: $status (Expected: $expected_status)${NC}"
        echo "Response: $body"
        return 0
    else
        echo -e "${RED}✗ Status: $status (Expected: $expected_status)${NC}"
        echo "Response: $body"
        return 1
    fi
}

# Check if servers are running
echo -e "\n📡 Checking Server Status"
echo "-------------------------"

if ! check_server "http://localhost:3001/api/auth/login" "Backend Server"; then
    echo -e "${RED}Please start the backend server first: cd backend && npm start${NC}"
    exit 1
fi

if ! check_server "http://localhost:5173" "Frontend Server"; then
    echo -e "${RED}Please start the frontend server first: cd frontend && npm run dev${NC}"
    exit 1
fi

# Test API endpoints
echo -e "\n🧪 Testing API Endpoints"
echo "------------------------"

# Test teacher login
test_endpoint "POST" "http://localhost:3001/api/auth/login" \
    '{"email":"teacher@metrouni.edu.bd","password":"password123"}' \
    "Teacher Login" "200"

echo ""

# Test student login  
test_endpoint "POST" "http://localhost:3001/api/auth/login" \
    '{"email":"student@gmail.com","password":"password123"}' \
    "Student Login" "200"

echo ""

# Test invalid login
test_endpoint "POST" "http://localhost:3001/api/auth/login" \
    '{"email":"invalid@email.com","password":"wrongpassword"}' \
    "Invalid Login" "401"

echo -e "\n🌐 Frontend Integration Test"
echo "----------------------------"
echo "Please manually test the following in your browser:"
echo "1. Go to http://localhost:5173/login"
echo "2. Try logging in with: teacher@metrouni.edu.bd / password123"
echo "3. Try logging in with: student@gmail.com / password123"
echo "4. Verify that you're redirected to the feed page on successful login"
echo "5. Verify that error messages are displayed for invalid credentials"

echo -e "\n${GREEN}✓ All automated tests completed!${NC}"
echo "Please verify the frontend functionality manually in your browser."
