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
      
      // Check if this is a preferences update (different structure)
      if (profileData.searchInterests !== undefined || profileData.profilePrefs !== undefined) {
        return this.updatePreferences(userId, profileData);
      }
      
      // Get gender_id and pronouns_id if gender/pronouns are provided
      let genderId = null;
      let pronounsId = null;
      
      if (profileData.gender) {
        const { data: genderData } = await supabase
          .from('genders')
          .select('id')
          .eq('label', profileData.gender)
          .single();
        genderId = genderData?.id || null;
      }
      
      if (profileData.pronouns) {
        const { data: pronounsData } = await supabase
          .from('pronouns')
          .select('id')
          .eq('label', profileData.pronouns)
          .single();
        pronounsId = pronounsData?.id || null;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          name: profileData.name,
          age: profileData.age,
          city: profileData.city,
          bio: profileData.bio,
          gender_id: genderId,
          pronouns_id: pronounsId,
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

  // Update user preferences (search profile)
  async updatePreferences(userId, preferencesData) {
    try {
      console.log('📝 Updating preferences for user:', userId);
      
      // Check if user_search_profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_search_profile')
        .select('id')
        .eq('user_id', userId)
        .single();

      const searchInterests = preferencesData.searchInterests || [];
      const profilePrefs = preferencesData.profilePrefs || {};
      
      // Map gender labels to IDs if provided
      let genderIds = [];
      if (profilePrefs.genders && profilePrefs.genders.length > 0) {
        const { data: gendersData } = await supabase
          .from('genders')
          .select('id')
          .in('label', profilePrefs.genders);
        genderIds = gendersData?.map(g => g.id) || [];
      }

      // Map relationship type labels to IDs if provided
      let relationshipTypeIds = [];
      if (profilePrefs.relationshipTypes && profilePrefs.relationshipTypes.length > 0) {
        const { data: rTypesData } = await supabase
          .from('relationship_types')
          .select('id')
          .in('label', profilePrefs.relationshipTypes);
        relationshipTypeIds = rTypesData?.map(r => r.id) || [];
      }

      // Map vibe label to ID if provided
      let vibeId = null;
      if (profilePrefs.vibe) {
        const { data: vibeData, error: vibeError } = await supabase
          .from('vibes')
          .select('id')
          .eq('label', profilePrefs.vibe)
          .single();
        vibeId = vibeError ? null : (vibeData?.id || null);
      }

      const searchProfileData = {
        min_age: profilePrefs.ageMin || 18,
        max_age: profilePrefs.ageMax || 100,
        genders: genderIds,
        relationship_types: relationshipTypeIds,
        vibe_id: vibeId,
        vibe_description: profilePrefs.vibeDescription || null,
        max_distance: profilePrefs.distanceKm || 50,
        updated_at: new Date().toISOString()
      };

      if (existingProfile && !checkError) {
        // Update existing
        const { data, error } = await supabase
          .from('user_search_profile')
          .update(searchProfileData)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          console.error('❌ Error updating search profile:', error);
          return { success: false, error: error.message };
        }
      } else {
        // Create new
        const { data, error } = await supabase
          .from('user_search_profile')
          .insert({
            user_id: userId,
            ...searchProfileData
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Error creating search profile:', error);
          return { success: false, error: error.message };
        }
      }

      // Save user interests
      if (searchInterests && searchInterests.length > 0) {
        await this.updateUserInterests(userId, searchInterests);
      }

      console.log('✅ Preferences updated successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error in updatePreferences:', error);
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