#!/bin/bash

# Vercel Deployment Setup for MetroUni
# Ultra-fast serverless deployment

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
echo "║  ⚡ Vercel Deployment Setup - MetroUni                        ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${GREEN}🎯 Setting up ultra-fast Vercel deployment!${NC}"
echo ""

# Install Vercel CLI
echo -e "${BLUE}📦 Checking Vercel CLI...${NC}"
if ! command -v vercel &> /dev/null; then
    echo "🔧 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "✅ Vercel CLI ready"
echo ""

# Create Vercel configuration
echo -e "${BLUE}📝 Creating Vercel configuration...${NC}"

# Create vercel.json
cat > vercel.json << EOF
{
  "version": 2,
  "name": "metriuni-production",
  "builds": [
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/server.js"
    },
    {
      "src": "/health",
      "dest": "backend/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "backend/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "backend/server.js": {
      "maxDuration": 30
    }
  }
}
EOF

# Create Vercel-specific server entry
echo -e "${BLUE}🔧 Creating Vercel-optimized server...${NC}"

cat > backend/vercel-server.js << 'EOF'
// Vercel-optimized server for MetroUni
const app = require('./server');

// Export for Vercel
module.exports = app;
EOF

# Update vercel.json to use vercel-server.js
cat > vercel.json << EOF
{
  "version": 2,
  "name": "metriuni-production",
  "builds": [
    {
      "src": "backend/vercel-server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/vercel-server.js"
    },
    {
      "src": "/health",
      "dest": "backend/vercel-server.js"
    },
    {
      "src": "/(.*)",
      "dest": "backend/vercel-server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "backend/vercel-server.js": {
      "maxDuration": 30
    }
  }
}
EOF

# Create .vercelignore
cat > .vercelignore << EOF
node_modules
.env
.env.local
.env.development
*.log
.DS_Store
uploads
EOF

echo "✅ Vercel configuration created"
echo ""

echo -e "${BOLD}${GREEN}⚡ Vercel Deployment Guide${NC}"
echo ""

echo -e "${BLUE}Step 1: Login to Vercel${NC}"
echo "Run: ${BOLD}vercel login${NC}"
echo "This will authenticate you with Vercel"
echo ""

echo -e "${BLUE}Step 2: Configure Environment Variables${NC}"
echo "You'll need to set these environment variables:"
echo ""

# Show environment variables
echo -e "${YELLOW}Environment Variables for Vercel:${NC}"
echo "NODE_ENV=production"
echo "MONGODB_URI=mongodb+srv://metrouni_admin:bangladeshzindabad@metrouni-cluster.dtqxnr1.mongodb.net/metriuni?retryWrites=true&w=majority&appName=metrouni-cluster"
echo "JWT_SECRET=production-super-secure-jwt-secret-key-2024-metrouni-platform"
echo "JWT_EXPIRES_IN=7d"
echo "UPLOAD_MAX_SIZE=10485760"
echo "RATE_LIMIT_WINDOW_MS=900000"
echo "RATE_LIMIT_MAX_REQUESTS=100"
echo ""

echo -e "${BLUE}Step 3: Deploy${NC}"
echo "Run: ${BOLD}vercel --prod${NC}"
echo "Vercel will build and deploy your application"
echo "Your app will be live at: https://metriuni-production.vercel.app"
echo ""

# Interactive deployment
while true; do
    echo -e "${BOLD}What would you like to do?${NC}"
    echo "1) Deploy to Vercel now (automatic setup)"
    echo "2) Show me manual deployment steps"
    echo "3) Create deployment script for later"
    echo "4) Exit - I'll deploy manually"
    echo ""
    read -p "Choose option (1-4): " choice
    
    case $choice in
        1)
            echo ""
            echo -e "${GREEN}⚡ Starting Vercel deployment!${NC}"
            echo ""
            
            # Login to Vercel
            echo -e "${BLUE}Step 1: Vercel Login${NC}"
            vercel login
            
            if [ $? -eq 0 ]; then
                echo "✅ Vercel login successful"
                echo ""
                
                # Set environment variables
                echo -e "${BLUE}Step 2: Setting Environment Variables${NC}"
                
                # Read from production env
                MONGODB_URI=$(grep MONGODB_URI backend/.env.production | cut -d '=' -f2-)
                JWT_SECRET=$(grep JWT_SECRET backend/.env.production | cut -d '=' -f2-)
                
                vercel env add NODE_ENV production
                vercel env add MONGODB_URI "$MONGODB_URI" production
                vercel env add JWT_SECRET "$JWT_SECRET" production
                vercel env add JWT_EXPIRES_IN "7d" production
                vercel env add UPLOAD_MAX_SIZE "10485760" production
                vercel env add RATE_LIMIT_WINDOW_MS "900000" production
                vercel env add RATE_LIMIT_MAX_REQUESTS "100" production
                
                echo "✅ Environment variables set"
                echo ""
                
                # Deploy
                echo -e "${BLUE}Step 3: Deploying to Production${NC}"
                vercel --prod
                
                echo ""
                echo -e "${GREEN}🎉 Vercel deployment completed!${NC}"
                echo ""
                echo -e "${BOLD}${GREEN}🌐 Your MetroUni platform is now live!${NC}"
                echo ""
                echo "Admin credentials:"
                echo "📧 Email: admin@avishekchandradas.me"
                echo "🔑 Password: SecureAdmin2024!"
                echo ""
                
            else
                echo "❌ Vercel login failed. Please try manual deployment."
            fi
            
            exit 0
            ;;
        2)
            echo ""
            echo -e "${BLUE}📋 Manual Vercel Deployment Steps:${NC}"
            echo ""
            echo "1. Install Vercel CLI:"
            echo "   npm install -g vercel"
            echo ""
            echo "2. Login to Vercel:"
            echo "   vercel login"
            echo ""
            echo "3. Set environment variables:"
            echo "   vercel env add MONGODB_URI production"
            echo "   (Enter your MongoDB Atlas connection string)"
            echo "   vercel env add JWT_SECRET production"
            echo "   (Enter your JWT secret)"
            echo "   vercel env add NODE_ENV production"
            echo ""
            echo "4. Deploy:"
            echo "   vercel --prod"
            echo ""
            echo "5. Your app will be live at:"
            echo "   https://metriuni-production.vercel.app"
            echo ""
            echo "6. Optional - Add custom domain:"
            echo "   vercel domains add metrouni.avishekchandradas.me"
            echo ""
            ;;
        3)
            echo ""
            echo -e "${BLUE}📝 Creating deployment script...${NC}"
            
            cat > deploy-to-vercel.sh << 'EOF'
#!/bin/bash

# MetroUni Vercel Deployment Script
echo "⚡ Deploying MetroUni to Vercel..."

# Login to Vercel
echo "Logging in to Vercel..."
vercel login

# Set environment variables
echo "Setting environment variables..."
MONGODB_URI=$(grep MONGODB_URI backend/.env.production | cut -d '=' -f2-)
JWT_SECRET=$(grep JWT_SECRET backend/.env.production | cut -d '=' -f2-)

vercel env add NODE_ENV production
vercel env add MONGODB_URI "$MONGODB_URI" production
vercel env add JWT_SECRET "$JWT_SECRET" production
vercel env add JWT_EXPIRES_IN "7d" production
vercel env add UPLOAD_MAX_SIZE "10485760" production

# Deploy to production
echo "Deploying to production..."
vercel --prod

echo ""
echo "🎉 Deployment completed!"
echo "Your MetroUni platform is now live on Vercel!"
echo ""
echo "Admin credentials:"
echo "📧 Email: admin@avishekchandradas.me" 
echo "🔑 Password: SecureAdmin2024!"
EOF

            chmod +x deploy-to-vercel.sh
            
            echo "✅ Created: deploy-to-vercel.sh"
            echo ""
            echo "To deploy later, run: ./deploy-to-vercel.sh"
            echo ""
            ;;
        4)
            echo ""
            echo -e "${GREEN}👍 Perfect!${NC}"
            echo ""
            echo "Your Vercel configuration is ready:"
            echo "• vercel.json (deployment configuration)"
            echo "• backend/vercel-server.js (Vercel-optimized entry)"
            echo "• .vercelignore (files to ignore)"
            echo ""
            echo "Manual deployment:"
            echo "1. vercel login"
            echo "2. Set environment variables with 'vercel env add'"
            echo "3. vercel --prod"
            echo ""
            echo "Your MetroUni platform will be ultra-fast on Vercel!"
            exit 0
            ;;
        *)
            echo ""
            echo -e "${RED}❌ Invalid option. Please choose 1-4.${NC}"
            ;;
    esac
done
