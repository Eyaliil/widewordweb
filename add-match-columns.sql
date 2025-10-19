-- =====================================================
-- ADD MISSING COLUMNS TO MATCHES TABLE
-- =====================================================
-- This script adds the detailed_insights and compatibility_breakdown columns
-- to the matches table for enhanced matching analysis
-- =====================================================

-- Add detailed_insights column (JSONB for storing detailed compatibility analysis)
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS detailed_insights JSONB;

-- Add compatibility_breakdown column (JSONB for storing score breakdown)
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS compatibility_breakdown JSONB;

-- Add comments to document the new columns
COMMENT ON COLUMN matches.detailed_insights IS 'Detailed compatibility analysis including category-specific insights';
COMMENT ON COLUMN matches.compatibility_breakdown IS 'Score breakdown by category (interests, age, gender, etc.)';

-- Create indexes for better query performance on JSONB columns
CREATE INDEX IF NOT EXISTS idx_matches_detailed_insights ON matches USING GIN (detailed_insights);
CREATE INDEX IF NOT EXISTS idx_matches_compatibility_breakdown ON matches USING GIN (compatibility_breakdown);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- The matches table now supports:
-- ✅ detailed_insights: JSONB column for storing detailed compatibility analysis
-- ✅ compatibility_breakdown: JSONB column for storing score breakdown
-- ✅ Proper indexing for JSONB queries
-- =====================================================
