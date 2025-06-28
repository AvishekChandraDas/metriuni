#!/bin/bash

# MetroUni Production Deployment Script
# Deploy to metrouni.avishekchandradas.me with MongoDB Atlas

echo "🚀 Starting MetroUni Production Deployment"
echo "================================================"

# Configuration
DOMAIN="metrouni.avishekchandradas.me"
PROJECT_DIR="/Users/avishekchandradas/Desktop/MetroUni"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "📋 Deployment Configuration:"
echo "   Domain: $DOMAIN"
echo "   Project: $PROJECT_DIR"
echo "   Backend: $BACKEND_DIR"
echo "   Frontend: $FRONTEND_DIR"
echo ""

# Step 1: Check Prerequisites
echo "🔍 Step 1: Checking Prerequisites..."

# Check if MongoDB Atlas URI is configured
if grep -q "mongodb+srv" "$BACKEND_DIR/.env" 2>/dev/null; then
    echo "   ✅ MongoDB Atlas URI found"
else
    echo "   ⚠️  MongoDB Atlas URI not configured"
    echo "   📝 You'll need to:"
    echo "      1. Create MongoDB Atlas cluster"
    echo "      2. Update MONGODB_URI in .env"
fi

# Check if domain is configured
echo "   🌐 Testing domain resolution..."
if nslookup $DOMAIN > /dev/null 2>&1; then
    echo "   ✅ Domain $DOMAIN resolves"
else
    echo "   ⚠️  Domain $DOMAIN not configured or not resolving"
fi

# Check if we have production environment
if [ -f "$BACKEND_DIR/.env.production" ]; then
    echo "   ✅ Production environment file exists"
else
    echo "   📝 Creating production environment template..."
fi

echo ""

# Step 2: Create Production Environment
echo "🔧 Step 2: Setting up Production Environment..."

cat > "$BACKEND_DIR/.env.production" << EOF
# Production Environment Configuration
NODE_ENV=production

# Server Configuration
PORT=443
HOST=0.0.0.0

# MongoDB Atlas Configuration (UPDATE THESE)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/metriuni

# Security Configuration (UPDATE THESE)
JWT_SECRET=your-super-secure-production-jwt-secret-key-here
JWT_EXPIRES_IN=7d

# CORS Configuration
ALLOWED_ORIGINS=https://$DOMAIN,https://www.$DOMAIN
FRONTEND_URL=https://$DOMAIN

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760
UPLOAD_DIR=/var/www/uploads
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf

# Rate Limiting (Production)
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=1000
AUTH_RATE_LIMIT_MAX=10

# SSL Configuration
SSL_CERT_PATH=/etc/ssl/certs/$DOMAIN.crt
SSL_KEY_PATH=/etc/ssl/private/$DOMAIN.key

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Push Notifications (VAPID keys)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_EMAIL=your-email@gmail.com
EOF

echo "   ✅ Created production environment template"

# Step 3: Create Docker Configuration
echo "🐳 Step 3: Creating Docker Configuration..."

cat > "$PROJECT_DIR/Dockerfile" << EOF
# Multi-stage Docker build for MetroUni

# Backend Stage
FROM node:18-alpine AS backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./
EXPOSE 3000

# Frontend Stage  
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Production Stage
FROM node:18-alpine AS production
WORKDIR /app

# Install backend dependencies
COPY --from=backend /app/backend ./backend
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Create uploads directory
RUN mkdir -p /app/uploads

# Install PM2 for process management
RUN npm install -g pm2

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["pm2-runtime", "start", "backend/ecosystem.config.js"]
EOF

echo "   ✅ Created Dockerfile"

# Step 4: Create PM2 Configuration
echo "⚙️  Step 4: Creating PM2 Configuration..."

cat > "$BACKEND_DIR/ecosystem.config.js" << EOF
module.exports = {
  apps: [{
    name: 'metrouni-backend',
    script: 'server.js',
    cwd: '/app/backend',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: '/app/logs/combined.log',
    out_file: '/app/logs/out.log',
    error_file: '/app/logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    merge_logs: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

echo "   ✅ Created PM2 configuration"

# Step 5: Create Docker Compose
echo "🐙 Step 5: Creating Docker Compose Configuration..."

cat > "$PROJECT_DIR/docker-compose.yml" << EOF
version: '3.8'

services:
  metrouni-app:
    build: .
    container_name: metrouni-production
    restart: unless-stopped
    ports:
      - "80:3000"
      - "443:3000"
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
      - /etc/ssl:/etc/ssl:ro
    environment:
      - NODE_ENV=production
    env_file:
      - ./backend/.env.production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - metrouni-network

  nginx:
    image: nginx:alpine
    container_name: metrouni-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./frontend/dist:/usr/share/nginx/html:ro
      - /etc/ssl:/etc/ssl:ro
    depends_on:
      - metrouni-app
    networks:
      - metrouni-network

networks:
  metrouni-network:
    driver: bridge
EOF

echo "   ✅ Created Docker Compose configuration"

# Step 6: Create Nginx Configuration
echo "🌐 Step 6: Creating Nginx Configuration..."

cat > "$PROJECT_DIR/nginx.conf" << EOF
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=1r/s;

    # Upstream backend
    upstream metrouni_backend {
        server metrouni-app:3000;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name $DOMAIN www.$DOMAIN;
        return 301 https://\$server_name\$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name $DOMAIN www.$DOMAIN;

        # SSL Configuration
        ssl_certificate /etc/ssl/certs/$DOMAIN.crt;
        ssl_certificate_key /etc/ssl/private/$DOMAIN.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

        # Frontend static files
        location / {
            root /usr/share/nginx/html;
            try_files \$uri \$uri/ /index.html;
            
            # Cache static assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://metrouni_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
        }

        # Health check
        location /health {
            proxy_pass http://metrouni_backend;
            access_log off;
        }

        # Auth endpoints with stricter rate limiting
        location /api/auth/ {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://metrouni_backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        # WebSocket support for real-time features
        location /socket.io/ {
            proxy_pass http://metrouni_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
EOF

echo "   ✅ Created Nginx configuration"

echo ""
echo "🎉 Deployment Configuration Complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Set up MongoDB Atlas cluster"
echo "   2. Update MONGODB_URI in .env.production" 
echo "   3. Configure domain DNS"
echo "   4. Obtain SSL certificate"
echo "   5. Run deployment"
echo ""
echo "📁 Created files:"
echo "   • $BACKEND_DIR/.env.production"
echo "   • $PROJECT_DIR/Dockerfile"
echo "   • $BACKEND_DIR/ecosystem.config.js"
echo "   • $PROJECT_DIR/docker-compose.yml"
echo "   • $PROJECT_DIR/nginx.conf"
echo ""
echo "🔐 Admin Credentials:"
echo "   Email: admin@avishekchandradas.me"
echo "   Password: SecureAdmin2024!"
EOF
