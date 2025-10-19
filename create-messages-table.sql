-- =====================================================
-- CREATE MESSAGES TABLE FOR CHAT FUNCTIONALITY
-- =====================================================
-- This script creates the messages table for enabling chat
-- between matched users
-- =====================================================

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- Create composite index for unread messages
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, is_read) WHERE is_read = FALSE;

-- Add RLS (Row Level Security) policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see messages from their matches
CREATE POLICY "Users can view messages from their matches" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- Policy: Users can only send messages to their matches
CREATE POLICY "Users can send messages to their matches" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
      AND matches.status = 'mutual_match'
    )
  );

-- Policy: Users can update their own messages (for read status)
CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (
    receiver_id = auth.uid() OR sender_id = auth.uid()
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_messages_updated_at_trigger
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_messages_updated_at();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- The messages table now supports:
-- ✅ Full chat functionality between matched users
-- ✅ Proper foreign key relationships
-- ✅ Row Level Security policies
-- ✅ Performance indexes
-- ✅ Automatic timestamp updates
-- =====================================================
