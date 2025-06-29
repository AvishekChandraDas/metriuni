#!/bin/bash

echo "🚂 Setting Railway Environment Variables"
echo "======================================="

# Login to Railway
railway login

# Set environment variables
echo "Setting NODE_ENV..."
railway variables set NODE_ENV=production

echo "Setting MONGODB_URI..."
railway variables set MONGODB_URI="mongodb+srv://metrouni_admin:bangladeshzindabad@metrouni-cluster.dtqxnr1.mongodb.net/metriuni?retryWrites=true&w=majority&appName=metrouni-cluster"

echo "Setting JWT_SECRET..."
railway variables set JWT_SECRET="production-super-secure-jwt-secret-key-2024-metrouni-platform"

echo "Setting other variables..."
railway variables set JWT_EXPIRES_IN="7d"
railway variables set UPLOAD_MAX_SIZE="10485760"
railway variables set RATE_LIMIT_WINDOW_MS="900000"
railway variables set RATE_LIMIT_MAX_REQUESTS="100"
railway variables set PORT="3001"

echo "✅ All variables set!"
echo "🚀 Railway will automatically redeploy your app"
echo "⏱️ Wait 2-3 minutes for health checks to pass"
