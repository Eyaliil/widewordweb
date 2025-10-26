# Multi-Image Support Implementation

## Summary
Added support for users to upload up to 3 photos, with the first photo serving as their main profile picture.

## Database Changes

### New Table: `user_images`
```sql
CREATE TABLE IF NOT EXISTS user_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_order INTEGER NOT NULL CHECK (image_order >= 0 AND image_order <= 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, image_order)
);
```

**Features:**
- Stores up to 3 images per user (`image_order` 0, 1, 2)
- First image (order 0) is the main profile picture
- Cascading delete when user is deleted
- RLS policies enabled for security

## Frontend Changes

### 1. ProfileForm Component (`src/components/profile/ProfileForm.js`)
- Added `userImages` state to store array of image URLs
- Created 3-column grid for image upload slots
- First image slot shows "Main" badge
- Hover effect to remove images
- Updated `handleImageUpload` to support multiple images with ordering
- Added `handleRemoveImage` to delete individual images
- Emoji/initials fallback only shows when no images are uploaded

### 2. Icons Added
- `RiCloseCircleLine` - Remove image button
- `RiAddCircleLine` - Add image placeholder

## Backend Changes

### userService.js
- Updated `updateProfile` to save user images
- Added `saveUserImages` method that:
  - Deletes existing images for the user
  - Inserts new images with their order (0, 1, 2)
  - First image is automatically the profile picture

## Migration Steps

1. **Run the SQL script** to create the `user_images` table:
   ```bash
   # In Supabase SQL Editor, run:
   docs/database/create-user-images-table.sql
   ```

2. **Test the implementation**:
   - Navigate to the profile form
   - Upload up to 3 images
   - First image becomes the main profile picture
   - Remove images by hovering and clicking the X button

## Notes

- Images are currently stored as base64 data URLs in the database
- Future enhancement: Upload images to Supabase Storage and store only URLs
- The avatar system (emoji/initials) is still available as a fallback when no images are uploaded
- Maximum image size: 5MB per image
- Supported formats: JPG, JPEG, PNG

