require('dotenv').config();
const pool = require('../config/database');

async function addApprovalSystem() {
  const client = await pool.connect();
  
  try {
    console.log('Adding admin approval system fields...');

    // Add new fields to users table
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS id_card_photo_url TEXT,
      ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS date_of_birth DATE,
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS rejection_reason TEXT
    `);
    console.log('✓ Added approval system fields to users table');

    // Update existing users to approved status (so they don't get locked out)
    await client.query(`
      UPDATE users 
      SET status = 'approved' 
      WHERE status = 'pending' AND role = 'admin'
    `);
    console.log('✓ Updated existing admin users to approved status');

    // Update other existing users to approved status as well (backward compatibility)
    await client.query(`
      UPDATE users 
      SET status = 'approved' 
      WHERE status = 'pending'
    `);
    console.log('✓ Updated existing users to approved status for backward compatibility');

    console.log('Admin approval system migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
addApprovalSystem()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
