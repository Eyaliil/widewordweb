import { supabase } from '../lib/supabaseClient';
import { userService } from './userService';

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

  // Find potential matches for a user
  async findMatches(userId) {
    console.log(`🔍 Finding matches for user: ${userId}`);
    
    // Get current user's profile
    const currentUser = await userService.getUserById(userId);
    if (!currentUser) {
      console.error('❌ Error fetching current user');
      return [];
    }
    console.log('✅ Current user data:', currentUser);

    // Get all users for matching (excludes current user)
    console.log('🔍 Fetching all matching users...');
    const otherUsers = await userService.getMatchingUsers(userId);
    console.log(`✅ Found ${otherUsers.length} users as potential matches`);
    console.log('📋 Users details:', otherUsers.map(u => ({ id: u.id, name: u.name, interests: u.interests })));

    if (otherUsers.length === 0) {
      console.log('No users available');
      return [];
    }

    // Calculate compatibility scores for all users
    const allMatches = otherUsers.map(otherUser => {
      const compatibility = this.calculateCompatibilityScore(currentUser, otherUser);
      console.log(`Compatibility with ${otherUser.name}: ${compatibility.score}% (${compatibility.reasons.join(', ')})`);
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
        matchScore: compatibility.score,
        matchReasons: compatibility.reasons,
        detailedInsights: compatibility.detailedInsights,
        breakdown: compatibility.breakdown
      };
    });

    // Sort by compatibility score (highest first)
    allMatches.sort((a, b) => b.matchScore - a.matchScore);

    // Try to find a good match (score >= 60)
    const goodMatches = allMatches.filter(match => match.matchScore >= 60);
    
    if (goodMatches.length > 0) {
      const bestMatch = goodMatches[0];
      console.log(`Creating match with ${bestMatch.matchedUser.name} (score: ${bestMatch.matchScore}%) - Good match found!`);
      const createdMatch = await this.createMatch(userId, bestMatch.id, bestMatch.matchScore, bestMatch.matchReasons, bestMatch.detailedInsights, bestMatch.breakdown);
      return [createdMatch];
    }

    // If no good matches, try acceptable matches (score >= 40)
    const acceptableMatches = allMatches.filter(match => match.matchScore >= 40);
    
    if (acceptableMatches.length > 0) {
      const bestMatch = acceptableMatches[0];
      console.log(`Creating match with ${bestMatch.matchedUser.name} (score: ${bestMatch.matchScore}%) - Acceptable match found!`);
      const createdMatch = await this.createMatch(userId, bestMatch.id, bestMatch.matchScore, bestMatch.matchReasons, bestMatch.detailedInsights, bestMatch.breakdown);
      return [createdMatch];
    }

    // If no acceptable matches, try any match (score >= 20)
    const anyMatches = allMatches.filter(match => match.matchScore >= 20);
    
    if (anyMatches.length > 0) {
      const bestMatch = anyMatches[0];
      console.log(`Creating match with ${bestMatch.matchedUser.name} (score: ${bestMatch.matchScore}%) - Basic match found!`);
      const createdMatch = await this.createMatch(userId, bestMatch.id, bestMatch.matchScore, bestMatch.matchReasons, bestMatch.detailedInsights, bestMatch.breakdown);
      return [createdMatch];
    }

    console.log('No matches found even with lowest threshold (20)');
    
    return [];
  }

  // Calculate compatibility score between two users
  calculateCompatibilityScore(user1, user2) {
    let score = 0;
    let reasons = [];
    let detailedInsights = {
      interests: { score: 0, details: [] },
      age: { score: 0, details: [] },
      gender: { score: 0, details: [] },
      location: { score: 0, details: [] },
      bio: { score: 0, details: [] },
      lifestyle: { score: 0, details: [] },
      personality: { score: 0, details: [] }
    };

    // Enhanced Interest Matching (35 points max)
    const user1Interests = user1.interests || [];
    const user2Interests = user2.interests || [];
    const commonInterests = user1Interests.filter(interest => 
      user2Interests.includes(interest)
    );
    
    // Weighted interest scoring based on number of shared interests
    let interestScore = 0;
    if (commonInterests.length > 0) {
      interestScore = Math.min(commonInterests.length * 8, 35);
      reasons.push(`Shared ${commonInterests.length} interests: ${commonInterests.join(', ')}`);
      detailedInsights.interests = {
        score: interestScore,
        details: [`You both love: ${commonInterests.join(', ')}`]
      };
    } else {
      detailedInsights.interests = {
        score: 0,
        details: ['No shared interests found']
      };
    }
    score += interestScore;

    // Enhanced Age Compatibility (25 points max)
    const ageDiff = Math.abs(user1.age - user2.age);
    let ageScore = 0;
    let ageDetails = [];
    
    if (ageDiff === 0) {
      ageScore = 25;
      ageDetails.push('Same age - perfect match!');
    } else if (ageDiff <= 2) {
      ageScore = 22;
      ageDetails.push('Very similar age');
    } else if (ageDiff <= 5) {
      ageScore = 18;
      ageDetails.push('Similar age range');
    } else if (ageDiff <= 8) {
      ageScore = 12;
      ageDetails.push('Age compatible');
    } else if (ageDiff <= 12) {
      ageScore = 8;
      ageDetails.push('Age difference acceptable');
    } else {
      ageScore = 3;
      ageDetails.push('Significant age difference');
    }
    
    score += ageScore;
    reasons.push(ageDetails[0]);
    detailedInsights.age = { score: ageScore, details: ageDetails };

    // Enhanced Gender Compatibility (20 points max)
    const genderCompatible = (
      (user1.gender === 'Female' && user2.gender === 'Male') ||
      (user1.gender === 'Male' && user2.gender === 'Female') ||
      (user1.gender === 'Non-binary' && user2.gender === 'Non-binary') ||
      (user1.gender === 'Non-binary' && (user2.gender === 'Male' || user2.gender === 'Female')) ||
      ((user1.gender === 'Male' || user1.gender === 'Female') && user2.gender === 'Non-binary')
    );
    
    let genderScore = 0;
    let genderDetails = [];
    if (genderCompatible) {
      genderScore = 20;
      genderDetails.push('Gender preferences align');
    } else {
      genderDetails.push('Gender preferences may not align');
    }
    
    score += genderScore;
    if (genderScore > 0) reasons.push('Gender compatible');
    detailedInsights.gender = { score: genderScore, details: genderDetails };

    // Enhanced Location Compatibility (15 points max)
    let locationScore = 0;
    let locationDetails = [];
    
    if (user1.city === user2.city) {
      locationScore = 15;
      locationDetails.push('Same city - easy to meet up!');
    } else if (user1.city && user2.city) {
      // Check if cities are in same region/state (simplified)
      const city1Lower = user1.city.toLowerCase();
      const city2Lower = user2.city.toLowerCase();
      
      if (city1Lower.includes(city2Lower.split(' ')[0]) || city2Lower.includes(city1Lower.split(' ')[0])) {
        locationScore = 10;
        locationDetails.push('Nearby cities');
      } else {
        locationScore = 5;
        locationDetails.push('Different cities');
      }
    } else {
      locationDetails.push('Location information incomplete');
    }
    
    score += locationScore;
    if (locationScore > 0) reasons.push(locationDetails[0]);
    detailedInsights.location = { score: locationScore, details: locationDetails };

    // Enhanced Bio Compatibility (10 points max)
    let bioScore = 0;
    let bioDetails = [];
    
    if (user1.bio && user2.bio) {
      const user1BioWords = user1.bio.toLowerCase().split(/\W+/).filter(word => word.length > 3);
      const user2BioWords = user2.bio.toLowerCase().split(/\W+/).filter(word => word.length > 3);
      const commonBioWords = user1BioWords.filter(word => user2BioWords.includes(word));
      
      if (commonBioWords.length > 0) {
        bioScore = Math.min(commonBioWords.length * 2, 10);
        bioDetails.push(`Similar language and interests in bio`);
      } else {
        bioDetails.push('Different bio styles');
      }
    } else {
      bioDetails.push('Bio information incomplete');
    }
    
    score += bioScore;
    if (bioScore > 0) reasons.push('Similar interests in bio');
    detailedInsights.bio = { score: bioScore, details: bioDetails };

    // Lifestyle Compatibility (10 points max)
    let lifestyleScore = 0;
    let lifestyleDetails = [];
    
    // Analyze interests for lifestyle patterns
    const activeInterests = ['Sports', 'Fitness', 'Hiking', 'Running', 'Swimming', 'Cycling', 'Yoga'];
    const creativeInterests = ['Art', 'Music', 'Writing', 'Photography', 'Design', 'Crafting'];
    const socialInterests = ['Travel', 'Parties', 'Socializing', 'Networking', 'Events'];
    const intellectualInterests = ['Reading', 'Learning', 'Science', 'Technology', 'Philosophy'];
    
    const user1Active = user1Interests.some(i => activeInterests.includes(i));
    const user2Active = user2Interests.some(i => activeInterests.includes(i));
    const user1Creative = user1Interests.some(i => creativeInterests.includes(i));
    const user2Creative = user2Interests.some(i => creativeInterests.includes(i));
    const user1Social = user1Interests.some(i => socialInterests.includes(i));
    const user2Social = user2Interests.some(i => socialInterests.includes(i));
    const user1Intellectual = user1Interests.some(i => intellectualInterests.includes(i));
    const user2Intellectual = user2Interests.some(i => intellectualInterests.includes(i));
    
    let lifestyleMatches = 0;
    if (user1Active && user2Active) { lifestyleMatches++; lifestyleDetails.push('Both enjoy active lifestyles'); }
    if (user1Creative && user2Creative) { lifestyleMatches++; lifestyleDetails.push('Both have creative interests'); }
    if (user1Social && user2Social) { lifestyleMatches++; lifestyleDetails.push('Both enjoy social activities'); }
    if (user1Intellectual && user2Intellectual) { lifestyleMatches++; lifestyleDetails.push('Both have intellectual pursuits'); }
    
    lifestyleScore = Math.min(lifestyleMatches * 3, 10);
    score += lifestyleScore;
    if (lifestyleScore > 0) reasons.push('Compatible lifestyle');
    detailedInsights.lifestyle = { score: lifestyleScore, details: lifestyleDetails };

    // Personality Compatibility (5 points max)
    let personalityScore = 0;
    let personalityDetails = [];
    
    // Analyze bio for personality indicators
    const personalityWords = {
      adventurous: ['adventure', 'explore', 'travel', 'new', 'exciting', 'spontaneous'],
      caring: ['care', 'help', 'support', 'kind', 'compassionate', 'nurturing'],
      funny: ['funny', 'humor', 'joke', 'laugh', 'comedy', 'wit'],
      ambitious: ['goal', 'success', 'career', 'achieve', 'motivated', 'driven'],
      romantic: ['romance', 'love', 'relationship', 'intimate', 'passionate']
    };
    
    let personalityMatches = 0;
    Object.keys(personalityWords).forEach(trait => {
      const user1HasTrait = personalityWords[trait].some(word => 
        user1.bio && user1.bio.toLowerCase().includes(word)
      );
      const user2HasTrait = personalityWords[trait].some(word => 
        user2.bio && user2.bio.toLowerCase().includes(word)
      );
      
      if (user1HasTrait && user2HasTrait) {
        personalityMatches++;
        personalityDetails.push(`Both seem ${trait}`);
      }
    });
    
    personalityScore = Math.min(personalityMatches * 2, 5);
    score += personalityScore;
    if (personalityScore > 0) reasons.push('Compatible personalities');
    detailedInsights.personality = { score: personalityScore, details: personalityDetails };

    // Chemistry Bonus (5 points max)
    const chemistryBonus = Math.floor(Math.random() * 6);
    score += chemistryBonus;
    if (chemistryBonus > 0) {
      reasons.push('Great chemistry potential');
    }

    // Calculate final percentage
    const maxPossibleScore = 35 + 25 + 20 + 15 + 10 + 10 + 5 + 5; // 125 max
    const percentage = Math.round((score / maxPossibleScore) * 100);

    return { 
      score: percentage, 
      reasons, 
      detailedInsights,
      breakdown: {
        interests: interestScore,
        age: ageScore,
        gender: genderScore,
        location: locationScore,
        bio: bioScore,
        lifestyle: lifestyleScore,
        personality: personalityScore,
        chemistry: chemistryBonus
      }
    };
  }

  // Create a match between two users
  async createMatch(user1Id, user2Id, score, reasons, detailedInsights = null, breakdown = null) {
    console.log(`🗄️ Creating match in database: ${user1Id} <-> ${user2Id} (Score: ${score}%)`);
    
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
        .select('*')
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
      const matchedUserId = user1 === user1Id ? user2 : user1;
      const { data: matchedUserProfile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, name, age, city, bio, avatar_type, avatar_emoji')
        .eq('user_id', matchedUserId)
        .single();

      if (profileError) {
        console.error('Error getting matched user profile:', profileError);
        return null;
      }
      
      const matchObj = {
        id: match.id,
        user1Id: match.user1_id,
        user2Id: match.user2_id,
        user1Decision: match.user1_decision,
        user2Decision: match.user2_decision,
        matchScore: match.match_score,
        matchReasons: match.match_reasons,
        detailedInsights: detailedInsights,
        breakdown: breakdown,
        matchedUser: {
          id: matchedUserProfile.user_id,
          name: matchedUserProfile.name,
          age: matchedUserProfile.age,
          city: matchedUserProfile.city,
          bio: matchedUserProfile.bio,
          avatar_type: matchedUserProfile.avatar_type,
          avatar_emoji: matchedUserProfile.avatar_emoji
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

// Function to get the appropriate service
export const getMatchingService = () => {
  // Always use Supabase service for persistent data
  return supabaseService;
};

// Default export
export const currentMatchingService = supabaseService;
