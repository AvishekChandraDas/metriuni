#!/bin/bash

echo "🚀 MetroUni Frontend - Netlify Deployment"
echo "========================================"

cd frontend

echo "✅ Building frontend locally..."
NODE_ENV=production npm run build

echo "📁 Build completed! Files ready in dist/ folder"
echo ""
echo "🌐 NEXT STEPS:"
echo "1. Go to https://netlify.com"
echo "2. Click 'Add new site' > 'Deploy manually'"
echo "3. Drag and drop the 'frontend/dist' folder"
echo "4. Set environment variables in Site Settings:"
echo "   - VITE_API_URL: https://web-production-7bab5.up.railway.app"
echo "   - VITE_SOCKET_URL: https://web-production-7bab5.up.railway.app"
echo "   - VITE_APP_NAME: MetroUni"
echo ""
echo "🎉 Your MetroUni frontend will be live in minutes!"

# Open the dist folder in finder for easy drag & drop
open dist
