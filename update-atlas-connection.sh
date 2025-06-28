#!/bin/bash

# MongoDB Atlas Connection String Updater
# Use this script to update your Atlas connection string

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "================================================"
echo "🔧 MongoDB Atlas Connection String Updater"
echo "================================================"
echo -e "${NC}"

PROJECT_DIR="/Users/avishekchandradas/Desktop/MetroUni"
BACKEND_DIR="$PROJECT_DIR/backend"
ENV_FILE="$BACKEND_DIR/.env.production"

echo "This script will help you update your MongoDB Atlas connection string."
echo ""

# Check if Atlas cluster is ready
echo -e "${BLUE}📋 Atlas Setup Checklist:${NC}"
echo "□ MongoDB Atlas account created"
echo "□ Cluster 'metrouni-cluster' created and ready"
echo "□ Database user 'metrouni_admin' created"
echo "□ Network access configured (IP whitelisted)"
echo "□ Connection string copied from Atlas"
echo ""

read -p "Have you completed all the above steps? (y/n): " READY

if [[ $READY != "y" && $READY != "Y" ]]; then
    echo ""
    echo -e "${YELLOW}⏸️  Please complete the Atlas setup first:${NC}"
    echo "1. Go to https://cloud.mongodb.com"
    echo "2. Create cluster: metrouni-cluster"
    echo "3. Create user: metrouni_admin"
    echo "4. Configure network access"
    echo "5. Get connection string"
    echo ""
    echo "Then run this script again."
    exit 0
fi

echo ""
echo -e "${BLUE}🔗 Connection String Update${NC}"
echo ""
echo "Please paste your MongoDB Atlas connection string below."
echo "It should look like:"
echo "mongodb+srv://metrouni_admin:PASSWORD@metrouni-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority"
echo ""
read -p "Enter your Atlas connection string: " ATLAS_URI

# Validate connection string format
if [[ ! $ATLAS_URI =~ ^mongodb\+srv:// ]]; then
    echo -e "${RED}❌ Invalid connection string format. Should start with 'mongodb+srv://'${NC}"
    exit 1
fi

if [[ ! $ATLAS_URI =~ metrouni-cluster ]]; then
    echo -e "${YELLOW}⚠️  Warning: Connection string doesn't contain 'metrouni-cluster'${NC}"
    read -p "Continue anyway? (y/n): " CONTINUE
    if [[ $CONTINUE != "y" && $CONTINUE != "Y" ]]; then
        exit 0
    fi
fi

# Add database name if not present
if [[ ! $ATLAS_URI =~ /metriuni\? ]]; then
    # Insert /metriuni before the ?
    ATLAS_URI=$(echo "$ATLAS_URI" | sed 's/?retryWrites/\/metriuni?retryWrites/')
    echo -e "${BLUE}📝 Added database name 'metriuni' to connection string${NC}"
fi

echo ""
echo -e "${BLUE}🔄 Updating configuration...${NC}"

# Backup current .env.production
cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backed up current .env.production"

# Update MongoDB URI
sed -i.tmp "s|MONGODB_URI=.*|MONGODB_URI=$ATLAS_URI|g" "$ENV_FILE"
rm "$ENV_FILE.tmp"
echo "✅ Updated MONGODB_URI in .env.production"

# Display the update (with password masked)
MASKED_URI=$(echo "$ATLAS_URI" | sed 's/:[^:@]*@/:***@/')
echo ""
echo -e "${GREEN}✅ Configuration Updated!${NC}"
echo "   URI: $MASKED_URI"

# Test the connection
echo ""
echo -e "${BLUE}🧪 Testing Atlas connection...${NC}"

cd "$BACKEND_DIR"

# Create test script
cat > test-atlas.js << 'EOF'
require('dotenv').config({path: '.env.production'});
const mongoose = require('mongoose');

console.log('🔗 Testing MongoDB Atlas connection...');
const uri = process.env.MONGODB_URI.replace(/:[^:@]*@/, ':***@');
console.log('URI:', uri);

mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000
})
.then(() => {
    console.log('✅ MongoDB Atlas connection successful!');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🏢 Host:', mongoose.connection.host);
    process.exit(0);
})
.catch(err => {
    console.error('❌ Connection failed:', err.message);
    
    if (err.message.includes('authentication failed')) {
        console.error('💡 Check username and password in connection string');
    }
    if (err.message.includes('ENOTFOUND')) {
        console.error('💡 Check cluster name and ensure cluster is ready');
    }
    if (err.message.includes('IP not authorized')) {
        console.error('💡 Check Network Access settings in Atlas');
    }
    
    process.exit(1);
});

setTimeout(() => {
    console.error('❌ Connection timeout - check your settings');
    process.exit(1);
}, 15000);
EOF

if node test-atlas.js; then
    echo ""
    echo -e "${GREEN}🎉 Atlas Connection Successful!${NC}"
    
    # Clean up test script
    rm test-atlas.js
    
    # Continue with deployment preparation
    echo ""
    echo -e "${BLUE}🚀 Ready for next steps:${NC}"
    echo "1. Seed production database"
    echo "2. Build Docker image"
    echo "3. Deploy to production"
    echo ""
    
    read -p "Continue with automatic setup? (y/n): " CONTINUE_SETUP
    
    if [[ $CONTINUE_SETUP == "y" || $CONTINUE_SETUP == "Y" ]]; then
        echo ""
        echo -e "${BLUE}🌱 Seeding production database...${NC}"
        NODE_ENV=production node scripts/seed-mongodb.js
        
        echo ""
        echo -e "${BLUE}🐳 Building Docker image...${NC}"
        cd "$PROJECT_DIR"
        if command -v docker &> /dev/null; then
            docker build -t metrouni:latest .
            echo -e "${GREEN}✅ Docker image built successfully!${NC}"
        else
            echo -e "${YELLOW}⚠️  Docker not found - skipping image build${NC}"
        fi
        
        echo ""
        echo -e "${GREEN}🎯 Setup Complete!${NC}"
        echo ""
        echo "Your MetroUni platform is now ready for production deployment!"
        echo ""
        echo -e "${BLUE}Next steps:${NC}"
        echo "1. Set up your production server"
        echo "2. Configure domain DNS (metrouni.avishekchandradas.me)"
        echo "3. Run: ./deploy-mongo-production.sh"
        echo ""
        echo -e "${BLUE}Admin credentials:${NC}"
        echo "   Email: admin@avishekchandradas.me"
        echo "   Password: SecureAdmin2024!"
        
    else
        echo ""
        echo -e "${GREEN}✅ Atlas connection configured!${NC}"
        echo "Run ./continue-after-atlas.sh when ready to continue."
    fi
    
else
    echo ""
    echo -e "${RED}❌ Atlas connection failed${NC}"
    echo ""
    echo "Please check:"
    echo "1. Cluster is fully created and running"
    echo "2. Username and password are correct"
    echo "3. Network access is configured"
    echo "4. Connection string format is correct"
    echo ""
    echo "You can run this script again after fixing the issues."
    
    # Clean up test script
    rm test-atlas.js
fi

echo ""
echo "Configuration saved. Backup available at: $ENV_FILE.backup.*"
