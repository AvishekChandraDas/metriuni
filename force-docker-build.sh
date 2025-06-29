#!/bin/bash

echo "🔧 Forcing Railway to use Docker build..."

# Remove any cached Railway settings
rm -rf .railway

# Force Railway to recognize Docker
echo "Using Docker build with railway.json configuration..."

# Push changes to trigger redeploy
git add .
git commit -m "Force Docker build for Railway deployment"
git push

echo "✅ Changes pushed. Railway should now use Docker build."
echo "💡 If it still uses Nixpacks, manually set in Railway dashboard:"
echo "   Settings > Deploy > Builder: Docker"
echo "   Settings > Deploy > Dockerfile Path: Dockerfile.backend"
