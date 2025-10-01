-- ==============================================
-- MATCHING SYSTEM DATABASE SCHEMA
-- ==============================================

-- Table to track users who are currently online and looking for matches
CREATE TABLE IF NOT EXISTS public.online_users (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_online BOOLEAN DEFAULT true,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store match history and decisions
CREATE TABLE IF NOT EXISTS public.matches (
    id SERIAL PRIMARY KEY,
    user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user1_decision TEXT CHECK (user1_decision IN ('pending', 'accepted', 'rejected', 'ignored')),
    user2_decision TEXT CHECK (user2_decision IN ('pending', 'accepted', 'rejected', 'ignored')),
    match_score INTEGER DEFAULT 0, -- Compatibility score (0-100)
    match_reasons TEXT[], -- Array of reasons why they matched
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);

-- Table to store match notifications/events
CREATE TABLE IF NOT EXISTS public.match_events (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('match_created', 'user1_accepted', 'user2_accepted', 'user1_rejected', 'user2_rejected', 'mutual_match', 'match_expired')),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_online_users_is_online ON public.online_users(is_online);
CREATE INDEX IF NOT EXISTS idx_online_users_last_seen ON public.online_users(last_seen);
CREATE INDEX IF NOT EXISTS idx_matches_user1_id ON public.matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2_id ON public.matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_decisions ON public.matches(user1_decision, user2_decision);
CREATE INDEX IF NOT EXISTS idx_match_events_match_id ON public.match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_match_events_user_id ON public.match_events(user_id);

-- ==============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE public.online_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

-- Online users policies
CREATE POLICY "Users can manage their own online status" ON public.online_users
    FOR ALL USING (auth.uid() = user_id);

-- Matches policies - users can see matches they're involved in
CREATE POLICY "Users can view their own matches" ON public.matches
    FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their own match decisions" ON public.matches
    FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "System can create matches" ON public.matches
    FOR INSERT WITH CHECK (true); -- Allow system to create matches

-- Match events policies
CREATE POLICY "Users can view their own match events" ON public.match_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create match events" ON public.match_events
    FOR INSERT WITH CHECK (true); -- Allow system to create events

-- ==============================================
-- FUNCTIONS FOR MATCHING ALGORITHM
-- ==============================================

-- Function to calculate compatibility score between two users
CREATE OR REPLACE FUNCTION calculate_match_score(
    p_user1_id UUID,
    p_user2_id UUID
) RETURNS TABLE(
    score INTEGER,
    reasons TEXT[]
) AS $$
DECLARE
    v_score INTEGER := 0;
    v_reasons TEXT[] := '{}';
    v_common_interests INTEGER := 0;
    v_age_compatibility BOOLEAN := false;
    v_gender_preference BOOLEAN := false;
    v_location_compatibility BOOLEAN := false;
    v_relationship_compatibility BOOLEAN := false;
    v_vibe_compatibility BOOLEAN := false;
BEGIN
    -- Count common interests (40 points max)
    SELECT COUNT(*) INTO v_common_interests
    FROM (
        SELECT ui1.interest_id
        FROM public.user_interests ui1
        WHERE ui1.user_id = p_user1_id
        INTERSECT
        SELECT ui2.interest_id
        FROM public.user_interests ui2
        WHERE ui2.user_id = p_user2_id
    ) common;
    
    v_score := v_score + LEAST(v_common_interests * 10, 40);
    IF v_common_interests > 0 THEN
        v_reasons := v_reasons || ('Shared ' || v_common_interests || ' interests');
    END IF;
    
    -- Check age compatibility (20 points max)
    SELECT EXISTS(
        SELECT 1
        FROM public.profiles p1, public.profiles p2, public.user_search_profile usp1
        WHERE p1.id = p_user1_id 
        AND p2.id = p_user2_id
        AND usp1.user_id = p_user1_id
        AND p2.age BETWEEN usp1.age_min AND usp1.age_max
    ) INTO v_age_compatibility;
    
    IF v_age_compatibility THEN
        v_score := v_score + 20;
        v_reasons := v_reasons || 'Age compatible';
    END IF;
    
    -- Check gender preference (20 points max)
    SELECT EXISTS(
        SELECT 1
        FROM public.profiles p1, public.profiles p2, public.user_search_profile usp1
        WHERE p1.id = p_user1_id 
        AND p2.id = p_user2_id
        AND usp1.user_id = p_user1_id
        AND p2.gender = ANY(usp1.genders)
    ) INTO v_gender_preference;
    
    IF v_gender_preference THEN
        v_score := v_score + 20;
        v_reasons := v_reasons || 'Gender preference match';
    END IF;
    
    -- Check location compatibility (10 points max)
    SELECT EXISTS(
        SELECT 1
        FROM public.profiles p1, public.profiles p2, public.user_search_profile usp1
        WHERE p1.id = p_user1_id 
        AND p2.id = p_user2_id
        AND usp1.user_id = p_user1_id
        AND usp1.distance_km >= 50 -- Simplified: assume same city if distance allows
    ) INTO v_location_compatibility;
    
    IF v_location_compatibility THEN
        v_score := v_score + 10;
        v_reasons := v_reasons || 'Location compatible';
    END IF;
    
    -- Check relationship type compatibility (5 points max)
    SELECT EXISTS(
        SELECT 1
        FROM public.user_search_profile usp1, public.user_search_profile usp2
        WHERE usp1.user_id = p_user1_id 
        AND usp2.user_id = p_user2_id
        AND usp1.relationship_types && usp2.relationship_types -- Arrays overlap
    ) INTO v_relationship_compatibility;
    
    IF v_relationship_compatibility THEN
        v_score := v_score + 5;
        v_reasons := v_reasons || 'Relationship goals align';
    END IF;
    
    -- Check vibe compatibility (5 points max)
    SELECT EXISTS(
        SELECT 1
        FROM public.user_search_profile usp1, public.user_search_profile usp2
        WHERE usp1.user_id = p_user1_id 
        AND usp2.user_id = p_user2_id
        AND usp1.vibe = usp2.vibe
    ) INTO v_vibe_compatibility;
    
    IF v_vibe_compatibility THEN
        v_score := v_score + 5;
        v_reasons := v_reasons || 'Similar vibe';
    END IF;
    
    RETURN QUERY SELECT v_score, v_reasons;
END;
$$ LANGUAGE plpgsql;

-- Function to find potential matches for a user
CREATE OR REPLACE FUNCTION find_potential_matches(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10
) RETURNS TABLE(
    user_id UUID,
    name TEXT,
    age INTEGER,
    gender TEXT,
    city TEXT,
    bio TEXT,
    match_score INTEGER,
    match_reasons TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.age,
        p.gender,
        p.city,
        p.bio,
        ms.score,
        ms.reasons
    FROM public.profiles p
    CROSS JOIN LATERAL calculate_match_score(p_user_id, p.id) ms
    WHERE p.id != p_user_id
    AND p.id IN (
        SELECT ou.user_id 
        FROM public.online_users ou 
        WHERE ou.is_online = true
    )
    AND NOT EXISTS (
        SELECT 1 
        FROM public.matches m 
        WHERE (m.user1_id = p_user_id AND m.user2_id = p.id)
        OR (m.user1_id = p.id AND m.user2_id = p_user_id)
    )
    AND ms.score >= 30 -- Minimum compatibility threshold
    ORDER BY ms.score DESC, p.name
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_online_users_updated_at BEFORE UPDATE ON public.online_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- SAMPLE DATA FOR TESTING
-- ==============================================

-- Insert some users as online (using the fake user IDs from our populate script)
INSERT INTO public.online_users (user_id, is_online) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', true),
    ('550e8400-e29b-41d4-a716-446655440002', true),
    ('550e8400-e29b-41d4-a716-446655440003', true),
    ('550e8400-e29b-41d4-a716-446655440004', true)
ON CONFLICT (user_id) DO UPDATE SET 
    is_online = EXCLUDED.is_online,
    last_seen = NOW();
