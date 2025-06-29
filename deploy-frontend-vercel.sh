#!/bin/bash

echo "🚀 MetroUni Frontend Deployment to Vercel"
echo "=========================================="

# Navigate to frontend directory
cd frontend

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

echo "🔧 Setting up Vercel project..."

# Login to Vercel (will open browser)
vercel login

echo "🌍 Setting production environment variables..."
vercel env add VITE_API_URL production
echo "Enter: https://web-production-7bab5.up.railway.app"

vercel env add VITE_SOCKET_URL production  
echo "Enter: https://web-production-7bab5.up.railway.app"

vercel env add VITE_APP_NAME production
echo "Enter: MetroUni"

echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Frontend deployment completed!"
echo "🌐 Your MetroUni frontend is now live!"
echo "🔗 Check your Vercel dashboard for the live URL"
