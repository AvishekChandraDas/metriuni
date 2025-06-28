const mongoose = require('mongoose');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Load environment variables
require('dotenv').config();

async function testNotificationSystem() {
  try {
    console.log('🔔 Testing MongoDB Notification System...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/metriuni');
    console.log('✅ Connected to MongoDB');
    
    // Find existing users
    const users = await User.find().limit(2);
    if (users.length < 2) {
      console.log('❌ Need at least 2 users for testing. Run the main seeder first.');
      process.exit(1);
    }
    
    const [user1, user2] = users;
    console.log(`📱 Testing notifications for users: ${user1.name} and ${user2.name}`);
    
    // Test 1: Create a general notification
    const generalNotification = await Notification.create({
      userId: user1._id,
      message: 'Welcome to MetroUni! Your account has been set up successfully.',
      type: 'general',
      priority: 'normal'
    });
    console.log('✅ Created general notification');
    
    // Test 2: Create a like notification (using helper method)
    const likeNotification = await Notification.createLikeNotification(
      '60a7c5e8f8d2c123456789ab', // Fake post ID
      { _id: user2._id, name: user2.name },
      user1._id
    );
    if (likeNotification) {
      console.log('✅ Created like notification');
    }
    
    // Test 3: Create system notifications for all users
    const allUserIds = users.map(u => u._id);
    await Notification.createSystemNotification(
      allUserIds,
      'System maintenance scheduled for tonight at 2 AM. Service may be briefly interrupted.',
      '/announcements/maintenance',
      'high'
    );
    console.log('✅ Created system notifications for all users');
    
    // Test 4: Get notifications for user1
    const user1Notifications = await Notification.getByUser(user1._id, { limit: 10 });
    console.log(`✅ Found ${user1Notifications.total} notifications for ${user1.name}`);
    
    // Test 5: Get unread count
    const unreadCount = await Notification.getUnreadCount(user1._id);
    console.log(`✅ Unread notifications for ${user1.name}: ${unreadCount}`);
    
    // Test 6: Mark notification as read
    if (user1Notifications.notifications.length > 0) {
      const firstNotification = user1Notifications.notifications[0];
      await Notification.markAsRead(firstNotification.id, user1._id);
      console.log('✅ Marked first notification as read');
      
      const newUnreadCount = await Notification.getUnreadCount(user1._id);
      console.log(`✅ New unread count: ${newUnreadCount}`);
    }
    
    // Test 7: Test instance methods
    const testNotification = await Notification.create({
      userId: user2._id,
      message: 'This is a test notification for instance methods',
      type: 'general'
    });
    
    await testNotification.markAsRead();
    console.log('✅ Tested instance method: markAsRead');
    
    // Display summary
    const totalNotifications = await Notification.countDocuments();
    console.log('\n🎉 Notification System Test Complete!');
    console.log(`📊 Total notifications in database: ${totalNotifications}`);
    
    // Show recent notifications
    console.log('\n📱 Recent notifications:');
    const recentNotifications = await Notification.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(3);
      
    recentNotifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. [${notif.type.toUpperCase()}] ${notif.message} (${notif.isRead ? 'READ' : 'UNREAD'})`);
    });
    
  } catch (error) {
    console.error('❌ Error testing notification system:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
  }
}

// Run the test
if (require.main === module) {
  testNotificationSystem();
}

module.exports = testNotificationSystem;
