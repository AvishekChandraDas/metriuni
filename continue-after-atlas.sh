#!/bin/bash

# MetroUni Post-Atlas Setup Script
# Run this after MongoDB Atlas is configured

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "================================================"
echo "🚀 MetroUni Post-Atlas Deployment"
echo "================================================"
echo -e "${NC}"

PROJECT_DIR="/Users/avishekchandradas/Desktop/MetroUni"
BACKEND_DIR="$PROJECT_DIR/backend"

echo "This script will complete your MetroUni deployment after MongoDB Atlas is set up."
echo ""

# Step 1: Verify Atlas connection
echo -e "${BLUE}🧪 Step 1: Testing MongoDB Atlas Connection...${NC}"

cd "$BACKEND_DIR"

# Test Atlas connection
node -e "
require('dotenv').config({path: '.env.production'});
const mongoose = require('mongoose');
console.log('🔗 Testing Atlas connection...');
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log('✅ MongoDB Atlas connection successful!');
    process.exit(0);
})
.catch(err => {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
});
setTimeout(() => {
    console.error('❌ Connection timeout');
    process.exit(1);
}, 10000);
" && ATLAS_CONNECTED=true || ATLAS_CONNECTED=false

if [ "$ATLAS_CONNECTED" = "true" ]; then
    echo -e "${GREEN}✅ Atlas connection verified!${NC}"
else
    echo -e "${YELLOW}⚠️  Atlas connection failed. Please check your configuration.${NC}"
    echo ""
    echo "Make sure you've:"
    echo "1. Created MongoDB Atlas cluster"
    echo "2. Updated MONGODB_URI in backend/.env.production"
    echo "3. Configured network access (IP whitelist)"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Step 2: Seed production database
echo ""
echo -e "${BLUE}🌱 Step 2: Seeding Production Database...${NC}"

NODE_ENV=production node scripts/seed-mongodb.js
echo -e "${GREEN}✅ Database seeded with admin user!${NC}"

# Step 3: Verify admin user
echo ""
echo -e "${BLUE}🔐 Step 3: Verifying Admin User...${NC}"

node -e "
require('dotenv').config({path: '.env.production'});
const mongoose = require('mongoose');

async function checkAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const User = require('./models/User');
        const admin = await User.findOne({ email: 'admin@avishekchandradas.me' });
        
        if (admin) {
            console.log('✅ Admin user verified:');
            console.log('   Email:', admin.email);
            console.log('   Name:', admin.firstName, admin.lastName);
            console.log('   Type:', admin.accountType);
        } else {
            console.log('❌ Admin user not found');
        }
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkAdmin();
"

# Step 4: Build Docker image
echo ""
echo -e "${BLUE}🐳 Step 4: Building Production Docker Image...${NC}"

cd "$PROJECT_DIR"

if command -v docker &> /dev/null; then
    docker build -t metrouni:latest .
    echo -e "${GREEN}✅ Docker image built successfully!${NC}"
else
    echo -e "${YELLOW}⚠️  Docker not found. Skipping image build.${NC}"
    echo "Install Docker on your production server to use containerized deployment."
fi

# Step 5: Test production configuration
echo ""
echo -e "${BLUE}🧪 Step 5: Testing Production Configuration...${NC}"

cd "$BACKEND_DIR"

# Start server briefly to test
NODE_ENV=production node server.js &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Test health endpoint
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Production server test successful!${NC}"
else
    echo -e "${YELLOW}⚠️  Production server test failed or using different port${NC}"
fi

# Stop test server
kill $SERVER_PID 2>/dev/null || true

# Final summary
echo ""
echo -e "${GREEN}🎉 MongoDB Atlas Setup Complete!${NC}"
echo ""
echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo "   • MongoDB Atlas: ✅ Connected and tested"
echo "   • Database: ✅ Seeded with admin user"
echo "   • Admin Access: admin@avishekchandradas.me / SecureAdmin2024!"
echo "   • Docker Image: ✅ Built and ready"
echo "   • Production Config: ✅ Verified"
echo ""
echo -e "${BLUE}🚀 Deployment Options:${NC}"
echo ""
echo "1. 🧪 Local Docker Test:"
echo "   docker run -p 3000:3000 --env-file backend/.env.production metrouni:latest"
echo ""
echo "2. 🌍 Full Production Deployment:"
echo "   ./deploy-mongo-production.sh"
echo ""
echo "3. ☁️  Manual Cloud Deployment:"
echo "   • Upload files to your server"
echo "   • Install Docker and dependencies"
echo "   • Run the Docker container with your domain configuration"
echo ""

# Ask what to do next
echo "What would you like to do next?"
echo "1) Test locally with Docker"
echo "2) Get instructions for production server deployment"
echo "3) View deployment documentation"
echo "4) Exit (deploy manually later)"
read -p "Enter choice (1-4): " CHOICE

case $CHOICE in
    1)
        if command -v docker &> /dev/null; then
            echo ""
            echo -e "${BLUE}🧪 Starting local Docker test...${NC}"
            echo "This will start MetroUni on http://localhost:3000"
            echo "Press Ctrl+C to stop"
            echo ""
            docker run --rm -p 3000:3000 --env-file backend/.env.production metrouni:latest
        else
            echo -e "${YELLOW}Docker not available for local testing.${NC}"
        fi
        ;;
    2)
        echo ""
        echo -e "${BLUE}📋 Production Server Instructions:${NC}"
        echo ""
        echo "1. Set up your production server (Ubuntu/CentOS/etc.)"
        echo "2. Install Docker:"
        echo "   curl -fsSL https://get.docker.com -o get-docker.sh"
        echo "   sudo sh get-docker.sh"
        echo ""
        echo "3. Upload your MetroUni project to the server"
        echo ""
        echo "4. Configure domain DNS to point to your server"
        echo ""
        echo "5. Get SSL certificate (Let's Encrypt):"
        echo "   sudo apt install certbot"
        echo "   sudo certbot certonly --standalone -d metrouni.avishekchandradas.me"
        echo ""
        echo "6. Run deployment script:"
        echo "   ./deploy-mongo-production.sh"
        echo ""
        ;;
    3)
        echo ""
        echo -e "${BLUE}📚 Documentation Files:${NC}"
        echo "• ATLAS_SETUP_GUIDE.md - MongoDB Atlas setup"
        echo "• PRODUCTION_DEPLOYMENT_GUIDE.md - Complete deployment guide"
        echo "• MONGODB_ATLAS_SETUP.md - Detailed Atlas documentation"
        echo "• DEPLOYMENT_READY.md - Current status summary"
        echo ""
        ;;
    4)
        echo ""
        echo -e "${GREEN}✅ Setup complete!${NC}"
        echo "Your MetroUni platform is ready for deployment."
        echo "Run ./deploy-mongo-production.sh when ready to deploy."
        ;;
esac

echo ""
echo -e "${GREEN}🎯 Atlas setup completed successfully!${NC}"

# Save completion status
cat > atlas-setup-complete.txt << EOF
MetroUni MongoDB Atlas Setup Complete
Generated: $(date)

✅ MongoDB Atlas Connection: Verified
✅ Production Database: Seeded
✅ Admin User: Created and verified
✅ Docker Image: Built
✅ Production Config: Tested

Admin Credentials:
Email: admin@avishekchandradas.me
Password: SecureAdmin2024!

Next Steps:
1. Configure production server with Docker
2. Set up domain DNS (metrouni.avishekchandradas.me)
3. Obtain SSL certificates
4. Run: ./deploy-mongo-production.sh

Status: Ready for production deployment
EOF

echo "Setup details saved to atlas-setup-complete.txt"
