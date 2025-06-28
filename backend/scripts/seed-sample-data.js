const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// Load environment variables
require('dotenv').config();

async function seedSampleData() {
  try {
    console.log('[dotenv@16.6.0] injecting env (16) from .env');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/metriuni');
    console.log('✅ Connected to MongoDB');
    
    // Find an existing user to create posts
    const sampleUser = await User.findOne({ email: 'jane.smith@example.com' });
    if (!sampleUser) {
      console.log('❌ No sample user found. Run the main seeder first.');
      process.exit(1);
    }
    
    console.log(`📝 Creating sample posts for user: ${sampleUser.name}`);
    
    // Create sample posts
    const samplePosts = await Promise.all([
      Post.create({
        authorId: sampleUser._id,
        content: "Hello MetroUni! Just testing the new MongoDB backend. Everything looks great! 🎉",
        department: sampleUser.department,
        batch: sampleUser.batch,
        tags: ['mongodb', 'backend', 'test'],
        visibility: 'public'
      }),
      Post.create({
        authorId: sampleUser._id,
        content: "Anyone interested in forming a study group for Advanced Database Systems? We can meet virtually and share resources! 📚",
        department: sampleUser.department,
        batch: sampleUser.batch,
        tags: ['study-group', 'database', 'collaboration'],
        visibility: 'public'
      }),
      Post.create({
        authorId: sampleUser._id,
        content: "The campus library now has extended hours during finals week. Great news for night owls! 🌙📖",
        department: 'Other',
        batch: sampleUser.batch,
        tags: ['library', 'finals', 'campus-news'],
        visibility: 'public'
      })
    ]);
    
    console.log(`✅ Created ${samplePosts.length} sample posts`);
    
    // Create sample comments
    const post1 = samplePosts[0];
    const post2 = samplePosts[1];
    
    const adminUser = await User.findOne({ email: 'admin@avishekchandradas.me' });
    if (adminUser) {
      const sampleComments = await Promise.all([
        Comment.create({
          postId: post1._id,
          authorId: adminUser._id,
          content: "Great to see the new system working! 👍"
        }),
        Comment.create({
          postId: post2._id,
          authorId: adminUser._id,
          content: "I'd be interested in joining the study group! Count me in."
        }),
        Comment.create({
          postId: post1._id,
          authorId: sampleUser._id,
          content: "Thanks! The migration went smoothly."
        })
      ]);
      
      console.log(`✅ Created ${sampleComments.length} sample comments`);
      
      // Add likes to posts
      await post1.addLike(adminUser._id);
      await post2.addLike(sampleUser._id);
      await post2.addLike(adminUser._id);
      
      console.log('✅ Added sample likes');
    }
    
    console.log('\n🎉 Sample data seeded successfully!');
    
    // Display summary
    const totalPosts = await Post.countDocuments({ status: 'active' });
    const totalComments = await Comment.countDocuments({ status: 'active' });
    
    console.log('\n📊 Summary:');
    console.log(`   • Total posts: ${totalPosts}`);
    console.log(`   • Total comments: ${totalComments}`);
    
    console.log('\n🌐 Test URLs:');
    console.log('   • Health: http://localhost:3001/health');
    console.log('   • API Health: http://localhost:3001/api/health');
    console.log('   • Users: http://localhost:3001/api/users');
    
  } catch (error) {
    console.error('❌ Error seeding sample data:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
  }
}

// Run the seeder
if (require.main === module) {
  seedSampleData();
}

module.exports = seedSampleData;
