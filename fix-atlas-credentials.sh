#!/bin/bash

# Quick MongoDB Credentials Updater
# Update username and password in the cleaned connection string

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔧 MongoDB Atlas Credentials Updater${NC}"
echo "================================================"
echo ""

ENV_FILE="/Users/avishekchandradas/Desktop/MetroUni/backend/.env.production"

echo "Your current connection string template:"
grep "MONGODB_URI=" "$ENV_FILE"
echo ""

echo "Please provide your MongoDB Atlas credentials:"
echo ""

read -p "Enter your MongoDB Atlas username (e.g., metrouni_admin): " USERNAME
read -s -p "Enter your MongoDB Atlas password: " PASSWORD
echo ""
echo ""

# Update the connection string
sed -i.backup "s/<db_username>/$USERNAME/g" "$ENV_FILE"
sed -i "s/<db_password>/$PASSWORD/g" "$ENV_FILE"

echo -e "${GREEN}✅ Credentials updated!${NC}"
echo ""

# Show the updated connection string (with password masked)
UPDATED_URI=$(grep "MONGODB_URI=" "$ENV_FILE" | cut -d'=' -f2-)
MASKED_URI=$(echo "$UPDATED_URI" | sed 's/:[^:@]*@/:***@/')
echo "Updated connection string: $MASKED_URI"
echo ""

# Test the connection
echo -e "${BLUE}🧪 Testing MongoDB Atlas connection...${NC}"
echo ""

cd "/Users/avishekchandradas/Desktop/MetroUni/backend"

# Test connection
node -e "
require('dotenv').config({path: '.env.production'});
const mongoose = require('mongoose');

console.log('🔗 Testing connection...');
console.log('Cluster:', process.env.MONGODB_URI.split('@')[1].split('/')[0]);

mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000
})
.then(() => {
    console.log('✅ MongoDB Atlas connection successful!');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🏢 Host:', mongoose.connection.host);
    console.log('');
    console.log('🎉 Your MetroUni platform is ready for Atlas!');
    process.exit(0);
})
.catch(err => {
    console.error('❌ Connection failed:', err.message);
    console.log('');
    console.log('Common solutions:');
    console.log('• Check if cluster is fully ready (wait 2-3 minutes)');
    console.log('• Verify username and password are correct');
    console.log('• Ensure IP is whitelisted in Network Access');
    console.log('• Confirm cluster name matches your Atlas cluster');
    process.exit(1);
});

setTimeout(() => {
    console.error('❌ Connection timeout');
    process.exit(1);
}, 15000);
"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎯 Connection successful! Ready for deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Seed production database: cd backend && NODE_ENV=production node scripts/seed-mongodb.js"
    echo "2. Build Docker image: docker build -t metrouni:latest ."
    echo "3. Deploy to production: ./deploy-mongo-production.sh"
    echo ""
    echo -e "${BLUE}Admin credentials:${NC}"
    echo "   Email: admin@avishekchandradas.me"
    echo "   Password: SecureAdmin2024!"
else
    echo ""
    echo -e "${YELLOW}⚠️  Connection failed. Please check your credentials and cluster status.${NC}"
    echo ""
    echo "You can run this script again: ./fix-atlas-credentials.sh"
fi
