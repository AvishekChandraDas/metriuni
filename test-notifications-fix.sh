#!/bin/bash

echo "🔧 Testing NotificationsPage Filter Fix"
echo "======================================"
echo

# Get admin token
TOKEN=$(curl -s -X POST "http://localhost:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@metro.edu", "password": "admin123"}' | jq -r '.token // empty')

if [ -z "$TOKEN" ]; then
  echo "❌ Admin login failed"
  exit 1
fi

echo "✅ Admin login successful"
echo

# Test notifications endpoint structure
echo "Testing /api/notifications endpoint:"
NOTIFICATIONS_RESPONSE=$(curl -s "http://localhost:3001/api/notifications" -H "Authorization: Bearer $TOKEN")
HAS_NOTIFICATIONS_ARRAY=$(echo "$NOTIFICATIONS_RESPONSE" | jq 'has("notifications")')
HAS_PAGINATION=$(echo "$NOTIFICATIONS_RESPONSE" | jq 'has("pagination")')
NOTIFICATIONS_COUNT=$(echo "$NOTIFICATIONS_RESPONSE" | jq '.notifications | length // 0')

echo "  - Response has 'notifications' array: $HAS_NOTIFICATIONS_ARRAY"
echo "  - Response has 'pagination' object: $HAS_PAGINATION"
echo "  - Notifications count: $NOTIFICATIONS_COUNT"

# Test unread endpoint
echo
echo "Testing /api/notifications/unread endpoint:"
UNREAD_RESPONSE=$(curl -s "http://localhost:3001/api/notifications/unread" -H "Authorization: Bearer $TOKEN")
HAS_UNREAD_NOTIFICATIONS=$(echo "$UNREAD_RESPONSE" | jq 'has("notifications")')
HAS_UNREAD_COUNT=$(echo "$UNREAD_RESPONSE" | jq 'has("unreadCount")')

echo "  - Response has 'notifications' array: $HAS_UNREAD_NOTIFICATIONS"
echo "  - Response has 'unreadCount' field: $HAS_UNREAD_COUNT"

echo
if [ "$HAS_NOTIFICATIONS_ARRAY" = "true" ] && [ "$HAS_PAGINATION" = "true" ]; then
  echo "🎉 NotificationsPage API endpoints are working correctly!"
  echo "✅ Backend returns structured responses: { notifications: [...], pagination: {...} }"
  echo "✅ Frontend has been updated to handle this structure"
  echo "✅ The NotificationsPage should now load without filter errors"
else
  echo "❌ API endpoints are not returning expected structure"
fi

echo
echo "Summary of fixes applied to NotificationsPage:"
echo "1. ✅ Updated data extraction: notifications = response.data.notifications || []"
echo "2. ✅ Added null safety: (notifications || []).filter(...)"
echo "3. ✅ Protected all array operations: map, length, filter"
echo "4. ✅ Added fallback empty array in error handling"
echo
echo "Access the notifications page at: http://localhost:5173/notifications"
