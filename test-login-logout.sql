-- =====================================================
-- TEST LOGIN/LOGOUT FUNCTIONALITY
-- =====================================================
-- This script tests that users can logout and login again
-- with the same name while preserving all their information
-- =====================================================

-- 1. Create a test user "Alice" with complete profile
INSERT INTO users (name, is_active, last_login) 
VALUES ('Alice', true, NOW())
ON CONFLICT (name) DO UPDATE SET 
    last_login = NOW(),
    is_active = true;

-- 2. Set up Alice's complete profile
UPDATE profiles 
SET 
    name = 'Alice',
    age = 28,
    city = 'San Francisco',
    bio = 'Love hiking, photography, and trying new restaurants! Looking for someone to explore the city with.',
    avatar_type = 'emoji',
    avatar_emoji = '👩',
    is_profile_complete = true,
    gender_id = (SELECT id FROM genders WHERE label = 'Female'),
    pronouns_id = (SELECT id FROM pronouns WHERE label = 'She/Her')
WHERE user_id = (SELECT id FROM users WHERE name = 'Alice');

-- 3. Add Alice's interests
INSERT INTO user_interests (user_id, interest_id)
SELECT 
    (SELECT id FROM users WHERE name = 'Alice'),
    id
FROM interests 
WHERE label IN ('Hiking', 'Photography', 'Food', 'Nature', 'Travel')
ON CONFLICT (user_id, interest_id) DO NOTHING;

-- 4. Verify Alice's profile is complete
SELECT 
    'BEFORE LOGOUT' as test_phase,
    p.name,
    p.age,
    p.city,
    p.bio,
    g.label as gender,
    pr.label as pronouns,
    p.avatar_emoji,
    p.is_profile_complete,
    array_agg(i.label) as interests
FROM profiles p
LEFT JOIN genders g ON p.gender_id = g.id
LEFT JOIN pronouns pr ON p.pronouns_id = pr.id
LEFT JOIN user_interests ui ON p.user_id = ui.user_id
LEFT JOIN interests i ON ui.interest_id = i.id
WHERE p.user_id = (SELECT id FROM users WHERE name = 'Alice')
GROUP BY p.name, p.age, p.city, p.bio, g.label, pr.label, p.avatar_emoji, p.is_profile_complete;

-- 5. Simulate logout (in real app, this just clears the session)
-- The data remains in the database

-- 6. Simulate login again (this is what happens when user logs back in)
-- Update last_login timestamp (this happens automatically in the app)
UPDATE users 
SET last_login = NOW()
WHERE name = 'Alice';

-- 7. Verify Alice's profile is still complete after "login"
SELECT 
    'AFTER LOGIN' as test_phase,
    p.name,
    p.age,
    p.city,
    p.bio,
    g.label as gender,
    pr.label as pronouns,
    p.avatar_emoji,
    p.is_profile_complete,
    array_agg(i.label) as interests
FROM profiles p
LEFT JOIN genders g ON p.gender_id = g.id
LEFT JOIN pronouns pr ON p.pronouns_id = pr.id
LEFT JOIN user_interests ui ON p.user_id = ui.user_id
LEFT JOIN interests i ON ui.interest_id = i.id
WHERE p.user_id = (SELECT id FROM users WHERE name = 'Alice')
GROUP BY p.name, p.age, p.city, p.bio, g.label, pr.label, p.avatar_emoji, p.is_profile_complete;

-- 8. Test that the loginWithName function would work correctly
-- This simulates what happens in the app when Alice logs in again
SELECT 
    'LOGIN SIMULATION' as test_phase,
    u.id,
    u.name,
    u.is_active,
    u.last_login,
    p.is_profile_complete,
    CASE 
        WHEN p.is_profile_complete THEN 'Profile Complete - Ready for Matching'
        ELSE 'Profile Incomplete - Needs Setup'
    END as status
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.name = 'Alice';

-- =====================================================
-- EXPECTED RESULTS:
-- =====================================================
-- 1. Alice's profile should be complete before logout
-- 2. Alice's profile should remain complete after login
-- 3. All interests, bio, age, city, etc. should be preserved
-- 4. The login simulation should show "Profile Complete - Ready for Matching"
-- =====================================================
