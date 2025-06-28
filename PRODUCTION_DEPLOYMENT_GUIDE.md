# MetroUni Production Deployment Guide

## Overview
This guide walks you through deploying MetroUni to production using MongoDB Atlas and Docker on `metrouni.avishekchandradas.me`.

## Prerequisites
- [x] ✅ Backend migrated to MongoDB (Complete)
- [x] ✅ All models converted to Mongoose (Complete)
- [x] ✅ Admin credentials configured (Complete)
- [ ] 🟡 MongoDB Atlas cluster setup (Required)
- [ ] 🟡 Domain configured and DNS pointing to server (Required)
- [ ] 🟡 SSL certificates obtained (Required)
- [ ] 🟡 Production server with Docker installed (Required)

## Admin Credentials
- **Email**: `admin@avishekchandradas.me`
- **Password**: `SecureAdmin2024!`

## Quick Start Deployment

### Option 1: Automated Setup (Recommended)
```bash
# Run the complete setup script
./setup-mongodb-atlas.sh
```

This script will:
1. Guide you through MongoDB Atlas configuration
2. Test the Atlas connection
3. Seed the production database
4. Build the Docker image
5. Offer deployment options

### Option 2: Manual Step-by-Step

#### Step 1: MongoDB Atlas Setup
1. Go to https://cloud.mongodb.com
2. Create cluster: `metrouni-cluster`
3. Create user: `metrouni_admin` with strong password
4. Configure network access (whitelist your server IP)
5. Get connection string and update `backend/.env.production`

#### Step 2: Test Configuration
```bash
cd backend
# Test Atlas connection
node -e "
require('dotenv').config({path: '.env.production'});
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✅ Connected'))
.catch(err => console.error('❌ Failed:', err.message));
"
```

#### Step 3: Build and Deploy
```bash
# Build Docker image
docker build -t metrouni:latest .

# Test locally
docker run -p 3000:3000 --env-file backend/.env.production metrouni:latest

# Deploy to production
./deploy-mongo-production.sh
```

## Production Files Created

### Configuration Files
- `backend/.env.production` - Production environment variables
- `Dockerfile` - Multi-stage production Docker build
- `docker-compose.prod.yml` - Production Docker Compose (created by deploy script)
- `nginx.conf` - Nginx reverse proxy configuration

### Scripts
- `setup-mongodb-atlas.sh` - Interactive Atlas setup
- `deploy-mongo-production.sh` - Complete production deployment
- `backend/scripts/seed-mongodb.js` - Database seeding

### Documentation
- `MONGODB_ATLAS_SETUP.md` - Detailed Atlas setup guide
- `atlas-config-info.txt` - Configuration summary (created after setup)
- `deployment-info.txt` - Deployment details (created after deploy)

## Deployment Architecture

```
Internet → Nginx (Port 80/443) → Node.js App (Port 3000) → MongoDB Atlas
                ↓
        Static Files (Frontend)
```

### Components
- **Frontend**: React/Vue app served by Nginx
- **Backend**: Node.js API server with MongoDB
- **Database**: MongoDB Atlas (cloud-hosted)
- **Reverse Proxy**: Nginx with SSL termination
- **Container**: Docker with multi-stage build

## Environment Configuration

### Production Environment (`.env.production`)
```bash
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/metriuni
JWT_SECRET=production-jwt-secret
ALLOWED_ORIGINS=https://metrouni.avishekchandradas.me
# ... other production settings
```

### Security Features
- HTTPS enforcement
- CORS configuration
- Rate limiting
- Secure headers
- Non-root Docker user
- Environment-based secrets

## Domain and SSL Setup

### DNS Configuration
Point your domain to your server:
```
Type: A
Name: metrouni
Value: YOUR_SERVER_IP
```

### SSL Certificate (Let's Encrypt)
```bash
# Install certbot
sudo apt update && sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d metrouni.avishekchandradas.me

# Certificate files will be at:
# /etc/letsencrypt/live/metrouni.avishekchandradas.me/fullchain.pem
# /etc/letsencrypt/live/metrouni.avishekchandradas.me/privkey.pem
```

## Monitoring and Maintenance

### Health Checks
- Application: `https://metrouni.avishekchandradas.me/api/health`
- Database: MongoDB Atlas monitoring dashboard
- Server: Docker container logs

### Log Management
```bash
# Application logs
docker logs metrouni-app -f

# Nginx logs
docker logs nginx-container -f

# System logs
tail -f /var/log/metrouni/app.log
```

### Backup Strategy
- **Database**: MongoDB Atlas automatic backups
- **Files**: Regular backup of uploads directory
- **Configuration**: Version control for all config files

## Testing Checklist

### Pre-Deployment Tests
- [ ] Backend starts successfully
- [ ] MongoDB Atlas connection works
- [ ] Admin user can login
- [ ] API endpoints respond correctly
- [ ] Docker image builds without errors

### Post-Deployment Tests
- [ ] Domain resolves correctly
- [ ] HTTPS certificate is valid
- [ ] Health endpoint returns 200
- [ ] Admin dashboard accessible
- [ ] File uploads work
- [ ] Database operations function
- [ ] Performance is acceptable

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check Atlas network access settings
   - Verify username/password
   - Confirm connection string format

2. **Docker Build Failed**
   - Check Node.js version compatibility
   - Verify all dependencies are available
   - Review Dockerfile syntax

3. **SSL Certificate Issues**
   - Confirm domain DNS is propagated
   - Check certificate file permissions
   - Verify Nginx configuration

4. **Application Won't Start**
   - Check environment variables
   - Review application logs
   - Verify port availability

### Support Resources
- MongoDB Atlas documentation
- Docker documentation
- Let's Encrypt documentation
- Application logs and health endpoints

## Security Considerations

### Production Security
- Use strong passwords for all accounts
- Regularly rotate JWT secrets
- Monitor access logs
- Keep dependencies updated
- Use HTTPS everywhere
- Implement proper backup procedures

### Database Security
- Limit database user permissions
- Use connection string encryption
- Enable database auditing
- Regular security updates
- Monitor database access patterns

## Performance Optimization

### Database Performance
- Use appropriate MongoDB indexes
- Monitor query performance
- Implement caching strategies
- Regular database maintenance

### Application Performance
- Enable gzip compression
- Use CDN for static assets
- Implement API rate limiting
- Monitor response times
- Use connection pooling

## Cost Management

### MongoDB Atlas
- Start with free tier (M0)
- Monitor usage and upgrade as needed
- Use data archiving for old data
- Optimize queries to reduce operations

### Server Resources
- Right-size your server
- Use monitoring to track resource usage
- Implement auto-scaling if available
- Regular cleanup of logs and temp files

---

## Quick Reference Commands

```bash
# Setup MongoDB Atlas
./setup-mongodb-atlas.sh

# Full deployment
./deploy-mongo-production.sh

# Test health
curl https://metrouni.avishekchandradas.me/api/health

# View logs
docker logs metrouni-app -f

# Restart application
docker restart metrouni-app

# Update application
docker pull metrouni:latest && docker restart metrouni-app
```

---

**Ready to deploy?** Run `./setup-mongodb-atlas.sh` to get started!
