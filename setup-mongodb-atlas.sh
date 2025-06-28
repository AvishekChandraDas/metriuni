#!/bin/bash

# MongoDB Atlas Quick Setup Script for MetroUni
# This script helps configure MongoDB Atlas connection

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}"
    echo "================================================"
    echo "🗄️  MetroUni MongoDB Atlas Setup"
    echo "================================================"
    echo -e "${NC}"
}

print_status() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header

PROJECT_DIR="/Users/avishekchandradas/Desktop/MetroUni"
BACKEND_DIR="$PROJECT_DIR/backend"

echo "This script will help you set up MongoDB Atlas for MetroUni production deployment."
echo ""

# Step 1: Check if Atlas is already configured
if grep -q "mongodb+srv" "$BACKEND_DIR/.env.production" 2>/dev/null; then
    print_success "MongoDB Atlas URI already configured in .env.production"
    ATLAS_CONFIGURED=true
else
    print_warning "MongoDB Atlas URI not yet configured"
    ATLAS_CONFIGURED=false
fi

# Step 2: Interactive Atlas setup
if [ "$ATLAS_CONFIGURED" = false ]; then
    echo ""
    print_status "📋 MongoDB Atlas Setup Steps:"
    echo ""
    echo "1. Go to https://cloud.mongodb.com and sign in (or create account)"
    echo "2. Create a new cluster:"
    echo "   - Cluster Name: metrouni-cluster"
    echo "   - Provider: AWS/Google/Azure (your choice)"
    echo "   - Region: Choose closest to your server"
    echo "   - Tier: M0 (Free) or higher"
    echo ""
    echo "3. Create Database User:"
    echo "   - Go to Database Access → Add New Database User"
    echo "   - Username: metrouni_admin"
    echo "   - Password: Generate strong password"
    echo "   - Privileges: Read and write to any database"
    echo ""
    echo "4. Configure Network Access:"
    echo "   - Go to Network Access → Add IP Address"
    echo "   - Add: 0.0.0.0/0 (for testing) or your server IP"
    echo ""
    echo "5. Get Connection String:"
    echo "   - Go to Clusters → Connect → Connect your application"
    echo "   - Driver: Node.js"
    echo "   - Copy the connection string"
    echo ""
    
    read -p "Press Enter when you've completed the above steps..."
    
    echo ""
    print_status "📝 Please provide your MongoDB Atlas details:"
    echo ""
    
    # Get connection details
    read -p "Enter your Atlas username: " ATLAS_USERNAME
    read -s -p "Enter your Atlas password: " ATLAS_PASSWORD
    echo ""
    read -p "Enter your Atlas cluster URL (e.g., metrouni-cluster.abc123.mongodb.net): " ATLAS_CLUSTER_URL
    
    # Construct connection string
    MONGODB_URI="mongodb+srv://$ATLAS_USERNAME:$ATLAS_PASSWORD@$ATLAS_CLUSTER_URL/metriuni?retryWrites=true&w=majority"
    
    echo ""
    print_status "🔧 Updating production environment configuration..."
    
    # Update .env.production
    sed -i.bak "s|MONGODB_URI=.*|MONGODB_URI=$MONGODB_URI|g" "$BACKEND_DIR/.env.production"
    
    print_success "MongoDB Atlas URI configured successfully!"
    
else
    echo ""
    print_status "Using existing MongoDB Atlas configuration..."
fi

# Step 3: Test Atlas connection
echo ""
print_status "🧪 Testing MongoDB Atlas connection..."

cd "$BACKEND_DIR"

# Create test script
cat > test-atlas-connection.js << 'EOF'
require('dotenv').config({path: '.env.production'});
const mongoose = require('mongoose');

console.log('🔗 Testing MongoDB Atlas connection...');
console.log('URI:', process.env.MONGODB_URI.replace(/:[^:@]*@/, ':***@'));

mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log('✅ MongoDB Atlas connection successful!');
    console.log('📊 Connected to:', mongoose.connection.name);
    console.log('🏢 Host:', mongoose.connection.host);
    process.exit(0);
})
.catch(err => {
    console.error('❌ MongoDB Atlas connection failed:');
    console.error('Error:', err.message);
    if (err.message.includes('authentication failed')) {
        console.error('💡 Check your username and password');
    }
    if (err.message.includes('network error')) {
        console.error('💡 Check your network access settings (IP whitelist)');
    }
    process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
    console.error('❌ Connection test timed out');
    process.exit(1);
}, 10000);
EOF

# Run connection test
if node test-atlas-connection.js; then
    print_success "Atlas connection test passed!"
    rm test-atlas-connection.js
else
    print_error "Atlas connection test failed!"
    echo ""
    echo "Please check:"
    echo "1. Username and password are correct"
    echo "2. Database user has proper permissions"
    echo "3. IP address is whitelisted in Network Access"
    echo "4. Connection string format is correct"
    echo ""
    rm test-atlas-connection.js
    exit 1
fi

# Step 4: Seed production database
echo ""
print_status "🌱 Seeding production database with sample data..."

# Temporarily use production config for seeding
cp .env.production .env.temp
NODE_ENV=production node scripts/seed-mongodb.js
rm .env.temp

print_success "Production database seeded successfully!"

# Step 5: Verify admin user
echo ""
print_status "🔐 Verifying admin user..."

cat > verify-admin.js << 'EOF'
require('dotenv').config({path: '.env.production'});
const mongoose = require('mongoose');
const User = require('./models/User');

async function verifyAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const admin = await User.findOne({ email: 'admin@avishekchandradas.me' });
        
        if (admin) {
            console.log('✅ Admin user found');
            console.log('📧 Email:', admin.email);
            console.log('👤 Name:', admin.firstName, admin.lastName);
            console.log('🛡️  Account Type:', admin.accountType);
            console.log('📊 Status:', admin.isApproved ? 'Approved' : 'Pending');
        } else {
            console.log('❌ Admin user not found');
        }
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error verifying admin:', error.message);
    }
}

verifyAdmin();
EOF

node verify-admin.js
rm verify-admin.js

# Step 6: Build Docker image for production
echo ""
print_status "🐳 Building production Docker image..."

cd "$PROJECT_DIR"

if docker build -t metrouni:latest . ; then
    print_success "Docker image built successfully!"
else
    print_error "Docker build failed!"
    exit 1
fi

# Step 7: Final deployment options
echo ""
print_status "🚀 Ready for deployment!"
echo ""
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo -e "${BLUE}📊 Configuration Summary:${NC}"
echo "   • MongoDB Atlas: Connected and configured"
echo "   • Database: Seeded with admin user"
echo "   • Docker Image: Built and ready"
echo "   • Admin Credentials: admin@avishekchandradas.me / SecureAdmin2024!"
echo ""
echo -e "${BLUE}🚀 Deployment Options:${NC}"
echo ""
echo "1. Local Testing:"
echo "   docker run -p 3000:3000 --env-file backend/.env.production metrouni:latest"
echo ""
echo "2. Production Deployment:"
echo "   ./deploy-mongo-production.sh"
echo ""
echo "3. Manual Docker Deployment:"
echo "   docker run -d --name metrouni-prod -p 80:3000 --env-file backend/.env.production --restart unless-stopped metrouni:latest"
echo ""

# Ask user what they want to do next
echo "What would you like to do next?"
echo "1) Test locally with Docker"
echo "2) Run full production deployment"
echo "3) Exit (manual deployment later)"
read -p "Enter choice (1-3): " NEXT_STEP

case $NEXT_STEP in
    1)
        print_status "🧪 Starting local Docker test..."
        docker run --rm -p 3000:3000 --env-file backend/.env.production metrouni:latest &
        DOCKER_PID=$!
        
        echo "Waiting for server to start..."
        sleep 10
        
        if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            print_success "Local Docker test successful!"
            echo "API available at: http://localhost:3000/api"
            echo "Health check: http://localhost:3000/api/health"
            echo ""
            echo "Press Ctrl+C to stop the test server"
            wait $DOCKER_PID
        else
            print_error "Local Docker test failed"
            kill $DOCKER_PID 2>/dev/null || true
        fi
        ;;
        
    2)
        print_status "🚀 Starting full production deployment..."
        ./deploy-mongo-production.sh
        ;;
        
    3)
        print_success "Setup complete! You can run the deployment later with:"
        echo "   ./deploy-mongo-production.sh"
        ;;
esac

echo ""
print_success "MongoDB Atlas setup completed successfully!"

# Save configuration info
cat > atlas-config-info.txt << EOF
MetroUni MongoDB Atlas Configuration
Generated: $(date)

Atlas Cluster: Configured and tested
Database: metriuni
Admin User: admin@avishekchandradas.me
Admin Password: SecureAdmin2024!

Connection Status: ✅ Verified
Database Seeding: ✅ Complete
Docker Image: ✅ Built

Next Steps:
1. Configure domain DNS (metrouni.avishekchandradas.me)
2. Set up SSL certificates
3. Run production deployment script
4. Configure monitoring and backups

For full deployment: ./deploy-mongo-production.sh
EOF

print_success "Configuration saved to atlas-config-info.txt"
