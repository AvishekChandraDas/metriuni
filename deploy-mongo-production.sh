#!/bin/bash

# MetroUni Production Deployment Script
# Deploy to metrouni.avishekchandradas.me with MongoDB Atlas

set -e

echo "🚀 MetroUni Production Deployment"
echo "================================================"

# Configuration
DOMAIN="metrouni.avishekchandradas.me"
PROJECT_DIR="/Users/avishekchandradas/Desktop/MetroUni"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "   Domain: $DOMAIN"
echo "   Project: $PROJECT_DIR"
echo "   Backend: $BACKEND_DIR"
echo "   Frontend: $FRONTEND_DIR"
echo ""

# Function to print status
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

# Step 1: MongoDB Atlas Setup
print_status "🗄️  Step 1: MongoDB Atlas Setup"

if ! grep -q "mongodb+srv" "$BACKEND_DIR/.env.production" 2>/dev/null; then
    print_warning "MongoDB Atlas URI not configured!"
    echo ""
    echo -e "${YELLOW}📝 Please complete these steps:${NC}"
    echo "   1. Go to https://cloud.mongodb.com"
    echo "   2. Create a new cluster (or use existing)"
    echo "   3. Create a database user with read/write permissions"
    echo "   4. Whitelist your server IP address (or use 0.0.0.0/0 for testing)"
    echo "   5. Get the connection string and update MONGODB_URI in backend/.env.production"
    echo ""
    echo -e "${BLUE}Example connection string:${NC}"
    echo "   mongodb+srv://username:password@cluster.mongodb.net/metriuni?retryWrites=true&w=majority"
    echo ""
    read -p "Press Enter when you've updated the MongoDB Atlas URI..."
fi

# Step 2: Check Prerequisites
print_status "🔍 Step 2: Checking Prerequisites"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker found: $DOCKER_VERSION"
else
    print_error "Docker not found. Please install Docker first."
    exit 1
fi

# Check if domain resolves
print_status "🌐 Testing domain resolution..."
if nslookup $DOMAIN > /dev/null 2>&1; then
    print_success "Domain $DOMAIN resolves"
else
    print_warning "Domain $DOMAIN not configured or not resolving"
    echo "   You may need to configure your DNS settings"
fi

# Step 3: Build and Test Backend
print_status "🏗️  Step 3: Building Backend"

cd "$BACKEND_DIR"

# Install dependencies
print_status "Installing backend dependencies..."
npm install
print_success "Backend dependencies installed"

# Run backend tests with production environment
print_status "Testing backend with production environment..."
cp .env.production .env.test
NODE_ENV=test npm test 2>/dev/null || {
    print_warning "Backend tests not configured or failed"
    echo "   Continuing with deployment..."
}

# Step 4: Build Frontend
print_status "🎨 Step 4: Building Frontend"

cd "$FRONTEND_DIR"

# Install dependencies
print_status "Installing frontend dependencies..."
npm install
print_success "Frontend dependencies installed"

# Build for production
print_status "Building frontend for production..."
npm run build
print_success "Frontend built successfully"

# Step 5: Docker Setup
print_status "🐳 Step 5: Docker Setup"

cd "$PROJECT_DIR"

# Build Docker image
print_status "Building Docker image..."
docker build -t metrouni:latest .
print_success "Docker image built successfully"

# Step 6: SSL Certificate Setup
print_status "🔒 Step 6: SSL Certificate Setup"

print_warning "SSL Certificate required for HTTPS"
echo ""
echo -e "${YELLOW}📝 SSL Certificate Options:${NC}"
echo "   1. Let's Encrypt (Recommended - Free)"
echo "   2. CloudFlare SSL (If using CloudFlare)"
echo "   3. Custom SSL Certificate"
echo ""
echo -e "${BLUE}For Let's Encrypt:${NC}"
echo "   sudo apt update && sudo apt install certbot"
echo "   sudo certbot certonly --standalone -d $DOMAIN"
echo ""
echo -e "${BLUE}SSL files should be placed at:${NC}"
echo "   Certificate: /etc/ssl/certs/metrouni.crt"
echo "   Private Key: /etc/ssl/private/metrouni.key"
echo ""

# Step 7: Production Deployment
print_status "🚀 Step 7: Production Deployment"

echo "Choose deployment method:"
echo "1) Docker Compose (Recommended)"
echo "2) PM2 Process Manager"
echo "3) Manual Docker Run"
read -p "Enter choice (1-3): " DEPLOY_METHOD

case $DEPLOY_METHOD in
    1)
        print_status "Deploying with Docker Compose..."
        
        # Create production docker-compose
        cat > docker-compose.prod.yml << 'EOF'
version: '3.8'
services:
  metrouni-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - backend/.env.production
    volumes:
      - ./uploads:/app/uploads
      - /var/log/metrouni:/var/log/metrouni
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./frontend/dist:/usr/share/nginx/html
      - /etc/ssl/certs:/etc/ssl/certs
      - /etc/ssl/private:/etc/ssl/private
    depends_on:
      - metrouni-app
    restart: unless-stopped
EOF
        
        docker-compose -f docker-compose.prod.yml up -d
        print_success "Application deployed with Docker Compose"
        ;;
        
    2)
        print_status "Deploying with PM2..."
        
        # Install PM2 globally if not installed
        if ! command -v pm2 &> /dev/null; then
            print_status "Installing PM2..."
            npm install -g pm2
        fi
        
        # Start application with PM2
        cd "$BACKEND_DIR"
        cp .env.production .env
        pm2 start ecosystem.config.js --env production
        pm2 save
        pm2 startup
        
        print_success "Application deployed with PM2"
        ;;
        
    3)
        print_status "Manual Docker deployment..."
        
        # Run Docker container
        docker run -d \
            --name metrouni-app \
            -p 3000:3000 \
            --env-file backend/.env.production \
            -v $(pwd)/uploads:/app/uploads \
            -v /var/log/metrouni:/var/log/metrouni \
            --restart unless-stopped \
            metrouni:latest
            
        print_success "Application deployed with Docker"
        ;;
esac

# Step 8: Database Seeding
print_status "🌱 Step 8: Database Seeding"

print_status "Seeding production database..."
cd "$BACKEND_DIR"
NODE_ENV=production node scripts/seed-mongodb.js
print_success "Database seeded successfully"

# Step 9: Health Check
print_status "🏥 Step 9: Health Check"

print_status "Waiting for application to start..."
sleep 10

# Test health endpoint
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_success "Health check passed - Application is running!"
else
    print_warning "Health check failed - Check application logs"
fi

# Step 10: Final Setup Instructions
print_status "📋 Step 10: Final Setup"

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "   1. Configure your domain's DNS to point to your server"
echo "   2. Set up SSL certificates (Let's Encrypt recommended)"
echo "   3. Update firewall rules to allow ports 80 and 443"
echo "   4. Set up monitoring and backup procedures"
echo ""
echo -e "${BLUE}📊 Application URLs:${NC}"
echo "   Backend API: http://$DOMAIN/api"
echo "   Health Check: http://$DOMAIN/api/health"
echo "   Admin Login: admin@avishekchandradas.me / SecureAdmin2024!"
echo ""
echo -e "${BLUE}🔧 Management Commands:${NC}"
if [ "$DEPLOY_METHOD" = "1" ]; then
    echo "   View logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "   Restart: docker-compose -f docker-compose.prod.yml restart"
    echo "   Stop: docker-compose -f docker-compose.prod.yml down"
elif [ "$DEPLOY_METHOD" = "2" ]; then
    echo "   View logs: pm2 logs metrouni"
    echo "   Restart: pm2 restart metrouni"
    echo "   Stop: pm2 stop metrouni"
else
    echo "   View logs: docker logs metrouni-app -f"
    echo "   Restart: docker restart metrouni-app"
    echo "   Stop: docker stop metrouni-app"
fi
echo ""

print_success "Deployment script completed successfully!"

# Save deployment info
cat > deployment-info.txt << EOF
MetroUni Deployment Information
Generated: $(date)

Domain: $DOMAIN
Deployment Method: $DEPLOY_METHOD
Backend Port: 3000
Admin Email: admin@avishekchandradas.me
Admin Password: SecureAdmin2024!

MongoDB Atlas: Check backend/.env.production for connection string
SSL Certificates: /etc/ssl/certs/metrouni.crt and /etc/ssl/private/metrouni.key

Health Check: http://$DOMAIN/api/health
API Documentation: http://$DOMAIN/api/docs (if implemented)
EOF

print_success "Deployment information saved to deployment-info.txt"
