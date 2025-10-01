-- ==============================================
-- POPULATE DATABASE WITH FAKE USERS
-- ==============================================

-- First, ensure all lookup tables have data
INSERT INTO public.interests (label) VALUES 
    ('Music'), ('Travel'), ('Art'), ('Sports'), ('Food'), ('Nature'), ('Technology'), ('Fitness'),
    ('Hiking'), ('Coffee'), ('Photography'), ('Dancing'), ('Gaming'), ('Yoga'), ('Sustainability'),
    ('Cooking'), ('Reading'), ('Movies'), ('Animals'), ('Adventure'), ('Mountain Biking'), ('Craft Beer'),
    ('Beach'), ('Fashion'), ('Writing'), ('Literature'), ('City Exploration'), ('Health'), ('Outdoor Activities')
ON CONFLICT (label) DO NOTHING;

INSERT INTO public.genders (label) VALUES 
    ('Man'), ('Woman'), ('Non-binary'), ('Genderfluid'), ('Agender'),
    ('Bigender'), ('Demigender'), ('Two-spirit'), ('Other')
ON CONFLICT (label) DO NOTHING;

INSERT INTO public.pronouns (label) VALUES 
    ('He/Him'), ('She/Her'), ('They/Them'), ('He/They'), ('She/They'),
    ('It/Its'), ('Xe/Xem'), ('Ze/Zir'), ('Other')
ON CONFLICT (label) DO NOTHING;

INSERT INTO public.relationship_types (label) VALUES 
    ('Casual Dating'), ('Serious Relationship'), ('Marriage'), 
    ('Friendship'), ('Something Casual'), ('Long-term'), ('Open Relationship')
ON CONFLICT (label) DO NOTHING;

INSERT INTO public.vibes (label) VALUES 
    ('Adventure'), ('Romantic'), ('Fun'), ('Intellectual'), ('Creative'),
    ('Athletic'), ('Spiritual'), ('Chill'), ('Energetic'), ('Mysterious')
ON CONFLICT (label) DO NOTHING;

-- ==============================================
-- INSERT FAKE USERS INTO PROFILES TABLE
-- ==============================================

-- Generate fake UUIDs for users (these are fake UUIDs for testing)
INSERT INTO public.profiles (id, name, age, gender, pronouns, city, bio) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'Alex Johnson', 28, 'Non-binary', 'They/Them', 'San Francisco', 'Love hiking, coffee, and good conversations. Looking for someone to explore the city with!'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Sarah Chen', 25, 'Woman', 'She/Her', 'New York', 'Artist and yoga instructor. Passionate about sustainable living and creative expression.'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Marcus Rodriguez', 32, 'Man', 'He/Him', 'Austin', 'Software engineer by day, musician by night. Love live music and trying new restaurants.'),
    ('550e8400-e29b-41d4-a716-446655440004', 'Jordan Kim', 26, 'Woman', 'She/Her', 'Seattle', 'Book lover and nature enthusiast. Always up for a good adventure or cozy night in.'),
    ('550e8400-e29b-41d4-a716-446655440005', 'Taylor Williams', 30, 'Non-binary', 'They/Them', 'Portland', 'Fitness enthusiast and dog lover. Looking for someone who shares my active lifestyle.'),
    ('550e8400-e29b-41d4-a716-446655440006', 'Riley Davis', 27, 'Man', 'He/Him', 'Denver', 'Mountain biker and craft beer enthusiast. Love exploring new trails and breweries.'),
    ('550e8400-e29b-41d4-a716-446655440007', 'Casey Brown', 24, 'Woman', 'She/Her', 'Miami', 'Dancer and beach lover. Always dancing to the rhythm of life and looking for my perfect partner.'),
    ('550e8400-e29b-41d4-a716-446655440008', 'Morgan Lee', 29, 'Non-binary', 'They/Them', 'Chicago', 'Writer and coffee shop enthusiast. Love deep conversations and exploring the city.')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    age = EXCLUDED.age,
    gender = EXCLUDED.gender,
    pronouns = EXCLUDED.pronouns,
    city = EXCLUDED.city,
    bio = EXCLUDED.bio;

-- ==============================================
-- INSERT USER INTERESTS (ABOUT ME)
-- ==============================================

-- Get interest IDs for mapping
WITH interest_map AS (
    SELECT id, label FROM public.interests
),
user_interests_data AS (
    SELECT 
        '550e8400-e29b-41d4-a716-446655440001'::uuid as user_id,
        unnest(ARRAY['Hiking', 'Coffee', 'Photography', 'Travel']) as interest_label
    UNION ALL
    SELECT 
        '550e8400-e29b-41d4-a716-446655440002'::uuid as user_id,
        unnest(ARRAY['Art', 'Yoga', 'Sustainability', 'Music']) as interest_label
    UNION ALL
    SELECT 
        '550e8400-e29b-41d4-a716-446655440003'::uuid as user_id,
        unnest(ARRAY['Music', 'Technology', 'Food', 'Gaming']) as interest_label
    UNION ALL
    SELECT 
        '550e8400-e29b-41d4-a716-446655440004'::uuid as user_id,
        unnest(ARRAY['Reading', 'Nature', 'Travel', 'Cooking']) as interest_label
    UNION ALL
    SELECT 
        '550e8400-e29b-41d4-a716-446655440005'::uuid as user_id,
        unnest(ARRAY['Fitness', 'Animals', 'Outdoor Activities', 'Health']) as interest_label
    UNION ALL
    SELECT 
        '550e8400-e29b-41d4-a716-446655440006'::uuid as user_id,
        unnest(ARRAY['Mountain Biking', 'Craft Beer', 'Adventure', 'Sports']) as interest_label
    UNION ALL
    SELECT 
        '550e8400-e29b-41d4-a716-446655440007'::uuid as user_id,
        unnest(ARRAY['Dancing', 'Beach', 'Fashion', 'Fitness']) as interest_label
    UNION ALL
    SELECT 
        '550e8400-e29b-41d4-a716-446655440008'::uuid as user_id,
        unnest(ARRAY['Writing', 'Coffee', 'Literature', 'City Exploration']) as interest_label
)
INSERT INTO public.user_interests (user_id, interest_id)
SELECT uid.user_id, im.id
FROM user_interests_data uid
JOIN interest_map im ON im.label = uid.interest_label
ON CONFLICT (user_id, interest_id) DO NOTHING;

-- ==============================================
-- INSERT USER SEARCH PROFILES (PREFERENCES)
-- ==============================================

INSERT INTO public.user_search_profile (user_id, genders, age_min, age_max, distance_km, relationship_types, vibe) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', ARRAY['Man', 'Woman'], 25, 35, 50, ARRAY['Casual Dating', 'Serious Relationship'], 'Adventure'),
    ('550e8400-e29b-41d4-a716-446655440002', ARRAY['Man', 'Woman', 'Non-binary'], 22, 30, 75, ARRAY['Serious Relationship'], 'Creative'),
    ('550e8400-e29b-41d4-a716-446655440003', ARRAY['Woman'], 24, 32, 50, ARRAY['Casual Dating', 'Friendship'], 'Fun'),
    ('550e8400-e29b-41d4-a716-446655440004', ARRAY['Man', 'Non-binary'], 25, 35, 100, ARRAY['Serious Relationship', 'Long-term'], 'Romantic'),
    ('550e8400-e29b-41d4-a716-446655440005', ARRAY['Man', 'Woman'], 26, 35, 50, ARRAY['Serious Relationship'], 'Athletic'),
    ('550e8400-e29b-41d4-a716-446655440006', ARRAY['Woman', 'Non-binary'], 23, 30, 75, ARRAY['Casual Dating'], 'Adventure'),
    ('550e8400-e29b-41d4-a716-446655440007', ARRAY['Man'], 25, 35, 50, ARRAY['Casual Dating', 'Serious Relationship'], 'Fun'),
    ('550e8400-e29b-41d4-a716-446655440008', ARRAY['Man', 'Woman', 'Non-binary'], 24, 32, 50, ARRAY['Serious Relationship'], 'Intellectual')
ON CONFLICT (user_id) DO UPDATE SET
    genders = EXCLUDED.genders,
    age_min = EXCLUDED.age_min,
    age_max = EXCLUDED.age_max,
    distance_km = EXCLUDED.distance_km,
    relationship_types = EXCLUDED.relationship_types,
    vibe = EXCLUDED.vibe;

-- ==============================================
-- INSERT USER SEARCH INTERESTS (WHAT THEY'RE LOOKING FOR)
-- ==============================================

WITH search_interests_data AS (
    SELECT 
        '550e8400-e29b-41d4-a716-446655440001'::uuid as user_id,
        unnest(ARRAY['Music', 'Travel', 'Adventure', 'Nature']) as interest_label
    UNION ALL
    SELECT 
        '550e8400-e29b-41d4-a716-446655440002'::uuid as user_id,
        unnest(ARRAY['Art', 'Music', 'Sustainability', 'Creative']) as interest_label
    UNION ALL
    SELECT 
        '550e8400-e29b-41d4-a716-446655440003'::uuid as user_id,
        unnest(ARRAY['Music', 'Food', 'Technology', 'Gaming']) as interest_label
    UNION ALL
    SELECT 
        '550e8400-e29b-41d4-a716-446655440004'::uuid as user_id,
        unnest(ARRAY['Reading', 'Nature', 'Travel', 'Cooking']) as interest_label
    UNION ALL
    SELECT 
        '550e8400-e29b-41d4-a716-446655440005'::uuid as user_id,
        unnest(ARRAY['Fitness', 'Outdoor Activities', 'Health', 'Sports']) as interest_label
    UNION ALL
    SELECT 
        '550e8400-e29b-41d4-a716-446655440006'::uuid as user_id,
        unnest(ARRAY['Adventure', 'Sports', 'Nature', 'Mountain Biking']) as interest_label
    UNION ALL
    SELECT 
        '550e8400-e29b-41d4-a716-446655440007'::uuid as user_id,
        unnest(ARRAY['Dancing', 'Fashion', 'Beach', 'Fitness']) as interest_label
    UNION ALL
    SELECT 
        '550e8400-e29b-41d4-a716-446655440008'::uuid as user_id,
        unnest(ARRAY['Literature', 'Coffee', 'Writing', 'City Exploration']) as interest_label
)
INSERT INTO public.user_search_interests (user_id, interest_id)
SELECT sid.user_id, im.id
FROM search_interests_data sid
JOIN public.interests im ON im.label = sid.interest_label
ON CONFLICT (user_id, interest_id) DO NOTHING;

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Check that all data was inserted correctly
SELECT 'Profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'User Interests', COUNT(*) FROM public.user_interests
UNION ALL
SELECT 'User Search Profiles', COUNT(*) FROM public.user_search_profile
UNION ALL
SELECT 'User Search Interests', COUNT(*) FROM public.user_search_interests
UNION ALL
SELECT 'Interests', COUNT(*) FROM public.interests
UNION ALL
SELECT 'Genders', COUNT(*) FROM public.genders
UNION ALL
SELECT 'Pronouns', COUNT(*) FROM public.pronouns
UNION ALL
SELECT 'Relationship Types', COUNT(*) FROM public.relationship_types
UNION ALL
SELECT 'Vibes', COUNT(*) FROM public.vibes;

-- Show sample data
SELECT 'Sample Profiles:' as info;
SELECT name, age, gender, city FROM public.profiles LIMIT 3;

SELECT 'Sample User Interests:' as info;
SELECT p.name, i.label as interest 
FROM public.user_interests ui
JOIN public.profiles p ON p.id = ui.user_id
JOIN public.interests i ON i.id = ui.interest_id
LIMIT 5;
