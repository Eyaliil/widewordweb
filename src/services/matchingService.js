import { supabase } from '../lib/supabaseClient';
import { scalableMatchingService } from './scalableMatchingService';
import { redisCachingService } from './cachingService';
import { backgroundProcessingService } from './cachingService';
import { performanceMonitoringService } from './performanceMonitoringService';

// Enhanced Supabase matching service with scalable algorithm
export class SupabaseMatchingService {
  // Check if user has an active sent match (one they initiated)
  async hasActiveSentMatch(userId) {
    try {
      const { data: matches, error } = await supabase
        .from('matches')
        .select('id, status, user1_decision')
        .eq('user1_id', userId)
        .eq('status', 'pending')
        .eq('user1_decision', 'pending');

      if (error) {
        console.error('Error checking active sent match:', error);
        return false;
      }

      return matches && matches.length > 0;
    } catch (error) {
      console.error('Error in hasActiveSentMatch:', error);
      return false;
    }
  }

  // Get user's active sent match
  async getActiveSentMatch(userId) {
    try {
      const { data: match, error } = await supabase
        .from('matches')
        .select('*')
        .eq('user1_id', userId)
        .eq('status', 'pending')
        .eq('user1_decision', 'pending')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - no active sent match
          return null;
        }
        console.error('Error getting active sent match:', error);
        return null;
      }

      // Get the matched user's profile separately
      const { data: matchedUserProfile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, name, age, city, bio, avatar_type, avatar_emoji')
        .eq('user_id', match.user2_id)
        .single();

      if (profileError) {
        console.error('Error getting matched user profile:', profileError);
        return null;
      }

      // Transform to match the expected format
      return {
        id: match.id,
        user1Id: match.user1_id,
        user2Id: match.user2_id,
        user1Decision: match.user1_decision,
        user2Decision: match.user2_decision,
        matchScore: match.match_score,
        matchReasons: match.match_reasons,
        matchedUser: {
          id: matchedUserProfile.user_id,
          name: matchedUserProfile.name,
          age: matchedUserProfile.age,
          city: matchedUserProfile.city,
          bio: matchedUserProfile.bio,
          avatar: {
            type: matchedUserProfile.avatar_type,
            emoji: matchedUserProfile.avatar_emoji
          }
        },
        createdAt: new Date(match.created_at),
        status: match.status,
        expiresAt: new Date(match.expires_at)
      };
    } catch (error) {
      console.error('Error in getActiveSentMatch:', error);
      return null;
    }
  }


  // Get matches that are waiting for this user's decision
  async getPendingMatches(userId) {
    // First, clean up expired matches
    await this.cleanupExpiredMatches();
    
    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'pending')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .or(`user1_decision.eq.pending,user2_decision.eq.pending`);
    
    if (error) {
      console.error('Error fetching pending matches:', error);
      return [];
    }

    // Get profiles for all matched users
    const userIds = matches.flatMap(match => [match.user1_id, match.user2_id]);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, name, age, city, bio, avatar_type, avatar_emoji')
      .in('user_id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return [];
    }

    // Create a map of user_id to profile for quick lookup
    const profileMap = profiles.reduce((acc, profile) => {
      acc[profile.user_id] = profile;
      return acc;
    }, {});

    return matches.map(match => {
      // Transform match to show from current user's perspective
      if (match.user2_id === userId) {
        // If current user is user2, flip the match to show from their perspective
        const user1Profile = profileMap[match.user1_id];
        return {
          id: match.id,
          user1Id: userId,
          user2Id: match.user1_id,
          user1Decision: match.user2_decision,
          user2Decision: match.user1_decision,
          matchScore: match.match_score,
          matchReasons: match.match_reasons,
          matchedUser: {
            id: match.user1_id,
            name: user1Profile?.name || 'Unknown User',
            age: user1Profile?.age || 25,
            city: user1Profile?.city || 'Unknown',
            bio: user1Profile?.bio || 'No bio available',
            avatar_type: user1Profile?.avatar_type || 'emoji',
            avatar_emoji: user1Profile?.avatar_emoji || '👤'
          },
          createdAt: new Date(match.created_at),
          status: match.status,
          expiresAt: new Date(match.expires_at)
        };
      } else {
        // Current user is user1, just ensure matchedUser is set
        const user2Profile = profileMap[match.user2_id];
        return {
          id: match.id,
          user1Id: match.user1_id,
          user2Id: match.user2_id,
          user1Decision: match.user1_decision,
          user2Decision: match.user2_decision,
          matchScore: match.match_score,
          matchReasons: match.match_reasons,
          matchedUser: {
            id: match.user2_id,
            name: user2Profile?.name || 'Unknown User',
            age: user2Profile?.age || 25,
            city: user2Profile?.city || 'Unknown',
            bio: user2Profile?.bio || 'No bio available',
            avatar_type: user2Profile?.avatar_type || 'emoji',
            avatar_emoji: user2Profile?.avatar_emoji || '👤'
          },
          createdAt: new Date(match.created_at),
          status: match.status,
          expiresAt: new Date(match.expires_at)
        };
      }
    });
  }

  // Clean up expired matches
  async cleanupExpiredMatches() {
    const now = new Date().toISOString();
    
    const { error } = await supabase
      .from('matches')
      .update({ 
        status: 'expired',
        completed_at: now
      })
      .eq('status', 'pending')
      .lt('expires_at', now);
    
    if (error) {
      console.error('Error cleaning up expired matches:', error);
    }
  }

  // Find potential matches for a user using scalable algorithm
  async findMatches(userId) {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 [SCALABLE] Finding matches for user: ${userId}`);
      
      // Start performance monitoring
      performanceMonitoringService.start();
      
      // Use the scalable matching service
      const matches = await scalableMatchingService.findMatches(userId);
      
      // Record performance metrics
      const queryTime = Date.now() - startTime;
      performanceMonitoringService.recordQuery('findMatches', queryTime, matches.length > 0);
      
      if (matches.length > 0) {
        performanceMonitoringService.recordMatch(true);
        console.log(`✅ [SCALABLE] Found ${matches.length} matches in ${queryTime}ms`);
      } else {
        performanceMonitoringService.recordMatch(false);
        console.log(`❌ [SCALABLE] No matches found in ${queryTime}ms`);
      }
      
      return matches;
      
    } catch (error) {
      const queryTime = Date.now() - startTime;
      performanceMonitoringService.recordQuery('findMatches', queryTime, false);
      performanceMonitoringService.recordError(error, 'findMatches');
      
      console.error('❌ [SCALABLE] Error in findMatches:', error);
      
      // Return empty array if scalable matching fails
      console.log('❌ Scalable matching failed, returning empty results');
      return [];
    }
  }




  // Notify both users about a match
  async notifyBothUsers(user1Id, user2Id, match) {
    console.log(`Notifying both users about match: ${match.id}`);
    
    const notifications = [
      {
        user_id: user1Id,
        type: 'new_match',
        title: 'New Match!',
        message: 'You have a new potential match waiting for your decision.',
        match_id: match.id,
        matched_user_id: user2Id,
        is_read: false
      },
      {
        user_id: user2Id,
        type: 'new_match',
        title: 'New Match!',
        message: 'You have a new potential match waiting for your decision.',
        match_id: match.id,
        matched_user_id: user1Id,
        is_read: false
      }
    ];

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('Error creating notifications:', error);
    }
  }

  // Get notifications for a user
  async getNotifications(userId) {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return notifications || [];
    } catch (error) {
      console.error('Error in getNotifications:', error);
      return [];
    }
  }

  // Clear notifications for a user
  async clearNotifications(userId) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  // Mark a specific notification as read
  async markNotificationAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }

      console.log(`✅ Notification ${notificationId} marked as read`);
    } catch (error) {
      console.error('Error in markNotificationAsRead:', error);
      throw error;
    }
  }


  // Get match history (each user sees only their own perspective)
  async getMatchHistory(userId) {
    console.log(`📋 Fetching match history from database for user: ${userId}`);
    
    try {
      const { data: matches, error } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching match history:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return [];
      }

      console.log(`✅ Found ${matches.length} matches in database for user ${userId}`);

      if (matches.length === 0) {
        return [];
      }

      // Get profiles for all matched users
      const userIds = matches.flatMap(match => [match.user1_id, match.user2_id]);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, age, city, bio, avatar_type, avatar_emoji')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles for match history:', profilesError);
        return [];
      }

      // Create a map of user_id to profile for quick lookup
      const profileMap = profiles.reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {});

      // For each unique match pair, show only the match where the current user is user1
      const uniqueMatches = [];
      const processedPairs = new Set();
      
      matches.forEach(match => {
        // Create a unique key for the match pair (sorted to avoid duplicates)
        const pairKey = [match.user1_id, match.user2_id].sort().join('_');
        
        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey);
          
          // Keep the original match structure, just ensure matchedUser is populated correctly
          let matchedUserData;
          if (match.user1_id === userId) {
            // Current user is user1 (sent the match), matchedUser should be user2
            const user2Profile = profileMap[match.user2_id];
            matchedUserData = user2Profile ? {
              id: user2Profile.user_id,
              name: user2Profile.name,
              age: user2Profile.age,
              city: user2Profile.city,
              bio: user2Profile.bio,
              avatar: {
                type: user2Profile.avatar_type,
                emoji: user2Profile.avatar_emoji
              }
            } : {
              id: match.user2_id,
              name: `User ${match.user2_id.slice(0, 8)}...`,
              avatar: { emoji: '👤' }
            };
          } else {
            // Current user is user2 (received the match), matchedUser should be user1
            const user1Profile = profileMap[match.user1_id];
            matchedUserData = user1Profile ? {
              id: user1Profile.user_id,
              name: user1Profile.name,
              age: user1Profile.age,
              city: user1Profile.city,
              bio: user1Profile.bio,
              avatar: {
                type: user1Profile.avatar_type,
                emoji: user1Profile.avatar_emoji
              }
            } : {
              id: match.user1_id,
              name: `User ${match.user1_id.slice(0, 8)}...`,
              avatar: { emoji: '👤' }
            };
          }

          uniqueMatches.push({
            id: match.id,
            user1Id: match.user1_id,
            user2Id: match.user2_id,
            user1Decision: match.user1_decision,
            user2Decision: match.user2_decision,
            matchScore: match.match_score,
            matchReasons: match.match_reasons,
            matchedUser: matchedUserData,
            createdAt: new Date(match.created_at),
            status: match.status,
            expiresAt: new Date(match.expires_at)
          });
        }
      });
      
      return uniqueMatches;
    } catch (dbError) {
      console.error('❌ Database connection error in getMatchHistory:', dbError);
      return [];
    }
  }

  // Make a decision on a match
  async makeDecision(matchId, userId, decision) {
    // First, get the current match
    const { data: match, error: fetchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (fetchError || !match) {
      return { success: false, error: 'Match not found' };
    }

    // Check if match is still active
    if (match.status !== 'pending') {
      return { success: false, error: 'Match is no longer active' };
    }

    // Check if match has expired
    if (new Date() > new Date(match.expires_at)) {
      await supabase
        .from('matches')
        .update({ status: 'expired', completed_at: new Date().toISOString() })
        .eq('id', matchId);
      return { success: false, error: 'Match has expired' };
    }

    // Update the decision for the current user
    let updateData = {};
    if (match.user1_id === userId) {
      updateData.user1_decision = decision;
    } else if (match.user2_id === userId) {
      updateData.user2_decision = decision;
    } else {
      return { success: false, error: 'User not part of this match' };
    }

    const { data: updatedMatch, error: updateError } = await supabase
      .from('matches')
      .update(updateData)
      .eq('id', matchId)
      .select('*')
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Check if both users have made decisions
    if (updatedMatch.user1_decision !== 'pending' && updatedMatch.user2_decision !== 'pending') {
      const finalStatus = (updatedMatch.user1_decision === 'accepted' && updatedMatch.user2_decision === 'accepted') 
        ? 'mutual_match' 
        : 'rejected';
      
      await supabase
        .from('matches')
        .update({ 
          status: finalStatus,
          completed_at: new Date().toISOString()
        })
        .eq('id', matchId);

      if (finalStatus === 'mutual_match') {
        console.log(`🎉 Mutual match! ${updatedMatch.user1_id} and ${updatedMatch.user2_id} both accepted`);
        await this.createMutualMatchNotification(updatedMatch);
      } else {
        console.log(`❌ Match rejected: ${updatedMatch.user1_id} (${updatedMatch.user1_decision}) and ${updatedMatch.user2_id} (${updatedMatch.user2_decision})`);
      }
    } else {
      console.log(`⏳ ${userId} made decision: ${decision}. Waiting for other user...`);
    }

    return { success: true, match: updatedMatch };
  }

  // Respond to a match (wrapper for makeDecision)
  async respondToMatch(matchId, userId, decision) {
    console.log(`🎯 Responding to match ${matchId} with decision: ${decision} for user: ${userId}`);
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const result = await this.makeDecision(matchId, userId, decision);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to respond to match');
    }
    
    return result;
  }

  // Create notification for mutual match
  async createMutualMatchNotification(match) {
    try {
      console.log(`🔔 Creating mutual match notifications for match ${match.id}`);
      
      // Create notifications for both users
      const notifications = [
        {
          user_id: match.user1_id,
          type: 'mutual_match',
          title: '🎉 Mutual Match!',
          message: 'You both accepted each other! Start chatting now.',
          data: { match_id: match.id },
          is_read: false
        },
        {
          user_id: match.user2_id,
          type: 'mutual_match',
          title: '🎉 Mutual Match!',
          message: 'You both accepted each other! Start chatting now.',
          data: { match_id: match.id },
          is_read: false
        }
      ];

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) {
        console.error('❌ Error creating mutual match notifications:', error);
      } else {
        console.log('✅ Mutual match notifications created successfully');
      }
    } catch (error) {
      console.error('❌ Error in createMutualMatchNotification:', error);
    }
  }
}

// Create service instance
const supabaseService = new SupabaseMatchingService();

// Initialize scalable services
export const initializeScalableServices = async () => {
  try {
    console.log('🚀 Initializing scalable matching services...');
    
    // Start background processing
    backgroundProcessingService.start();
    
    // Start performance monitoring
    performanceMonitoringService.start();
    
    console.log('✅ Scalable services initialized successfully');
    
    // Log initial performance metrics
    setTimeout(() => {
      const metrics = performanceMonitoringService.getPerformanceSummary();
      console.log('📊 Initial performance metrics:', metrics);
    }, 5000);
    
  } catch (error) {
    console.error('❌ Error initializing scalable services:', error);
  }
};

// Function to get the appropriate service
export const getMatchingService = () => {
  // Always use Supabase service for persistent data
  return supabaseService;
};

// Function to get performance metrics
export const getPerformanceMetrics = () => {
  return performanceMonitoringService.getDetailedReport();
};

// Function to get cache statistics
export const getCacheStats = async () => {
  return await redisCachingService.getCacheStats();
};

// Function to clear cache
export const clearCache = async () => {
  return await redisCachingService.clearAllCache();
};

// Default export
export const currentMatchingService = supabaseService;
