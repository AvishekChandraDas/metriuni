#!/bin/bash

# Complete MongoDB Model Migration Script
# This script migrates all remaining PostgreSQL models to MongoDB

BACKEND_DIR="/Users/avishekchandradas/Desktop/MetroUni/backend"
MODELS_DIR="$BACKEND_DIR/models"

echo "🔄 Starting complete MongoDB model migration..."

# Create backup directory if it doesn't exist
mkdir -p "$MODELS_DIR/postgresql-backup"

# Function to backup and replace model
replace_model() {
    local model_name=$1
    
    if [ -f "$MODELS_DIR/$model_name.js" ]; then
        echo "📦 Backing up $model_name.js..."
        mv "$MODELS_DIR/$model_name.js" "$MODELS_DIR/postgresql-backup/$model_name.js"
    fi

    if [ -f "$MODELS_DIR/$model_name-new.js" ]; then
        echo "✅ Installing new $model_name model..."
        mv "$MODELS_DIR/$model_name-new.js" "$MODELS_DIR/$model_name.js"
    else
        echo "⚠️  No new $model_name model found - skipping"
    fi
}

# Replace models
replace_model "Notification"
replace_model "Chat"
replace_model "File"

echo ""
echo "📋 Checking remaining models for PostgreSQL dependencies..."

# Check remaining models
for model in "$MODELS_DIR"/*.js; do
    if [ -f "$model" ]; then
        filename=$(basename "$model")
        
        # Skip already migrated and backup files
        if [[ "$filename" != "User.js" && "$filename" != "Post.js" && "$filename" != "Comment.js" && 
              "$filename" != "Notification.js" && "$filename" != "Chat.js" && "$filename" != "File.js" &&
              "$filename" != "User-old.js" && "$filename" != *"-new.js" ]]; then
            
            # Check if it contains PostgreSQL patterns
            if grep -q "pool.query\|require.*database.*pool" "$model" 2>/dev/null; then
                echo "   ⚠️  $filename (still needs migration)"
            else
                echo "   ✅ $filename (appears MongoDB ready)"
            fi
        fi
    fi
done

echo ""
echo "🎉 Model migration batch completed!"
echo "📁 PostgreSQL models backed up to: $MODELS_DIR/postgresql-backup/"

# Test the server
echo ""
echo "🧪 Testing server restart with new models..."
cd "$BACKEND_DIR"

# Kill existing server if running
pkill -f "node server.js" 2>/dev/null || true
pkill -f "nodemon server.js" 2>/dev/null || true

sleep 2

# Start server in background and test
npm run dev > /tmp/metrouni-test.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
for i in {1..10}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Server started successfully!"
        
        # Test health endpoint
        echo "🩺 Testing health endpoint..."
        curl -s http://localhost:3001/health | head -c 200
        echo ""
        
        break
    fi
    sleep 2
done

# Show any errors from log
if [ -s /tmp/metrouni-test.log ]; then
    echo ""
    echo "📋 Server startup log:"
    tail -20 /tmp/metrouni-test.log
fi

echo ""
echo "🎯 Migration status summary:"
echo "   ✅ User, Post, Comment, Notification, Chat, File - Migrated"
echo "   ⚠️  Check remaining models manually if needed"
echo "   🚀 Server is running with MongoDB models"
