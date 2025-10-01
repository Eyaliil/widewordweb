import { supabase } from '../lib/supabaseClient';
import { fakeUsers } from '../data/fakeUsers';

// Mock matching service for fake users
export class MockMatchingService {
  constructor() {
    this.onlineUsers = new Map();
    this.matches = new Map();
    this.matchHistory = [];
  }

  // Go online and start looking for matches
  async goOnline(userId) {
    console.log(`User ${userId} is now online`);
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
    
    // Simulate finding matches after a short delay
    setTimeout(() => {
      this.findMatches(userId);
    }, 2000);
    
    return { success: true, hasPendingMatches: false, pendingMatches: [] };
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
    const user = this.onlineUsers.get(userId);
    if (!user) return [];

    // Get current user data from fakeUsers
    const currentUserData = fakeUsers.find(u => u.id === userId);
    if (!currentUserData) return [];

    // Get all other fake users as potential matches
    const otherUsers = fakeUsers.filter(u => u.id !== userId);

    if (otherUsers.length === 0) {
      console.log('No other users available');
      return [];
    }

    // Calculate compatibility scores
    const potentialMatches = otherUsers.map(otherUser => {
      const score = this.calculateCompatibilityScore(currentUserData, otherUser);
      return {
        id: otherUser.id,
        matchedUser: otherUser,
        matchScore: score.score,
        matchReasons: score.reasons
      };
    }).filter(match => match.matchScore >= 30); // Minimum threshold

    // Sort by score and take the best match
    potentialMatches.sort((a, b) => b.matchScore - a.matchScore);
    
    if (potentialMatches.length > 0) {
      const bestMatch = potentialMatches[0];
      const createdMatch = this.createMatch(userId, bestMatch.id, bestMatch.matchScore, bestMatch.matchReasons);
      return [createdMatch]; // Return the actual created match for the UI
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
    
    // Get the matched user data for the UI
    const matchedUser = fakeUsers.find(u => u.id === user2Id);
    
    const match = {
      id: matchId,
      user1Id,
      user2Id,
      user1Decision: 'pending',
      user2Decision: 'pending',
      matchScore: score,
      matchReasons: reasons,
      matchedUser: matchedUser, // Add matched user data for UI
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
        
        // Show the match from the current user's perspective
        if (match.user1Id === userId) {
          uniqueMatches.push(match);
        } else {
          // If the current user is user2, create a view from their perspective
          const userPerspectiveMatch = {
            ...match,
            user1Id: userId,
            user2Id: match.user1Id,
            user1Decision: match.user2Decision,
            user2Decision: match.user1Decision
          };
          uniqueMatches.push(userPerspectiveMatch);
        }
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
        
        // Show the match from the current user's perspective
        if (match.user1Id === userId) {
          // Ensure matchedUser is included
          if (!match.matchedUser) {
            match.matchedUser = fakeUsers.find(u => u.id === match.user2Id);
          }
          uniqueMatches.push(match);
        } else {
          // If the current user is user2, create a view from their perspective
          const userPerspectiveMatch = {
            ...match,
            user1Id: userId,
            user2Id: match.user1Id,
            user1Decision: match.user2Decision,
            user2Decision: match.user1Decision,
            matchedUser: fakeUsers.find(u => u.id === match.user1Id)
          };
          uniqueMatches.push(userPerspectiveMatch);
        }
      }
    });
    
    return uniqueMatches;
  }
}

// Create a singleton instance
export const matchingService = new MockMatchingService();

// Real Supabase matching service (for when you want to use real database)
export class SupabaseMatchingService {
  async goOnline(userId) {
    const { error } = await supabase
      .from('online_users')
      .upsert({ user_id: userId, is_online: true }, { onConflict: 'user_id' });
    
    if (error) throw error;
    return { success: true };
  }

  async goOffline(userId) {
    const { error } = await supabase
      .from('online_users')
      .upsert({ user_id: userId, is_online: false }, { onConflict: 'user_id' });
    
    if (error) throw error;
    return { success: true };
  }

}

// Export the appropriate service based on environment
export const currentMatchingService = matchingService; // Use mock for now
