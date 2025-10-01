-- =====================================================
-- COMPLETE DATABASE SCHEMA FOR MATCHING APP
-- =====================================================
-- This schema supports all features built in the app:
-- - User profiles and preferences
-- - Matching algorithm and compatibility scoring
-- - Bidirectional decision making
-- - Match history and notifications
-- - Real-time status tracking
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. LOOKUP TABLES (Reference Data)
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
-- 2. USER MANAGEMENT TABLES
-- =====================================================

-- Main users table (authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 18 AND age <= 100),
    gender_id INTEGER NOT NULL REFERENCES genders(id),
    pronouns_id INTEGER REFERENCES pronouns(id),
    city VARCHAR(100) NOT NULL,
    bio TEXT,
    avatar_type VARCHAR(20) DEFAULT 'emoji', -- 'emoji', 'image', 'initials'
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

-- User search preferences
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
-- 3. MATCHING SYSTEM TABLES
-- =====================================================

-- Online users tracking
CREATE TABLE online_users (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_online BOOLEAN DEFAULT true,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    preferences JSONB, -- Store matching preferences as JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Matches table (main matching records)
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
    match_reasons TEXT[], -- Array of compatibility reasons
    user1_decision VARCHAR(20) DEFAULT 'pending' CHECK (user1_decision IN ('pending', 'accepted', 'rejected')),
    user2_decision VARCHAR(20) DEFAULT 'pending' CHECK (user2_decision IN ('pending', 'accepted', 'rejected')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'mutual_match', 'rejected', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    
    -- Ensure user1_id < user2_id for consistency
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
    
    UNIQUE(match_id, user_id) -- One decision per user per match
);

-- =====================================================
-- 4. NOTIFICATION SYSTEM TABLES
-- =====================================================

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'new_match', 'mutual_match', 'match_expired', etc.
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    matched_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 5. ANALYTICS AND REPORTING TABLES
-- =====================================================

-- Match analytics
CREATE TABLE match_analytics (
    id SERIAL PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    compatibility_factors JSONB, -- Store detailed compatibility analysis
    algorithm_version VARCHAR(20) DEFAULT '1.0',
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activity tracking
CREATE TABLE user_activity (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'login', 'profile_update', 'match_created', 'decision_made', etc.
    activity_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. INDEXES FOR PERFORMANCE
-- =====================================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
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

-- Activity indexes
CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX idx_user_activity_created_at ON user_activity(created_at);

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_search_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User interests policies
CREATE POLICY "Users can view own interests" ON user_interests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own interests" ON user_interests FOR ALL USING (auth.uid() = user_id);

-- Search profile policies
CREATE POLICY "Users can view own search profile" ON user_search_profile FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own search profile" ON user_search_profile FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own search profile" ON user_search_profile FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Online users policies
CREATE POLICY "Users can view own online status" ON online_users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own online status" ON online_users FOR ALL USING (auth.uid() = user_id);

-- Matches policies (users can see matches they're involved in)
CREATE POLICY "Users can view own matches" ON matches FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users can update own match decisions" ON matches FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Match decisions policies
CREATE POLICY "Users can view own match decisions" ON match_decisions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own match decisions" ON match_decisions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Activity policies
CREATE POLICY "Users can view own activity" ON user_activity FOR SELECT USING (auth.uid() = user_id);

-- Public read access for lookup tables
CREATE POLICY "Anyone can read lookup tables" ON genders FOR SELECT USING (true);
CREATE POLICY "Anyone can read lookup tables" ON pronouns FOR SELECT USING (true);
CREATE POLICY "Anyone can read lookup tables" ON relationship_types FOR SELECT USING (true);
CREATE POLICY "Anyone can read lookup tables" ON vibes FOR SELECT USING (true);
CREATE POLICY "Anyone can read lookup tables" ON interests FOR SELECT USING (true);

-- =====================================================
-- 8. FUNCTIONS AND TRIGGERS
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
    -- Check if both users have made decisions
    IF NEW.user1_decision != 'pending' AND NEW.user2_decision != 'pending' THEN
        NEW.completed_at = NOW();
        
        -- Determine final status
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
    -- Create notification for user1
    INSERT INTO notifications (user_id, type, title, message, match_id, matched_user_id)
    VALUES (
        NEW.user1_id,
        'new_match',
        'New Match!',
        'You have a new potential match waiting for your decision.',
        NEW.id,
        NEW.user2_id
    );
    
    -- Create notification for user2
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
    -- Only create notification when status changes to mutual_match
    IF NEW.status = 'mutual_match' AND OLD.status != 'mutual_match' THEN
        -- Create notification for user1
        INSERT INTO notifications (user_id, type, title, message, match_id, matched_user_id)
        VALUES (
            NEW.user1_id,
            'mutual_match',
            'Mutual Match! 🎉',
            'Congratulations! You both accepted each other.',
            NEW.id,
            NEW.user2_id
        );
        
        -- Create notification for user2
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
-- 9. SAMPLE DATA INSERTION
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
-- 10. VIEWS FOR COMMON QUERIES
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
-- SCHEMA COMPLETE
-- =====================================================

-- This schema supports:
-- ✅ User profiles and preferences
-- ✅ Matching algorithm with compatibility scoring
-- ✅ Bidirectional decision making
-- ✅ Match history and status tracking
-- ✅ Notification system
-- ✅ Activity tracking and analytics
-- ✅ Row Level Security
-- ✅ Performance optimization with indexes
-- ✅ Automated triggers and functions
-- ✅ Sample data for testing
