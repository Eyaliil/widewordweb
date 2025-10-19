# Supabase Database Setup Guide

## Quick Setup Steps

### 1. Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy your credentials:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 2. Create Environment File

Create a `.env` file in your project root with:

```env
REACT_APP_SUPABASE_URL=your-actual-project-url
REACT_APP_SUPABASE_ANON_KEY=your-actual-anon-key
```

**Example:**
```env
REACT_APP_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNDU2Nzg5MCwiZXhwIjoxOTUwMTQzODkwfQ.example-key
```

### 3. Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Create a new query
3. Copy and paste the contents of `complete-database-schema.sql`
4. Click **Run** to execute

### 4. Load Sample Data

1. In the SQL Editor, create another new query
2. Copy and paste the contents of `sample-data.sql`
3. Click **Run** to execute

### 5. Restart Your App

```bash
npm start
```

### 6. Verify Connection

- Open your app in the browser
- Check the browser console for connection logs
- The UserSelector should show database users instead of "Using fake users"
- You should see: Alex Johnson, Sam Wilson, Maya Patel, Jordan Smith, Zoe Martinez

## Troubleshooting

### If you see "Using fake users (no DB)":
1. Check your `.env` file has the correct credentials
2. Make sure you restarted the app after adding the `.env` file
3. Check the browser console for connection errors

### If you see "No users available":
1. Verify the sample data was loaded successfully
2. Check the SQL Editor for any errors when running the sample data
3. Make sure all tables were created properly

### If you get connection errors:
1. Verify your Supabase URL and key are correct
2. Check that your Supabase project is active
3. Ensure you're using the anon key (not the service role key)

## Expected Sample Users

After setup, you should see these users in the profile selector:

- **Alex Johnson** (28, Male, New York) - Adventure seeker
- **Sam Wilson** (25, Non-binary, San Francisco) - Creative soul  
- **Maya Patel** (30, Female, Los Angeles) - Fitness enthusiast
- **Jordan Smith** (26, Male, Chicago) - Tech geek
- **Zoe Martinez** (24, Female, Austin) - Social butterfly

## Testing Profile Switching

1. Click any profile in the top-right selector
2. Click "Go Online" to start matching as that user
3. Switch to another profile and test again
4. Each user will see different matches based on their profile data
