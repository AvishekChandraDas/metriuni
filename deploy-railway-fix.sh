#!/bin/bash

echo "🚂 Railway Deployment Script for MetroUni"
echo "========================================="

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

echo "🔐 Logging into Railway..."
railway login

echo "🚀 Initializing Railway project..."
railway init

echo "⚙️ Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set MONGODB_URI="mongodb+srv://metrouni_admin:bangladeshzindabad@metrouni-cluster.dtqxnr1.mongodb.net/metriuni?retryWrites=true&w=majority&appName=metrouni-cluster"
railway variables set JWT_SECRET="production-super-secure-jwt-secret-key-2024-metrouni-platform"
railway variables set JWT_EXPIRES_IN="7d"
railway variables set UPLOAD_MAX_SIZE="10485760"
railway variables set RATE_LIMIT_WINDOW_MS="900000"
railway variables set RATE_LIMIT_MAX_REQUESTS="100"
railway variables set PORT="3001"

echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment completed!"
echo "📱 Your MetroUni platform should be live in 2-3 minutes"
echo "🌐 Check your Railway dashboard for the live URL"
echo "🔧 Health check available at: /api/health"
