-- Push Notifications Database Schema
-- Run this migration to add push notification functionality

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, endpoint)
);

-- Create push_notification_logs table
CREATE TABLE IF NOT EXISTS push_notification_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    notification_type VARCHAR(50) DEFAULT 'general',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, notification_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_push_notification_logs_user_id ON push_notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_push_notification_logs_type ON push_notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_push_notification_logs_read ON push_notification_logs(is_read);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);

-- Insert default notification settings for existing users
INSERT INTO notification_settings (user_id, notification_type, is_enabled)
SELECT u.id, nt.type, TRUE
FROM users u
CROSS JOIN (
    VALUES 
    ('new_message'),
    ('new_post'),
    ('new_comment'),
    ('new_like'),
    ('new_follower'),
    ('study_group_invite'),
    ('university_announcement')
) AS nt(type)
WHERE u.status = 'approved'
ON CONFLICT (user_id, notification_type) DO NOTHING;

-- Create trigger to add default notification settings for new users
CREATE OR REPLACE FUNCTION add_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_settings (user_id, notification_type, is_enabled)
    VALUES 
    (NEW.id, 'new_message', TRUE),
    (NEW.id, 'new_post', TRUE),
    (NEW.id, 'new_comment', TRUE),
    (NEW.id, 'new_like', TRUE),
    (NEW.id, 'new_follower', TRUE),
    (NEW.id, 'study_group_invite', TRUE),
    (NEW.id, 'university_announcement', TRUE);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_add_default_notification_settings
    AFTER INSERT ON users
    FOR EACH ROW
    WHEN (NEW.status = 'approved')
    EXECUTE FUNCTION add_default_notification_settings();
