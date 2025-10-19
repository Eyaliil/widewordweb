import { supabase } from '../lib/supabaseClient';

// Service for managing name-based users
export class NameBasedUserService {
  // Login with just a name (create user if doesn't exist)
  async loginWithName(name) {
    try {
      console.log(`🔐 Attempting name-based login for: ${name}`);
      
      // First, try to find existing user
      const { data: existingUser, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('name', name)
        .eq('is_active', true)
        .single();

      if (existingUser && !findError) {
        console.log(`✅ Found existing user: ${name}`);
        
        // Update last login
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', existingUser.id);
        
        
        // Get user profile
        const profile = await this.getUserProfile(existingUser.id);
        
        if (profile) {
          console.log(`✅ Profile loaded successfully for ${name}`);
          return {
            success: true,
            user: {
              id: existingUser.id,
              name: existingUser.name,
              ...profile
            }
          };
        } else {
          console.error(`❌ Failed to load profile for existing user: ${name}`);
          return { success: false, error: 'Failed to load user profile. Please try again.' };
        }
      }

      // User doesn't exist, create new user
      console.log(`🆕 Creating new user: ${name}`);
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          name: name,
          is_active: true,
          last_login: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating user:', createError);
        return { success: false, error: createError.message };
      }

      // Create empty profile with default avatar
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: newUser.id,
          name: name,
          avatar_type: 'emoji',
          avatar_emoji: '👤',
          is_profile_complete: false
        });

      if (profileError) {
        console.error('❌ Error creating profile:', profileError);
        return { success: false, error: profileError.message };
      }


      console.log(`✅ Created new user and profile: ${name}`);
      return {
        success: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          isProfileComplete: false
        }
      };

    } catch (error) {
      console.error('❌ Error in loginWithName:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user profile with all related data
  async getUserProfile(userId) {
    try {
      console.log(`📋 Fetching profile for user ID: ${userId}`);
      
      // First get basic profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          name,
          age,
          city,
          bio,
          avatar_type,
          avatar_emoji,
          avatar_initials,
          avatar_image_url,
          is_profile_complete,
          gender_id,
          pronouns_id
        `)
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('❌ Error fetching profile:', profileError);
        return null;
      }

      if (!profile) {
        console.error('❌ No profile found for user:', userId);
        return null;
      }

      console.log('✅ Profile data loaded:', profile);

      // Get gender and pronouns separately
      let gender = '';
      let pronouns = '';
      
      if (profile.gender_id) {
        const { data: genderData } = await supabase
          .from('genders')
          .select('label')
          .eq('id', profile.gender_id)
          .single();
        gender = genderData?.label || '';
      }

      if (profile.pronouns_id) {
        const { data: pronounsData } = await supabase
          .from('pronouns')
          .select('label')
          .eq('id', profile.pronouns_id)
          .single();
        pronouns = pronounsData?.label || '';
      }

      // Get interests separately
      const { data: interestsData } = await supabase
        .from('user_interests')
        .select(`
          interests(label)
        `)
        .eq('user_id', userId);

      const interests = interestsData?.map(ui => ui.interests.label) || [];

      const result = {
        id: profile.user_id,
        name: profile.name,
        age: profile.age,
        gender: gender,
        pronouns: pronouns,
        city: profile.city || '',
        bio: profile.bio || '',
        avatar: {
          type: profile.avatar_type || 'emoji',
          emoji: profile.avatar_emoji || '👤',
          initials: profile.avatar_initials || '',
          image: profile.avatar_image_url || null
        },
        interests: interests,
        isProfileComplete: profile.is_profile_complete
      };

      console.log('✅ Complete profile data:', result);
      return result;
    } catch (error) {
      console.error('❌ Error in getUserProfile:', error);
      return null;
    }
  }

  // Update user profile
  async updateProfile(userId, profileData) {
    try {
      console.log('📝 Updating profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          name: profileData.name,
          age: profileData.age,
          city: profileData.city,
          bio: profileData.bio,
          avatar_type: profileData.avatar.type,
          avatar_emoji: profileData.avatar.emoji,
          avatar_initials: profileData.avatar.initials,
          avatar_image_url: profileData.avatar.image,
          is_profile_complete: this.isProfileComplete(profileData)
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating profile:', error);
        return { success: false, error: error.message };
      }

      // Update user interests
      if (profileData.interests && profileData.interests.length > 0) {
        await this.updateUserInterests(userId, profileData.interests);
      }

      console.log('✅ Profile updated successfully');
      return { success: true, profile: data };
    } catch (error) {
      console.error('❌ Error in updateProfile:', error);
      return { success: false, error: error.message };
    }
  }

  // Update user interests
  async updateUserInterests(userId, interests) {
    try {
      // First, get interest IDs
      const { data: interestData, error: interestError } = await supabase
        .from('interests')
        .select('id, label')
        .in('label', interests);

      if (interestError) {
        console.error('Error fetching interests:', interestError);
        return { success: false, error: interestError.message };
      }

      // Delete existing interests
      await supabase
        .from('user_interests')
        .delete()
        .eq('user_id', userId);

      // Insert new interests
      if (interestData.length > 0) {
        const interestInserts = interestData.map(interest => ({
          user_id: userId,
          interest_id: interest.id
        }));

        const { error: insertError } = await supabase
          .from('user_interests')
          .insert(interestInserts);

        if (insertError) {
          console.error('Error inserting interests:', insertError);
          return { success: false, error: insertError.message };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateUserInterests:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if profile is complete
  isProfileComplete(profileData) {
    return !!(
      profileData.name &&
      profileData.age &&
      profileData.city &&
      profileData.bio &&
      profileData.interests &&
      profileData.interests.length > 0
    );
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          name,
          age,
          city,
          bio,
          avatar_type,
          avatar_emoji,
          avatar_initials,
          avatar_image_url,
          is_profile_complete,
          gender_id,
          pronouns_id
        `)
        .eq('user_id', userId)
        .eq('is_profile_complete', true)
        .single();

      if (error) {
        console.error('Error fetching user by ID:', error);
        return null;
      }

      // Get gender and pronouns separately
      let gender = '';
      let pronouns = '';
      
      if (profile.gender_id) {
        const { data: genderData } = await supabase
          .from('genders')
          .select('label')
          .eq('id', profile.gender_id)
          .single();
        gender = genderData?.label || '';
      }

      if (profile.pronouns_id) {
        const { data: pronounsData } = await supabase
          .from('pronouns')
          .select('label')
          .eq('id', profile.pronouns_id)
          .single();
        pronouns = pronounsData?.label || '';
      }

      // Get interests separately
      const { data: interestsData } = await supabase
        .from('user_interests')
        .select(`
          interest_id,
          interests(label)
        `)
        .eq('user_id', userId);

      const interests = interestsData?.map(ui => ui.interests.label) || [];

      return {
        id: profile.user_id,
        name: profile.name,
        age: profile.age,
        gender: gender,
        pronouns: pronouns,
        city: profile.city,
        bio: profile.bio || '',
        avatar: {
          type: profile.avatar_type || 'emoji',
          emoji: profile.avatar_emoji || '👤',
          initials: profile.avatar_initials || '',
          image: profile.avatar_image_url || null
        },
        interests: interests,
        isProfileComplete: profile.is_profile_complete
      };
    } catch (error) {
      console.error('Error in getUserById:', error);
      return null;
    }
  }

  // Get all users for matching (excludes current user and users with existing matches)
  async getMatchingUsers(currentUserId) {
    try {
      // First, get all users who already have matches with the current user
      const { data: existingMatches, error: matchesError } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`);

      if (matchesError) {
        console.error('Error fetching existing matches:', matchesError);
        return [];
      }

      // Extract user IDs that already have matches with current user
      const excludedUserIds = new Set();
      existingMatches?.forEach(match => {
        if (match.user1_id === currentUserId) {
          excludedUserIds.add(match.user2_id);
        } else {
          excludedUserIds.add(match.user1_id);
        }
      });

      console.log(`🚫 Excluding ${excludedUserIds.size} users with existing matches`);

      // Get all profiles excluding current user and users with existing matches
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          name,
          age,
          city,
          bio,
          avatar_type,
          avatar_emoji,
          avatar_initials,
          avatar_image_url,
          is_profile_complete,
          gender_id,
          pronouns_id
        `)
        .eq('is_profile_complete', true)
        .neq('user_id', currentUserId);
      
      // Filter out users with existing matches
      const filteredProfiles = profiles?.filter(profile => !excludedUserIds.has(profile.user_id)) || [];

      if (error) {
        console.error('Error fetching matching users:', error);
        return [];
      }

      // Get all user IDs for interests lookup
      const userIds = filteredProfiles.map(p => p.user_id);
      
      // Get interests for all users
      const { data: interestsData } = await supabase
        .from('user_interests')
        .select(`
          user_id,
          interest_id,
          interests(label)
        `)
        .in('user_id', userIds);

      // Create a map of user_id to interests
      const interestsMap = {};
      interestsData?.forEach(ui => {
        if (!interestsMap[ui.user_id]) {
          interestsMap[ui.user_id] = [];
        }
        interestsMap[ui.user_id].push(ui.interests.label);
      });

      // Get gender and pronouns data
      const genderIds = [...new Set(profiles.map(p => p.gender_id).filter(Boolean))];
      const pronounsIds = [...new Set(profiles.map(p => p.pronouns_id).filter(Boolean))];

      const { data: gendersData } = await supabase
        .from('genders')
        .select('id, label')
        .in('id', genderIds);

      const { data: pronounsData } = await supabase
        .from('pronouns')
        .select('id, label')
        .in('id', pronounsIds);

      const genderMap = gendersData?.reduce((acc, g) => { acc[g.id] = g.label; return acc; }, {}) || {};
      const pronounsMap = pronounsData?.reduce((acc, p) => { acc[p.id] = p.label; return acc; }, {}) || {};

      return filteredProfiles.map(profile => ({
        id: profile.user_id,
        name: profile.name,
        age: profile.age,
        gender: genderMap[profile.gender_id] || 'Unknown',
        pronouns: pronounsMap[profile.pronouns_id] || '',
        city: profile.city,
        bio: profile.bio || '',
        avatar: {
          type: profile.avatar_type || 'emoji',
          emoji: profile.avatar_emoji || '👤',
          initials: profile.avatar_initials || '',
          image: profile.avatar_image_url || null
        },
        interests: interestsMap[profile.user_id] || [],
        isProfileComplete: profile.is_profile_complete
      }));
    } catch (error) {
      console.error('Error in getMatchingUsers:', error);
      return [];
    }
  }



  // Test database connection
  async testDatabaseConnection() {
    try {
      console.log('🔗 Testing database connection...');
      
      const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .limit(1);

      if (error) {
        console.error('❌ Database connection test failed:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Database connection successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Database test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export const userService = new NameBasedUserService();
