# Supabase Database Setup Guide for Matching App

## Overview
This guide will help you set up the complete database structure for the matching app using Supabase with all features we've built.

## Prerequisites
- Supabase account (free tier available)
- Access to Supabase dashboard

## Supabase Setup

### 1. Create New Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `matching-app` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
6. Click "Create new project"
7. Wait for the project to be created (usually 2-3 minutes)

### 2. Access Your Project
1. Once created, you'll see your project dashboard
2. Note your **Project URL** and **API Keys** (you'll need these for your app)
3. Go to **Settings** → **API** to find:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: For client-side operations
   - **service_role key**: For server-side operations (keep secret!)

### 3. Run the Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy the entire contents of `complete-database-schema.sql`
4. Paste it into the SQL editor
5. Click **"Run"** to execute the schema
6. You should see "Success. No rows returned" if everything worked

### 4. Verify Setup
Run this query in the SQL Editor to verify all tables were created:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see these tables:
- genders, pronouns, relationship_types, vibes, interests
- users, profiles, user_interests, user_search_profile
- online_users, matches, match_decisions, notifications
- match_analytics, user_activity

### 5. Add Sample Data (Optional)
1. In the SQL Editor, create a new query
2. Copy the contents of `sample-data.sql`
3. Paste and run it to populate with test data
4. This will create 10 sample users with profiles and matches

## Database Structure Overview

### Core Tables
- **users**: Authentication and user management
- **profiles**: User profile information
- **user_interests**: Many-to-many relationship for interests
- **user_search_profile**: User preferences for matching

### Matching System
- **online_users**: Track who's currently online
- **matches**: Main matching records with decisions
- **match_decisions**: Audit trail of all decisions
- **notifications**: User notifications

### Lookup Tables
- **genders**: Gender options
- **pronouns**: Pronoun options
- **relationship_types**: Relationship preferences
- **vibes**: Personality vibes
- **interests**: Interest categories

### Analytics
- **match_analytics**: Detailed compatibility analysis
- **user_activity**: User activity tracking

## Key Features Supported

### 1. User Management
- Complete profile system
- Avatar support (emoji, image, initials)
- Interest management
- Search preferences

### 2. Matching Algorithm
- Compatibility scoring (0-100)
- Multi-factor matching
- Real-time online status
- Match expiration (24 hours)

### 3. Decision System
- Bidirectional decision making
- Status tracking (pending, mutual_match, rejected, expired)
- Decision history and audit trail
- Automatic status updates

### 4. Notification System
- New match notifications
- Mutual match celebrations
- Match expiration alerts
- Read/unread status

### 5. Security
- Row Level Security (RLS) policies
- User data isolation
- Public read access for lookup tables
- Secure decision tracking

## Sample Data

The schema includes sample data for:
- 4 gender options
- 6 pronoun options
- 5 relationship types
- 10 personality vibes
- 18 interest categories

## Supabase Configuration

### 1. Configure Authentication
1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Enable **Email** authentication
3. Configure **Site URL** (your app's domain)
4. Set up **Email templates** if needed

### 2. Set Up Row Level Security
The schema automatically enables RLS, but you can verify in **Authentication** → **Policies**:
- Users can only see their own data
- Public read access for lookup tables
- Secure decision tracking

### 3. Configure Real-time (Optional)
1. Go to **Database** → **Replication**
2. Enable real-time for tables you want to sync:
   - `matches` (for real-time match updates)
   - `notifications` (for real-time notifications)
   - `online_users` (for online status)

## Testing the Database

### 1. Test with Sample Data
If you ran the sample data, you can test with these queries:

```sql
-- View all sample users
SELECT p.name, p.age, g.label as gender, p.city 
FROM profiles p 
JOIN genders g ON p.gender_id = g.id;

-- Check sample matches
SELECT m.id, u1.name as user1, u2.name as user2, m.match_score, m.status
FROM matches m
JOIN profiles u1 ON m.user1_id = u1.user_id
JOIN profiles u2 ON m.user2_id = u2.user_id;

-- View notifications
SELECT n.type, n.title, n.message, n.created_at
FROM notifications n
ORDER BY n.created_at DESC;
```

### 2. Test Matching Logic
```sql
-- Find potential matches for a user
SELECT 
    p2.name,
    p2.age,
    COUNT(ui2.interest_id) as common_interests,
    p2.city
FROM profiles p1
JOIN user_interests ui1 ON p1.user_id = ui1.user_id
JOIN user_interests ui2 ON ui1.interest_id = ui2.interest_id
JOIN profiles p2 ON ui2.user_id = p2.user_id
WHERE p1.user_id = '550e8400-e29b-41d4-a716-446655440001'
AND p2.user_id != p1.user_id
GROUP BY p2.user_id, p2.name, p2.age, p2.city
ORDER BY common_interests DESC;
```

## Performance Optimization

The schema includes:
- **Indexes** on all frequently queried columns
- **Composite indexes** for complex queries
- **Partial indexes** for filtered queries
- **JSONB indexes** for JSON data

## Supabase Monitoring and Analytics

### Built-in Supabase Features
Supabase provides built-in monitoring through:
- **Dashboard Analytics**: View usage, performance, and errors
- **Database Logs**: Monitor queries and performance
- **API Logs**: Track API usage and errors
- **Real-time Metrics**: Monitor active connections and usage

### Key Metrics to Track
- Match creation rate
- Decision completion rate
- Mutual match rate
- User engagement
- API response times

### Useful Analytics Queries
```sql
-- Daily match statistics
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_matches,
    COUNT(CASE WHEN status = 'mutual_match' THEN 1 END) as mutual_matches,
    AVG(match_score) as avg_score
FROM matches 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- User activity summary
SELECT 
    activity_type,
    COUNT(*) as count,
    DATE(created_at) as date
FROM user_activity
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY activity_type, DATE(created_at)
ORDER BY date DESC, count DESC;

-- Top matching cities
SELECT 
    p.city,
    COUNT(m.id) as total_matches,
    COUNT(CASE WHEN m.status = 'mutual_match' THEN 1 END) as successful_matches
FROM matches m
JOIN profiles p ON m.user1_id = p.user_id
GROUP BY p.city
ORDER BY total_matches DESC;
```

## Supabase Maintenance

### Automated Features
Supabase handles these automatically:
- **Backups**: Daily automated backups
- **Updates**: Automatic PostgreSQL updates
- **Scaling**: Auto-scaling based on usage
- **Security**: Automatic security patches

### Manual Tasks
1. **Monitor usage**: Check dashboard for usage limits
2. **Review logs**: Monitor error logs and performance
3. **Clean old data**: Archive old notifications and activity
4. **Update indexes**: Add indexes for new query patterns

### Supabase Dashboard Monitoring
1. **Go to your project dashboard**
2. **Check "Usage" tab** for:
   - Database size
   - API requests
   - Storage usage
   - Bandwidth usage
3. **Monitor "Logs" tab** for:
   - Database errors
   - API errors
   - Authentication issues

## Troubleshooting

### Common Supabase Issues
1. **RLS blocking queries**: Check user authentication in Auth tab
2. **API rate limits**: Monitor usage in dashboard
3. **Connection limits**: Check active connections
4. **Storage limits**: Monitor database size

### Supabase-Specific Solutions
```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public';

-- Monitor active connections
SELECT count(*) as active_connections
FROM pg_stat_activity 
WHERE state = 'active';

-- Check table sizes in Supabase
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
```

## Supabase Next Steps

1. **Enable Edge Functions** (for server-side logic)
2. **Set up Storage** (for user avatars)
3. **Configure Webhooks** (for external integrations)
4. **Set up Monitoring** (alerts and notifications)
5. **Plan Scaling** (upgrade plan as needed)

## Supabase Pricing Considerations

### Free Tier Limits
- **Database**: 500MB storage
- **API**: 50,000 requests/month
- **Auth**: 50,000 users
- **Storage**: 1GB

### When to Upgrade
- Exceed free tier limits
- Need more storage
- Require higher API limits
- Need advanced features

This Supabase setup provides a solid foundation for your matching app with built-in scaling, security, and monitoring!
