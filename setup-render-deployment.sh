#!/bin/bash

# Render Deployment Setup for MetroUni
# Great performance alternative

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
echo "║  🔥 Render Deployment Setup - MetroUni                       ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${GREEN}🎯 Setting up Render deployment for MetroUni!${NC}"
echo ""

# Create render.yaml
echo -e "${BLUE}📝 Creating Render configuration...${NC}"

cat > render.yaml << EOF
services:
  - type: web
    name: metriuni-backend
    env: node
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        fromService:
          type: web
          name: metriuni-backend
          property: port
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_EXPIRES_IN
        value: 7d
      - key: UPLOAD_MAX_SIZE
        value: 10485760
      - key: RATE_LIMIT_WINDOW_MS
        value: 900000
      - key: RATE_LIMIT_MAX_REQUESTS
        value: 100
EOF

# Create build script
echo -e "${BLUE}🔧 Creating build configuration...${NC}"

# Update backend package.json
cd backend
if ! grep -q '"start"' package.json; then
    sed -i '' 's/"scripts": {/"scripts": {\
    "start": "node server.js",\
    "build": "echo Build completed",/' package.json
fi
cd ..

echo "✅ Render configuration created"
echo ""

echo -e "${BOLD}${GREEN}🔥 Render Deployment Guide${NC}"
echo ""

echo -e "${BLUE}Step 1: Push to GitHub${NC}"
echo "1. Create GitHub repository"
echo "2. Push your code:"
echo "   git add ."
echo "   git commit -m 'Ready for Render deployment'"
echo "   git remote add origin https://github.com/yourusername/metriuni.git"
echo "   git push -u origin main"
echo ""

echo -e "${BLUE}Step 2: Connect to Render${NC}"
echo "1. Go to https://render.com"
echo "2. Sign up/Login with your GitHub account"
echo "3. Click 'New +' → 'Web Service'"
echo "4. Connect your GitHub repository"
echo ""

echo -e "${BLUE}Step 3: Configure Service${NC}"
echo "• Name: metriuni-production"
echo "• Environment: Node"
echo "• Build Command: cd backend && npm install"
echo "• Start Command: cd backend && npm start"
echo "• Instance Type: Free (for testing)"
echo ""

echo -e "${BLUE}Step 4: Set Environment Variables${NC}"
echo "Add these in Render dashboard:"
read -p "Press Enter to see environment variables..."

echo ""
echo -e "${YELLOW}Environment Variables for Render:${NC}"
echo "NODE_ENV=production"
echo "MONGODB_URI=mongodb+srv://metrouni_admin:bangladeshzindabad@metrouni-cluster.dtqxnr1.mongodb.net/metriuni?retryWrites=true&w=majority&appName=metrouni-cluster"
echo "JWT_SECRET=production-super-secure-jwt-secret-key-2024-metrouni-platform"
echo "JWT_EXPIRES_IN=7d"
echo "UPLOAD_MAX_SIZE=10485760"
echo "RATE_LIMIT_WINDOW_MS=900000"
echo "RATE_LIMIT_MAX_REQUESTS=100"
echo ""

echo -e "${BLUE}Step 5: Deploy${NC}"
echo "1. Click 'Create Web Service'"
echo "2. Render will automatically build and deploy"
echo "3. Your app will be live at: https://metriuni-production.onrender.com"
echo ""

# Create automated setup script
cat > setup-render-auto.sh << 'EOF'
#!/bin/bash

echo "🔥 Render Auto-Setup for MetroUni"
echo ""

# Check if git repo exists
if [ ! -d ".git" ]; then
    echo "Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - MetroUni ready for Render"
fi

echo "✅ Git repository ready"
echo ""
echo "Next steps:"
echo "1. Create GitHub repository"
echo "2. Push code: git remote add origin YOUR_GITHUB_URL && git push -u origin main"
echo "3. Go to https://render.com"
echo "4. Connect your GitHub repo"
echo "5. Use these settings:"
echo "   Build: cd backend && npm install"
echo "   Start: cd backend && npm start"
echo "6. Add environment variables from backend/.env.production"
echo ""
echo "Your MetroUni will be live in minutes!"
EOF

chmod +x setup-render-auto.sh

echo -e "${YELLOW}📝 Quick Setup Options:${NC}"
echo "1. Manual setup (follow steps above)"
echo "2. Use render.yaml (automatic configuration)"
echo "3. GitHub integration (recommended)"
echo ""

while true; do
    echo -e "${BOLD}What would you like to do?${NC}"
    echo "1) Open Render website to start deployment"
    echo "2) Show me GitHub setup commands"
    echo "3) Create quick deploy script"
    echo "4) Exit - I'll do it manually"
    echo ""
    read -p "Choose option (1-4): " choice
    
    case $choice in
        1)
            echo ""
            echo -e "${GREEN}🌐 Opening Render dashboard...${NC}"
            if command -v open &> /dev/null; then
                open https://render.com/dashboard
            else
                echo "Please go to: https://render.com/dashboard"
            fi
            echo ""
            echo "Steps to follow:"
            echo "1. Click 'New +' → 'Web Service'"
            echo "2. Connect your GitHub repository"
            echo "3. Configure as shown above"
            echo "4. Add environment variables"
            echo "5. Deploy!"
            exit 0
            ;;
        2)
            echo ""
            echo -e "${BLUE}📋 GitHub Setup Commands:${NC}"
            echo ""
            echo "# 1. Create repository on GitHub first, then:"
            echo "git add ."
            echo "git commit -m 'MetroUni ready for Render deployment'"
            echo "git branch -M main"
            echo "git remote add origin https://github.com/YOUR_USERNAME/metriuni.git"
            echo "git push -u origin main"
            echo ""
            echo "# 2. Then connect to Render:"
            echo "• Go to https://render.com"
            echo "• New Web Service"
            echo "• Connect GitHub repo"
            echo "• Configure and deploy"
            echo ""
            ;;
        3)
            echo ""
            echo -e "${BLUE}📝 Creating quick deploy script...${NC}"
            
            cat > deploy-to-render.sh << 'EOF'
#!/bin/bash

echo "🔥 MetroUni Render Deployment"
echo ""

# Ensure git is set up
if [ ! -d ".git" ]; then
    git init
    git add .
    git commit -m "MetroUni ready for Render deployment"
fi

echo "✅ Git repository ready"
echo ""
echo "🚀 Next steps:"
echo "1. Push to GitHub:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/metriuni.git"
echo "   git push -u origin main"
echo ""
echo "2. Deploy on Render:"
echo "   → Go to https://render.com"
echo "   → New Web Service"
echo "   → Connect your GitHub repo"
echo "   → Build: cd backend && npm install"
echo "   → Start: cd backend && npm start"
echo "   → Add environment variables"
echo "   → Deploy!"
echo ""
echo "🌐 Your MetroUni will be live at:"
echo "https://metriuni-production.onrender.com"
EOF

            chmod +x deploy-to-render.sh
            
            echo "✅ Created: deploy-to-render.sh"
            echo ""
            echo "Run: ./deploy-to-render.sh for step-by-step guidance"
            ;;
        4)
            echo ""
            echo -e "${GREEN}👍 Perfect!${NC}"
            echo ""
            echo "Your Render configuration is ready:"
            echo "• render.yaml (automatic configuration)"
            echo "• Updated package.json with start script"
            echo ""
            echo "Manual deployment steps:"
            echo "1. Push code to GitHub"
            echo "2. Connect to Render.com"
            echo "3. Deploy with provided configuration"
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
