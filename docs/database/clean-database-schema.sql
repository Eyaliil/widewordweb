-- =====================================================
-- CLEAN DATABASE SCHEMA FOR NAME-BASED DATING APP
-- =====================================================
-- This schema is optimized for the current app structure
-- - Name-based login (no passwords)
-- - Profile completion flow
-- - Matching system
-- - Notifications
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. DROP ALL EXISTING TABLES (CLEAN SLATE)
-- =====================================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS match_decisions CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS online_users CASCADE;
DROP TABLE IF EXISTS user_search_profile CASCADE;
DROP TABLE IF EXISTS user_interests CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop lookup tables
DROP TABLE IF EXISTS interests CASCADE;
DROP TABLE IF EXISTS vibes CASCADE;
DROP TABLE IF EXISTS relationship_types CASCADE;
DROP TABLE IF EXISTS pronouns CASCADE;
DROP TABLE IF EXISTS genders CASCADE;

-- Drop views
DROP VIEW IF EXISTS user_interests_view CASCADE;
DROP VIEW IF EXISTS matches_view CASCADE;
DROP VIEW IF EXISTS user_profiles_view CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS create_mutual_match_notification() CASCADE;
DROP FUNCTION IF EXISTS create_match_notification() CASCADE;
DROP FUNCTION IF EXISTS update_match_status() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- =====================================================
-- 2. LOOKUP TABLES (Reference Data)
-- =====================================================

-- Genders lookup table
CREATE TABLE genders (
    id SERIAL PRIMARY KEY,
    label VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pronouns lookup table
CREATE TABLE pronouns (
    id SERIAL PRIMARY KEY,
    label VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relationship types lookup table
CREATE TABLE relationship_types (
    id SERIAL PRIMARY KEY,
    label VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vibes lookup table
CREATE TABLE vibes (
    id SERIAL PRIMARY KEY,
    label VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interests lookup table
CREATE TABLE interests (
    id SERIAL PRIMARY KEY,
    label VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. USER MANAGEMENT TABLES
-- =====================================================

-- Main users table (name-based login)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table (matches app structure)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    age INTEGER CHECK (age >= 18 AND age <= 100),
    gender_id INTEGER REFERENCES genders(id),
    pronouns_id INTEGER REFERENCES pronouns(id),
    city VARCHAR(100),
    bio TEXT,
    avatar_type VARCHAR(20) DEFAULT 'emoji',
    avatar_emoji VARCHAR(10),
    avatar_image_url TEXT,
    avatar_initials VARCHAR(10),
    is_profile_complete BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_avatar CHECK (
        (avatar_type = 'emoji' AND avatar_emoji IS NOT NULL) OR
        (avatar_type = 'image' AND avatar_image_url IS NOT NULL) OR
        (avatar_type = 'initials' AND avatar_initials IS NOT NULL)
    )
);

-- User interests (many-to-many)
CREATE TABLE user_interests (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interest_id INTEGER NOT NULL REFERENCES interests(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, interest_id)
);

-- User search preferences (matches PreferencesForm)
CREATE TABLE user_search_profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    min_age INTEGER DEFAULT 18,
    max_age INTEGER DEFAULT 100,
    genders INTEGER[] DEFAULT '{}', -- Array of gender IDs
    relationship_types INTEGER[] DEFAULT '{}', -- Array of relationship type IDs
    vibe_id INTEGER REFERENCES vibes(id),
    vibe_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. MATCHING SYSTEM TABLES
-- =====================================================

-- Online users tracking
CREATE TABLE online_users (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_online BOOLEAN DEFAULT true,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Matches table (main matching records)
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
    match_reasons TEXT[],
    user1_decision VARCHAR(20) DEFAULT 'pending' CHECK (user1_decision IN ('pending', 'accepted', 'rejected')),
    user2_decision VARCHAR(20) DEFAULT 'pending' CHECK (user2_decision IN ('pending', 'accepted', 'rejected')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'mutual_match', 'rejected', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    
    CONSTRAINT valid_user_order CHECK (user1_id < user2_id),
    UNIQUE(user1_id, user2_id)
);

-- Match decisions history (audit trail)
CREATE TABLE match_decisions (
    id SERIAL PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('accepted', 'rejected')),
    decision_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    
    UNIQUE(match_id, user_id)
);

-- =====================================================
-- 5. NOTIFICATION SYSTEM TABLES
-- =====================================================

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    matched_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 6. INDEXES FOR PERFORMANCE
-- =====================================================

-- User indexes
CREATE INDEX idx_users_name ON users(name);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_complete ON profiles(is_profile_complete);
CREATE INDEX idx_profiles_city ON profiles(city);
CREATE INDEX idx_profiles_age ON profiles(age);

-- Matching indexes
CREATE INDEX idx_online_users_user_id ON online_users(user_id);
CREATE INDEX idx_online_users_online ON online_users(is_online);
CREATE INDEX idx_matches_user1 ON matches(user1_id);
CREATE INDEX idx_matches_user2 ON matches(user2_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_created_at ON matches(created_at);
CREATE INDEX idx_matches_expires_at ON matches(expires_at);
CREATE INDEX idx_matches_score ON matches(match_score);

-- Decision indexes
CREATE INDEX idx_match_decisions_match_id ON match_decisions(match_id);
CREATE INDEX idx_match_decisions_user_id ON match_decisions(user_id);
CREATE INDEX idx_match_decisions_timestamp ON match_decisions(decision_timestamp);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_type ON notifications(type);

-- =====================================================
-- 7. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_search_profile_updated_at BEFORE UPDATE ON user_search_profile FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update match status when both decisions are made
CREATE OR REPLACE FUNCTION update_match_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user1_decision != 'pending' AND NEW.user2_decision != 'pending' THEN
        NEW.completed_at = NOW();
        
        IF NEW.user1_decision = 'accepted' AND NEW.user2_decision = 'accepted' THEN
            NEW.status = 'mutual_match';
        ELSE
            NEW.status = 'rejected';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update match status
CREATE TRIGGER update_match_status_trigger 
    BEFORE UPDATE ON matches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_match_status();

-- Function to create notification when match is created
CREATE OR REPLACE FUNCTION create_match_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, message, match_id, matched_user_id)
    VALUES (
        NEW.user1_id,
        'new_match',
        'New Match!',
        'You have a new potential match waiting for your decision.',
        NEW.id,
        NEW.user2_id
    );
    
    INSERT INTO notifications (user_id, type, title, message, match_id, matched_user_id)
    VALUES (
        NEW.user2_id,
        'new_match',
        'New Match!',
        'You have a new potential match waiting for your decision.',
        NEW.id,
        NEW.user1_id
    );
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create match notifications
CREATE TRIGGER create_match_notification_trigger 
    AFTER INSERT ON matches 
    FOR EACH ROW 
    EXECUTE FUNCTION create_match_notification();

-- Function to create mutual match notification
CREATE OR REPLACE FUNCTION create_mutual_match_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'mutual_match' AND OLD.status != 'mutual_match' THEN
        INSERT INTO notifications (user_id, type, title, message, match_id, matched_user_id)
        VALUES (
            NEW.user1_id,
            'mutual_match',
            'Mutual Match! 🎉',
            'Congratulations! You both accepted each other.',
            NEW.id,
            NEW.user2_id
        );
        
        INSERT INTO notifications (user_id, type, title, message, match_id, matched_user_id)
        VALUES (
            NEW.user2_id,
            'mutual_match',
            'Mutual Match! 🎉',
            'Congratulations! You both accepted each other.',
            NEW.id,
            NEW.user1_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create mutual match notifications
CREATE TRIGGER create_mutual_match_notification_trigger 
    AFTER UPDATE ON matches 
    FOR EACH ROW 
    EXECUTE FUNCTION create_mutual_match_notification();

-- =====================================================
-- 8. INSERT SAMPLE DATA
-- =====================================================

-- Insert lookup data
INSERT INTO genders (label) VALUES 
    ('Male'), ('Female'), ('Non-binary'), ('Prefer not to say');

INSERT INTO pronouns (label) VALUES 
    ('He/Him'), ('She/Her'), ('They/Them'), ('He/They'), ('She/They'), ('Other');

INSERT INTO relationship_types (label) VALUES 
    ('Serious relationship'), ('Casual dating'), ('Friendship'), ('Something casual'), ('Not sure yet');

INSERT INTO vibes (label) VALUES 
    ('Adventure seeker'), ('Homebody'), ('Social butterfly'), ('Introvert'), ('Creative soul'), 
    ('Fitness enthusiast'), ('Food lover'), ('Traveler'), ('Bookworm'), ('Tech geek');

INSERT INTO interests (label, category) VALUES 
    ('Music', 'Entertainment'), ('Travel', 'Lifestyle'), ('Art', 'Creative'), ('Sports', 'Fitness'),
    ('Food', 'Lifestyle'), ('Nature', 'Outdoor'), ('Technology', 'Tech'), ('Fitness', 'Health'),
    ('Reading', 'Education'), ('Movies', 'Entertainment'), ('Photography', 'Creative'),
    ('Cooking', 'Lifestyle'), ('Dancing', 'Entertainment'), ('Gaming', 'Entertainment'),
    ('Hiking', 'Outdoor'), ('Yoga', 'Fitness'), ('Writing', 'Creative'), ('Volunteering', 'Social');

-- =====================================================
-- 9. CREATE VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for user profiles with lookup data
CREATE VIEW user_profiles_view AS
SELECT 
    p.id,
    p.user_id,
    p.name,
    p.age,
    g.label as gender,
    pr.label as pronouns,
    p.city,
    p.bio,
    p.avatar_type,
    p.avatar_emoji,
    p.avatar_image_url,
    p.avatar_initials,
    p.is_profile_complete,
    p.created_at,
    p.updated_at
FROM profiles p
LEFT JOIN genders g ON p.gender_id = g.id
LEFT JOIN pronouns pr ON p.pronouns_id = pr.id;

-- View for matches with user details
CREATE VIEW matches_view AS
SELECT 
    m.id,
    m.user1_id,
    m.user2_id,
    u1.name as user1_name,
    u2.name as user2_name,
    m.match_score,
    m.match_reasons,
    m.user1_decision,
    m.user2_decision,
    m.status,
    m.created_at,
    m.completed_at,
    m.expires_at
FROM matches m
JOIN profiles u1 ON m.user1_id = u1.user_id
JOIN profiles u2 ON m.user2_id = u2.user_id;

-- View for user interests
CREATE VIEW user_interests_view AS
SELECT 
    ui.user_id,
    ui.interest_id,
    i.label as interest_name,
    i.category as interest_category,
    ui.created_at
FROM user_interests ui
JOIN interests i ON ui.interest_id = i.id;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

-- Display success message
SELECT 'Clean database setup completed successfully!' as message;
