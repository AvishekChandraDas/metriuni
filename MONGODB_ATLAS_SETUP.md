# MongoDB Atlas Setup Guide for MetroUni

## Prerequisites

- MongoDB Atlas account (free tier available)
- Production server with internet access
- Domain configured (metrouni.avishekchandradas.me)

## Step 1: Create MongoDB Atlas Cluster

1. **Sign up/Login to MongoDB Atlas**

   - Go to https://cloud.mongodb.com
   - Create account or sign in

2. **Create a New Cluster**

   - Click "Create a New Cluster"
   - Choose "Shared" (Free tier) or "Dedicated" (Paid)
   - Select your preferred cloud provider and region
   - Cluster name: `metrouni-cluster`

3. **Configure Cluster Settings**
   - MongoDB Version: 6.0 or later
   - Cluster Tier: M0 (Free) or higher based on needs
   - Storage: Auto-scaling enabled (recommended)

## Step 2: Database Security

1. **Create Database User**

   - Go to "Database Access" in the left menu
   - Click "Add New Database User"
   - Username: `metrouni_admin`
   - Password: Generate strong password (save it securely)
   - Database User Privileges: "Read and write to any database"

2. **Configure Network Access**
   - Go to "Network Access" in the left menu
   - Click "Add IP Address"
   - For testing: Add "0.0.0.0/0" (Allow access from anywhere)
   - For production: Add your server's specific IP address
   - Comment: "MetroUni Production Server"

## Step 3: Get Connection String

1. **Get Connection String**

   - Go to "Clusters" in the left menu
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Driver: Node.js, Version: 4.1 or later
   - Copy the connection string

2. **Connection String Format**

   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   ```

3. **Example Connection String**
   ```
   mongodb+srv://metrouni_admin:YourStrongPassword@metrouni-cluster.mongodb.net/metriuni?retryWrites=true&w=majority
   ```

## Step 4: Update Production Environment

1. **Edit backend/.env.production**

   ```bash
   # Replace the MONGODB_URI with your actual connection string
   MONGODB_URI=mongodb+srv://metrouni_admin:YourActualPassword@metrouni-cluster.mongodb.net/metriuni?retryWrites=true&w=majority
   ```

2. **Important Notes**
   - Replace `YourActualPassword` with the actual password
   - The database name `metriuni` will be created automatically
   - Keep the `?retryWrites=true&w=majority` parameters

## Step 5: Test Connection

1. **Test Locally First**
   ```bash
   cd backend
   cp .env.production .env.test
   node -e "
   require('dotenv').config({path: '.env.test'});
   const mongoose = require('mongoose');
   mongoose.connect(process.env.MONGODB_URI)
   .then(() => {
     console.log('✅ MongoDB Atlas connection successful!');
     process.exit(0);
   })
   .catch(err => {
     console.error('❌ MongoDB Atlas connection failed:', err.message);
     process.exit(1);
   });
   "
   ```

## Step 6: Production Deployment

1. **Run the deployment script**

   ```bash
   chmod +x deploy-mongo-production.sh
   ./deploy-mongo-production.sh
   ```

2. **Monitor the deployment**
   - Check application logs for connection status
   - Verify health endpoint: `http://your-domain/api/health`
   - Test admin login functionality

## Step 7: Database Monitoring

1. **Atlas Monitoring**

   - Go to "Metrics" in your cluster
   - Monitor connection count, operations, and performance
   - Set up alerts for critical metrics

2. **Application Monitoring**
   - Check application logs for database errors
   - Monitor response times and error rates

## Security Best Practices

1. **Network Security**

   - Use specific IP addresses instead of 0.0.0.0/0
   - Enable VPC Peering for enhanced security
   - Use private endpoints when possible

2. **Database Security**

   - Rotate database passwords regularly
   - Use strong, unique passwords
   - Enable database auditing
   - Limit user privileges to minimum required

3. **Connection Security**
   - Always use TLS/SSL connections
   - Store connection strings securely
   - Use environment variables, never hardcode credentials

## Backup and Recovery

1. **Automatic Backups**

   - Atlas provides continuous backups
   - Configure backup retention policies
   - Test restore procedures regularly

2. **Point-in-Time Recovery**
   - Available for M10+ clusters
   - Allows recovery to any point in time
   - Configure based on your RTO/RPO requirements

## Cost Optimization

1. **Free Tier Limits**

   - 512 MB storage
   - Shared RAM and CPU
   - No backup retention

2. **Scaling Considerations**
   - Monitor storage usage
   - Upgrade to paid tiers for better performance
   - Consider data archiving strategies

## Troubleshooting

### Common Issues

1. **Connection Timeout**

   - Check network access settings
   - Verify IP address whitelist
   - Check firewall rules

2. **Authentication Failed**

   - Verify username and password
   - Check database user permissions
   - Ensure connection string format is correct

3. **DNS Resolution Issues**
   - Check internet connectivity
   - Verify DNS settings
   - Try alternative connection methods

### Support Resources

1. **MongoDB Atlas Documentation**

   - https://docs.atlas.mongodb.com/

2. **Community Support**

   - MongoDB Community Forums
   - Stack Overflow
   - Discord/Slack communities

3. **Professional Support**
   - MongoDB Atlas Support (paid plans)
   - MongoDB Professional Services

## Production Checklist

- [ ] MongoDB Atlas cluster created and configured
- [ ] Database user created with appropriate permissions
- [ ] Network access configured for production server
- [ ] Connection string obtained and tested
- [ ] Production environment file updated
- [ ] Local connection test successful
- [ ] Deployment script executed
- [ ] Health checks passing
- [ ] Admin user can login
- [ ] Monitoring and alerting configured
- [ ] Backup strategy implemented
- [ ] Security best practices applied
