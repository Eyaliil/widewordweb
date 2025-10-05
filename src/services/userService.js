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
        
        // Set user as online
        await this.setUserOnline(existingUser.id);
        
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

      // Set new user as online
      await this.setUserOnline(newUser.id);

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
          genders(label),
          pronouns(label),
          user_interests(interest_id, interests(label))
        `)
        .eq('user_id', userId)
        .eq('is_profile_complete', true)
        .single();

      if (error) {
        console.error('Error fetching user by ID:', error);
        return null;
      }

      return {
        id: profile.user_id,
        name: profile.name,
        age: profile.age,
        gender: profile.genders?.label || 'Unknown',
        pronouns: profile.pronouns?.label || '',
        city: profile.city,
        bio: profile.bio || '',
        avatar: {
          type: profile.avatar_type || 'emoji',
          emoji: profile.avatar_emoji || '👤',
          initials: profile.avatar_initials || '',
          image: profile.avatar_image_url || null
        },
        interests: profile.user_interests?.map(ui => ui.interests.label) || [],
        isProfileComplete: profile.is_profile_complete
      };
    } catch (error) {
      console.error('Error in getUserById:', error);
      return null;
    }
  }

  // Get all users for matching (excludes current user)
  async getMatchingUsers(currentUserId) {
    try {
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
          genders(label),
          pronouns(label),
          user_interests(interest_id, interests(label))
        `)
        .eq('is_profile_complete', true)
        .neq('user_id', currentUserId);

      if (error) {
        console.error('Error fetching matching users:', error);
        return [];
      }

      return profiles.map(profile => ({
        id: profile.user_id,
        name: profile.name,
        age: profile.age,
        gender: profile.genders?.label || 'Unknown',
        pronouns: profile.pronouns?.label || '',
        city: profile.city,
        bio: profile.bio || '',
        avatar: {
          type: profile.avatar_type || 'emoji',
          emoji: profile.avatar_emoji || '👤',
          initials: profile.avatar_initials || '',
          image: profile.avatar_image_url || null
        },
        interests: profile.user_interests?.map(ui => ui.interests.label) || [],
        isProfileComplete: profile.is_profile_complete
      }));
    } catch (error) {
      console.error('Error in getMatchingUsers:', error);
      return [];
    }
  }

  // Get only online users for matching (excludes current user)
  async getOnlineMatchingUsers(currentUserId) {
    try {
      console.log(`🔍 Getting online matching users (excluding ${currentUserId})`);
      
      // First get all online user IDs
      const { data: onlineUsers, error: onlineError } = await supabase
        .from('online_users')
        .select('user_id')
        .eq('is_online', true)
        .neq('user_id', currentUserId);

      if (onlineError) {
        console.error('❌ Error fetching online users:', onlineError);
        return [];
      }

      console.log(`📊 Found ${onlineUsers.length} online users in database:`, onlineUsers);

      if (onlineUsers.length === 0) {
        console.log('⚠️  No online users available for matching');
        return [];
      }

      const onlineUserIds = onlineUsers.map(user => user.user_id);
      console.log(`✅ Online user IDs to check:`, onlineUserIds);

      // Get profiles for online users only
      console.log('🔍 Fetching profiles for online users...');
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
          genders(label),
          pronouns(label),
          user_interests(interest_id, interests(label))
        `)
        .eq('is_profile_complete', true)
        .in('user_id', onlineUserIds);

      if (error) {
        console.error('❌ Error fetching online user profiles:', error);
        return [];
      }

      console.log(`✅ Found ${profiles.length} complete profiles for online users:`, profiles.map(p => ({ id: p.user_id, name: p.name, complete: p.is_profile_complete })));

      return profiles.map(profile => ({
        id: profile.user_id,
        name: profile.name,
        age: profile.age,
        gender: profile.genders?.label || 'Unknown',
        pronouns: profile.pronouns?.label || '',
        city: profile.city,
        bio: profile.bio || '',
        avatar: {
          type: profile.avatar_type || 'emoji',
          emoji: profile.avatar_emoji || '👤',
          initials: profile.avatar_initials || '',
          image: profile.avatar_image_url || null
        },
        interests: profile.user_interests?.map(ui => ui.interests.label) || [],
        isProfileComplete: profile.is_profile_complete
      }));
    } catch (error) {
      console.error('Error in getOnlineMatchingUsers:', error);
      return [];
    }
  }

  // Set user as online
  async setUserOnline(userId) {
    try {
      console.log(`🟢 Setting user ${userId} as online`);
      
      const { data, error } = await supabase
        .from('online_users')
        .upsert({
          user_id: userId,
          is_online: true,
          last_seen: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select();

      if (error) {
        console.error('❌ Error setting user online:', error);
        console.error('❌ Error details:', error.message, error.details, error.hint);
        return { success: false, error: error.message };
      }

      console.log(`✅ User ${userId} is now online`);
      console.log('✅ Online status data:', data);
      return { success: true };
    } catch (error) {
      console.error('❌ Error in setUserOnline:', error);
      return { success: false, error: error.message };
    }
  }

  // Set user as offline
  async setUserOffline(userId) {
    try {
      console.log(`🔴 Setting user ${userId} as offline`);
      
      const { data, error } = await supabase
        .from('online_users')
        .upsert({
          user_id: userId,
          is_online: false,
          last_seen: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select();

      if (error) {
        console.error('❌ Error setting user offline:', error);
        console.error('❌ Error details:', error.message, error.details, error.hint);
        return { success: false, error: error.message };
      }

      console.log(`✅ User ${userId} is now offline`);
      console.log('✅ Offline status data:', data);
      return { success: true };
    } catch (error) {
      console.error('❌ Error in setUserOffline:', error);
      return { success: false, error: error.message };
    }
  }

  // Get online users
  async getOnlineUsers() {
    try {
      const { data: onlineUsers, error } = await supabase
        .from('online_users')
        .select(`
          user_id,
          is_online,
          last_seen,
          users(name)
        `)
        .eq('is_online', true);

      if (error) {
        console.error('❌ Error fetching online users:', error);
        return [];
      }

      return onlineUsers.map(ou => ({
        id: ou.user_id,
        name: ou.users.name,
        isOnline: ou.is_online,
        lastSeen: ou.last_seen
      }));
    } catch (error) {
      console.error('❌ Error in getOnlineUsers:', error);
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
