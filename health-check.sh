#!/bin/bash

# MetroUni Health Check Script
# This script checks if all services are running properly

echo "🏥 MetroUni Health Check"
echo "========================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a service is running on a port
check_service() {
    local service_name=$1
    local port=$2
    local url=$3
    
    echo -n "Checking $service_name on port $port... "
    
    if curl -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Running${NC}"
        return 0
    else
        echo -e "${RED}✗ Not running${NC}"
        return 1
    fi
}

# Check PostgreSQL
echo -n "Checking PostgreSQL... "
if pg_isready -q; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
    echo -e "${YELLOW}⚠️  Make sure PostgreSQL is installed and running${NC}"
fi

echo ""

# Check Backend API
check_service "Backend API" "5000" "http://localhost:5000/api/health"

# Check Frontend Dev Server
check_service "Frontend" "5173" "http://localhost:5173"

echo ""
echo "📋 Quick Setup Commands:"
echo "========================"
echo "1. Start PostgreSQL:"
echo "   brew services start postgresql  # macOS with Homebrew"
echo "   sudo systemctl start postgresql # Linux"
echo ""
echo "2. Start Backend:"
echo "   cd backend && npm run dev"
echo ""
echo "3. Start Frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "4. Start Telegram Bot (optional):"
echo "   cd telegram-bot && npm start"
echo ""
echo "📚 Documentation: http://localhost:5173"
echo "🛠️  Admin Dashboard: http://localhost:5173/admin"
