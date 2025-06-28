#!/bin/bash

# MetroUni Development Setup Script
# This script helps set up the development environment

echo "🚀 MetroUni Development Setup"
echo "============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Node.js is installed
print_status "Checking Node.js installation..."
if command -v node > /dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    print_success "Node.js is installed: $NODE_VERSION"
else
    print_error "Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

# Check if PostgreSQL is installed
print_status "Checking PostgreSQL installation..."
if command -v psql > /dev/null 2>&1; then
    POSTGRES_VERSION=$(psql --version | awk '{print $3}')
    print_success "PostgreSQL is installed: $POSTGRES_VERSION"
else
    print_warning "PostgreSQL not found. Installing via Homebrew..."
    if command -v brew > /dev/null 2>&1; then
        brew install postgresql
        brew services start postgresql
    else
        print_error "Please install PostgreSQL manually and restart this script."
        exit 1
    fi
fi

# Setup Backend
print_status "Setting up Backend..."
cd backend

if [ ! -f ".env" ]; then
    print_status "Creating backend .env file..."
    cp .env.example .env
    print_success "Backend .env file created. Please update with your database credentials."
else
    print_success "Backend .env file already exists."
fi

print_status "Installing backend dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_success "Backend dependencies installed successfully."
else
    print_error "Failed to install backend dependencies."
    exit 1
fi

# Setup Database
print_status "Setting up database..."
print_warning "Make sure PostgreSQL is running and update the .env file with correct credentials."
echo "To create the database manually, run:"
echo "  createdb metrouni"
echo "To run migrations:"
echo "  npm run db:migrate"
echo "To seed initial data:"
echo "  npm run db:seed"

# Setup Frontend
print_status "Setting up Frontend..."
cd ../frontend

if [ ! -f ".env" ]; then
    print_status "Creating frontend .env file..."
    cat > .env << EOL
# API Configuration
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000

# App Configuration
VITE_APP_NAME=MetroUni
EOL
    print_success "Frontend .env file created."
else
    print_success "Frontend .env file already exists."
fi

print_status "Installing frontend dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_success "Frontend dependencies installed successfully."
else
    print_error "Failed to install frontend dependencies."
    exit 1
fi

# Setup Telegram Bot (Optional)
print_status "Setting up Telegram Bot (Optional)..."
cd ../telegram-bot

if [ ! -f ".env" ]; then
    print_status "Creating telegram bot .env file..."
    cp .env.example .env
    print_warning "Telegram bot .env file created. Add your bot token to enable the bot."
else
    print_success "Telegram bot .env file already exists."
fi

print_status "Installing telegram bot dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_success "Telegram bot dependencies installed successfully."
else
    print_warning "Failed to install telegram bot dependencies. This is optional."
fi

# Final instructions
cd ..
echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "📋 Next Steps:"
echo "1. Update database credentials in backend/.env"
echo "2. Create the PostgreSQL database: createdb metrouni"
echo "3. Run database migrations: cd backend && npm run db:migrate"
echo "4. (Optional) Seed initial data: npm run db:seed"
echo ""
echo "🚀 To start development:"
echo "Terminal 1: cd backend && npm run dev"
echo "Terminal 2: cd frontend && npm run dev"
echo "Terminal 3: cd telegram-bot && npm start (optional)"
echo ""
echo "🌐 Access the app at: http://localhost:5173"
echo "📊 Admin dashboard: http://localhost:5173/admin"
echo "🔧 API health check: http://localhost:5000/api/health"
echo ""
echo "📚 Check README.md for detailed documentation."
print_success "Happy coding! 🚀"
