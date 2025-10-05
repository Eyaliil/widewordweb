-- =====================================================
-- QUICK SETUP WITH SAMPLE DATA
-- =====================================================
-- Run this after clean-database-schema.sql to add test users
-- =====================================================

-- Create test users with complete profiles
INSERT INTO users (name, is_active, last_login) VALUES 
    ('Alice', true, NOW()),
    ('Bob', true, NOW()),
    ('Carol', true, NOW()),
    ('David', true, NOW());

-- Create complete profiles for test users
INSERT INTO profiles (user_id, name, age, city, bio, avatar_type, avatar_emoji, is_profile_complete, gender_id, pronouns_id) VALUES 
    ((SELECT id FROM users WHERE name = 'Alice'), 'Alice', 28, 'San Francisco', 'Love hiking, photography, and trying new restaurants! Looking for someone to explore the city with.', 'emoji', '👩', true, (SELECT id FROM genders WHERE label = 'Female'), (SELECT id FROM pronouns WHERE label = 'She/Her')),
    ((SELECT id FROM users WHERE name = 'Bob'), 'Bob', 30, 'New York', 'Tech enthusiast and coffee lover. Always up for a good conversation and exploring new places.', 'emoji', '👨', true, (SELECT id FROM genders WHERE label = 'Male'), (SELECT id FROM pronouns WHERE label = 'He/Him')),
    ((SELECT id FROM users WHERE name = 'Carol'), 'Carol', 26, 'Seattle', 'Artist and nature enthusiast. Love painting, hiking, and finding inspiration in everyday moments.', 'emoji', '👩', true, (SELECT id FROM genders WHERE label = 'Female'), (SELECT id FROM pronouns WHERE label = 'She/Her')),
    ((SELECT id FROM users WHERE name = 'David'), 'David', 32, 'Los Angeles', 'Fitness enthusiast and foodie. Love cooking, working out, and discovering new restaurants.', 'emoji', '👨', true, (SELECT id FROM genders WHERE label = 'Male'), (SELECT id FROM pronouns WHERE label = 'He/Him'));

-- Add interests for each user
INSERT INTO user_interests (user_id, interest_id)
SELECT 
    (SELECT id FROM users WHERE name = 'Alice'),
    id
FROM interests 
WHERE label IN ('Hiking', 'Photography', 'Food', 'Nature', 'Travel');

INSERT INTO user_interests (user_id, interest_id)
SELECT 
    (SELECT id FROM users WHERE name = 'Bob'),
    id
FROM interests 
WHERE label IN ('Technology', 'Coffee', 'Gaming', 'Movies', 'Music');

INSERT INTO user_interests (user_id, interest_id)
SELECT 
    (SELECT id FROM users WHERE name = 'Carol'),
    id
FROM interests 
WHERE label IN ('Art', 'Nature', 'Hiking', 'Reading', 'Writing');

INSERT INTO user_interests (user_id, interest_id)
SELECT 
    (SELECT id FROM users WHERE name = 'David'),
    id
FROM interests 
WHERE label IN ('Fitness', 'Food', 'Cooking', 'Sports', 'Yoga');

-- Create some test matches
INSERT INTO matches (user1_id, user2_id, match_score, match_reasons)
SELECT 
    LEAST(
        (SELECT id FROM users WHERE name = 'Alice'),
        (SELECT id FROM users WHERE name = 'Bob')
    ) as user1_id,
    GREATEST(
        (SELECT id FROM users WHERE name = 'Alice'),
        (SELECT id FROM users WHERE name = 'Bob')
    ) as user2_id,
    85,
    ARRAY['Shared interests: Nature, Food', 'Similar age range', 'Both active users'];

INSERT INTO matches (user1_id, user2_id, match_score, match_reasons)
SELECT 
    LEAST(
        (SELECT id FROM users WHERE name = 'Carol'),
        (SELECT id FROM users WHERE name = 'David')
    ) as user1_id,
    GREATEST(
        (SELECT id FROM users WHERE name = 'Carol'),
        (SELECT id FROM users WHERE name = 'David')
    ) as user2_id,
    78,
    ARRAY['Shared interests: Nature, Fitness', 'Complementary personalities', 'Both creative types'];

-- Verify the setup
SELECT 
    'SETUP COMPLETE' as status,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM profiles WHERE is_profile_complete = true) as complete_profiles,
    (SELECT COUNT(*) FROM matches) as total_matches,
    (SELECT COUNT(*) FROM interests) as available_interests;

-- Show sample user data
SELECT 
    u.name,
    p.age,
    p.city,
    p.bio,
    g.label as gender,
    pr.label as pronouns,
    p.is_profile_complete,
    array_agg(i.label) as interests
FROM users u
JOIN profiles p ON u.id = p.user_id
LEFT JOIN genders g ON p.gender_id = g.id
LEFT JOIN pronouns pr ON p.pronouns_id = pr.id
LEFT JOIN user_interests ui ON u.id = ui.user_id
LEFT JOIN interests i ON ui.interest_id = i.id
GROUP BY u.name, p.age, p.city, p.bio, g.label, pr.label, p.is_profile_complete
ORDER BY u.name;
