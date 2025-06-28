const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Post = require('../models/Post');

async function seed() {
  console.log('Starting database seeding...');

  try {
    // Create admin user
    const adminPasswordHash = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@metro.edu',
      passwordHash: adminPasswordHash,
      muStudentId: 'MU000001',
      department: 'Administration',
      batch: '2020',
      role: 'admin'
    });
    console.log('✓ Admin user created');

    // Create sample users
    const sampleUsers = [
      {
        name: 'John Doe',
        email: 'john.doe@metro.edu',
        muStudentId: 'MU123456',
        department: 'Computer Science',
        batch: '2024'
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@metro.edu',
        muStudentId: 'MU123457',
        department: 'Engineering',
        batch: '2023'
      },
      {
        name: 'Bob Wilson',
        email: 'bob.wilson@metro.edu',
        muStudentId: 'MU123458',
        department: 'Business',
        batch: '2025'
      },
      {
        name: 'Alice Johnson',
        email: 'alice.johnson@metro.edu',
        muStudentId: 'MU123459',
        department: 'Psychology',
        batch: '2024'
      },
      {
        name: 'Charlie Brown',
        email: 'charlie.brown@metro.edu',
        muStudentId: 'MU123460',
        department: 'Mathematics',
        batch: '2023'
      }
    ];

    const createdUsers = [];
    for (const userData of sampleUsers) {
      const passwordHash = await bcrypt.hash('password123', 12);
      const user = await User.create({
        ...userData,
        passwordHash
      });
      createdUsers.push(user);
    }
    console.log('✓ Sample users created');

    // Create bot user
    const botPasswordHash = await bcrypt.hash('system', 12);
    const botUser = await User.create({
      name: 'MetroUni Bot',
      email: 'bot@metro.edu',
      passwordHash: botPasswordHash,
      muStudentId: 'MU000000',
      department: 'System',
      batch: '2024',
      role: 'user'
    });
    console.log('✓ Bot user created');

    // Create some follows
    await User.follow(createdUsers[0].id, createdUsers[1].id);
    await User.follow(createdUsers[0].id, createdUsers[2].id);
    await User.follow(createdUsers[1].id, createdUsers[0].id);
    await User.follow(createdUsers[1].id, createdUsers[3].id);
    await User.follow(createdUsers[2].id, createdUsers[0].id);
    await User.follow(createdUsers[3].id, createdUsers[1].id);
    console.log('✓ Sample follows created');

    // Create sample posts
    const samplePosts = [
      {
        authorId: createdUsers[0].id,
        content: 'Just finished my Computer Science project! Excited to share what I learned. 🚀'
      },
      {
        authorId: createdUsers[1].id,
        content: 'Great lecture today on sustainable engineering practices. Our professors at Metro University are amazing! 💡'
      },
      {
        authorId: createdUsers[2].id,
        content: 'Study group forming for Business Statistics. Who wants to join? We meet every Tuesday at the library. 📚'
      },
      {
        authorId: createdUsers[3].id,
        content: 'Interesting discussion in Psychology class about cognitive behavioral therapy. The human mind is fascinating! 🧠'
      },
      {
        authorId: createdUsers[4].id,
        content: 'Working on some calculus problems. Math can be beautiful when you understand the patterns. ∫∫∫'
      },
      {
        authorId: botUser.id,
        content: '🎓 UNIVERSITY ANNOUNCEMENT: Registration for Spring 2025 semester begins next week. Check your student portal for details.',
        isBot: true
      },
      {
        authorId: botUser.id,
        content: '📚 LIBRARY UPDATE: Extended hours during finals week. The library will be open 24/7 from December 15-22.',
        isBot: true
      }
    ];

    for (const postData of samplePosts) {
      await Post.create(postData);
    }
    console.log('✓ Sample posts created');

    console.log('\nSeeding completed successfully!');
    console.log('\nSample login credentials:');
    console.log('Admin: admin@metro.edu / admin123');
    console.log('Student: john.doe@metro.edu / password123');
    console.log('Student: jane.smith@metro.edu / password123');

  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seed;
