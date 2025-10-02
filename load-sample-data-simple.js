// Simple script to load sample data using JavaScript
// Run with: node load-sample-data-simple.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample data
const sampleProfiles = [
  {
    user_id: '11111111-1111-1111-1111-111111111111',
    name: 'Alice Johnson',
    age: 28,
    city: 'New York',
    bio: 'Love hiking, photography, and trying new restaurants. Looking for someone to explore the city with!',
    avatar_type: 'emoji',
    avatar_emoji: '🌸',
    avatar_initials: 'AJ',
    avatar_image_url: null,
    is_profile_complete: true,
    gender_id: 1,
    pronouns_id: 1
  },
  {
    user_id: '22222222-2222-2222-2222-222222222222',
    name: 'Bob Smith',
    age: 32,
    city: 'Los Angeles',
    bio: 'Software engineer who loves music, travel, and good food. Always up for an adventure!',
    avatar_type: 'emoji',
    avatar_emoji: '🚀',
    avatar_initials: 'BS',
    avatar_image_url: null,
    is_profile_complete: true,
    gender_id: 2,
    pronouns_id: 2
  },
  {
    user_id: '33333333-3333-3333-3333-333333333333',
    name: 'Carol Davis',
    age: 25,
    city: 'Chicago',
    bio: 'Art enthusiast, fitness lover, and coffee addict. Looking for meaningful connections.',
    avatar_type: 'emoji',
    avatar_emoji: '🎨',
    avatar_initials: 'CD',
    avatar_image_url: null,
    is_profile_complete: true,
    gender_id: 1,
    pronouns_id: 3
  },
  {
    user_id: '44444444-4444-4444-4444-444444444444',
    name: 'David Wilson',
    age: 30,
    city: 'Miami',
    bio: 'Beach lover, sports fan, and tech enthusiast. Always ready for a good time!',
    avatar_type: 'emoji',
    avatar_emoji: '🏖️',
    avatar_initials: 'DW',
    avatar_image_url: null,
    is_profile_complete: true,
    gender_id: 2,
    pronouns_id: 2
  },
  {
    user_id: '55555555-5555-5555-5555-555555555555',
    name: 'Emma Brown',
    age: 27,
    city: 'Seattle',
    bio: 'Nature lover, bookworm, and yoga instructor. Seeking someone who shares my passion for wellness.',
    avatar_type: 'emoji',
    avatar_emoji: '🧘',
    avatar_initials: 'EB',
    avatar_image_url: null,
    is_profile_complete: true,
    gender_id: 1,
    pronouns_id: 1
  },
  {
    user_id: '66666666-6666-6666-6666-666666666666',
    name: 'Frank Miller',
    age: 35,
    city: 'Denver',
    bio: 'Outdoor enthusiast, chef, and music producer. Life is an adventure - want to join me?',
    avatar_type: 'emoji',
    avatar_emoji: '🎵',
    avatar_initials: 'FM',
    avatar_image_url: null,
    is_profile_complete: true,
    gender_id: 2,
    pronouns_id: 2
  }
];

async function loadSampleData() {
  try {
    console.log('📥 Loading sample data into database...');
    
    // Insert profiles
    console.log('👥 Inserting profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .insert(sampleProfiles)
      .select('user_id, name');

    if (profilesError) {
      console.error('❌ Error inserting profiles:', profilesError.message);
      return;
    }

    console.log(`✅ Inserted ${profiles.length} profiles`);

    // Add user interests (random interests for each user)
    console.log('🏷️ Adding user interests...');
    
    const interestMappings = [
      { user_id: '11111111-1111-1111-1111-111111111111', interests: [1, 2, 4, 6] }, // Alice: Music, Travel, Sports, Nature
      { user_id: '22222222-2222-2222-2222-222222222222', interests: [1, 2, 5, 7] }, // Bob: Music, Travel, Food, Technology
      { user_id: '33333333-3333-3333-3333-333333333333', interests: [3, 4, 5, 8] }, // Carol: Art, Sports, Food, Fitness
      { user_id: '44444444-4444-4444-4444-444444444444', interests: [2, 4, 6, 10] }, // David: Travel, Sports, Nature, Movies
      { user_id: '55555555-5555-5555-5555-555555555555', interests: [3, 6, 8, 9] }, // Emma: Art, Nature, Fitness, Reading
      { user_id: '66666666-6666-6666-6666-666666666666', interests: [1, 2, 5, 7] }  // Frank: Music, Travel, Food, Technology
    ];

    for (const mapping of interestMappings) {
      const userInterests = mapping.interests.map(interestId => ({
        user_id: mapping.user_id,
        interest_id: interestId
      }));

      const { error: interestsError } = await supabase
        .from('user_interests')
        .insert(userInterests);

      if (interestsError) {
        console.error(`❌ Error inserting interests for ${mapping.user_id}:`, interestsError.message);
      }
    }

    console.log('✅ Added user interests');

    // Add search profiles
    console.log('🔍 Adding search profiles...');
    
    const searchProfiles = sampleProfiles.map(profile => ({
      user_id: profile.user_id,
      min_age: profile.age - 3,
      max_age: profile.age + 5,
      preferred_gender_ids: profile.gender_id === 1 ? [2] : [1], // Opposite gender
      preferred_city: profile.city,
      max_distance_km: 50,
      is_active: true
    }));

    const { error: searchError } = await supabase
      .from('user_search_profile')
      .insert(searchProfiles);

    if (searchError) {
      console.error('❌ Error inserting search profiles:', searchError.message);
    } else {
      console.log('✅ Added search profiles');
    }

    console.log('\n🎉 Sample data loaded successfully!');
    
    // Verify the data
    const { data: finalProfiles } = await supabase
      .from('profiles')
      .select('user_id, name, age, city')
      .eq('is_profile_complete', true);
    
    console.log(`\n📊 Database now contains ${finalProfiles.length} users:`);
    finalProfiles.forEach((profile, index) => {
      console.log(`  ${index + 1}. ${profile.name} (${profile.age}, ${profile.city})`);
    });

  } catch (error) {
    console.error('❌ Failed to load sample data:', error.message);
  }
}

loadSampleData();
