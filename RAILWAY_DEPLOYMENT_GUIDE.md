# 🚂 MetroUni Railway Deployment Guide

## 🎉 SUCCESS! GitHub Push Completed!

Your MetroUni platform has been successfully pushed to GitHub and is ready for Railway deployment!

**✅ GitHub Repository:** https://github.com/AvishekChandraDas/metriuni

---

## 🚀 NEXT STEP: Deploy on Railway

### Step 1: Access Railway

1. Go to **https://railway.app**
2. Sign up/Login with your **GitHub account**
3. Click **"New Project"**

### Step 2: Deploy from GitHub

1. Choose **"Deploy from GitHub repo"**
2. Select your **"metriuni"** repository
3. Railway will automatically detect it's a Node.js app
4. Click **"Deploy Now"**

### Step 3: Add Environment Variables

In Railway dashboard, go to **Variables** tab and add these:

NODE_ENV=production
MONGODB_URI=mongodb+srv://metrouni_admin:bangladeshzindabad@metrouni-cluster.dtqxnr1.mongodb.net/metriuni?retryWrites=true&w=majority&appName=metrouni-cluster
JWT_SECRET=production-super-secure-jwt-secret-key-2024-metrouni-platform
JWT_EXPIRES_IN=7d
UPLOAD_MAX_SIZE=10485760
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

4️⃣ DEPLOY
→ Railway automatically deploys when you connect GitHub
→ Your app will be live in 3-5 minutes!

🌐 YOUR URLS AFTER DEPLOYMENT:
→ https://metrouni-production.up.railway.app
→ Admin: https://metrouni-production.up.railway.app/admin

🔐 ADMIN CREDENTIALS:
📧 Email: admin@avishekchandradas.me
🔑 Password: SecureAdmin2024!

🚀 ALTERNATIVE: CLI DEPLOYMENT
If you prefer CLI, run these commands:

# Login to Railway

railway login

# Initialize project

railway init

# Set environment variables

railway variables set NODE_ENV=production
railway variables set MONGODB_URI="mongodb+srv://metrouni_admin:bangladeshzindabad@metrouni-cluster.dtqxnr1.mongodb.net/metriuni?retryWrites=true&w=majority&appName=metrouni-cluster"
railway variables set JWT_SECRET="production-super-secure-jwt-secret-key-2024-metrouni-platform"

# Deploy

railway up

📋 GITHUB SETUP (If needed):
git init
git add .
git commit -m "MetroUni ready for Railway deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/metriuni.git
git push -u origin main

Then connect this GitHub repo to Railway!

🎉 YOUR METROUNIVERSITY WILL BE LIVE IN MINUTES!

Railway is perfect for your platform:
✅ Free $5/month credit (500+ hours)
✅ Automatic SSL certificates  
✅ MongoDB Atlas integration
✅ Custom domain support
✅ Zero configuration needed
