-- Create user_images table to store up to 3 photos per user
CREATE TABLE IF NOT EXISTS user_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_order INTEGER NOT NULL CHECK (image_order >= 0 AND image_order <= 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, image_order)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_images_user_id ON user_images(user_id);

-- Enable RLS
ALTER TABLE user_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for user_images
CREATE POLICY "Users can view all images" ON user_images
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own images" ON user_images
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own images" ON user_images
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own images" ON user_images
  FOR DELETE
  USING (true);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_images_updated_at
  BEFORE UPDATE ON user_images
  FOR EACH ROW
  EXECUTE FUNCTION update_user_images_updated_at();
