# 🍃 MongoDB Atlas Setup Guide

Since local MongoDB is not installed, let's use MongoDB Atlas (cloud database) which is perfect for production deployment.

## Quick Setup:

1. **Go to MongoDB Atlas**: https://www.mongodb.com/atlas
2. **Sign up/Login** with your email
3. **Create a new project**: "MetroUni"
4. **Create a free cluster** (M0 Sandbox - Free forever)
5. **Choose region**: Select closest to your location
6. **Create cluster**: Wait 1-3 minutes for provisioning

## Database Configuration:

1. **Database Access**:

   - Click "Database Access" in left sidebar
   - Click "Add New Database User"
   - Username: `metriuni_user`
   - Password: `MetroUni2024!` (or generate secure password)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

2. **Network Access**:

   - Click "Network Access" in left sidebar
   - Click "Add IP Address"
   - Select "Allow access from anywhere" (0.0.0.0/0)
   - Click "Confirm"

3. **Get Connection String**:
   - Go to "Clusters" → Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - It will look like: `mongodb+srv://metriuni_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

## Update Environment Variables:

Replace your MONGODB_URI in .env with the Atlas connection string:

```bash
MONGODB_URI=mongodb+srv://metriuni_user:MetroUni2024!@cluster0.xxxxx.mongodb.net/metriuni?retryWrites=true&w=majority
```

## Alternative: Use MongoDB Compass (GUI)

1. Download MongoDB Compass: https://www.mongodb.com/products/compass
2. Install and open Compass
3. Use the same connection string to connect
4. Create database "metriuni" manually

---

**Would you like me to help you set up MongoDB Atlas, or do you prefer to install MongoDB locally?**

For now, I'll configure the project to work with both Atlas and local MongoDB.
