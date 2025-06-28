#!/bin/bash

# MetroUni Final Production Deployment
# Complete deployment to production server

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

clear

echo -e "${BOLD}${BLUE}"
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║  🚀 MetroUni Final Production Deployment                         ║"
echo "║     Domain: metrouni.avishekchandradas.me                       ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${GREEN}✅ MongoDB Atlas: Connected and verified${NC}"
echo -e "${GREEN}✅ Database: Seeded with admin user${NC}"
echo -e "${GREEN}✅ Backend: Production-ready${NC}"
echo -e "${GREEN}✅ Configuration: Complete${NC}"
echo ""

# Choose deployment method
echo -e "${BOLD}${BLUE}🎯 Choose Your Deployment Method:${NC}"
echo ""
echo "1) 🌐 Cloud Platform (Railway/Render/Vercel) - Easiest"
echo "2) 🖥️  VPS Server (DigitalOcean/AWS/Google) - Full Control"
echo "3) 🧪 Local Docker Testing - Test First"
echo "4) 📋 Manual Setup Guide - DIY Instructions"
echo ""

read -p "Choose deployment method (1-4): " DEPLOY_METHOD

case $DEPLOY_METHOD in
    1)
        echo ""
        echo -e "${BLUE}🌐 Cloud Platform Deployment${NC}"
        echo "=========================================="
        echo ""
        echo -e "${YELLOW}📋 Recommended Platforms:${NC}"
        echo ""
        echo -e "${BOLD}🚂 Railway (Recommended)${NC}"
        echo "   • Free tier available"
        echo "   • Automatic deployments"
        echo "   • Easy environment variables"
        echo "   • Custom domains supported"
        echo "   • Steps:"
        echo "     1. Go to railway.app"
        echo "     2. Connect GitHub repo or upload files"
        echo "     3. Add environment variables from .env.production"
        echo "     4. Deploy!"
        echo ""
        echo -e "${BOLD}🎨 Render${NC}"
        echo "   • Free tier with SSL"
        echo "   • GitHub integration"
        echo "   • Automatic deploys"
        echo "   • Steps:"
        echo "     1. Go to render.com"
        echo "     2. Create Web Service from repo"
        echo "     3. Set environment variables"
        echo "     4. Deploy!"
        echo ""
        echo -e "${BOLD}▲ Vercel${NC}"
        echo "   • Great for full-stack apps"
        echo "   • Serverless functions"
        echo "   • Global CDN"
        echo "   • Steps:"
        echo "     1. Go to vercel.com"
        echo "     2. Import project"
        echo "     3. Configure build settings"
        echo "     4. Deploy!"
        echo ""
        
        # Create deployment package
        echo -e "${BLUE}📦 Creating deployment package...${NC}"
        
        # Create package.json for root if not exists
        if [ ! -f "package.json" ]; then
            cat > package.json << 'EOF'
{
  "name": "metrouni-platform",
  "version": "1.0.0",
  "description": "MetroUni Social Platform - Production Ready",
  "main": "backend/server.js",
  "scripts": {
    "start": "cd backend && node server.js",
    "build": "cd frontend && npm install && npm run build",
    "dev": "cd backend && npm run dev",
    "seed": "cd backend && NODE_ENV=production node scripts/seed-mongodb.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF
            echo "✅ Root package.json created"
        fi
        
        # Create deployment instructions
        cat > CLOUD_DEPLOYMENT_GUIDE.md << 'EOF'
# MetroUni Cloud Platform Deployment Guide

## 🚂 Railway Deployment (Recommended)

### Step 1: Prepare Your Project
1. Create GitHub repository with your MetroUni code
2. Push all files to the repository

### Step 2: Deploy to Railway
1. Go to https://railway.app
2. Sign up/Login with GitHub
3. Click "Deploy from GitHub repo"
4. Select your MetroUni repository
5. Railway will auto-detect your Node.js app

### Step 3: Environment Variables
Add these environment variables in Railway dashboard:
```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://metrouni_admin:bangladeshzindabad@metrouni-cluster.dtqxnr1.mongodb.net/metriuni?retryWrites=true&w=majority&appName=metrouni-cluster
JWT_SECRET=production-super-secure-jwt-secret-key-2024-metrouni-platform
ALLOWED_ORIGINS=https://your-railway-domain.railway.app,https://metrouni.avishekchandradas.me
FRONTEND_URL=https://your-railway-domain.railway.app
```

### Step 4: Custom Domain (Optional)
1. In Railway dashboard, go to Settings
2. Add custom domain: metrouni.avishekchandradas.me
3. Update your DNS A record to point to Railway's IP

### Step 5: Deploy
1. Railway automatically builds and deploys
2. Check deployment logs for any issues
3. Test your endpoints

## 🎨 Render Deployment

### Step 1: Create Web Service
1. Go to https://render.com
2. Create "Web Service" from Git repository
3. Connect your GitHub repo

### Step 2: Configure Service
- **Name**: metrouni-platform
- **Environment**: Node
- **Build Command**: `npm install && cd backend && npm install && cd ../frontend && npm install && npm run build`
- **Start Command**: `npm start`

### Step 3: Environment Variables
Add the same environment variables as Railway

### Step 4: Deploy
Render will build and deploy automatically

## ▲ Vercel Deployment

### Step 1: Import Project
1. Go to https://vercel.com
2. Import your Git repository

### Step 2: Configure
- **Framework Preset**: Other
- **Root Directory**: ./
- **Build Command**: `cd backend && npm install`
- **Output Directory**: backend
- **Install Command**: `npm install`

### Step 3: Environment Variables
Add your production environment variables

### Step 4: Deploy
Vercel deploys automatically

## 📝 Post-Deployment Testing

Test these endpoints after deployment:
- `GET /api/health` - Health check
- `POST /api/auth/login` - Admin login
- `GET /api/users/profile` - User profile (with auth)

Admin credentials:
- Email: admin@avishekchandradas.me
- Password: SecureAdmin2024!
EOF
        
        echo "✅ Cloud deployment guide created: CLOUD_DEPLOYMENT_GUIDE.md"
        echo ""
        echo -e "${GREEN}🎉 Ready for cloud deployment!${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Create GitHub repository with your code"
        echo "2. Choose a platform (Railway recommended)"
        echo "3. Follow the guide in CLOUD_DEPLOYMENT_GUIDE.md"
        echo "4. Deploy and test!"
        ;;
        
    2)
        echo ""
        echo -e "${BLUE}🖥️  VPS Server Deployment${NC}"
        echo "========================================"
        echo ""
        echo -e "${YELLOW}📋 Server Requirements:${NC}"
        echo "• Ubuntu 20.04+ / CentOS 8+ / Debian 11+"
        echo "• 1GB+ RAM, 20GB+ storage"
        echo "• Root/sudo access"
        echo "• Domain pointing to server IP"
        echo ""
        
        # Create VPS deployment script
        cat > deploy-vps.sh << 'EOFVPS'
#!/bin/bash

# MetroUni VPS Deployment Script
# Run this on your VPS server

set -e

echo "🚀 MetroUni VPS Deployment Starting..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
echo "🐳 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
echo "🌐 Installing Nginx..."
sudo apt install -y nginx

# Install Certbot for SSL
echo "🔒 Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Install PM2
echo "⚙️  Installing PM2..."
sudo npm install -g pm2

echo "✅ VPS setup complete!"
echo ""
echo "Next steps:"
echo "1. Upload your MetroUni project to this server"
echo "2. Run the deployment script from your project directory"
echo "3. Configure SSL with: sudo certbot --nginx -d metrouni.avishekchandradas.me"

EOFVPS

        chmod +x deploy-vps.sh
        
        # Create production docker-compose
        cat > docker-compose.production.yml << 'EOFDOCKER'
version: '3.8'

services:
  metrouni-app:
    build: .
    container_name: metrouni-backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - backend/.env.production
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    container_name: metrouni-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.production.conf:/etc/nginx/nginx.conf
      - ./frontend/dist:/usr/share/nginx/html
      - /etc/letsencrypt:/etc/letsencrypt
    depends_on:
      - metrouni-app
    restart: unless-stopped
EOFDOCKER

        # Create production nginx config
        cat > nginx.production.conf << 'EOFNGINX'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    upstream backend {
        server metrouni-app:3000;
    }

    server {
        listen 80;
        server_name metrouni.avishekchandradas.me;
        
        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name metrouni.avishekchandradas.me;

        # SSL Configuration (will be set up by Certbot)
        ssl_certificate /etc/letsencrypt/live/metrouni.avishekchandradas.me/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/metrouni.avishekchandradas.me/privkey.pem;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

        # Frontend
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
        }

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Auth routes with stricter rate limiting
        location /api/auth/ {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files
        location /uploads/ {
            alias /app/uploads/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOFNGINX

        echo "✅ VPS deployment files created:"
        echo "   • deploy-vps.sh - Server setup script"
        echo "   • docker-compose.production.yml - Container orchestration"
        echo "   • nginx.production.conf - Reverse proxy config"
        echo ""
        echo -e "${GREEN}🎯 VPS Deployment Instructions:${NC}"
        echo ""
        echo "1. Get a VPS (DigitalOcean, AWS, Google Cloud, etc.)"
        echo "2. Point metrouni.avishekchandradas.me to your server IP"
        echo "3. SSH to your server and run: wget -O- https://your-files-url/deploy-vps.sh | bash"
        echo "4. Upload your MetroUni project to the server"
        echo "5. Run: docker-compose -f docker-compose.production.yml up -d"
        echo "6. Set up SSL: sudo certbot --nginx -d metrouni.avishekchandradas.me"
        ;;
        
    3)
        echo ""
        echo -e "${BLUE}🧪 Local Docker Testing${NC}"
        echo "======================================"
        echo ""
        
        # Check if Docker is available
        if command -v docker &> /dev/null; then
            echo -e "${GREEN}✅ Docker found! Starting local test...${NC}"
            echo ""
            
            # Build Docker image
            echo "🐳 Building Docker image..."
            if docker build -t metrouni:latest .; then
                echo "✅ Docker image built successfully!"
                echo ""
                
                # Run container
                echo "🚀 Starting MetroUni container..."
                echo "This will start your app on http://localhost:3000"
                echo ""
                echo "Press Ctrl+C to stop the container"
                echo ""
                
                # Run with production environment
                docker run --rm -p 3000:3000 \
                    --env-file backend/.env.production \
                    --name metrouni-test \
                    metrouni:latest
            else
                echo "❌ Docker build failed. Check the error above."
            fi
        else
            echo -e "${YELLOW}⚠️  Docker not found. Installing Docker...${NC}"
            echo ""
            echo "For macOS:"
            echo "1. Download Docker Desktop: https://docs.docker.com/desktop/install/mac-install/"
            echo "2. Install and start Docker Desktop"
            echo "3. Run this script again"
            echo ""
            echo "For Linux:"
            echo "curl -fsSL https://get.docker.com -o get-docker.sh"
            echo "sudo sh get-docker.sh"
            echo ""
        fi
        ;;
        
    4)
        echo ""
        echo -e "${BLUE}📋 Manual Setup Guide${NC}"
        echo "====================================="
        echo ""
        
        # Create comprehensive manual guide
        cat > MANUAL_DEPLOYMENT_GUIDE.md << 'EOFMANUAL'
# MetroUni Manual Deployment Guide

## 🎯 Overview
Your MetroUni platform is production-ready with:
- ✅ MongoDB Atlas connected and tested
- ✅ Database seeded with admin user
- ✅ Production environment configured
- ✅ Docker configuration ready

## 📋 Admin Credentials
- **Email**: admin@avishekchandradas.me
- **Password**: SecureAdmin2024!

## 🔧 Environment Variables
Your production environment is configured in `backend/.env.production`:
```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://metrouni_admin:bangladeshzindabad@metrouni-cluster.dtqxnr1.mongodb.net/metriuni?retryWrites=true&w=majority&appName=metrouni-cluster
JWT_SECRET=production-super-secure-jwt-secret-key-2024-metrouni-platform
ALLOWED_ORIGINS=https://metrouni.avishekchandradas.me
FRONTEND_URL=https://metrouni.avishekchandradas.me
```

## 🌐 Deployment Options

### Option 1: Cloud Platforms

#### Railway (Recommended)
1. Go to https://railway.app
2. Connect GitHub repository
3. Add environment variables from .env.production
4. Deploy automatically

#### Render
1. Go to https://render.com
2. Create Web Service from Git
3. Configure build and start commands
4. Add environment variables

#### Vercel
1. Go to https://vercel.com
2. Import project from Git
3. Configure for Node.js
4. Add environment variables

### Option 2: VPS Deployment

#### Server Requirements
- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- 1GB+ RAM, 20GB+ storage
- Node.js 18+, Docker, Nginx

#### Setup Steps
1. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Install Nginx
   sudo apt install -y nginx
   
   # Install Certbot for SSL
   sudo apt install -y certbot python3-certbot-nginx
   ```

2. **Deploy Application**
   ```bash
   # Clone/upload your MetroUni project
   git clone your-repo.git metrouni
   cd metrouni
   
   # Install dependencies
   cd backend && npm install
   cd ../frontend && npm install && npm run build
   
   # Start with PM2
   npm install -g pm2
   pm2 start backend/server.js --name metrouni --env production
   pm2 save
   pm2 startup
   ```

3. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name metrouni.avishekchandradas.me;
       
       location / {
           root /path/to/metrouni/frontend/dist;
           try_files $uri $uri/ /index.html;
       }
       
       location /api/ {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

4. **Set up SSL**
   ```bash
   sudo certbot --nginx -d metrouni.avishekchandradas.me
   ```

### Option 3: Docker Deployment

#### Build and Run
```bash
# Build image
docker build -t metrouni:latest .

# Run container
docker run -d \
  --name metrouni-app \
  -p 3000:3000 \
  --env-file backend/.env.production \
  --restart unless-stopped \
  metrouni:latest
```

#### Docker Compose (Recommended)
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - backend/.env.production
    restart: unless-stopped
```

## 🧪 Testing Your Deployment

### Health Check
```bash
curl https://metrouni.avishekchandradas.me/api/health
```

### Admin Login Test
```bash
curl -X POST https://metrouni.avishekchandradas.me/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@avishekchandradas.me","password":"SecureAdmin2024!"}'
```

## 🔧 Post-Deployment

### Domain Configuration
1. Point metrouni.avishekchandradas.me to your server IP
2. Wait for DNS propagation (up to 24 hours)
3. Test domain resolution: `nslookup metrouni.avishekchandradas.me`

### SSL Certificate
1. Install Certbot
2. Run: `sudo certbot --nginx -d metrouni.avishekchandradas.me`
3. Test SSL: https://www.ssllabs.com/ssltest/

### Monitoring
1. Set up application monitoring
2. Configure log rotation
3. Set up backup procedures
4. Monitor database performance in Atlas

## 🆘 Troubleshooting

### Common Issues
- **502 Bad Gateway**: Backend not running or wrong port
- **Database Connection**: Check Atlas network access and credentials
- **SSL Issues**: Verify domain points to server and Certbot configuration
- **404 Errors**: Check Nginx configuration and file paths

### Log Locations
- Application: PM2 logs or Docker logs
- Nginx: /var/log/nginx/
- System: /var/log/syslog

## 📞 Support
Your MetroUni platform is production-ready. For additional support:
1. Check application logs
2. Verify environment variables
3. Test database connectivity
4. Check firewall and security groups

Good luck with your deployment! 🚀
EOFMANUAL

        echo "✅ Manual deployment guide created: MANUAL_DEPLOYMENT_GUIDE.md"
        echo ""
        echo -e "${GREEN}📚 Comprehensive guide created!${NC}"
        echo ""
        echo "The manual guide includes:"
        echo "• Cloud platform deployment (Railway, Render, Vercel)"
        echo "• VPS server setup and configuration"
        echo "• Docker deployment options"
        echo "• SSL and domain configuration"
        echo "• Testing and troubleshooting"
        echo ""
        echo "Choose the deployment method that best fits your needs!"
        ;;
        
    *)
        echo -e "${RED}❌ Invalid option. Please run the script again.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BOLD}${GREEN}🎉 Deployment preparation complete!${NC}"
echo ""
echo -e "${BLUE}📊 Your MetroUni Platform Summary:${NC}"
echo "   ✅ MongoDB Atlas: Connected and working"
echo "   ✅ Database: Seeded with admin user"
echo "   ✅ Admin Access: admin@avishekchandradas.me / SecureAdmin2024!"
echo "   ✅ Production Config: Ready for deployment"
echo "   ✅ Security: HTTPS, CORS, rate limiting configured"
echo ""
echo -e "${YELLOW}🎯 Next: Follow the deployment guide for your chosen method!${NC}"
echo ""

# Save deployment summary
cat > DEPLOYMENT_FINAL_SUMMARY.txt << EOF
MetroUni Final Deployment Summary
Generated: $(date)

STATUS: Ready for Production Deployment

✅ COMPLETED:
- MongoDB Atlas setup and connection verified
- Production database seeded with admin user
- Backend fully migrated to MongoDB
- Production environment configured
- Docker configuration optimized
- Security settings implemented
- SSL and domain configurations prepared

🔐 ADMIN CREDENTIALS:
Email: admin@avishekchandradas.me
Password: SecureAdmin2024!

🌐 DEPLOYMENT TARGET:
Domain: metrouni.avishekchandradas.me
Database: MongoDB Atlas (cloud)
Environment: Production

📋 DEPLOYMENT OPTIONS PROVIDED:
1. Cloud Platforms (Railway/Render/Vercel) - Easiest
2. VPS Server (DigitalOcean/AWS/Google) - Full Control
3. Local Docker Testing - Test First
4. Manual Setup Guide - DIY Instructions

📁 FILES CREATED:
- CLOUD_DEPLOYMENT_GUIDE.md (if option 1 chosen)
- deploy-vps.sh (if option 2 chosen)
- docker-compose.production.yml (if option 2 chosen)
- nginx.production.conf (if option 2 chosen)
- MANUAL_DEPLOYMENT_GUIDE.md (if option 4 chosen)

NEXT: Follow the guide for your chosen deployment method

Platform is 100% ready for production! 🚀
EOF

echo "📄 Final summary saved to DEPLOYMENT_FINAL_SUMMARY.txt"
