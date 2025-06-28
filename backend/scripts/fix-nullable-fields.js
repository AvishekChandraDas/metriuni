const pool = require('../config/database');

async function makeFieldsNullable() {
  try {
    console.log('Making department and batch fields nullable for teacher accounts...');
    
    // Make department nullable
    await pool.query('ALTER TABLE users ALTER COLUMN department DROP NOT NULL');
    console.log('✓ department field is now nullable');
    
    // Make batch nullable  
    await pool.query('ALTER TABLE users ALTER COLUMN batch DROP NOT NULL');
    console.log('✓ batch field is now nullable');
    
    console.log('Database schema updated successfully!');
  } catch (error) {
    console.error('Error updating database schema:', error);
  } finally {
    await pool.end();
  }
}

makeFieldsNullable();
