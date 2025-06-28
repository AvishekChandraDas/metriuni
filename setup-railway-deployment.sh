#!/bin/bash

# Railway Deployment Setup for MetroUni
# The easiest and best deployment solution

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
echo "║  🚂 Railway Deployment Setup - MetroUni                      ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${GREEN}🎯 Setting up the EASIEST deployment for MetroUni!${NC}"
echo ""

# Check if Railway CLI is installed
echo -e "${BLUE}📦 Checking Railway CLI...${NC}"
if ! command -v railway &> /dev/null; then
    echo "🔧 Installing Railway CLI..."
    if command -v npm &> /dev/null; then
        npm install -g @railway/cli
    elif command -v brew &> /dev/null; then
        brew install railway
    else
        echo ""
        echo -e "${YELLOW}Please install Railway CLI manually:${NC}"
        echo "npm install -g @railway/cli"
        echo "or"
        echo "curl -fsSL https://railway.app/install.sh | sh"
        echo ""
        read -p "Press Enter after installing Railway CLI..."
    fi
fi

echo "✅ Railway CLI ready"
echo ""

# Create Railway configuration
echo -e "${BLUE}📝 Creating Railway configuration...${NC}"

# Create railway.json
cat > railway.json << EOF
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health"
  }
}
EOF

# Create Procfile for Railway
cat > Procfile << EOF
web: cd backend && npm start
EOF

# Update package.json for Railway
echo -e "${BLUE}🔧 Updating backend package.json for Railway...${NC}"
cd backend

# Add start script if not present
if ! grep -q '"start"' package.json; then
    # Add start script
    sed -i '' 's/"scripts": {/"scripts": {\
    "start": "node server.js",/' package.json
fi

# Create Railway environment template
cat > .env.railway << EOF
# Railway Environment Variables Template
# Copy these to your Railway project settings

NODE_ENV=production
PORT=\$PORT
HOST=0.0.0.0

# Your MongoDB Atlas URI (copy from .env.production)
MONGODB_URI=mongodb+srv://metrouni_admin:bangladeshzindabad@metrouni-cluster.dtqxnr1.mongodb.net/metriuni?retryWrites=true&w=majority&appName=metrouni-cluster

# JWT Configuration
JWT_SECRET=production-super-secure-jwt-secret-key-2024-metrouni-platform
JWT_EXPIRES_IN=7d

# CORS Configuration (update with your Railway URL)
ALLOWED_ORIGINS=https://metrouni-production.up.railway.app,https://metrouni.avishekchandradas.me
FRONTEND_URL=https://metrouni-production.up.railway.app

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760
UPLOAD_DIR=uploads
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL=true

# Email Configuration (optional)
EMAIL_FROM=noreply@metrouniversity.edu
EMAIL_FROM_NAME=MetroUni Platform

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=production-session-secret-key-2024
COOKIE_SECRET=production-cookie-secret-key-2024
EOF

cd ..

echo "✅ Railway configuration created"
echo ""

# Git setup check
echo -e "${BLUE}📋 Checking Git repository...${NC}"
if [ ! -d ".git" ]; then
    echo "🔧 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - MetroUni platform ready for Railway deployment"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository exists"
    # Add and commit Railway files
    git add railway.json Procfile backend/.env.railway
    git commit -m "Add Railway deployment configuration" || echo "No changes to commit"
fi

echo ""
echo -e "${BOLD}${GREEN}🚂 Railway Deployment Guide${NC}"
echo ""

echo -e "${BLUE}Step 1: Login to Railway${NC}"
echo "Run: ${BOLD}railway login${NC}"
echo "This will open your browser to authenticate"
echo ""

echo -e "${BLUE}Step 2: Create Railway Project${NC}"
echo "Run: ${BOLD}railway init${NC}"
echo "Choose: Create new project"
echo "Name: metrouni-production"
echo ""

echo -e "${BLUE}Step 3: Set Environment Variables${NC}"
echo "Copy the variables from: backend/.env.railway"
echo "Run: ${BOLD}railway variables set MONGODB_URI=\"your_atlas_uri\"${NC}"
echo "And set all other variables from the .env.railway file"
echo ""

echo -e "${BLUE}Step 4: Deploy${NC}"
echo "Run: ${BOLD}railway up${NC}"
echo "Railway will build and deploy your application"
echo ""

echo -e "${BLUE}Step 5: Get Your URL${NC}"
echo "Run: ${BOLD}railway status${NC}"
echo "Your app will be available at: https://metrouni-production.up.railway.app"
echo ""

echo -e "${YELLOW}📝 Quick Commands Summary:${NC}"
echo "1. railway login"
echo "2. railway init"
echo "3. railway variables set MONGODB_URI=\"mongodb+srv://...\""
echo "4. railway up"
echo "5. railway status"
echo ""

# Interactive deployment
while true; do
    echo -e "${BOLD}What would you like to do?${NC}"
    echo "1) Start Railway deployment now (I'll guide you through each step)"
    echo "2) Show me the manual steps"
    echo "3) Create deployment script I can run later"
    echo "4) Exit and deploy manually"
    echo ""
    read -p "Choose option (1-4): " choice
    
    case $choice in
        1)
            echo ""
            echo -e "${GREEN}🚂 Let's deploy to Railway step by step!${NC}"
            echo ""
            
            echo -e "${BLUE}Step 1: Railway Login${NC}"
            echo "Opening Railway login..."
            railway login
            
            if [ $? -eq 0 ]; then
                echo "✅ Railway login successful"
                echo ""
                
                echo -e "${BLUE}Step 2: Initialize Project${NC}"
                echo "Creating Railway project..."
                railway init
                
                echo ""
                echo -e "${BLUE}Step 3: Set Environment Variables${NC}"
                echo "Setting up environment variables..."
                
                # Read MongoDB URI from production env
                MONGODB_URI=$(grep MONGODB_URI backend/.env.production | cut -d '=' -f2-)
                JWT_SECRET=$(grep JWT_SECRET backend/.env.production | cut -d '=' -f2-)
                
                railway variables set NODE_ENV=production
                railway variables set MONGODB_URI="$MONGODB_URI"
                railway variables set JWT_SECRET="$JWT_SECRET"
                railway variables set JWT_EXPIRES_IN=7d
                railway variables set UPLOAD_MAX_SIZE=10485760
                railway variables set RATE_LIMIT_WINDOW_MS=900000
                railway variables set RATE_LIMIT_MAX_REQUESTS=100
                
                echo "✅ Environment variables set"
                echo ""
                
                echo -e "${BLUE}Step 4: Deploy Application${NC}"
                echo "Deploying to Railway..."
                railway up
                
                echo ""
                echo -e "${GREEN}🎉 Deployment completed!${NC}"
                echo ""
                echo "Getting your application URL..."
                railway status
                
                echo ""
                echo -e "${BOLD}${GREEN}🌐 Your MetroUni platform is now live!${NC}"
                echo ""
                echo "Admin credentials:"
                echo "📧 Email: admin@avishekchandradas.me"
                echo "🔑 Password: SecureAdmin2024!"
                echo ""
                echo "Next steps:"
                echo "1. Update your domain DNS to point to Railway URL"
                echo "2. Add custom domain in Railway dashboard"
                echo "3. Test your live application"
                
            else
                echo "❌ Railway login failed. Please try again or deploy manually."
            fi
            
            exit 0
            ;;
        2)
            echo ""
            echo -e "${BLUE}📋 Manual Railway Deployment Steps:${NC}"
            echo ""
            echo "1. Install Railway CLI:"
            echo "   npm install -g @railway/cli"
            echo ""
            echo "2. Login to Railway:"
            echo "   railway login"
            echo ""
            echo "3. Initialize project:"
            echo "   railway init"
            echo "   (Choose: Create new project, name: metrouni-production)"
            echo ""
            echo "4. Set environment variables:"
            echo "   railway variables set NODE_ENV=production"
            echo "   railway variables set MONGODB_URI=\"your_atlas_connection_string\""
            echo "   railway variables set JWT_SECRET=\"your_jwt_secret\""
            echo "   (Copy all variables from backend/.env.railway)"
            echo ""
            echo "5. Deploy:"
            echo "   railway up"
            echo ""
            echo "6. Get your URL:"
            echo "   railway status"
            echo ""
            echo "Your app will be live at: https://metrouni-production.up.railway.app"
            echo ""
            ;;
        3)
            echo ""
            echo -e "${BLUE}📝 Creating deployment script...${NC}"
            
            cat > deploy-to-railway.sh << 'EOF'
#!/bin/bash

# MetroUni Railway Deployment Script
echo "🚂 Deploying MetroUni to Railway..."

# Login to Railway
echo "Logging in to Railway..."
railway login

# Initialize project
echo "Initializing Railway project..."
railway init

# Set environment variables
echo "Setting environment variables..."
railway variables set NODE_ENV=production

# Read from .env.production
MONGODB_URI=$(grep MONGODB_URI backend/.env.production | cut -d '=' -f2-)
JWT_SECRET=$(grep JWT_SECRET backend/.env.production | cut -d '=' -f2-)

railway variables set MONGODB_URI="$MONGODB_URI"
railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set JWT_EXPIRES_IN=7d
railway variables set UPLOAD_MAX_SIZE=10485760
railway variables set RATE_LIMIT_WINDOW_MS=900000
railway variables set RATE_LIMIT_MAX_REQUESTS=100

# Deploy
echo "Deploying application..."
railway up

# Show status
echo "Getting deployment status..."
railway status

echo ""
echo "🎉 Deployment completed!"
echo "Your MetroUni platform is now live on Railway!"
echo ""
echo "Admin credentials:"
echo "📧 Email: admin@avishekchandradas.me"
echo "🔑 Password: SecureAdmin2024!"
EOF

            chmod +x deploy-to-railway.sh
            
            echo "✅ Created: deploy-to-railway.sh"
            echo ""
            echo "To deploy later, run: ./deploy-to-railway.sh"
            echo ""
            ;;
        4)
            echo ""
            echo -e "${GREEN}👍 No problem!${NC}"
            echo ""
            echo "Your Railway configuration is ready in:"
            echo "• railway.json"
            echo "• Procfile"
            echo "• backend/.env.railway (environment variables template)"
            echo ""
            echo "When ready to deploy:"
            echo "1. railway login"
            echo "2. railway init"
            echo "3. Set environment variables from backend/.env.railway"
            echo "4. railway up"
            echo ""
            echo "Your MetroUni platform will be live in minutes!"
            exit 0
            ;;
        *)
            echo ""
            echo -e "${RED}❌ Invalid option. Please choose 1-4.${NC}"
            ;;
    esac
done
