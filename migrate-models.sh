#!/bin/bash

# MongoDB Model Migration Script
# This script backs up old PostgreSQL models and replaces them with MongoDB versions

BACKEND_DIR="/Users/avishekchandradas/Desktop/MetroUni/backend"
MODELS_DIR="$BACKEND_DIR/models"

echo "🔄 Starting MongoDB model migration..."

# Create backup directory
mkdir -p "$MODELS_DIR/postgresql-backup"

# Backup and replace Post model
if [ -f "$MODELS_DIR/Post.js" ]; then
    echo "📦 Backing up Post.js..."
    mv "$MODELS_DIR/Post.js" "$MODELS_DIR/postgresql-backup/Post.js"
fi

if [ -f "$MODELS_DIR/Post-new.js" ]; then
    echo "✅ Installing new Post model..."
    mv "$MODELS_DIR/Post-new.js" "$MODELS_DIR/Post.js"
fi

# Backup and replace Comment model
if [ -f "$MODELS_DIR/Comment.js" ]; then
    echo "📦 Backing up Comment.js..."
    mv "$MODELS_DIR/Comment.js" "$MODELS_DIR/postgresql-backup/Comment.js"
fi

if [ -f "$MODELS_DIR/Comment-new.js" ]; then
    echo "✅ Installing new Comment model..."
    mv "$MODELS_DIR/Comment-new.js" "$MODELS_DIR/Comment.js"
fi

# List other models that need migration
echo ""
echo "📋 Models that still need MongoDB migration:"
for model in "$MODELS_DIR"/*.js; do
    if [ -f "$model" ]; then
        filename=$(basename "$model")
        if [[ "$filename" != "User.js" && "$filename" != "Post.js" && "$filename" != "Comment.js" && "$filename" != "User-old.js" ]]; then
            # Check if it contains PostgreSQL patterns
            if grep -q "pool.query\|require.*database" "$model" 2>/dev/null; then
                echo "   ⚠️  $filename (contains PostgreSQL code)"
            else
                echo "   ✅ $filename (appears to be MongoDB ready)"
            fi
        fi
    fi
done

echo ""
echo "🎉 Model migration completed!"
echo "📁 PostgreSQL models backed up to: $MODELS_DIR/postgresql-backup/"
