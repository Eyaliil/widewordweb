-- =====================================================
-- SIMPLIFIED SAMPLE DATA FOR MATCHING APP
-- =====================================================
-- This file contains basic sample data to test the app
-- Run this after setting up the database schema
-- =====================================================

-- =====================================================
-- 1. INSERT LOOKUP DATA (if not already inserted)
-- =====================================================

-- Genders
INSERT INTO genders (label) VALUES 
    ('Male'), ('Female'), ('Non-binary')
ON CONFLICT (label) DO NOTHING;

-- Pronouns
INSERT INTO pronouns (label) VALUES 
    ('He/Him'), ('She/Her'), ('They/Them')
ON CONFLICT (label) DO NOTHING;

-- Relationship types
INSERT INTO relationship_types (label) VALUES 
    ('Serious relationship'), ('Casual dating'), ('Friendship')
ON CONFLICT (label) DO NOTHING;

-- Vibes
INSERT INTO vibes (label) VALUES 
    ('Adventure seeker'), ('Homebody'), ('Social butterfly'), ('Creative soul'), ('Fitness enthusiast')
ON CONFLICT (label) DO NOTHING;

-- Interests
INSERT INTO interests (label, category) VALUES 
    ('Music', 'Entertainment'), ('Travel', 'Lifestyle'), ('Art', 'Creative'), ('Sports', 'Fitness'),
    ('Food', 'Lifestyle'), ('Nature', 'Outdoor'), ('Technology', 'Tech'), ('Fitness', 'Health'),
    ('Reading', 'Education'), ('Movies', 'Entertainment'), ('Photography', 'Creative'),
    ('Cooking', 'Lifestyle'), ('Dancing', 'Entertainment'), ('Gaming', 'Entertainment'),
    ('Hiking', 'Outdoor'), ('Yoga', 'Fitness'), ('Writing', 'Creative'), ('Coffee', 'Lifestyle')
ON CONFLICT (label) DO NOTHING;

-- =====================================================
-- 2. CREATE SAMPLE USERS
-- =====================================================

-- Simple sample users with ordered UUIDs
INSERT INTO users (id, email, password_hash) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'alex@example.com', '$2a$10$hashedpassword1'),
    ('00000000-0000-0000-0000-000000000002', 'sam@example.com', '$2a$10$hashedpassword2'),
    ('00000000-0000-0000-0000-000000000003', 'maya@example.com', '$2a$10$hashedpassword3'),
    ('00000000-0000-0000-0000-000000000004', 'jordan@example.com', '$2a$10$hashedpassword4'),
    ('00000000-0000-0000-0000-000000000005', 'zoe@example.com', '$2a$10$hashedpassword5');

-- =====================================================
-- 3. CREATE USER PROFILES
-- =====================================================

INSERT INTO profiles (user_id, name, age, gender_id, pronouns_id, city, bio, avatar_type, avatar_emoji, is_profile_complete) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Alex Johnson', 28, 
     (SELECT id FROM genders WHERE label = 'Male'), 
     (SELECT id FROM pronouns WHERE label = 'He/Him'), 
     'New York', 'Adventure seeker who loves hiking and photography.', 'emoji', '🧑‍💼', true),
    
    ('00000000-0000-0000-0000-000000000002', 'Sam Wilson', 25, 
     (SELECT id FROM genders WHERE label = 'Non-binary'), 
     (SELECT id FROM pronouns WHERE label = 'They/Them'), 
     'San Francisco', 'Creative soul who enjoys art and music.', 'emoji', '🎨', true),
    
    ('00000000-0000-0000-0000-000000000003', 'Maya Patel', 30, 
     (SELECT id FROM genders WHERE label = 'Female'), 
     (SELECT id FROM pronouns WHERE label = 'She/Her'), 
     'Los Angeles', 'Fitness enthusiast and food lover.', 'emoji', '🧘‍♀️', true),
    
    ('00000000-0000-0000-0000-000000000004', 'Jordan Smith', 26, 
     (SELECT id FROM genders WHERE label = 'Male'), 
     (SELECT id FROM pronouns WHERE label = 'He/Him'), 
     'Chicago', 'Tech geek who loves gaming.', 'emoji', '💻', true),
    
    ('00000000-0000-0000-0000-000000000005', 'Zoe Martinez', 24, 
     (SELECT id FROM genders WHERE label = 'Female'), 
     (SELECT id FROM pronouns WHERE label = 'She/Her'), 
     'Austin', 'Social butterfly who loves dancing.', 'emoji', '💃', true);

-- =====================================================
-- 4. ADD USER INTERESTS
-- =====================================================

-- Alex Johnson's interests
INSERT INTO user_interests (user_id, interest_id) VALUES 
    ('00000000-0000-0000-0000-000000000001', (SELECT id FROM interests WHERE label = 'Hiking')),
    ('00000000-0000-0000-0000-000000000001', (SELECT id FROM interests WHERE label = 'Photography')),
    ('00000000-0000-0000-0000-000000000001', (SELECT id FROM interests WHERE label = 'Food')),
    ('00000000-0000-0000-0000-000000000001', (SELECT id FROM interests WHERE label = 'Travel'));

-- Sam Wilson's interests
INSERT INTO user_interests (user_id, interest_id) VALUES 
    ('00000000-0000-0000-0000-000000000002', (SELECT id FROM interests WHERE label = 'Art')),
    ('00000000-0000-0000-0000-000000000002', (SELECT id FROM interests WHERE label = 'Music')),
    ('00000000-0000-0000-0000-000000000002', (SELECT id FROM interests WHERE label = 'Coffee')),
    ('00000000-0000-0000-0000-000000000002', (SELECT id FROM interests WHERE label = 'Writing'));

-- Maya Patel's interests
INSERT INTO user_interests (user_id, interest_id) VALUES 
    ('00000000-0000-0000-0000-000000000003', (SELECT id FROM interests WHERE label = 'Fitness')),
    ('00000000-0000-0000-0000-000000000003', (SELECT id FROM interests WHERE label = 'Food')),
    ('00000000-0000-0000-0000-000000000003', (SELECT id FROM interests WHERE label = 'Cooking')),
    ('00000000-0000-0000-0000-000000000003', (SELECT id FROM interests WHERE label = 'Yoga'));

-- Jordan Smith's interests
INSERT INTO user_interests (user_id, interest_id) VALUES 
    ('00000000-0000-0000-0000-000000000004', (SELECT id FROM interests WHERE label = 'Technology')),
    ('00000000-0000-0000-0000-000000000004', (SELECT id FROM interests WHERE label = 'Gaming')),
    ('00000000-0000-0000-0000-000000000004', (SELECT id FROM interests WHERE label = 'Hiking')),
    ('00000000-0000-0000-0000-000000000004', (SELECT id FROM interests WHERE label = 'Movies'));

-- Zoe Martinez's interests
INSERT INTO user_interests (user_id, interest_id) VALUES 
    ('00000000-0000-0000-0000-000000000005', (SELECT id FROM interests WHERE label = 'Dancing')),
    ('00000000-0000-0000-0000-000000000005', (SELECT id FROM interests WHERE label = 'Music')),
    ('00000000-0000-0000-0000-000000000005', (SELECT id FROM interests WHERE label = 'Travel')),
    ('00000000-0000-0000-0000-000000000005', (SELECT id FROM interests WHERE label = 'Food'));

-- =====================================================
-- 5. CREATE USER SEARCH PREFERENCES
-- =====================================================

INSERT INTO user_search_profile (user_id, min_age, max_age, genders, relationship_types, vibe_id, vibe_description) VALUES 
    ('00000000-0000-0000-0000-000000000001', 22, 35, 
     ARRAY[(SELECT id FROM genders WHERE label = 'Female'), (SELECT id FROM genders WHERE label = 'Non-binary')], 
     ARRAY[(SELECT id FROM relationship_types WHERE label = 'Serious relationship')],
     (SELECT id FROM vibes WHERE label = 'Adventure seeker'), 'Looking for adventure partner'),
    
    ('00000000-0000-0000-0000-000000000002', 20, 30, 
     ARRAY[(SELECT id FROM genders WHERE label = 'Male'), (SELECT id FROM genders WHERE label = 'Female'), (SELECT id FROM genders WHERE label = 'Non-binary')], 
     ARRAY[(SELECT id FROM relationship_types WHERE label = 'Serious relationship')],
     (SELECT id FROM vibes WHERE label = 'Creative soul'), 'Seeking creative connections'),
    
    ('00000000-0000-0000-0000-000000000003', 25, 35, 
     ARRAY[(SELECT id FROM genders WHERE label = 'Male'), (SELECT id FROM genders WHERE label = 'Non-binary')], 
     ARRAY[(SELECT id FROM relationship_types WHERE label = 'Serious relationship')],
     (SELECT id FROM vibes WHERE label = 'Fitness enthusiast'), 'Looking for fitness partner'),
    
    ('00000000-0000-0000-0000-000000000004', 22, 32, 
     ARRAY[(SELECT id FROM genders WHERE label = 'Female'), (SELECT id FROM genders WHERE label = 'Non-binary')], 
     ARRAY[(SELECT id FROM relationship_types WHERE label = 'Casual dating')],
     (SELECT id FROM vibes WHERE label = 'Social butterfly'), 'Seeking tech-savvy connections'),
    
    ('00000000-0000-0000-0000-000000000005', 20, 30, 
     ARRAY[(SELECT id FROM genders WHERE label = 'Male'), (SELECT id FROM genders WHERE label = 'Non-binary')], 
     ARRAY[(SELECT id FROM relationship_types WHERE label = 'Casual dating')],
     (SELECT id FROM vibes WHERE label = 'Social butterfly'), 'Looking for fun connections');

-- =====================================================
-- 6. CREATE SAMPLE MATCHES
-- =====================================================

-- Create a simple pending match (user1_id < user2_id for constraint)
INSERT INTO matches (user1_id, user2_id, match_score, match_reasons, user1_decision, user2_decision, status, created_at, expires_at) VALUES 
    ('00000000-0000-0000-0000-000000000001',  -- Alex (user1)
     '00000000-0000-0000-0000-000000000003',  -- Maya (user2)
     85, 
     ARRAY['Common interest in food', 'Similar age range'], 
     'pending', 'pending', 'pending', 
     NOW() - INTERVAL '2 hours', NOW() + INTERVAL '22 hours');

-- =====================================================
-- SAMPLE DATA COMPLETE
-- =====================================================

-- This simplified sample data provides:
-- ✅ 5 basic user profiles with complete information
-- ✅ Simple interests and preferences
-- ✅ One pending match to test the system
-- ✅ All necessary lookup data

-- You can now test the basic features of the app with this data!
-- To add more complex data, you can run additional INSERT statements as needed.
