const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

const seedData = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/metriuni';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    console.log('🧹 Cleared existing users');

    // Create admin user
    const admin = new User({
      name: 'Avishek Chandra Das',
      email: 'admin@avishekchandradas.me',
      password: 'SecureAdmin2024!',
      muStudentId: '000-000-000',
      department: 'Computer Science & Engineering',
      batch: '2024',
      role: 'admin',
      status: 'approved',
      phoneNumber: '+880 1234567890',
      address: 'Dhaka, Bangladesh'
    });

    await admin.save();
    console.log('✅ Admin user created');
    console.log(`📧 Admin Email: ${admin.email}`);
    console.log(`🔑 Admin Password: SecureAdmin2024!`);

    // Create sample pending user
    const student = new User({
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'student123',
      muStudentId: '232-115-001',
      department: 'Computer Science & Engineering',
      batch: '2024',
      phoneNumber: '+880 1987654321',
      address: '123 University Road, Dhaka',
      dateOfBirth: new Date('2000-01-15'),
      status: 'pending'
    });

    await student.save();
    console.log('✅ Sample student created (pending approval)');

    // Create sample approved user
    const approvedStudent = new User({
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      password: 'student456',
      muStudentId: '232-115-002',
      department: 'Business Administration',
      batch: '2023',
      phoneNumber: '+880 1555666777',
      address: '456 Campus Street, Dhaka',
      dateOfBirth: new Date('1999-05-20'),
      status: 'approved'
    });

    await approvedStudent.save();
    console.log('✅ Sample approved student created');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📊 Summary:');
    
    const stats = await User.getApprovalStats();
    console.log(`   • Total users: ${stats.total_count}`);
    console.log(`   • Pending: ${stats.pending_count}`);
    console.log(`   • Approved: ${stats.approved_count}`);
    console.log(`   • Rejected: ${stats.rejected_count}`);
    
    console.log('\n🌐 Access URLs:');
    console.log(`   • Frontend: http://localhost:5173`);
    console.log(`   • Backend API: http://localhost:3001/api`);
    console.log(`   • Admin Dashboard: http://localhost:5173/admin`);
    console.log(`   • Health Check: http://localhost:3001/health`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Check if script is run directly
if (require.main === module) {
  seedData();
}

module.exports = seedData;
