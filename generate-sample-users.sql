-- =====================================================
-- GENERATE SAMPLE USERS WITH COMPLETE PROFILES
-- =====================================================
-- This script creates multiple users with complete profiles
-- for testing the dating app functionality
-- =====================================================

-- Insert sample users
INSERT INTO users (id, name, is_active, created_at, updated_at) VALUES
-- User 1: Sarah
('0184a84d-6f94-4a8d-bc2b-4f35267f3d81', 'Sarah', true, NOW(), NOW()),

-- User 2: Alex
('0184a84d-6f94-4a8d-bc2b-4f35267f3d82', 'Alex', true, NOW(), NOW()),

-- User 3: Michael
('0184a84d-6f94-4a8d-bc2b-4f35267f3d83', 'Michael', true, NOW(), NOW()),

-- User 4: Emma
('0184a84d-6f94-4a8d-bc2b-4f35267f3d84', 'Emma', true, NOW(), NOW()),


-- User 5: Jessica
('0184a84d-6f94-4a8d-bc2b-4f35267f3d86', 'Jessica', true, NOW(), NOW()),

-- User 6: Ryan
('0184a84d-6f94-4a8d-bc2b-4f35267f3d87', 'Ryan', true, NOW(), NOW()),

-- User 7: Maya
('0184a84d-6f94-4a8d-bc2b-4f35267f3d88', 'Maya', true, NOW(), NOW()),

-- User 8: Chris
('0184a84d-6f94-4a8d-bc2b-4f35267f3d89', 'Chris', true, NOW(), NOW()),

-- User 9: Zoe
('0184a84d-6f94-4a8d-bc2b-4f35267f3d90', 'Zoe', true, NOW(), NOW()),

-- User 10: James
('0184a84d-6f94-4a8d-bc2b-4f35267f3d91', 'James', true, NOW(), NOW()),

-- User 11: Lily
('0184a84d-6f94-4a8d-bc2b-4f35267f3d92', 'Lily', true, NOW(), NOW()),

-- User 12: Marcus
('0184a84d-6f94-4a8d-bc2b-4f35267f3d93', 'Marcus', true, NOW(), NOW()),

-- User 13: Sophie
('0184a84d-6f94-4a8d-bc2b-4f35267f3d94', 'Sophie', true, NOW(), NOW()),

-- User 14: Tyler
('0184a84d-6f94-4a8d-bc2b-4f35267f3d95', 'Tyler', true, NOW(), NOW());

-- Insert corresponding profiles
INSERT INTO profiles (user_id, name, age, gender_id, pronouns_id, city, bio, avatar_emoji, is_profile_complete, created_at, updated_at) VALUES
-- Profile 1: Sarah
('0184a84d-6f94-4a8d-bc2b-4f35267f3d81', 'Sarah', 25, 2, 1, 'New York', 'Love hiking, photography, and trying new restaurants. Looking for someone to explore the city with!', '📸', true, NOW(), NOW()),

-- Profile 2: Alex
('0184a84d-6f94-4a8d-bc2b-4f35267f3d82', 'Alex', 28, 3, 2, 'San Francisco', 'Software engineer by day, musician by night. Love indie music and board games.', '🎵', true, NOW(), NOW()),

-- Profile 3: Michael
('0184a84d-6f94-4a8d-bc2b-4f35267f3d83', 'Michael', 30, 1, 1, 'Los Angeles', 'Actor and fitness enthusiast. Always up for outdoor adventures and good conversations.', '💪', true, NOW(), NOW()),

-- Profile 4: Emma
('0184a84d-6f94-4a8d-bc2b-4f35267f3d84', 'Emma', 26, 2, 1, 'Chicago', 'Graphic designer who loves art galleries and weekend brunches. Looking for someone creative and kind.', '🎨', true, NOW(), NOW()),

-- Profile 6: Jessica
('0184a84d-6f94-4a8d-bc2b-4f35267f3d86', 'Jessica', 24, 2, 1, 'Austin', 'Music producer and dog lover. Always down for live music and dog park adventures.', '🐕', true, NOW(), NOW()),

-- Profile 7: Ryan
('0184a84d-6f94-4a8d-bc2b-4f35267f3d87', 'Ryan', 29, 1, 1, 'Denver', 'Outdoor guide and photographer. Love mountains, craft beer, and stargazing.', '🏔️', true, NOW(), NOW()),

-- Profile 8: Maya
('0184a84d-6f94-4a8d-bc2b-4f35267f3d88', 'Maya', 27, 2, 1, 'Portland', 'Yoga instructor and wellness coach. Passionate about mindfulness and healthy living.', '🧘‍♀️', true, NOW(), NOW()),

-- Profile 9: Chris
('0184a84d-6f94-4a8d-bc2b-4f35267f3d89', 'Chris', 31, 1, 1, 'Boston', 'Marine biologist and scuba diver. Love the ocean, science, and adventure travel.', '🐠', true, NOW(), NOW()),

-- Profile 10: Zoe
('0184a84d-6f94-4a8d-bc2b-4f35267f3d90', 'Zoe', 23, 2, 1, 'Miami', 'Dance instructor and beach enthusiast. Always up for salsa dancing and beach volleyball.', '💃', true, NOW(), NOW()),

-- Profile 11: James
('0184a84d-6f94-4a8d-bc2b-4f35267f3d91', 'James', 35, 1, 1, 'Phoenix', 'Architect and urban planner. Love design, sustainability, and exploring new cities.', '🏗️', true, NOW(), NOW()),

-- Profile 12: Lily
('0184a84d-6f94-4a8d-bc2b-4f35267f3d92', 'Lily', 26, 2, 1, 'Nashville', 'Singer-songwriter and music teacher. Love country music and teaching kids.', '🎤', true, NOW(), NOW()),

-- Profile 13: Marcus
('0184a84d-6f94-4a8d-bc2b-4f35267f3d93', 'Marcus', 28, 1, 1, 'Atlanta', 'Sports journalist and basketball fan. Love writing, sports, and good BBQ.', '🏀', true, NOW(), NOW()),

-- Profile 14: Sophie
('0184a84d-6f94-4a8d-bc2b-4f35267f3d94', 'Sophie', 25, 2, 1, 'Minneapolis', 'Environmental scientist and climate activist. Passionate about saving the planet.', '🌱', true, NOW(), NOW()),

-- Profile 15: Tyler
('0184a84d-6f94-4a8d-bc2b-4f35267f3d95', 'Tyler', 30, 1, 1, 'Las Vegas', 'Event planner and party enthusiast. Love organizing events and meeting new people.', '🎉', true, NOW(), NOW());

-- =====================================================
-- SAMPLE USERS CREATED SUCCESSFULLY
-- =====================================================
-- Created 14 diverse users with complete profiles:
-- 
-- 1. Sarah (25, Female, NYC) - Photographer/Hiker
-- 2. Alex (28, Non-binary, SF) - Software Engineer/Musician  
-- 3. Michael (30, Male, LA) - Actor/Fitness Enthusiast
-- 4. Emma (26, Female, Chicago) - Graphic Designer
-- 5. Jessica (24, Female, Austin) - Music Producer/Dog Lover
-- 6. Ryan (29, Male, Denver) - Outdoor Guide/Photographer
-- 7. Maya (27, Female, Portland) - Yoga Instructor/Wellness Coach
-- 8. Chris (31, Male, Boston) - Marine Biologist/Scuba Diver
-- 9. Zoe (23, Female, Miami) - Dance Instructor/Beach Enthusiast
-- 10. James (35, Male, Phoenix) - Architect/Urban Planner
-- 11. Lily (26, Female, Nashville) - Singer-songwriter/Music Teacher
-- 12. Marcus (28, Male, Atlanta) - Sports Journalist/Basketball Fan
-- 13. Sophie (25, Female, Minneapolis) - Environmental Scientist/Climate Activist
-- 14. Tyler (30, Male, Las Vegas) - Event Planner/Party Enthusiast
-- 
-- Gender IDs: 1=Male, 2=Female, 3=Non-binary
-- Pronouns IDs: 1=he/him, 2=they/them, 3=she/her
-- 
-- All users have:
-- ✅ Complete profiles with bios and avatars
-- ✅ Unique avatar emojis
-- ✅ Diverse ages (23-35), genders, and locations
-- ✅ Realistic bios and interests
-- ✅ Active status and profile completion flags
-- =====================================================
