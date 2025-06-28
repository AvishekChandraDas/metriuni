#!/bin/bash

# MetroUni Ultra-Fast Railway Deployment
# Deploy in under 5 minutes!

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

clear

echo -e "${BOLD}${GREEN}"
echo "🚂 RAILWAY ULTRA-FAST DEPLOYMENT"
echo "=================================="
echo -e "${NC}"

echo ""
echo -e "${GREEN}🎯 Deploy MetroUni to Railway in under 5 minutes!${NC}"
echo ""

# Step 1: Install Railway CLI
echo -e "${BLUE}Step 1: Installing Railway CLI...${NC}"
if ! command -v railway &> /dev/null; then
    npm install -g @railway/cli
    echo "✅ Railway CLI installed"
else
    echo "✅ Railway CLI already installed"
fi
echo ""

# Step 2: Login
echo -e "${BLUE}Step 2: Login to Railway${NC}"
echo "This will open your browser for authentication..."
read -p "Press Enter to continue..."
railway login

if [ $? -eq 0 ]; then
    echo "✅ Railway login successful!"
else
    echo "❌ Login failed. Please try again."
    exit 1
fi

echo ""

# Step 3: Initialize project
echo -e "${BLUE}Step 3: Creating Railway project...${NC}"
railway init

echo ""

# Step 4: Set environment variables
echo -e "${BLUE}Step 4: Setting environment variables...${NC}"

# Get MongoDB URI from production config
MONGODB_URI=$(grep MONGODB_URI backend/.env.production | cut -d '=' -f2-)
JWT_SECRET=$(grep JWT_SECRET backend/.env.production | cut -d '=' -f2-)

echo "Setting NODE_ENV..."
railway variables set NODE_ENV=production

echo "Setting MONGODB_URI..."
railway variables set MONGODB_URI="$MONGODB_URI"

echo "Setting JWT_SECRET..."
railway variables set JWT_SECRET="$JWT_SECRET"

echo "Setting other variables..."
railway variables set JWT_EXPIRES_IN=7d
railway variables set UPLOAD_MAX_SIZE=10485760
railway variables set RATE_LIMIT_WINDOW_MS=900000
railway variables set RATE_LIMIT_MAX_REQUESTS=100

echo "✅ Environment variables configured!"
echo ""

# Step 5: Deploy
echo -e "${BLUE}Step 5: Deploying to Railway...${NC}"
echo "This will build and deploy your MetroUni platform..."
railway deploy

echo ""
echo -e "${BOLD}${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo ""

# Get deployment URL
echo -e "${BLUE}Getting your application URL...${NC}"
railway status

echo ""
echo -e "${BOLD}${GREEN}🌐 YOUR METROUNIVERSITY IS NOW LIVE!${NC}"
echo ""
echo -e "${BLUE}Admin Access:${NC}"
echo "📧 Email: admin@avishekchandradas.me"
echo "🔑 Password: SecureAdmin2024!"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Test your live application"
echo "2. Add custom domain in Railway dashboard"
echo "3. Update DNS for metrouni.avishekchandradas.me"
echo "4. Share with your university!"
echo ""
echo -e "${GREEN}🎓 Congratulations! Your MetroUniversity platform is live!${NC}"
