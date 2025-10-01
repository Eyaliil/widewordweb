// Simple script to test Supabase database connection
// Run with: node test-db-connection.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.log('Please create a .env file with:');
  console.log('REACT_APP_SUPABASE_URL=your-project-url');
  console.log('REACT_APP_SUPABASE_ANON_KEY=your-anon-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔗 Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, name, age, city')
      .limit(5);

    if (error) {
      console.error('❌ Database connection failed:', error.message);
      console.log('Make sure:');
      console.log('1. Your Supabase project is active');
      console.log('2. You have run the database schema (complete-database-schema.sql)');
      console.log('3. You have loaded the sample data (sample-data.sql)');
      return;
    }

    console.log('✅ Database connection successful!');
    console.log(`📊 Found ${data.length} profiles in database:`);
    
    data.forEach((profile, index) => {
      console.log(`  ${index + 1}. ${profile.name} (${profile.age}, ${profile.city})`);
    });

    if (data.length === 0) {
      console.log('⚠️  No profiles found. Make sure you have run the sample-data.sql file.');
    }

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
}

testConnection();
