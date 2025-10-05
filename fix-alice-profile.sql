-- =====================================================
-- DELETE ALICE'S EMPTY ENTRY AND REFILL HER DATA
-- =====================================================
-- This script removes Alice's incomplete data and creates a complete profile
-- =====================================================

-- 1. Delete Alice's existing incomplete data
DELETE FROM user_interests WHERE user_id = (SELECT id FROM users WHERE name = 'Alice');
DELETE FROM profiles WHERE user_id = (SELECT id FROM users WHERE name = 'Alice');
DELETE FROM users WHERE name = 'Alice';

-- 2. Create Alice with complete profile
INSERT INTO users (name, is_active, last_login) 
VALUES ('Alice', true, NOW());

-- 3. Create Alice's complete profile
INSERT INTO profiles (user_id, name, age, city, bio, avatar_type, avatar_emoji, is_profile_complete, gender_id, pronouns_id) 
VALUES (
    (SELECT id FROM users WHERE name = 'Alice'),
    'Alice',
    28,
    'San Francisco',
    'Love hiking, photography, and trying new restaurants! Looking for someone to explore the city with.',
    'emoji',
    '👩',
    true,
    (SELECT id FROM genders WHERE label = 'Female'),
    (SELECT id FROM pronouns WHERE label = 'She/Her')
);

-- 4. Add Alice's interests
INSERT INTO user_interests (user_id, interest_id)
SELECT 
    (SELECT id FROM users WHERE name = 'Alice'),
    id
FROM interests 
WHERE label IN ('Hiking', 'Photography', 'Food', 'Nature', 'Travel');

-- 5. Verify Alice's complete profile
SELECT 
    'ALICE PROFILE VERIFICATION' as status,
    u.name,
    u.is_active,
    u.last_login,
    p.age,
    p.city,
    p.bio,
    g.label as gender,
    pr.label as pronouns,
    p.avatar_emoji,
    p.is_profile_complete,
    array_agg(i.label) as interests
FROM users u
JOIN profiles p ON u.id = p.user_id
LEFT JOIN genders g ON p.gender_id = g.id
LEFT JOIN pronouns pr ON p.pronouns_id = pr.id
LEFT JOIN user_interests ui ON u.id = ui.user_id
LEFT JOIN interests i ON ui.interest_id = i.id
WHERE u.name = 'Alice'
GROUP BY u.name, u.is_active, u.last_login, p.age, p.city, p.bio, g.label, pr.label, p.avatar_emoji, p.is_profile_complete;

-- 6. Show all users to confirm Alice is properly set up
SELECT 
    'ALL USERS STATUS' as status,
    u.name,
    p.is_profile_complete,
    CASE 
        WHEN p.is_profile_complete THEN 'Ready for Matching'
        ELSE 'Profile Incomplete'
    END as status_description
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
ORDER BY u.name;
