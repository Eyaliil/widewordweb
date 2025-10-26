require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetDatabase() {
  console.log('🗑️  Starting database reset...\n');

  try {
    // Delete in order to respect foreign key constraints
    const tables = [
      'user_images',
      'notifications',
      'messages',
      'conversations',
      'user_interests',
      'user_search_profile',
      'matches',
      'profiles',
      'users'
    ];

    for (const table of tables) {
      console.log(`🗑️  Deleting from ${table}...`);
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        console.error(`❌ Error deleting from ${table}:`, error.message);
      } else {
        console.log(`✅ Deleted from ${table}`);
      }
    }

    console.log('\n🎉 Database reset complete!');
    console.log('ℹ️  You can now run the test data script to populate with fresh data.');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase();
