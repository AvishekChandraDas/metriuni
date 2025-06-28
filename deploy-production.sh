#!/bin/bash

# MetroUni Production Deployment Script
set -e

echo "🚀 Starting MetroUni Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    print_error "Backend .env file not found!"
    echo "Please create backend/.env with required environment variables"
    exit 1
fi

if [ ! -f "frontend/.env" ]; then
    print_warning "Frontend .env file not found, creating with defaults..."
    cat > frontend/.env << EOF
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000
VITE_APP_NAME=MetroUni
EOF
fi

# Install dependencies
print_status "Installing backend dependencies..."
cd backend
npm ci --only=production
cd ..

print_status "Installing frontend dependencies..."
cd frontend
npm ci
cd ..

# Run database migrations
print_status "Running database migrations..."
cd backend
npm run db:migrate
cd ..

# Build frontend
print_status "Building frontend..."
cd frontend
npm run build
cd ..

# Test backend
print_status "Testing backend configuration..."
cd backend
timeout 10s npm run prod &
BACKEND_PID=$!
sleep 5

# Check if backend is running
if kill -0 $BACKEND_PID 2>/dev/null; then
    print_status "Backend started successfully"
    kill $BACKEND_PID
    wait $BACKEND_PID 2>/dev/null
else
    print_error "Backend failed to start"
    exit 1
fi
cd ..

# Serve frontend build
print_status "Testing frontend build..."
cd frontend
timeout 10s npm run preview &
FRONTEND_PID=$!
sleep 3

# Check if frontend is running
if kill -0 $FRONTEND_PID 2>/dev/null; then
    print_status "Frontend build tested successfully"
    kill $FRONTEND_PID
    wait $FRONTEND_PID 2>/dev/null
else
    print_error "Frontend build failed"
    exit 1
fi
cd ..

print_status "✅ Production deployment preparation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Deploy backend: cd backend && npm run prod"
echo "2. Serve frontend: cd frontend && npm run preview"
echo "3. Configure reverse proxy (nginx/apache) to serve frontend and proxy API calls"
echo "4. Set up SSL certificates"
echo "5. Configure monitoring and logging"
echo ""
echo "🔧 Environment variables to check:"
echo "- DATABASE_URL (production database)"
echo "- JWT_SECRET (secure random string)"
echo "- CORS_ORIGIN (production frontend URL)"
echo "- NODE_ENV=production"
