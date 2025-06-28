#!/bin/bash

# MetroUni - GitHub + Railway Deployment Helper
# The easiest way to deploy to Railway

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

clear

echo -e "${BOLD}${BLUE}"
echo "🚂 GitHub + Railway Deployment Helper"
echo "====================================="
echo -e "${NC}"

echo ""
echo -e "${GREEN}🎯 The EASIEST way to deploy MetroUni to Railway!${NC}"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo -e "${BLUE}📝 Initializing Git repository...${NC}"
    git init
    git add .
    git commit -m "MetroUni platform ready for Railway deployment"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository exists"
    echo -e "${BLUE}📝 Adding deployment files...${NC}"
    git add .
    git commit -m "Add Railway deployment configuration" 2>/dev/null || echo "No new changes to commit"
fi

echo ""
echo -e "${BOLD}${GREEN}🚀 DEPLOYMENT STEPS:${NC}"
echo ""

echo -e "${BLUE}Step 1: Create GitHub Repository${NC}"
echo "1. Go to https://github.com/new"
echo "2. Repository name: metriuni (or your preferred name)"
echo "3. Make it Public or Private"
echo "4. Don't initialize with README (we already have files)"
echo "5. Click 'Create repository'"
echo ""

echo -e "${BLUE}Step 2: Push Your Code${NC}"
echo "Run these commands after creating GitHub repo:"
echo ""
echo -e "${YELLOW}git remote add origin https://github.com/YOUR_USERNAME/metriuni.git${NC}"
echo -e "${YELLOW}git branch -M main${NC}"
echo -e "${YELLOW}git push -u origin main${NC}"
echo ""

echo -e "${BLUE}Step 3: Deploy on Railway${NC}"
echo "1. Go to https://railway.app"
echo "2. Sign up/Login with your GitHub account"
echo "3. Click 'New Project'"
echo "4. Choose 'Deploy from GitHub repo'"
echo "5. Select your 'metriuni' repository"
echo "6. Railway will start building automatically!"
echo ""

echo -e "${BLUE}Step 4: Add Environment Variables${NC}"
echo "In Railway dashboard, go to Variables tab and add:"
echo ""
echo -e "${YELLOW}NODE_ENV=production${NC}"
echo -e "${YELLOW}MONGODB_URI=mongodb+srv://metrouni_admin:bangladeshzindabad@metrouni-cluster.dtqxnr1.mongodb.net/metriuni?retryWrites=true&w=majority&appName=metrouni-cluster${NC}"
echo -e "${YELLOW}JWT_SECRET=production-super-secure-jwt-secret-key-2024-metrouni-platform${NC}"
echo -e "${YELLOW}JWT_EXPIRES_IN=7d${NC}"
echo -e "${YELLOW}UPLOAD_MAX_SIZE=10485760${NC}"
echo -e "${YELLOW}RATE_LIMIT_WINDOW_MS=900000${NC}"
echo -e "${YELLOW}RATE_LIMIT_MAX_REQUESTS=100${NC}"
echo ""

echo -e "${BLUE}Step 5: Your App Goes Live!${NC}"
echo "🌐 Your MetroUni will be available at:"
echo "https://metriuni-production.up.railway.app"
echo "(Railway will give you the exact URL)"
echo ""

echo -e "${BOLD}${GREEN}🔐 Admin Access Ready:${NC}"
echo "📧 Email: admin@avishekchandradas.me"
echo "🔑 Password: SecureAdmin2024!"
echo ""

while true; do
    echo -e "${BOLD}What would you like to do?${NC}"
    echo "1) Open GitHub to create repository"
    echo "2) Open Railway dashboard"
    echo "3) Show me Git commands to copy"
    echo "4) I'll do it manually"
    echo ""
    read -p "Choose option (1-4): " choice
    
    case $choice in
        1)
            echo ""
            echo -e "${GREEN}🌐 Opening GitHub to create repository...${NC}"
            if command -v open &> /dev/null; then
                open https://github.com/new
            else
                echo "Please go to: https://github.com/new"
            fi
            echo ""
            echo "After creating the repository:"
            echo "1. Copy the repository URL"
            echo "2. Run the Git commands shown above"
            echo "3. Go to Railway to deploy"
            ;;
        2)
            echo ""
            echo -e "${GREEN}🚂 Opening Railway dashboard...${NC}"
            if command -v open &> /dev/null; then
                open https://railway.app
            else
                echo "Please go to: https://railway.app"
            fi
            echo ""
            echo "Steps in Railway:"
            echo "1. Login with GitHub"
            echo "2. New Project → Deploy from GitHub repo"
            echo "3. Select your MetroUni repository"
            echo "4. Add environment variables"
            echo "5. Your app goes live!"
            ;;
        3)
            echo ""
            echo -e "${BLUE}📋 Git Commands (replace YOUR_USERNAME):${NC}"
            echo ""
            echo "git remote add origin https://github.com/YOUR_USERNAME/metriuni.git"
            echo "git branch -M main"
            echo "git push -u origin main"
            echo ""
            echo "After pushing, go to Railway and deploy from GitHub!"
            ;;
        4)
            echo ""
            echo -e "${GREEN}👍 Perfect!${NC}"
            echo ""
            echo "Manual steps:"
            echo "1. Create GitHub repository"
            echo "2. Push your code to GitHub"
            echo "3. Deploy on Railway from GitHub"
            echo "4. Add environment variables"
            echo "5. Your MetroUni goes live!"
            echo ""
            echo "📚 Full guide: RAILWAY_DEPLOYMENT_GUIDE.md"
            exit 0
            ;;
        *)
            echo ""
            echo -e "${RED}❌ Invalid option. Please choose 1-4.${NC}"
            ;;
    esac
done
