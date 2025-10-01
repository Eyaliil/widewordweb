import { supabase } from '../lib/supabaseClient';

// Service for managing database users
export class DatabaseUserService {
  // Get all users from the database
  async getAllUsers() {
    try {
      console.log('🔄 Fetching users from Supabase database...');
      
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
        .eq('is_profile_complete', true);

      if (error) {
        console.error('❌ Database error fetching users:', error);
        console.error('Make sure your Supabase credentials are correct in .env file');
        throw error;
      }

      const users = profiles.map(profile => ({
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

      console.log(`✅ Successfully loaded ${users.length} users from database:`, users.map(u => u.name));
      return users;
    } catch (error) {
      console.error('❌ Error in getAllUsers:', error);
      console.error('Falling back to fake users. Check your Supabase setup.');
      throw error;
    }
  }

  // Get a specific user by ID
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
        .single();

      if (error) {
        console.error('Error fetching user:', error);
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

  // Get users for matching (excludes current user)
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

  // Create a user from database data (for AuthContext)
  createUserFromDatabase(profile, email = null) {
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
      isProfileComplete: profile.is_profile_complete,
      email: email || `${profile.name.toLowerCase().replace(' ', '.')}@example.com`
    };
  }
}

export const userService = new DatabaseUserService();
