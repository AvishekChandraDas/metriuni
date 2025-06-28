require('dotenv').config();
const pool = require('../config/database');

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database migration...');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        mu_student_id VARCHAR(20) UNIQUE NOT NULL,
        department VARCHAR(100) NOT NULL,
        batch VARCHAR(4) NOT NULL,
        avatar_url TEXT,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        bio TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Users table created');

    // Create posts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        media_urls JSONB DEFAULT '[]',
        is_bot BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Posts table created');

    // Create comments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        parent_comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Comments table created');

    // Create likes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT likes_check CHECK (
          (post_id IS NOT NULL AND comment_id IS NULL) OR 
          (post_id IS NULL AND comment_id IS NOT NULL)
        ),
        UNIQUE(user_id, post_id),
        UNIQUE(user_id, comment_id)
      )
    `);
    console.log('✓ Likes table created');

    // Create follows table
    await client.query(`
      CREATE TABLE IF NOT EXISTS follows (
        id SERIAL PRIMARY KEY,
        follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id),
        CHECK (follower_id != following_id)
      )
    `);
    console.log('✓ Follows table created');

    // Create notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        link TEXT,
        type VARCHAR(50) DEFAULT 'general',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Notifications table created');

    // Create indexes for better performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_posts_is_bot ON posts(is_bot)');
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id)');
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_likes_comment_id ON likes(comment_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id)');
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id)');
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)');
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_mu_student_id ON users(mu_student_id)');
    
    console.log('✓ Indexes created');

    // Create triggers for updating updated_at timestamps
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await client.query(`
      CREATE OR REPLACE TRIGGER update_users_updated_at 
      BEFORE UPDATE ON users 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query(`
      CREATE OR REPLACE TRIGGER update_posts_updated_at 
      BEFORE UPDATE ON posts 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query(`
      CREATE OR REPLACE TRIGGER update_comments_updated_at 
      BEFORE UPDATE ON comments 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✓ Triggers created');
    console.log('Database migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrate;
