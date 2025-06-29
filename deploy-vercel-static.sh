#!/bin/bash

echo "🚀 MetroUni Frontend - Vercel Deployment (Pre-built)"
echo "================================================="

cd frontend

echo "✅ Building frontend locally..."
NODE_ENV=production npm run build

echo "📦 Installing Vercel CLI if needed..."
if ! command -v vercel &> /dev/null; then
    npm install -g vercel
fi

echo "🚀 Deploying pre-built files to Vercel..."

# Deploy the dist folder directly
vercel --prod --local-config ../vercel-static.json

echo "🎉 Deployment complete!"
