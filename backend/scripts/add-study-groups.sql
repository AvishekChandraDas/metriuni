-- Add study groups tables
CREATE TABLE IF NOT EXISTS study_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    is_private BOOLEAN DEFAULT FALSE,
    max_members INTEGER DEFAULT 20,
    member_count INTEGER DEFAULT 0,
    creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tags JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add study group members table
CREATE TABLE IF NOT EXISTS study_group_members (
    id SERIAL PRIMARY KEY,
    study_group_id INTEGER NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    message TEXT, -- Optional message when requesting to join
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    joined_at TIMESTAMP,
    UNIQUE(study_group_id, user_id)
);

-- Add study group invitations table
CREATE TABLE IF NOT EXISTS study_group_invitations (
    id SERIAL PRIMARY KEY,
    study_group_id INTEGER NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    inviter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    UNIQUE(study_group_id, invitee_id)
);

-- Add study group events table
CREATE TABLE IF NOT EXISTS study_group_events (
    id SERIAL PRIMARY KEY,
    study_group_id INTEGER NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) DEFAULT 'study_session' CHECK (event_type IN ('study_session', 'meeting', 'exam', 'assignment', 'presentation', 'other')),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    location VARCHAR(200),
    is_online BOOLEAN DEFAULT FALSE,
    meeting_link TEXT,
    max_attendees INTEGER,
    attendee_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add study group event attendees table
CREATE TABLE IF NOT EXISTS study_group_event_attendees (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES study_group_events(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

-- Update chat_rooms to support study groups
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS study_group_id INTEGER REFERENCES study_groups(id) ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_study_groups_creator_id ON study_groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_study_groups_subject ON study_groups(subject);
CREATE INDEX IF NOT EXISTS idx_study_groups_is_private ON study_groups(is_private);
CREATE INDEX IF NOT EXISTS idx_study_groups_created_at ON study_groups(created_at);
CREATE INDEX IF NOT EXISTS idx_study_groups_member_count ON study_groups(member_count);
CREATE INDEX IF NOT EXISTS idx_study_groups_tags ON study_groups USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_study_group_members_group_id ON study_group_members(study_group_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_user_id ON study_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_status ON study_group_members(status);
CREATE INDEX IF NOT EXISTS idx_study_group_members_role ON study_group_members(role);

CREATE INDEX IF NOT EXISTS idx_study_group_invitations_group_id ON study_group_invitations(study_group_id);
CREATE INDEX IF NOT EXISTS idx_study_group_invitations_invitee_id ON study_group_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_study_group_invitations_status ON study_group_invitations(status);
CREATE INDEX IF NOT EXISTS idx_study_group_invitations_expires_at ON study_group_invitations(expires_at);

CREATE INDEX IF NOT EXISTS idx_study_group_events_group_id ON study_group_events(study_group_id);
CREATE INDEX IF NOT EXISTS idx_study_group_events_creator_id ON study_group_events(creator_id);
CREATE INDEX IF NOT EXISTS idx_study_group_events_start_time ON study_group_events(start_time);
CREATE INDEX IF NOT EXISTS idx_study_group_events_event_type ON study_group_events(event_type);

CREATE INDEX IF NOT EXISTS idx_study_group_event_attendees_event_id ON study_group_event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_study_group_event_attendees_user_id ON study_group_event_attendees(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_study_group_id ON chat_rooms(study_group_id);

-- Function to create a chat room when a study group is created
CREATE OR REPLACE FUNCTION create_study_group_chat_room()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO chat_rooms (name, type, study_group_id, created_by)
    VALUES (NEW.name || ' Group Chat', 'group', NEW.id, NEW.creator_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for study group chat room creation
DROP TRIGGER IF EXISTS trigger_create_study_group_chat ON study_groups;
CREATE TRIGGER trigger_create_study_group_chat
    AFTER INSERT ON study_groups
    FOR EACH ROW
    EXECUTE FUNCTION create_study_group_chat_room();
