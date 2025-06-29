#!/bin/bash

echo "🔧 Setting Railway Environment Variables"
echo "======================================="

# Set all required environment variables for Railway
echo "Setting production environment variables..."

railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set MONGODB_URI="mongodb+srv://metrouni_admin:bangladeshzindabad@metrouni-cluster.dtqxnr1.mongodb.net/metriuni?retryWrites=true&w=majority&appName=metrouni-cluster"
railway variables set JWT_SECRET="production-super-secure-jwt-secret-key-2024-metrouni-platform"
railway variables set JWT_EXPIRES_IN="7d"
railway variables set UPLOAD_MAX_SIZE="10485760"
railway variables set RATE_LIMIT_WINDOW_MS="900000"
railway variables set RATE_LIMIT_MAX_REQUESTS="100"

echo "✅ Environment variables set!"
echo "🚀 Triggering redeploy..."

# Force redeploy
railway redeploy

echo "📊 Deployment status:"
railway status

echo "🌐 Your app should be available at:"
railway domain
