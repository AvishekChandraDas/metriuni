#!/bin/bash

echo "=== Adding Chat System to MetroUni ==="
echo

# Check if backend server is running
if ! pgrep -f "node.*server.js" > /dev/null; then
    echo "⚠️  Backend server is not running. Please start it first with:"
    echo "   cd backend && npm start"
    echo
    exit 1
fi

echo "✅ Backend server is running"

# Run the database migration
echo "📊 Running database migration for chat system..."
cd backend

# Check if PostgreSQL is accessible
if ! psql -h localhost -p 5432 -U postgres -d metrouni -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Cannot connect to PostgreSQL database"
    echo "   Please ensure PostgreSQL is running and the database exists"
    exit 1
fi

echo "✅ Database connection successful"

# Execute the migration
echo "🔄 Creating chat tables and indexes..."
psql -h localhost -p 5432 -U postgres -d metrouni -f scripts/add-chat-system.sql

if [ $? -eq 0 ]; then
    echo "✅ Chat system database migration completed successfully"
else
    echo "❌ Database migration failed"
    exit 1
fi

echo
echo "=== Chat System Setup Complete ==="
echo
echo "🎉 Chat features added:"
echo "  • Real-time messaging between users"
echo "  • Conversation management"
echo "  • Unread message tracking"
echo "  • Typing indicators"
echo "  • Message history with pagination"
echo
echo "📋 API Endpoints added:"
echo "  • GET /api/chat - Get user conversations"
echo "  • POST /api/chat/start - Start conversation with user"
echo "  • GET /api/chat/:id/messages - Get conversation messages"
echo "  • POST /api/chat/:id/messages - Send message"
echo "  • PUT /api/chat/:id/read - Mark messages as read"
echo "  • GET /api/chat/unread/count - Get unread message count"
echo
echo "🔌 Socket.IO Events:"
echo "  • join_conversation - Join chat room"
echo "  • new_message - Real-time message delivery"
echo "  • typing_start/typing_stop - Typing indicators"
echo
echo "✨ Ready to implement frontend chat components!"
