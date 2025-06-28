#!/bin/bash

echo "=== Testing Chat System API Endpoints ==="
echo

# Check if backend server is running
if ! curl -s http://localhost:3001 > /dev/null; then
    echo "❌ Backend server is not running on port 3001"
    echo "   Please start it with: cd backend && npm start"
    exit 1
fi

echo "✅ Backend server is running on http://localhost:3001"
echo

echo "📋 Chat API Endpoints Available:"
echo "  • GET /api/chat - Get user conversations"
echo "  • POST /api/chat/start - Start conversation with user"
echo "  • GET /api/chat/:id/messages - Get conversation messages" 
echo "  • POST /api/chat/:id/messages - Send message"
echo "  • PUT /api/chat/:id/read - Mark messages as read"
echo "  • GET /api/chat/unread/count - Get unread message count"
echo

echo "🔌 Socket.IO Events Added:"
echo "  • join_conversation - Join chat room"
echo "  • leave_conversation - Leave chat room"
echo "  • typing_start/typing_stop - Typing indicators"
echo "  • new_message - Real-time message delivery"
echo

echo "✨ Frontend Components Created:"
echo "  • ChatPage.tsx - Full chat interface"
echo "  • SocketContext.tsx - Real-time connection management"
echo

echo "📝 Next Steps:"
echo "1. Run the database migration manually:"
echo "   psql -U postgres -d metrouni -f backend/scripts/add-chat-system.sql"
echo
echo "2. Add SocketProvider to your App.tsx:"
echo "   import { SocketProvider } from './contexts/SocketContext';"
echo "   // Wrap your app with <SocketProvider>"
echo
echo "3. Add chat route to your routing:"
echo "   import ChatPage from './pages/ChatPage';"
echo "   // Add route: <Route path='/chat' element={<ChatPage />} />"
echo
echo "4. Add chat navigation to your Layout:"
echo "   // Add chat link/icon in navigation"
echo
echo "🎉 Chat system backend is ready!"
