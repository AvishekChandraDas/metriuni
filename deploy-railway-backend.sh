#!/bin/bash

echo "🚀 Deploying MetroUni Backend to Railway..."

# Check if we're in the right directory
if [ ! -f "Dockerfile.backend" ]; then
    echo "❌ Error: Dockerfile.backend not found. Please run from the project root."
    exit 1
fi

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Check if logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway. Please run: railway login"
    exit 1
fi

echo "✅ Railway CLI ready"

# Deploy using Railway CLI
echo "📦 Deploying backend..."
railway up --dockerfile Dockerfile.backend

echo "🎉 Backend deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Check Railway dashboard for deployment status"
echo "2. Verify environment variables are set (especially ALLOWED_ORIGINS)"
echo "3. Test the API health endpoint"
echo "4. Test CORS from frontend"
