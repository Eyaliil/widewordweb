import { supabase } from '../lib/supabaseClient';
import { fakeUsers } from '../data/fakeUsers';
import { userService } from './userService';

// Mock matching service for fake users
export class MockMatchingService {
  constructor() {
    this.onlineUsers = new Map();
    this.matches = new Map();
    this.matchHistory = [];
  }

  // Check if user has an active sent match (one they initiated)
  hasActiveSentMatch(userId) {
    const activeSentMatch = this.matchHistory.find(match => 
      match.user1Id === userId && 
      match.status === 'pending' && 
      match.user1Decision === 'pending'
    );
    return !!activeSentMatch;
  }

  // Get user's active sent match
  getActiveSentMatch(userId) {
    const activeSentMatch = this.matchHistory.find(match => 
      match.user1Id === userId && 
      match.status === 'pending' && 
      match.user1Decision === 'pending'
    );
    return activeSentMatch || null;
  }

  // Go online and start looking for matches
  async goOnline(userId) {
    console.log(`User ${userId} is now online`);
    
    // Check if user already has an active sent match
    if (this.hasActiveSentMatch(userId)) {
      console.log('❌ User already has an active sent match. Cannot create new match.');
      return { success: false, error: 'You already have an active match pending. Wait for a response or cancel your current match.' };
    }
    
    this.onlineUsers.set(userId, {
      userId,
      isOnline: true,
      lastSeen: new Date(),
      preferences: this.generateMockPreferences(userId)
    });
    
    // Check if there are any pending matches waiting for this user's decision
    const pendingMatches = await this.getPendingMatches(userId);
    if (pendingMatches.length > 0) {
      console.log(`User ${userId} has ${pendingMatches.length} pending matches waiting for decision`);
      return { success: true, hasPendingMatches: true, pendingMatches };
    }
    
    // Find matches immediately and return them
    const matches = await this.findMatches(userId);
    if (matches.length > 0) {
      console.log(`User ${userId} found ${matches.length} new matches`);
      return { success: true, hasPendingMatches: false, pendingMatches: [], newMatches: matches };
    }
    
    return { success: true, hasPendingMatches: false, pendingMatches: [], newMatches: [] };
  }

  // Get matches that are waiting for this user's decision
  async getPendingMatches(userId) {
    // First, clean up expired matches
    this.cleanupExpiredMatches();
    
    const userMatches = Array.from(this.matches.values())
      .filter(match => 
        match.status === 'pending' && (
          (match.user1Id === userId && match.user1Decision === 'pending') ||
          (match.user2Id === userId && match.user2Decision === 'pending')
        )
      )
      .map(match => {
        // Transform match to show from current user's perspective
        if (match.user2Id === userId) {
          // If current user is user2, flip the match to show from their perspective
          const transformedMatch = {
            ...match,
            user1Id: userId,
            user2Id: match.user1Id,
            user1Decision: match.user2Decision,
            user2Decision: match.user1Decision,
            matchedUser: fakeUsers.find(u => u.id === match.user1Id)
          };
          return transformedMatch;
        } else {
          // Current user is user1, just ensure matchedUser is set
          if (!match.matchedUser) {
            match.matchedUser = fakeUsers.find(u => u.id === match.user2Id);
          }
          return match;
        }
      });
    
    return userMatches;
  }

  // Clean up expired matches
  cleanupExpiredMatches() {
    const now = new Date();
    const expiredMatches = Array.from(this.matches.values())
      .filter(match => match.status === 'pending' && now > match.expiresAt);
    
    expiredMatches.forEach(match => {
      match.status = 'expired';
      match.completedAt = now;
      this.matches.set(match.id, match);
      
      // Update matchHistory
      const historyIndex = this.matchHistory.findIndex(m => m.id === match.id);
      if (historyIndex !== -1) {
        this.matchHistory[historyIndex] = { ...match };
      }
      
      console.log(`🧹 Cleaned up expired match: ${match.id}`);
    });
  }

  // Go offline
  async goOffline(userId) {
    console.log(`User ${userId} is now offline`);
    this.onlineUsers.delete(userId);
    return { success: true };
  }

  // Generate mock preferences for fake users
  generateMockPreferences(userId) {
    const preferences = {
      genders: ['Man', 'Woman', 'Non-binary'].slice(0, Math.floor(Math.random() * 3) + 1),
      ageMin: 22 + Math.floor(Math.random() * 10),
      ageMax: 28 + Math.floor(Math.random() * 15),
      distanceKm: [25, 50, 75, 100][Math.floor(Math.random() * 4)],
      relationshipTypes: ['Casual Dating', 'Serious Relationship', 'Friendship'].slice(0, Math.floor(Math.random() * 3) + 1),
      vibe: ['Adventure', 'Romantic', 'Fun', 'Intellectual', 'Creative', 'Chill'][Math.floor(Math.random() * 6)],
      interests: ['Music', 'Travel', 'Art', 'Sports', 'Food', 'Nature', 'Technology', 'Fitness'].slice(0, Math.floor(Math.random() * 5) + 2)
    };
    return preferences;
  }

  // Find potential matches for a user
  async findMatches(userId) {
    console.log(`Finding matches for user: ${userId}`);
    const user = this.onlineUsers.get(userId);
    if (!user) {
      console.log('User not found in online users');
      return [];
    }

    // Get current user data from fakeUsers
    const currentUserData = fakeUsers.find(u => u.id === userId);
    if (!currentUserData) {
      console.log('Current user data not found in fakeUsers');
      return [];
    }
    console.log('Current user data:', currentUserData);

    // Get all other fake users as potential matches
    const otherUsers = fakeUsers.filter(u => u.id !== userId);
    console.log(`Found ${otherUsers.length} other users as potential matches`);

    if (otherUsers.length === 0) {
      console.log('No other users available');
      return [];
    }

    // Calculate compatibility scores
    const potentialMatches = otherUsers.map(otherUser => {
      const score = this.calculateCompatibilityScore(currentUserData, otherUser);
      console.log(`Compatibility with ${otherUser.name}: ${score.score} (${score.reasons.join(', ')})`);
      return {
        id: otherUser.id,
        matchedUser: otherUser,
        matchScore: score.score,
        matchReasons: score.reasons
      };
    }).filter(match => match.matchScore >= 30); // Minimum threshold

    console.log(`Found ${potentialMatches.length} matches above threshold (30)`);

    // Sort by score and take the best match
    potentialMatches.sort((a, b) => b.matchScore - a.matchScore);
    
    if (potentialMatches.length > 0) {
      const bestMatch = potentialMatches[0];
      console.log(`Creating match with ${bestMatch.matchedUser.name} (score: ${bestMatch.matchScore})`);
      const createdMatch = this.createMatch(userId, bestMatch.id, bestMatch.matchScore, bestMatch.matchReasons);
      return [createdMatch]; // Return the actual created match for the UI
    }

    console.log('No matches found above threshold');
    
    // For testing purposes, if no matches found, create a match with the first available user
    if (otherUsers.length > 0) {
      console.log('Creating fallback match for testing');
      const fallbackUser = otherUsers[0];
      const fallbackScore = 75; // High score to ensure it shows
      const fallbackReasons = ['Great compatibility potential'];
      const createdMatch = this.createMatch(userId, fallbackUser.id, fallbackScore, fallbackReasons);
      return [createdMatch];
    }
    
    return [];
  }

  // Calculate compatibility score between two users
  calculateCompatibilityScore(user1, user2) {
    let score = 0;
    let reasons = [];

    // Common interests (40 points max)
    const commonInterests = user1.interests.filter(interest => 
      user2.interests.includes(interest)
    );
    const interestScore = Math.min(commonInterests.length * 10, 40);
    score += interestScore;
    if (commonInterests.length > 0) {
      reasons.push(`Shared ${commonInterests.length} interests: ${commonInterests.join(', ')}`);
    }

    // Age compatibility (20 points max) - simplified age range check
    const ageDiff = Math.abs(user1.age - user2.age);
    if (ageDiff <= 5) {
      score += 20;
      reasons.push('Similar age');
    } else if (ageDiff <= 10) {
      score += 10;
      reasons.push('Age compatible');
    }

    // Gender compatibility (20 points max) - simplified gender matching
    const genderCompatible = (
      (user1.gender === 'Woman' && user2.gender === 'Man') ||
      (user1.gender === 'Man' && user2.gender === 'Woman') ||
      (user1.gender === 'Non-binary' && user2.gender === 'Non-binary') ||
      (user1.gender === 'Non-binary' && (user2.gender === 'Man' || user2.gender === 'Woman')) ||
      ((user1.gender === 'Man' || user1.gender === 'Woman') && user2.gender === 'Non-binary')
    );
    
    if (genderCompatible) {
      score += 20;
      reasons.push('Gender compatible');
    }

    // Location compatibility (10 points max) - same city gets full points
    if (user1.city === user2.city) {
      score += 10;
      reasons.push('Same city');
    } else {
      score += 5;
      reasons.push('Different cities');
    }

    // Bio compatibility (5 points max) - check for similar keywords
    const user1BioWords = user1.bio.toLowerCase().split(' ');
    const user2BioWords = user2.bio.toLowerCase().split(' ');
    const commonBioWords = user1BioWords.filter(word => 
      word.length > 3 && user2BioWords.includes(word)
    );
    
    if (commonBioWords.length > 0) {
      score += 5;
      reasons.push('Similar interests in bio');
    }

    // Random bonus for variety (5 points max)
    const randomBonus = Math.floor(Math.random() * 6);
    score += randomBonus;
    if (randomBonus > 0) {
      reasons.push('Great chemistry potential');
    }

    return { score, reasons };
  }

  // Create a match between two users
  createMatch(user1Id, user2Id, score, reasons) {
    const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const match = {
      id: matchId,
      user1Id,
      user2Id,
      user1Decision: 'pending',
      user2Decision: 'pending',
      matchScore: score,
      matchReasons: reasons,
      // Don't set matchedUser here - it will be populated dynamically based on who's viewing
      createdAt: new Date(),
      status: 'pending', // pending, mutual_match, rejected, expired
      completedAt: null,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    };

    this.matches.set(matchId, match);
    this.matchHistory.push(match);

    console.log(`Match created: ${user1Id} <-> ${user2Id} (Score: ${score}) - Status: ${match.status}`);
    console.log('Match object:', match);
    
    // Notify both users about the match
    this.notifyBothUsers(user1Id, user2Id, match);

    // Set up expiration timer
    this.setupMatchExpiration(matchId);

    return match;
  }

  // Notify both users about a match
  notifyBothUsers(user1Id, user2Id, match) {
    console.log(`Notifying both users about match: ${match.id}`);
    
    // Store one notification per user for this match pair
    this.storeNotification(user1Id, {
      type: 'new_match',
      matchId: match.id,
      matchedUserId: user2Id,
      matchScore: match.matchScore,
      timestamp: new Date(),
      matchPairId: `${user1Id}_${user2Id}` // Unique identifier for this match pair
    });
    
    this.storeNotification(user2Id, {
      type: 'new_match',
      matchId: match.id,
      matchedUserId: user1Id,
      matchScore: match.matchScore,
      timestamp: new Date(),
      matchPairId: `${user1Id}_${user2Id}` // Same unique identifier
    });
  }

  // Store notification for a user (prevents duplicates for same match pair)
  storeNotification(userId, notification) {
    if (!this.notifications) {
      this.notifications = new Map();
    }
    
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    
    const userNotifications = this.notifications.get(userId);
    
    // Check if we already have a notification for this match pair
    const existingNotification = userNotifications.find(n => 
      n.type === 'new_match' && n.matchPairId === notification.matchPairId
    );
    
    if (!existingNotification) {
      userNotifications.push(notification);
      console.log(`Notification stored for user ${userId}:`, notification);
    } else {
      console.log(`Duplicate notification prevented for user ${userId} and match pair ${notification.matchPairId}`);
    }
  }

  // Get notifications for a user
  getNotifications(userId) {
    if (!this.notifications || !this.notifications.has(userId)) {
      return [];
    }
    return this.notifications.get(userId);
  }

  // Clear notifications for a user
  clearNotifications(userId) {
    if (this.notifications && this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
  }

  // Get matches for a user (each user sees only their own perspective)
  async getMatches(userId) {
    const userMatches = Array.from(this.matches.values())
      .filter(match => match.user1Id === userId || match.user2Id === userId);
    
    // For each unique match pair, show only the match where the current user is user1
    const uniqueMatches = [];
    const processedPairs = new Set();
    
    userMatches.forEach(match => {
      // Create a unique key for the match pair (sorted to avoid duplicates)
      const pairKey = [match.user1Id, match.user2Id].sort().join('_');
      
      if (!processedPairs.has(pairKey)) {
        processedPairs.add(pairKey);
        
        // Create a copy of the match for this user's perspective
        const userMatch = { ...match };
        
        // Populate matchedUser based on current user's perspective
        if (match.user1Id === userId) {
          // Current user is user1 (sent the match), matchedUser should be user2
          userMatch.matchedUser = fakeUsers.find(u => u.id === match.user2Id);
          if (!userMatch.matchedUser) {
            userMatch.matchedUser = {
              id: match.user2Id,
              name: `User ${match.user2Id.slice(0, 8)}...`,
              avatar: { emoji: '👤' }
            };
          }
        } else {
          // Current user is user2 (received the match), matchedUser should be user1
          userMatch.matchedUser = fakeUsers.find(u => u.id === match.user1Id);
          if (!userMatch.matchedUser) {
            userMatch.matchedUser = {
              id: match.user1Id,
              name: `User ${match.user1Id.slice(0, 8)}...`,
              avatar: { emoji: '👤' }
            };
          }
        }
        
        uniqueMatches.push(userMatch);
      }
    });
    
    return uniqueMatches;
  }

  // Make a decision on a match
  async makeDecision(matchId, userId, decision) {
    const match = this.matches.get(matchId);
    if (!match) return { success: false, error: 'Match not found' };

    // Check if match is still active
    if (match.status !== 'pending') {
      return { success: false, error: 'Match is no longer active' };
    }

    // Check if match has expired
    if (new Date() > match.expiresAt) {
      match.status = 'expired';
      this.matches.set(matchId, match);
      return { success: false, error: 'Match has expired' };
    }

    // Update the decision for the current user
    if (match.user1Id === userId) {
      match.user1Decision = decision;
    } else if (match.user2Id === userId) {
      match.user2Decision = decision;
    } else {
      return { success: false, error: 'User not part of this match' };
    }

    // Update the match in both the matches map and matchHistory
    this.matches.set(matchId, match);
    
    // Also update the corresponding entry in matchHistory
    const historyIndex = this.matchHistory.findIndex(m => m.id === matchId);
    if (historyIndex !== -1) {
      this.matchHistory[historyIndex] = { ...match };
    }

    // Check if both users have made decisions
    if (match.user1Decision !== 'pending' && match.user2Decision !== 'pending') {
      match.completedAt = new Date();
      
      if (match.user1Decision === 'accepted' && match.user2Decision === 'accepted') {
        match.status = 'mutual_match';
        console.log(`🎉 Mutual match! ${match.user1Id} and ${match.user2Id} both accepted`);
        this.createMutualMatchNotification(match);
      } else {
        match.status = 'rejected';
        console.log(`❌ Match rejected: ${match.user1Id} (${match.user1Decision}) and ${match.user2Id} (${match.user2Decision})`);
      }
      
      // Update the match with final status
      this.matches.set(matchId, match);
      if (historyIndex !== -1) {
        this.matchHistory[historyIndex] = { ...match };
      }
    } else {
      console.log(`⏳ ${userId} made decision: ${decision}. Waiting for other user...`);
    }

    return { success: true, match };
  }

  // Set up expiration timer for a match
  setupMatchExpiration(matchId) {
    const match = this.matches.get(matchId);
    if (!match) return;

    const timeUntilExpiry = match.expiresAt.getTime() - Date.now();
    
    setTimeout(() => {
      const currentMatch = this.matches.get(matchId);
      if (currentMatch && currentMatch.status === 'pending') {
        currentMatch.status = 'expired';
        currentMatch.completedAt = new Date();
        this.matches.set(matchId, currentMatch);
        
        // Update matchHistory
        const historyIndex = this.matchHistory.findIndex(m => m.id === matchId);
        if (historyIndex !== -1) {
          this.matchHistory[historyIndex] = { ...currentMatch };
        }
        
        console.log(`⏰ Match ${matchId} expired - no decisions made within 24 hours`);
      }
    }, timeUntilExpiry);
  }

  // Create notification for mutual match
  createMutualMatchNotification(match) {
    this.storeNotification(match.user1Id, {
      type: 'mutual_match',
      matchId: match.id,
      matchedUserId: match.user2Id,
      matchScore: match.matchScore,
      timestamp: new Date(),
      matchPairId: `${match.user1Id}_${match.user2Id}`
    });

    this.storeNotification(match.user2Id, {
      type: 'mutual_match',
      matchId: match.id,
      matchedUserId: match.user1Id,
      matchScore: match.matchScore,
      timestamp: new Date(),
      matchPairId: `${match.user1Id}_${match.user2Id}`
    });
  }

  // Get match history (each user sees only their own perspective)
  async getMatchHistory(userId) {
    const userMatches = this.matchHistory.filter(match => 
      match.user1Id === userId || match.user2Id === userId
    );
    
    // For each unique match pair, show only the match where the current user is user1
    const uniqueMatches = [];
    const processedPairs = new Set();
    
    userMatches.forEach(match => {
      // Create a unique key for the match pair (sorted to avoid duplicates)
      const pairKey = [match.user1Id, match.user2Id].sort().join('_');
      
      if (!processedPairs.has(pairKey)) {
        processedPairs.add(pairKey);
        
        // Create a copy of the match for this user's perspective
        const userMatch = { ...match };
        
        // Populate matchedUser based on current user's perspective
        if (match.user1Id === userId) {
          // Current user is user1 (sent the match), matchedUser should be user2
          userMatch.matchedUser = fakeUsers.find(u => u.id === match.user2Id);
          if (!userMatch.matchedUser) {
            userMatch.matchedUser = {
              id: match.user2Id,
              name: `User ${match.user2Id.slice(0, 8)}...`,
              avatar: { emoji: '👤' }
            };
          }
        } else {
          // Current user is user2 (received the match), matchedUser should be user1
          userMatch.matchedUser = fakeUsers.find(u => u.id === match.user1Id);
          if (!userMatch.matchedUser) {
            userMatch.matchedUser = {
              id: match.user1Id,
              name: `User ${match.user1Id.slice(0, 8)}...`,
              avatar: { emoji: '👤' }
            };
          }
        }
        
        uniqueMatches.push(userMatch);
      }
    });
    
    return uniqueMatches;
  }
}

// Create a singleton instance
export const matchingService = new MockMatchingService();

// Real Supabase matching service (for persistent data)
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
        .select(`
          *,
          user2:profiles!matches_user2_id_fkey(name, age, city, bio, avatar_type, avatar_emoji)
        `)
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
          id: match.user2.user_id,
          name: match.user2.name,
          age: match.user2.age,
          city: match.user2.city,
          bio: match.user2.bio,
          avatar: {
            type: match.user2.avatar_type,
            emoji: match.user2.avatar_emoji
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

  // Go online and start looking for matches
  async goOnline(userId) {
    console.log(`User ${userId} is now online`);
    
    // Check if user already has an active sent match
    const hasActiveMatch = await this.hasActiveSentMatch(userId);
    if (hasActiveMatch) {
      console.log('❌ User already has an active sent match. Cannot create new match.');
      return { success: false, error: 'You already have an active match pending. Wait for a response or cancel your current match.' };
    }
    
    // Add user to online_users table
    const { error } = await supabase
      .from('online_users')
      .upsert({ user_id: userId, is_online: true, last_seen: new Date().toISOString() }, { onConflict: 'user_id' });
    
    if (error) {
      console.error('Error going online:', error);
      return { success: false, error: error.message };
    }
    
    // Check if there are any pending matches waiting for this user's decision
    const pendingMatches = await this.getPendingMatches(userId);
    if (pendingMatches.length > 0) {
      console.log(`User ${userId} has ${pendingMatches.length} pending matches waiting for decision`);
      return { success: true, hasPendingMatches: true, pendingMatches };
    }
    
    // Find new matches and create them in the database
    const newMatches = await this.findMatches(userId);
    if (newMatches.length > 0) {
      console.log(`User ${userId} found ${newMatches.length} new matches`);
      return { success: true, hasPendingMatches: false, pendingMatches: [], newMatches };
    }
    
    return { success: true, hasPendingMatches: false, pendingMatches: [], newMatches: [] };
  }

  // Go offline
  async goOffline(userId) {
    console.log(`User ${userId} is now offline`);
    
    const { error } = await supabase
      .from('online_users')
      .upsert({ user_id: userId, is_online: false, last_seen: new Date().toISOString() }, { onConflict: 'user_id' });
    
    if (error) {
      console.error('Error going offline:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  }

  // Get matches that are waiting for this user's decision
  async getPendingMatches(userId) {
    // First, clean up expired matches
    await this.cleanupExpiredMatches();
    
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        *,
        user1:profiles!matches_user1_id_fkey(name, age, city, bio, avatar_type, avatar_emoji),
        user2:profiles!matches_user2_id_fkey(name, age, city, bio, avatar_type, avatar_emoji)
      `)
      .eq('status', 'pending')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .or(`user1_decision.eq.pending,user2_decision.eq.pending`);
    
    if (error) {
      console.error('Error fetching pending matches:', error);
      return [];
    }

    return matches.map(match => {
      // Transform match to show from current user's perspective
      if (match.user2_id === userId) {
        // If current user is user2, flip the match to show from their perspective
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
            name: match.user1.name,
            age: match.user1.age,
            city: match.user1.city,
            bio: match.user1.bio,
            avatar_type: match.user1.avatar_type,
            avatar_emoji: match.user1.avatar_emoji
          },
          createdAt: new Date(match.created_at),
          status: match.status,
          expiresAt: new Date(match.expires_at)
        };
      } else {
        // Current user is user1, just ensure matchedUser is set
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
            name: match.user2.name,
            age: match.user2.age,
            city: match.user2.city,
            bio: match.user2.bio,
            avatar_type: match.user2.avatar_type,
            avatar_emoji: match.user2.avatar_emoji
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

  // Find potential matches for a user
  async findMatches(userId) {
    console.log(`Finding matches for user: ${userId}`);
    
    // Get current user's profile
    const currentUser = await userService.getUserById(userId);
    if (!currentUser) {
      console.error('Error fetching current user');
      return [];
    }
    console.log('Current user data:', currentUser);

    // Get other users for matching
    const otherUsers = await userService.getMatchingUsers(userId);
    console.log(`Found ${otherUsers.length} other users as potential matches`);

    if (otherUsers.length === 0) {
      console.log('No other users available');
      return [];
    }

    // Calculate compatibility scores
    const potentialMatches = otherUsers.map(otherUser => {
      const score = this.calculateCompatibilityScore(currentUser, otherUser);
      console.log(`Compatibility with ${otherUser.name}: ${score.score} (${score.reasons.join(', ')})`);
      return {
        id: otherUser.id,
        matchedUser: {
          id: otherUser.id,
          name: otherUser.name,
          age: otherUser.age,
          city: otherUser.city,
          bio: otherUser.bio,
          avatar_type: otherUser.avatar.type,
          avatar_emoji: otherUser.avatar.emoji
        },
        matchScore: score.score,
        matchReasons: score.reasons
      };
    }).filter(match => match.matchScore >= 30); // Minimum threshold

    console.log(`Found ${potentialMatches.length} matches above threshold (30)`);

    // Sort by score and take the best match
    potentialMatches.sort((a, b) => b.matchScore - a.matchScore);
    
    if (potentialMatches.length > 0) {
      const bestMatch = potentialMatches[0];
      console.log(`Creating match with ${bestMatch.matchedUser.name} (score: ${bestMatch.matchScore})`);
      const createdMatch = await this.createMatch(userId, bestMatch.id, bestMatch.matchScore, bestMatch.matchReasons);
      return [createdMatch]; // Return the actual created match for the UI
    }

    console.log('No matches found above threshold');
    
    // For testing purposes, if no matches found, create a match with the first available user
    if (otherUsers.length > 0) {
      console.log('Creating fallback match for testing');
      const fallbackUser = otherUsers[0];
      const fallbackScore = 75; // High score to ensure it shows
      const fallbackReasons = ['Great compatibility potential'];
      const createdMatch = await this.createMatch(userId, fallbackUser.id, fallbackScore, fallbackReasons);
      return [createdMatch];
    }
    
    return [];
  }

  // Calculate compatibility score between two users
  calculateCompatibilityScore(user1, user2) {
    let score = 0;
    let reasons = [];

    // Common interests (40 points max)
    const user1Interests = user1.interests || [];
    const user2Interests = user2.interests || [];
    const commonInterests = user1Interests.filter(interest => 
      user2Interests.includes(interest)
    );
    const interestScore = Math.min(commonInterests.length * 10, 40);
    score += interestScore;
    if (commonInterests.length > 0) {
      reasons.push(`Shared ${commonInterests.length} interests: ${commonInterests.join(', ')}`);
    }

    // Age compatibility (20 points max)
    const ageDiff = Math.abs(user1.age - user2.age);
    if (ageDiff <= 5) {
      score += 20;
      reasons.push('Similar age');
    } else if (ageDiff <= 10) {
      score += 10;
      reasons.push('Age compatible');
    }

    // Gender compatibility (20 points max) - simplified gender matching
    const genderCompatible = (
      (user1.gender === 'Female' && user2.gender === 'Male') ||
      (user1.gender === 'Male' && user2.gender === 'Female') ||
      (user1.gender === 'Non-binary' && user2.gender === 'Non-binary') ||
      (user1.gender === 'Non-binary' && (user2.gender === 'Male' || user2.gender === 'Female')) ||
      ((user1.gender === 'Male' || user1.gender === 'Female') && user2.gender === 'Non-binary')
    );
    
    if (genderCompatible) {
      score += 20;
      reasons.push('Gender compatible');
    }

    // Location compatibility (10 points max)
    if (user1.city === user2.city) {
      score += 10;
      reasons.push('Same city');
    } else {
      score += 5;
      reasons.push('Different cities');
    }

    // Bio compatibility (5 points max)
    if (user1.bio && user2.bio) {
      const user1BioWords = user1.bio.toLowerCase().split(' ');
      const user2BioWords = user2.bio.toLowerCase().split(' ');
      const commonBioWords = user1BioWords.filter(word => 
        word.length > 3 && user2BioWords.includes(word)
      );
      
      if (commonBioWords.length > 0) {
        score += 5;
        reasons.push('Similar interests in bio');
      }
    }

    // Random bonus for variety (5 points max)
    const randomBonus = Math.floor(Math.random() * 6);
    score += randomBonus;
    if (randomBonus > 0) {
      reasons.push('Great chemistry potential');
    }

    return { score, reasons };
  }

  // Create a match between two users
  async createMatch(user1Id, user2Id, score, reasons) {
    console.log(`🗄️ Creating match in database: ${user1Id} <-> ${user2Id} (Score: ${score})`);
    
    // Ensure user1_id < user2_id for the constraint
    const [user1, user2] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];
    
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    try {
      const { data: match, error } = await supabase
        .from('matches')
        .insert({
          user1_id: user1,
          user2_id: user2,
          match_score: score,
          match_reasons: reasons,
          user1_decision: user1 === user1Id ? 'pending' : 'pending',
          user2_decision: user2 === user1Id ? 'pending' : 'pending',
          status: 'pending',
          expires_at: expiresAt.toISOString()
        })
        .select(`
          *,
          user1:profiles!matches_user1_id_fkey(name, age, city, bio, avatar_type, avatar_emoji),
          user2:profiles!matches_user2_id_fkey(name, age, city, bio, avatar_type, avatar_emoji)
        `)
        .single();

      if (error) {
        console.error('❌ Database error creating match:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return null;
      }

      console.log('✅ Match created successfully in database:', match.id);
      
      // Get the matched user data for the UI
      const matchedUser = user1 === user1Id ? match.user2 : match.user1;
      
      const matchObj = {
        id: match.id,
        user1Id: match.user1_id,
        user2Id: match.user2_id,
        user1Decision: match.user1_decision,
        user2Decision: match.user2_decision,
        matchScore: match.match_score,
        matchReasons: match.match_reasons,
        matchedUser: {
          id: matchedUser.user_id,
          name: matchedUser.name,
          age: matchedUser.age,
          city: matchedUser.city,
          bio: matchedUser.bio,
          avatar_type: matchedUser.avatar_type,
          avatar_emoji: matchedUser.avatar_emoji
        },
        createdAt: new Date(match.created_at),
        status: match.status,
        expiresAt: new Date(match.expires_at)
      };

      console.log(`✅ Match object created: ${user1} <-> ${user2} (Score: ${score}) - Status: ${match.status}`);
      
      // Notify both users about the match
      await this.notifyBothUsers(user1, user2, matchObj);

      return matchObj;
    } catch (dbError) {
      console.error('❌ Database connection error:', dbError);
      return null;
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

  // Get match history (each user sees only their own perspective)
  async getMatchHistory(userId) {
    console.log(`📋 Fetching match history from database for user: ${userId}`);
    
    try {
      const { data: matches, error } = await supabase
        .from('matches')
        .select(`
          *,
          user1:profiles!matches_user1_id_fkey(name, age, city, bio, avatar_type, avatar_emoji),
          user2:profiles!matches_user2_id_fkey(name, age, city, bio, avatar_type, avatar_emoji)
        `)
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
          matchedUserData = match.user2 ? {
            id: match.user2.user_id,
            name: match.user2.name,
            age: match.user2.age,
            city: match.user2.city,
            bio: match.user2.bio,
            avatar: {
              type: match.user2.avatar_type,
              emoji: match.user2.avatar_emoji
            }
          } : {
            id: match.user2_id,
            name: `User ${match.user2_id.slice(0, 8)}...`,
            avatar: { emoji: '👤' }
          };
        } else {
          // Current user is user2 (received the match), matchedUser should be user1
          matchedUserData = match.user1 ? {
            id: match.user1.user_id,
            name: match.user1.name,
            age: match.user1.age,
            city: match.user1.city,
            bio: match.user1.bio,
            avatar: {
              type: match.user1.avatar_type,
              emoji: match.user1.avatar_emoji
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

  // Create notification for mutual match
  async createMutualMatchNotification(match) {
    const notifications = [
      {
        user_id: match.user1_id,
        type: 'mutual_match',
        title: 'Mutual Match! 🎉',
        message: 'Congratulations! You both accepted each other.',
        match_id: match.id,
        matched_user_id: match.user2_id,
        is_read: false
      },
      {
        user_id: match.user2_id,
        type: 'mutual_match',
        title: 'Mutual Match! 🎉',
        message: 'Congratulations! You both accepted each other.',
        match_id: match.id,
        matched_user_id: match.user1_id,
        is_read: false
      }
    ];

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('Error creating mutual match notifications:', error);
    }
  }
}

// Create service instances
const mockService = new MockMatchingService();
const supabaseService = new SupabaseMatchingService();

// Function to get the appropriate service
export const getMatchingService = (isUsingFakeUsers = false, isUsingDatabaseUsers = false) => {
  // If we have database users, always use Supabase service for persistence
  if (isUsingDatabaseUsers) {
    return supabaseService;
  }
  // Otherwise use mock service for fake users
  return mockService;
};

// Default export (will be overridden by context)
export const currentMatchingService = supabaseService;
