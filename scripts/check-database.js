// Quick script to check database contents
// Run with: node check-database.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  try {
    console.log('🔍 Checking database contents...');
    
    // Check profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, name, is_profile_complete')
      .limit(10);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError.message);
      return;
    }

    console.log(`📊 Profiles table: ${profiles.length} records`);
    profiles.forEach((profile, index) => {
      console.log(`  ${index + 1}. ${profile.name} (${profile.user_id}) - Complete: ${profile.is_profile_complete}`);
    });

    // Check matches table
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('id, user1_id, user2_id, status, match_score')
      .limit(10);

    if (matchesError) {
      console.error('❌ Error fetching matches:', matchesError.message);
    } else {
      console.log(`\n🎯 Matches table: ${matches.length} records`);
      matches.forEach((match, index) => {
        console.log(`  ${index + 1}. ${match.user1_id} <-> ${match.user2_id} (Score: ${match.match_score}, Status: ${match.status})`);
      });
    }

    // Check interests table
    const { data: interests, error: interestsError } = await supabase
      .from('interests')
      .select('id, label')
      .limit(10);

    if (interestsError) {
      console.error('❌ Error fetching interests:', interestsError.message);
    } else {
      console.log(`\n🏷️ Interests table: ${interests.length} records`);
      interests.forEach((interest, index) => {
        console.log(`  ${index + 1}. ${interest.label}`);
      });
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkDatabase();
