-- =====================================================
-- FORCE FIX SECURITY DEFINER VIEWS
-- =====================================================
-- Aggressively drops and recreates views to remove SECURITY DEFINER
-- =====================================================

-- Drop all views with CASCADE to remove dependencies
DROP VIEW IF EXISTS public.user_profiles_view CASCADE;
DROP VIEW IF EXISTS public.matches_view CASCADE;
DROP VIEW IF EXISTS public.user_interests_view CASCADE;
DROP VIEW IF EXISTS public.compatibility_cache_view CASCADE;

-- Wait a moment for any triggers/cascades to complete
DO $$
BEGIN
    PERFORM pg_advisory_lock(1);
    PERFORM pg_sleep(0.1);
    PERFORM pg_advisory_unlock(1);
END $$;

-- Recreate views WITHOUT SECURITY DEFINER
-- Using CREATE OR REPLACE won't work because it preserves SECURITY DEFINER
-- So we explicitly create new views

CREATE VIEW public.user_profiles_view
WITH (security_invoker=true) AS
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

CREATE VIEW public.matches_view
WITH (security_invoker=true) AS
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

CREATE VIEW public.user_interests_view
WITH (security_invoker=true) AS
SELECT 
    ui.user_id,
    ui.interest_id,
    i.label as interest_name,
    i.category as interest_category,
    ui.created_at
FROM user_interests ui
JOIN interests i ON ui.interest_id = i.id;

CREATE VIEW public.compatibility_cache_view
WITH (security_invoker=true) AS
SELECT 
    id,
    user1_id,
    user2_id,
    compatibility_score,
    score_breakdown,
    calculated_at,
    expires_at
FROM compatibility_cache;

-- Verify views were created
-- Run this to check:
-- SELECT schemaname, viewname, viewowner FROM pg_views WHERE schemaname = 'public' AND viewname IN ('user_profiles_view', 'matches_view', 'user_interests_view', 'compatibility_cache_view');

