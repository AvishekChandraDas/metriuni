#!/bin/bash

# MetroUni Railway Deployment Helper
# This script helps you deploy your MetroUni platform to Railway

clear
echo "🚂 MetroUni Railway Deployment Helper"
echo "====================================="
echo ""

# Check if git repository exists
if [ ! -d .git ]; then
    echo "❌ Error: Not a git repository. Please run 'git init' first."
    exit 1
fi

# Check if remote origin exists
if ! git remote get-url origin >/dev/null 2>&1; then
    echo "❌ Error: No git remote origin found. Please push to GitHub first."
    exit 1
fi

REPO_URL=$(git remote get-url origin)
echo "✅ GitHub Repository: $REPO_URL"
echo ""

echo "🎯 DEPLOYMENT STEPS:"
echo ""
echo "Step 1: Open Railway Dashboard"
echo "   🔗 https://railway.app"
echo "   📝 Sign up/Login with your GitHub account"
echo ""

echo "Step 2: Create New Project"
echo "   1. Click 'New Project' in Railway dashboard"
echo "   2. Choose 'Deploy from GitHub repo'"
echo "   3. Select your 'metriuni' repository"
echo "   4. Railway will start building automatically!"
echo ""

echo "Step 3: Add Environment Variables"
echo "   In Railway dashboard, go to Variables tab and add:"
echo ""
echo "   NODE_ENV=production"
echo "   MONGODB_URI=mongodb+srv://metrouni_admin:bangladeshzindabad@metrouni-cluster.dtqxnr1.mongodb.net/metriuni?retryWrites=true&w=majority&appName=metrouni-cluster"
echo "   JWT_SECRET=production-super-secure-jwt-secret-key-2024-metrouni-platform"
echo "   JWT_EXPIRES_IN=7d"
echo "   UPLOAD_MAX_SIZE=10485760"
echo "   RATE_LIMIT_WINDOW_MS=900000"
echo "   RATE_LIMIT_MAX_REQUESTS=100"
echo ""

echo "Step 4: Deployment Complete!"
echo "   🌐 Your app will be live at: https://metriuni-production.up.railway.app"
echo "   (Railway will provide the exact URL)"
echo ""

echo "🔐 Admin Access:"
echo "   📧 Email: admin@avishekchandradas.me"
echo "   🔑 Password: SecureAdmin2024!"
echo ""

echo "📋 Environment Variables (copy these to Railway):"
echo "======================================================"
cat << 'EOF'
NODE_ENV=production
MONGODB_URI=mongodb+srv://metrouni_admin:bangladeshzindabad@metrouni-cluster.dtqxnr1.mongodb.net/metriuni?retryWrites=true&w=majority&appName=metrouni-cluster
JWT_SECRET=production-super-secure-jwt-secret-key-2024-metrouni-platform
JWT_EXPIRES_IN=7d
UPLOAD_MAX_SIZE=10485760
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
echo "======================================================"
echo ""

echo "Would you like to:"
echo "1) Open Railway dashboard in browser"
echo "2) Show deployment checklist"
echo "3) Exit"
echo ""

read -p "Choose option (1-3): " choice

case $choice in
    1)
        echo "🌐 Opening Railway dashboard..."
        if command -v open >/dev/null 2>&1; then
            open "https://railway.app"
        elif command -v xdg-open >/dev/null 2>&1; then
            xdg-open "https://railway.app"
        else
            echo "Please manually open: https://railway.app"
        fi
        ;;
    2)
        echo ""
        echo "📝 DEPLOYMENT CHECKLIST:"
        echo "========================"
        echo "✅ Code pushed to GitHub"
        echo "⬜ Railway account created"
        echo "⬜ New project created in Railway"
        echo "⬜ Repository connected"
        echo "⬜ Environment variables added"
        echo "⬜ Deployment successful"
        echo "⬜ App tested and working"
        echo ""
        ;;
    3)
        echo "👋 Good luck with your deployment!"
        ;;
    *)
        echo "Invalid option. Please run the script again."
        ;;
esac

echo ""
echo "🚀 Your MetroUni platform is ready to go live!"
echo "📚 Need help? Check the deployment documentation."
