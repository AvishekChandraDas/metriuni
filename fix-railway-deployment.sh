#!/bin/bash

echo "🚀 Fixing Railway Deployment"
echo "================================"

# Step 1: Ensure we're in the right directory
cd "$(dirname "$0")"
echo "Working in: $(pwd)"

# Step 2: Check current git status
echo -e "\n📦 Current git status:"
git status --short

# Step 3: Make sure railway.json is correct
echo -e "\n🔧 Checking railway.json configuration:"
cat railway.json

# Step 4: Make sure Dockerfile.backend exists and is correct
echo -e "\n🐳 Checking Dockerfile.backend:"
head -10 Dockerfile.backend

# Step 5: Remove any problematic scripts from root package.json
echo -e "\n📝 Updating root package.json to avoid build issues:"
cat > package.json << 'EOF'
{
  "name": "metriuni-platform",
  "version": "1.0.0",
  "description": "MetroUni Social Learning Platform",
  "main": "backend/server.js",
  "scripts": {
    "start": "node backend/server.js"
  },
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  },
  "keywords": [
    "social-network",
    "university",
    "education",
    "platform"
  ],
  "author": "Avishek Chandra Das",
  "license": "MIT"
}
EOF

# Step 6: Commit and push changes
echo -e "\n🔄 Committing changes:"
git add .
git commit -m "Fix Railway deployment - remove problematic scripts"

echo -e "\n🚀 Pushing to trigger Railway redeploy:"
git push origin main

echo -e "\n✅ Done! Railway should now redeploy successfully."
echo "🔗 Check your Railway dashboard for deployment progress."
echo "🌐 Backend will be available at: https://metriuni-platform-production.up.railway.app"
echo "🔍 Health check: https://metriuni-platform-production.up.railway.app/api/health"

echo -e "\n⏱️  Wait 2-3 minutes for deployment, then test:"
echo "curl https://metriuni-platform-production.up.railway.app/api/health"
