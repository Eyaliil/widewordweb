# Reset Database Guide

## Quick Start

To reset the database and load fresh test data:

```bash
npm run reset-and-load
```

Or run the commands separately:

```bash
# Reset database (delete all data)
npm run reset-db

# Load test data
npm run load-data
```

## Test Users

After running the reset and load, you'll have these test users:

1. **Alice Johnson** (28, New York) - love hiking, photography, and trying new restaurants
2. **Bob Smith** (32, Los Angeles) - software engineer who loves music, travel, and good food
3. **Carol Davis** (25, Chicago) - art enthusiast, fitness lover, and coffee addict
4. **David Wilson** (30, Miami) - beach lover, sports fan, and tech enthusiast
5. **Emma Brown** (27, Seattle) - nature lover, bookworm, and yoga instructor
6. **Frank Miller** (35, Denver) - outdoor enthusiast, chef, and music producer

You can log in with any of these names (just type the first name) since the app uses name-based authentication.

## What Gets Deleted

The reset script deletes data from these tables:
- user_images
- notifications
- messages
- conversations
- user_interests
- user_search_profile
- matches
- profiles
- users

## What Gets Created

The load script creates:
- 6 users with complete profiles
- User interests for each user
- Ready-to-match data

## Troubleshooting

If you encounter errors, make sure:
1. Your `.env` file has the correct Supabase credentials
2. Your Supabase project is active (not paused)
3. All necessary tables exist in your database
