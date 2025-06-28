#!/bin/bash

echo "🚀 Setting up complete MetroUni platform with all features..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo -e "${RED}❌ PostgreSQL is not running. Please start PostgreSQL first.${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
cd backend
npm install

echo -e "${BLUE}🗃️ Running database migrations...${NC}"

# Core tables
echo -e "${YELLOW}Creating core tables...${NC}"
psql -d metrouni_development -f scripts/migrate.js 2>/dev/null || echo "Core tables may already exist"

# Chat system
echo -e "${YELLOW}Setting up chat system...${NC}"
psql -d metrouni_development -f scripts/add-chat-system.sql

# Push notifications
echo -e "${YELLOW}Setting up push notifications...${NC}"
psql -d metrouni_development -f scripts/add-push-notifications.sql

echo -e "${BLUE}📁 Creating uploads directory...${NC}"
mkdir -p ../uploads
chmod 755 ../uploads

echo -e "${BLUE}🌱 Seeding database with sample data...${NC}"
node scripts/seed.js

echo -e "${BLUE}🚀 Starting backend server...${NC}"
npm run dev &
BACKEND_PID=$!

cd ../frontend

echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
npm install

echo -e "${BLUE}🎨 Starting frontend development server...${NC}"
npm run dev &
FRONTEND_PID=$!

cd ..

echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${GREEN}🌐 Frontend: http://localhost:5173${NC}"
echo -e "${GREEN}🔧 Backend API: http://localhost:3000${NC}"
echo ""
echo -e "${BLUE}📋 Available Features:${NC}"
echo -e "  • User Registration & Authentication with Admin Approval"
echo -e "  • Social Feed with Posts, Comments, and Real-time Updates"
echo -e "  • Real-time Chat System with Socket.IO"
echo -e "  • Push Notifications (Web Push API)"
echo -e "  • Q&A Forum with Voting and Best Answers"
echo -e "  • Admin Dashboard with User Management"
echo -e "  • Profile Management and User Discovery"
echo ""
echo -e "${YELLOW}💡 To stop servers: kill $BACKEND_PID $FRONTEND_PID${NC}"
echo -e "${YELLOW}📚 Check the documentation files for detailed feature guides${NC}"

# Keep script running
wait
