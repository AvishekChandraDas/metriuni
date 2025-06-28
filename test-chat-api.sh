#!/bin/bash

echo "🧪 Testing Chat System API..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_BASE="http://localhost:3000/api"
TEST_EMAIL="test@metrouni.edu"
TEST_PASSWORD="password123"

echo -e "${BLUE}🔐 Testing Authentication...${NC}"

# Test login to get token
LOGIN_RESPONSE=$(curl -s -X POST $API_BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_EMAIL'",
    "password": "'$TEST_PASSWORD'"
  }')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Login successful${NC}"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
else
    echo -e "${RED}❌ Login failed - creating test user first${NC}"
    
    # Register test user
    REGISTER_RESPONSE=$(curl -s -X POST $API_BASE/auth/register \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Test User",
        "email": "'$TEST_EMAIL'",
        "password": "'$TEST_PASSWORD'",
        "muStudentId": "232-115-304",
        "department": "Computer Science",
        "batch": "2024"
      }')
    
    echo "Registration response: $REGISTER_RESPONSE"
    
    # Try login again
    LOGIN_RESPONSE=$(curl -s -X POST $API_BASE/auth/login \
      -H "Content-Type: application/json" \
      -d '{
        "email": "'$TEST_EMAIL'",
        "password": "'$TEST_PASSWORD'"
      }')
    
    if echo "$LOGIN_RESPONSE" | grep -q '"token"'; then
        TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✅ Login successful after registration${NC}"
    else
        echo -e "${RED}❌ Still unable to login${NC}"
        echo "$LOGIN_RESPONSE"
        exit 1
    fi
fi

echo -e "${BLUE}💬 Testing Chat API...${NC}"

# Test get conversations
echo -e "${YELLOW}Testing get conversations...${NC}"
CHAT_RESPONSE=$(curl -s -X GET $API_BASE/chat \
  -H "Authorization: Bearer $TOKEN")

if echo "$CHAT_RESPONSE" | grep -q '"conversations"'; then
    echo -e "${GREEN}✅ Chat conversations fetch successful${NC}"
else
    echo -e "${RED}❌ Chat conversations fetch failed${NC}"
    echo "Response: $CHAT_RESPONSE"
fi

# Test get chat rooms (new format)
echo -e "${YELLOW}Testing get chat rooms...${NC}"
ROOMS_RESPONSE=$(curl -s -X GET $API_BASE/chat/rooms \
  -H "Authorization: Bearer $TOKEN")

if echo "$ROOMS_RESPONSE" | grep -q '"success"'; then
    echo -e "${GREEN}✅ Chat rooms fetch successful${NC}"
else
    echo -e "${RED}❌ Chat rooms fetch failed${NC}"
    echo "Response: $ROOMS_RESPONSE"
fi

# Test create chat room
echo -e "${YELLOW}Testing create chat room...${NC}"
CREATE_ROOM_RESPONSE=$(curl -s -X POST $API_BASE/chat/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Room",
    "type": "private"
  }')

if echo "$CREATE_ROOM_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Chat room creation successful${NC}"
    ROOM_ID=$(echo "$CREATE_ROOM_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)
    echo "Created room ID: $ROOM_ID"
else
    echo -e "${RED}❌ Chat room creation failed${NC}"
    echo "Response: $CREATE_ROOM_RESPONSE"
fi

echo ""
echo -e "${GREEN}🎉 Chat API testing completed!${NC}"
