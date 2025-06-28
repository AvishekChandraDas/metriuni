#!/bin/bash

# MetroUni Deployment Verification Script
# Verify all components are ready for production deployment

# Note: Don't use set -e so we can continue checking even if some checks fail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}"
    echo "================================================"
    echo "🔍 MetroUni Deployment Verification"
    echo "================================================"
    echo -e "${NC}"
}

print_status() {
    echo -e "${BLUE}$1${NC}"
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

print_header

PROJECT_DIR="/Users/avishekchandradas/Desktop/MetroUni"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Verification counters
PASSED=0
FAILED=0
WARNINGS=0

check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        print_success "$description exists"
        ((PASSED++))
    else
        print_error "$description missing: $file"
        ((FAILED++))
    fi
}

check_directory() {
    local dir=$1
    local description=$2
    
    if [ -d "$dir" ]; then
        print_success "$description exists"
        ((PASSED++))
    else
        print_error "$description missing: $dir"
        ((FAILED++))
    fi
}

# Check project structure
print_status "📁 Checking Project Structure..."
check_directory "$BACKEND_DIR" "Backend directory"
check_directory "$FRONTEND_DIR" "Frontend directory"
check_file "$BACKEND_DIR/server.js" "Backend server file"
check_file "$BACKEND_DIR/package.json" "Backend package.json"
check_file "$FRONTEND_DIR/package.json" "Frontend package.json"

# Check configuration files
print_status "⚙️  Checking Configuration Files..."
check_file "$BACKEND_DIR/.env" "Development environment file"
check_file "$BACKEND_DIR/.env.production" "Production environment file"
check_file "$PROJECT_DIR/Dockerfile" "Docker configuration"
check_file "$PROJECT_DIR/.dockerignore" "Docker ignore file"

# Check deployment scripts
print_status "🚀 Checking Deployment Scripts..."
check_file "$PROJECT_DIR/setup-mongodb-atlas.sh" "MongoDB Atlas setup script"
check_file "$PROJECT_DIR/deploy-mongo-production.sh" "Production deployment script"

# Check backend dependencies
print_status "📦 Checking Backend Dependencies..."
cd "$BACKEND_DIR"

if [ -f "package.json" ]; then
    # Check for MongoDB dependencies
    if grep -q "mongoose" package.json; then
        print_success "Mongoose (MongoDB driver) configured"
        ((PASSED++))
    else
        print_error "Mongoose dependency missing"
        ((FAILED++))
    fi
    
    # Check for required dependencies
    for dep in "express" "cors" "dotenv" "bcryptjs" "jsonwebtoken"; do
        if grep -q "\"$dep\"" package.json; then
            print_success "$dep dependency found"
            ((PASSED++))
        else
            print_error "$dep dependency missing"
            ((FAILED++))
        fi
    done
fi

# Check MongoDB models
print_status "🗄️  Checking MongoDB Models..."
check_directory "$BACKEND_DIR/models" "Models directory"

for model in "User.js" "Post.js" "Comment.js" "Notification.js" "Chat.js"; do
    check_file "$BACKEND_DIR/models/$model" "$model model"
done

# Check if models use Mongoose
if [ -f "$BACKEND_DIR/models/User.js" ]; then
    if grep -q "mongoose" "$BACKEND_DIR/models/User.js"; then
        print_success "Models use Mongoose (MongoDB compatible)"
        ((PASSED++))
    else
        print_error "Models not using Mongoose"
        ((FAILED++))
    fi
fi

# Check environment configuration
print_status "🔧 Checking Environment Configuration..."

if [ -f "$BACKEND_DIR/.env.production" ]; then
    # Check MongoDB URI format
    if grep -q "MONGODB_URI=mongodb" "$BACKEND_DIR/.env.production"; then
        if grep -q "mongodb+srv" "$BACKEND_DIR/.env.production"; then
            print_success "MongoDB Atlas URI configured"
            ((PASSED++))
        else
            print_warning "MongoDB URI set but not Atlas format"
            ((WARNINGS++))
        fi
    else
        print_warning "MongoDB URI not configured in production env"
        ((WARNINGS++))
    fi
    
    # Check admin credentials
    if grep -q "ADMIN_EMAIL" "$BACKEND_DIR/.env.production"; then
        print_success "Admin credentials configured"
        ((PASSED++))
    else
        print_warning "Admin credentials not found in production env"
        ((WARNINGS++))
    fi
    
    # Check JWT secret
    if grep -q "JWT_SECRET" "$BACKEND_DIR/.env.production"; then
        print_success "JWT secret configured"
        ((PASSED++))
    else
        print_error "JWT secret not configured"
        ((FAILED++))
    fi
fi

# Test local backend
print_status "🧪 Testing Backend Functionality..."

# Check if backend is running
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    print_success "Backend health check passed"
    ((PASSED++))
    
    # Test admin login endpoint
    if curl -f http://localhost:3001/api/auth/login > /dev/null 2>&1; then
        print_success "Auth endpoints accessible"
        ((PASSED++))
    else
        print_warning "Auth endpoints may not be configured"
        ((WARNINGS++))
    fi
else
    print_warning "Backend not currently running (this is ok for deployment)"
    ((WARNINGS++))
fi

# Check database seeding script
print_status "🌱 Checking Database Scripts..."
check_file "$BACKEND_DIR/scripts/seed-mongodb.js" "MongoDB seeding script"

if [ -f "$BACKEND_DIR/scripts/seed-mongodb.js" ]; then
    if grep -q "admin@avishekchandradas.me" "$BACKEND_DIR/scripts/seed-mongodb.js"; then
        print_success "Admin user seeding configured"
        ((PASSED++))
    else
        print_warning "Admin user seeding may not be configured"
        ((WARNINGS++))
    fi
fi

# Check frontend build capability
print_status "🎨 Checking Frontend Build..."
cd "$FRONTEND_DIR"

if [ -f "package.json" ]; then
    if grep -q "\"build\"" package.json; then
        print_success "Frontend build script configured"
        ((PASSED++))
    else
        print_error "Frontend build script missing"
        ((FAILED++))
    fi
    
    # Check if frontend has been built
    if [ -d "dist" ] || [ -d "build" ]; then
        print_success "Frontend build directory exists"
        ((PASSED++))
    else
        print_warning "Frontend not yet built (will be built during deployment)"
        ((WARNINGS++))
    fi
fi

# Check system prerequisites (for deployment server)
print_status "🖥️  Checking System Prerequisites..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js available: $NODE_VERSION"
    ((PASSED++))
else
    print_error "Node.js not found"
    ((FAILED++))
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm available: $NPM_VERSION"
    ((PASSED++))
else
    print_error "npm not found"
    ((FAILED++))
fi

# Check Docker (optional for local development)
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker available: $DOCKER_VERSION"
    ((PASSED++))
else
    print_warning "Docker not found (needed for production deployment)"
    ((WARNINGS++))
fi

# Summary
echo ""
print_status "📊 Verification Summary"
echo "========================"
echo -e "✅ Passed: ${GREEN}$PASSED${NC}"
echo -e "⚠️  Warnings: ${YELLOW}$WARNINGS${NC}"
echo -e "❌ Failed: ${RED}$FAILED${NC}"
echo ""

# Recommendations
if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        print_success "🎉 All checks passed! Ready for deployment."
        echo ""
        echo -e "${BLUE}Next steps:${NC}"
        echo "1. Set up MongoDB Atlas cluster"
        echo "2. Update MONGODB_URI in backend/.env.production"
        echo "3. Run: ./setup-mongodb-atlas.sh"
        echo "4. Deploy to production server"
    else
        print_warning "✨ Mostly ready! Please address warnings before deployment."
        echo ""
        echo -e "${BLUE}Recommended actions:${NC}"
        if [ $WARNINGS -gt 0 ]; then
            echo "1. Set up MongoDB Atlas cluster if not done"
            echo "2. Configure production environment variables"
            echo "3. Install Docker on production server"
        fi
    fi
else
    print_error "🔧 Issues found! Please fix errors before deployment."
    echo ""
    echo -e "${BLUE}Required fixes:${NC}"
    echo "1. Install missing dependencies"
    echo "2. Fix configuration errors"
    echo "3. Re-run verification"
fi

echo ""
echo -e "${BLUE}📋 Deployment Checklist:${NC}"
echo "□ MongoDB Atlas cluster created"
echo "□ Production server with Docker ready"
echo "□ Domain DNS configured"
echo "□ SSL certificates obtained"
echo "□ Environment variables updated"
echo "□ All verification checks passed"

# Return appropriate exit code
if [ $FAILED -gt 0 ]; then
    exit 1
else
    exit 0
fi
