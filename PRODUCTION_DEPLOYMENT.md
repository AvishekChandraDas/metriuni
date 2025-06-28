# 🚀 MetroUni Production Deployment Guide

This guide covers deploying MetroUni to production using Docker, Docker Compose, or manual deployment methods.

## 📋 Prerequisites

- Node.js 18+ (for manual deployment)
- PostgreSQL 15+ (for manual deployment)
- Docker & Docker Compose (for containerized deployment)
- SSL Certificate (recommended for production)
- Domain name (recommended)

## 🔧 Pre-Deployment Checklist

### 1. Environment Configuration

#### For Docker Deployment:

```bash
# Copy and configure environment variables
cp .env.prod.template .env.prod

# Edit .env.prod and set secure values:
# - DB_PASSWORD: Strong database password
# - JWT_SECRET: Secure random string (use: openssl rand -base64 64)
# - CORS_ORIGIN: Your production domain
```

#### For Manual Deployment:

```bash
# Backend environment
cp backend/.env.production.template backend/.env.production

# Frontend environment
cp frontend/.env.template frontend/.env.production
```

### 2. Security Setup

Generate secure secrets:

```bash
# JWT Secret
openssl rand -base64 64

# VAPID Keys (for push notifications)
npx web-push generate-vapid-keys
```

### 3. Database Setup

For Docker deployment, the database will be automatically configured.
For manual deployment, ensure PostgreSQL is running and create the database:

```sql
CREATE DATABASE metrouni;
CREATE USER metrouni WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE metrouni TO metrouni;
```

## 🐳 Docker Deployment (Recommended)

### Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd MetroUni

# 2. Configure environment
cp .env.prod.template .env.prod
# Edit .env.prod with your secure values

# 3. Build and start services
docker-compose -f docker-compose.prod.yml up -d

# 4. Check status
docker-compose -f docker-compose.prod.yml ps

# 5. View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Services

- **Frontend**: http://localhost (port 80)
- **Backend API**: http://localhost:3000
- **Database**: localhost:5432
- **Redis**: localhost:6379

### Scaling

```bash
# Scale backend instances
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Update services
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Manual Deployment

### Backend Deployment

```bash
cd backend

# 1. Install dependencies
npm ci --only=production

# 2. Configure environment
cp .env.production.template .env.production
# Edit .env.production with your values

# 3. Run database migrations
npm run db:migrate

# 4. Start the server
npm run prod
```

### Frontend Deployment

```bash
cd frontend

# 1. Install dependencies
npm ci

# 2. Configure environment
cp .env.template .env.production
# Edit with your API URL

# 3. Build for production
npm run build

# 4. Serve the build (using serve, nginx, or apache)
npx serve -s dist -l 80
```

## 🌐 Web Server Configuration

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket Proxy
    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Static Files
    location /uploads/ {
        proxy_pass http://localhost:3000/uploads/;
    }
}
```

### SSL Configuration (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring & Health Checks

### Health Endpoints

- **Application Health**: `GET /health`
- **API Health**: `GET /api/health`
- **Readiness**: `GET /ready`
- **Liveness**: `GET /live`

### Monitoring Setup

```bash
# Check application status
curl http://localhost/health

# Backend health check
curl http://localhost:3000/health

# Database connectivity
docker-compose -f docker-compose.prod.yml exec postgres pg_isready
```

## 🔒 Security Considerations

### Environment Variables

- Use strong, unique passwords
- Generate secure JWT secrets
- Set appropriate CORS origins
- Use environment-specific configurations

### Network Security

- Use HTTPS in production
- Configure proper firewall rules
- Use private networks for database connections
- Implement rate limiting (already configured)

### File Security

- Validate file uploads (already implemented)
- Set proper file permissions
- Use cloud storage for production (S3/Cloudinary)

## 🚀 Performance Optimization

### Database

- Connection pooling (configured)
- Proper indexing (in migrations)
- Regular backups

### Caching

- Redis for session storage
- Static file caching with nginx
- API response caching

### Application

- Gzip compression (enabled)
- Asset optimization
- CDN for static files (recommended)

## 📈 Scaling

### Horizontal Scaling

```bash
# Scale backend instances
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Load balancer configuration needed
```

### Database Scaling

- Read replicas
- Connection pooling
- Database sharding (for large datasets)

## 🔄 Backup & Recovery

### Database Backup

```bash
# Docker environment
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U metrouni metrouni > backup.sql

# Restore
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U metrouni metrouni < backup.sql
```

### File Backup

```bash
# Backup uploads
tar -czf uploads-backup.tar.gz uploads/

# For Docker volumes
docker run --rm -v metrouni_uploads_data:/uploads -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz -C /uploads .
```

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Error**

   ```bash
   # Check database status
   docker-compose -f docker-compose.prod.yml logs postgres

   # Check connection
   docker-compose -f docker-compose.prod.yml exec backend npm run db:migrate
   ```

2. **File Upload Issues**

   ```bash
   # Check permissions
   docker-compose -f docker-compose.prod.yml exec backend ls -la uploads/

   # Fix permissions
   docker-compose -f docker-compose.prod.yml exec backend chown -R node:node uploads/
   ```

3. **Memory Issues**

   ```bash
   # Check memory usage
   docker stats

   # Increase memory limits in docker-compose.prod.yml
   ```

### Logs

```bash
# Application logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Database logs
docker-compose -f docker-compose.prod.yml logs -f postgres

# All services
docker-compose -f docker-compose.prod.yml logs -f
```

## 📞 Support

For production deployment support:

- Check the troubleshooting section
- Review application logs
- Verify environment configuration
- Test health endpoints

## 🔄 Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and update
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Run any new migrations
docker-compose -f docker-compose.prod.yml exec backend npm run db:migrate
```
