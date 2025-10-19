// Test script to verify match creation and persistence
// Run with: node test-match-creation.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMatchCreation() {
  try {
    console.log('🔗 Testing match creation and persistence...');
    
    // First, check if we have users in the database
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, name')
      .eq('is_profile_complete', true)
      .limit(5);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message);
      return;
    }

    if (!users || users.length < 2) {
      console.error('❌ Need at least 2 users in database to test matching');
      console.log('Make sure you have run the sample-data.sql file');
      return;
    }

    console.log(`✅ Found ${users.length} users in database:`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.user_id})`);
    });

    // Test creating a match
    const user1 = users[0];
    const user2 = users[1];
    
    console.log(`\n🎯 Creating test match between ${user1.name} and ${user2.name}...`);
    
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const [user1Id, user2Id] = user1.user_id < user2.user_id ? [user1.user_id, user2.user_id] : [user2.user_id, user1.user_id];
    
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        user1_id: user1Id,
        user2_id: user2Id,
        match_score: 85,
        match_reasons: ['Test match creation', 'Database persistence test'],
        user1_decision: 'pending',
        user2_decision: 'pending',
        status: 'pending',
        expires_at: expiresAt.toISOString()
      })
      .select('*')
      .single();

    if (matchError) {
      console.error('❌ Error creating match:', matchError.message);
      console.error('Make sure the matches table exists and has the correct schema');
      return;
    }

    console.log('✅ Match created successfully:', match.id);

    // Test fetching the match
    console.log('\n🔍 Testing match retrieval...');
    
    const { data: fetchedMatch, error: fetchError } = await supabase
      .from('matches')
      .select(`
        *,
        user1:profiles!matches_user1_id_fkey(name, age, city),
        user2:profiles!matches_user2_id_fkey(name, age, city)
      `)
      .eq('id', match.id)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching match:', fetchError.message);
      return;
    }

    console.log('✅ Match retrieved successfully:');
    console.log(`  Match ID: ${fetchedMatch.id}`);
    console.log(`  Users: ${fetchedMatch.user1?.name} <-> ${fetchedMatch.user2?.name}`);
    console.log(`  Score: ${fetchedMatch.match_score}`);
    console.log(`  Status: ${fetchedMatch.status}`);

    // Test match history for user1
    console.log('\n📋 Testing match history for user1...');
    
    const { data: user1Matches, error: historyError } = await supabase
      .from('matches')
      .select(`
        *,
        user1:profiles!matches_user1_id_fkey(name, age, city),
        user2:profiles!matches_user2_id_fkey(name, age, city)
      `)
      .or(`user1_id.eq.${user1.user_id},user2_id.eq.${user1.user_id}`)
      .order('created_at', { ascending: false });

    if (historyError) {
      console.error('❌ Error fetching match history:', historyError.message);
      return;
    }

    console.log(`✅ Found ${user1Matches.length} matches for ${user1.name}:`);
    user1Matches.forEach((m, index) => {
      const otherUser = m.user1_id === user1.user_id ? m.user2 : m.user1;
      console.log(`  ${index + 1}. ${otherUser?.name || 'Unknown'} (Score: ${m.match_score}, Status: ${m.status})`);
    });

    console.log('\n🎉 All tests passed! Database persistence is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMatchCreation();
