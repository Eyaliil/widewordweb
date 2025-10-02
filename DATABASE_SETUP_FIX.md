# Database Setup Fix

The sample data loading failed due to Row Level Security (RLS) policies. Here are the steps to fix this:

## Option 1: Disable RLS (Recommended for Development)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Policies**
3. For each table (`profiles`, `user_interests`, `user_search_profile`, `matches`, `notifications`):
   - Click on the table name
   - Click **"Disable RLS"** button
   - Confirm the action

## Option 2: Set Up Proper RLS Policies (Production Ready)

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_search_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Or create permissive policies for development
CREATE POLICY "Enable all operations for all users" ON profiles FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON user_interests FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON user_search_profile FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON matches FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON notifications FOR ALL USING (true);
```

## After Fixing RLS

1. Run the sample data loader:
   ```bash
   node load-sample-data-simple.js
   ```

2. Test the database connection:
   ```bash
   node test-match-creation.js
   ```

3. Refresh your React app to see the database users

## Alternative: Manual Data Loading

If you prefer to load data manually:

1. Go to your Supabase dashboard
2. Navigate to **Table Editor**
3. For each table, click **"Insert"** and add the sample data from `sample-data.sql`

## Verification

After loading the data, you should see:
- 6 profiles in the `profiles` table
- Interest mappings in the `user_interests` table
- Search preferences in the `user_search_profile` table

The React app will then automatically load these users and you can test the matching functionality.
