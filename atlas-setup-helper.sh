#!/bin/bash

# MongoDB Atlas Setup Guide - Interactive Helper
# This script provides step-by-step guidance for Atlas setup

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

clear

echo -e "${BOLD}${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║  🗄️  MongoDB Atlas Setup Guide - Interactive Helper           ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${GREEN}🎯 Your MetroUni platform is ready for MongoDB Atlas!${NC}"
echo ""
echo "This guide will walk you through setting up MongoDB Atlas step by step."
echo ""

# Check if browser is available
if command -v open &> /dev/null; then
    echo -e "${BLUE}🌐 Opening MongoDB Atlas in your browser...${NC}"
    open https://cloud.mongodb.com
    echo "✅ Atlas opened in browser"
else
    echo -e "${YELLOW}📱 Please manually open: https://cloud.mongodb.com${NC}"
fi

echo ""
echo -e "${BOLD}${BLUE}📋 Step-by-Step Atlas Setup:${NC}"
echo ""

echo -e "${BLUE}Step 1: Create Account/Sign In${NC}"
echo "   • Go to https://cloud.mongodb.com"
echo "   • Sign up for free account or sign in"
echo "   • Verify your email if required"
echo ""

echo -e "${BLUE}Step 2: Create New Cluster${NC}"
echo "   • Click 'Create a New Cluster' or 'Build a Database'"
echo "   • Choose 'Shared' (Free tier - perfect for starting)"
echo "   • Cloud Provider: AWS, Google Cloud, or Azure"
echo "   • Region: Choose closest to your server location"
echo "   • Cluster Name: ${BOLD}metrouni-cluster${NC}"
echo "   • Click 'Create Cluster' (takes 2-3 minutes)"
echo ""

echo -e "${BLUE}Step 3: Create Database User${NC}"
echo "   • In left sidebar, click 'Database Access'"
echo "   • Click 'Add New Database User'"
echo "   • Authentication Method: Password"
echo "   • Username: ${BOLD}metrouni_admin${NC}"
echo "   • Password: Generate a strong password (save it securely!)"
echo "   • Database User Privileges: 'Read and write to any database'"
echo "   • Click 'Add User'"
echo ""

echo -e "${BLUE}Step 4: Configure Network Access${NC}"
echo "   • In left sidebar, click 'Network Access'"
echo "   • Click 'Add IP Address'"
echo "   • For testing: Click 'Allow Access from Anywhere' (0.0.0.0/0)"
echo "   • For production: Add your server's specific IP address"
echo "   • Comment: 'MetroUni Production Server'"
echo "   • Click 'Confirm'"
echo ""

echo -e "${BLUE}Step 5: Get Connection String${NC}"
echo "   • Go back to 'Clusters' in left sidebar"
echo "   • Wait for cluster to show 'Connected' status"
echo "   • Click 'Connect' button on your cluster"
echo "   • Choose 'Connect your application'"
echo "   • Driver: Node.js, Version: 4.1 or later"
echo "   • Copy the connection string"
echo ""

echo -e "${YELLOW}📝 Your connection string will look like:${NC}"
echo "mongodb+srv://metrouni_admin:<password>@metrouni-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority"
echo ""

echo -e "${BOLD}${RED}⚠️  Important Notes:${NC}"
echo "   • Replace <password> with your actual password"
echo "   • Save your password securely"
echo "   • The cluster takes 2-3 minutes to be ready"
echo "   • Make sure all steps are completed before continuing"
echo ""

# Interactive waiting
echo -e "${BLUE}🕐 Take your time to complete the Atlas setup...${NC}"
echo ""

while true; do
    echo "Have you completed all the above steps and have your connection string ready?"
    echo "1) Yes - I have my Atlas connection string"
    echo "2) No - I need more help with Atlas setup"
    echo "3) I'm still working on it"
    echo "4) Exit and do this later"
    echo ""
    read -p "Choose option (1-4): " choice
    
    case $choice in
        1)
            echo ""
            echo -e "${GREEN}🎉 Great! Let's test your Atlas connection.${NC}"
            echo ""
            echo "Please have your connection string ready."
            echo "It should look like:"
            echo "mongodb+srv://metrouni_admin:YOUR_PASSWORD@metrouni-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority"
            echo ""
            read -p "Press Enter when ready to continue..."
            
            # Run the connection updater
            echo ""
            echo -e "${BLUE}🔧 Running connection updater...${NC}"
            ./update-atlas-connection.sh
            
            if [ $? -eq 0 ]; then
                echo ""
                echo -e "${GREEN}🎉 Atlas setup completed successfully!${NC}"
                echo ""
                echo -e "${BLUE}🚀 Your MetroUni platform is now ready for production deployment!${NC}"
                echo ""
                echo "Next steps:"
                echo "1. Set up your production server"
                echo "2. Configure domain DNS (metrouni.avishekchandradas.me)"
                echo "3. Run: ./deploy-mongo-production.sh"
                echo ""
                echo -e "${BLUE}Admin credentials:${NC}"
                echo "   Email: admin@avishekchandradas.me"
                echo "   Password: SecureAdmin2024!"
            else
                echo ""
                echo -e "${YELLOW}⚠️  Atlas connection test failed.${NC}"
                echo "Please check your connection string and try again."
            fi
            
            exit 0
            ;;
        2)
            echo ""
            echo -e "${BLUE}🆘 Additional Help:${NC}"
            echo ""
            echo -e "${YELLOW}Common Issues:${NC}"
            echo "• Cluster not ready: Wait 2-3 minutes after creation"
            echo "• Can't find 'Connect' button: Make sure cluster status is 'Connected'"
            echo "• Network timeout: Check if your IP is whitelisted"
            echo "• Authentication error: Verify username and password"
            echo ""
            echo -e "${BLUE}Resources:${NC}"
            echo "• Atlas Documentation: https://docs.atlas.mongodb.com/getting-started/"
            echo "• Atlas Support: Available in Atlas dashboard"
            echo "• Video tutorials: Available on MongoDB University"
            echo ""
            echo "You can also check the detailed guide in ATLAS_SETUP_GUIDE.md"
            echo ""
            ;;
        3)
            echo ""
            echo -e "${BLUE}⏳ No problem! Take your time.${NC}"
            echo ""
            echo "Remember:"
            echo "• Atlas setup is free and takes about 5-10 minutes"
            echo "• Your cluster needs to be fully ready before connecting"
            echo "• Save your database user password securely"
            echo "• The connection string must include your actual password"
            echo ""
            echo "Run this script again when you're ready to continue."
            echo ""
            ;;
        4)
            echo ""
            echo -e "${GREEN}👋 No problem!${NC}"
            echo ""
            echo "When you're ready to continue:"
            echo "1. Complete the Atlas setup"
            echo "2. Run: ./atlas-setup-helper.sh"
            echo "3. Or run: ./update-atlas-connection.sh directly"
            echo ""
            echo "Your MetroUni platform will be waiting for you!"
            exit 0
            ;;
        *)
            echo ""
            echo -e "${RED}❌ Invalid option. Please choose 1-4.${NC}"
            echo ""
            ;;
    esac
done
