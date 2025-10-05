-- =====================================================
-- TEST ONLINE STATUS FUNCTIONALITY
-- =====================================================
-- This script tests if the online_users table is working correctly
-- =====================================================

-- 1. Check if online_users table exists and has data
SELECT 'ONLINE USERS TABLE CHECK' as test_name;
SELECT * FROM online_users;

-- 2. Check if Alice exists and has a profile
SELECT 'ALICE USER CHECK' as test_name;
SELECT 
    u.id,
    u.name,
    u.is_active,
    u.last_login,
    p.is_profile_complete
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.name = 'Alice';

-- 3. Manually set Alice as online (simulate login)
SELECT 'MANUALLY SET ALICE ONLINE' as test_name;
INSERT INTO online_users (user_id, is_online, last_seen)
VALUES (
    (SELECT id FROM users WHERE name = 'Alice'),
    true,
    NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
    is_online = true,
    last_seen = NOW();

-- 4. Check Alice's online status
SELECT 'ALICE ONLINE STATUS' as test_name;
SELECT 
    u.name,
    ou.is_online,
    ou.last_seen,
    ou.created_at
FROM users u
JOIN online_users ou ON u.id = ou.user_id
WHERE u.name = 'Alice';

-- 5. Set Alice as offline (simulate logout)
SELECT 'SET ALICE OFFLINE' as test_name;
UPDATE online_users 
SET is_online = false, last_seen = NOW()
WHERE user_id = (SELECT id FROM users WHERE name = 'Alice');

-- 6. Check Alice's offline status
SELECT 'ALICE OFFLINE STATUS' as test_name;
SELECT 
    u.name,
    ou.is_online,
    ou.last_seen
FROM users u
JOIN online_users ou ON u.id = ou.user_id
WHERE u.name = 'Alice';

-- 7. Show all online users
SELECT 'ALL ONLINE USERS' as test_name;
SELECT 
    u.name,
    ou.is_online,
    ou.last_seen
FROM users u
JOIN online_users ou ON u.id = ou.user_id
WHERE ou.is_online = true;

-- 8. Show all users and their online status
SELECT 'ALL USERS STATUS' as test_name;
SELECT 
    u.name,
    CASE 
        WHEN ou.is_online IS NULL THEN 'Never logged in'
        WHEN ou.is_online = true THEN 'Online'
        WHEN ou.is_online = false THEN 'Offline'
    END as status,
    ou.last_seen
FROM users u
LEFT JOIN online_users ou ON u.id = ou.user_id
ORDER BY u.name;
