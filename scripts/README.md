# Development Scripts

This directory contains utility scripts for development, testing, and database management.

## 📋 Available Scripts

### 🗄️ Database Scripts

#### `check-database.js`
**Purpose**: Quick database inspection and verification
**Usage**: `node scripts/check-database.js`
**Description**: 
- Checks database connection
- Displays table contents
- Verifies data integrity
- Useful for debugging database issues

#### `load-sample-data.js`
**Purpose**: Populate database with sample users and profiles
**Usage**: `node scripts/load-sample-data.js`
**Description**:
- Creates sample users with complete profiles
- Adds realistic test data for development
- Includes diverse user types and preferences
- Safe to run multiple times (handles duplicates)

#### `test-db-connection.js`
**Purpose**: Test Supabase database connectivity
**Usage**: `node scripts/test-db-connection.js`
**Description**:
- Verifies environment variables
- Tests database connection
- Checks authentication
- Useful for troubleshooting connection issues

### 🧪 Testing Scripts

#### `test-match-creation.js`
**Purpose**: Test the matching system functionality
**Usage**: `node scripts/test-match-creation.js`
**Description**:
- Tests match creation between users
- Verifies match persistence
- Tests match status updates
- Validates matching algorithm

## 🚀 Quick Start

1. **Set up environment variables** in `.env`:
   ```bash
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. **Test database connection**:
   ```bash
   node scripts/test-db-connection.js
   ```

3. **Load sample data**:
   ```bash
   node scripts/load-sample-data.js
   ```

4. **Verify data**:
   ```bash
   node scripts/check-database.js
   ```

5. **Test matching**:
   ```bash
   node scripts/test-match-creation.js
   ```

## 📝 Notes

- All scripts require Node.js and the `.env` file to be configured
- Scripts are safe to run multiple times
- Use these scripts for development and testing only
- Never run these scripts in production environments

## 🔧 Troubleshooting

**Connection Issues**:
- Verify `.env` file has correct Supabase credentials
- Check internet connection
- Ensure Supabase project is active

**Data Issues**:
- Run `check-database.js` to inspect current state
- Use `load-sample-data.js` to reset with fresh data
- Check Supabase dashboard for detailed logs

**Matching Issues**:
- Run `test-match-creation.js` to verify matching logic
- Check database constraints and relationships
- Verify user profiles are complete
