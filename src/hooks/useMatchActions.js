import { useState, useCallback } from 'react';
import { getMatchingService } from '../services/matchingService';

const TOAST_DURATIONS = {
  SUCCESS: 5000,
  ERROR: 4000,
  WARNING: 3000,
  INFO: 3000
};

export const useMatchActions = (currentUser, loadMatchHistory, loadNotifications) => {
  const [isMatching, setIsMatching] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [showMatchModal, setShowMatchModal] = useState(false);

  const populateMatchedUser = useCallback((match) => {
    // Helper function to populate matched user data for the modal
    // Handle both old structure (with matchedUser) and new structure (user data directly in match)
    const userData = match.matchedUser || match;
    
    return {
      // Match metadata
      id: match.id,
      user1_id: match.user1_id,
      user2_id: match.user2_id,
      status: match.status,
      user1_decision: match.user1_decision,
      user2_decision: match.user2_decision,
      expires_at: match.expires_at,
      
      // User data (either from matchedUser or directly from match)
      matchedUser: {
        id: userData.id || userData.user_id,
        name: userData.name || 'Unknown User',
        age: userData.age || 25,
        city: userData.city || 'Unknown',
        bio: userData.bio || 'No bio available',
        avatar_type: userData.avatar_type || 'emoji',
        avatar_emoji: userData.avatar_emoji || '👤',
        interests: userData.interests || [],
        gender: userData.gender,
        pronouns: userData.pronouns
      },
      
      // Compatibility data
      matchScore: match.matchScore || match.score || 0,
      matchReasons: match.matchReasons || match.reasons || ['Great compatibility!'],
      detailedInsights: match.detailedInsights || match.detailed_insights || {},
      breakdown: match.breakdown || match.compatibility_breakdown || {}
    };
  }, []);

  const findMatches = useCallback(async () => {
    console.log('🎯 Match Me button clicked!');
    console.log('🔍 Current user:', currentUser);
    
    if (!currentUser?.id) {
      console.log('❌ Cannot find matches - no user ID');
      return;
    }
    
    console.log('✅ Starting fresh match finding process...');
    setIsMatching(true);
    
    try {
      const matchingService = getMatchingService();
      
      // Always generate fresh matches - no checking for existing matches
      console.log('🔍 Generating fresh matches...');
      const newMatches = await matchingService.findMatches(currentUser.id);
      console.log('✅ New matches result:', newMatches);
      
      if (newMatches.length > 0) {
        console.log(`Found ${newMatches.length} new matches`);
        const bestMatch = newMatches[0];
        console.log('New match:', bestMatch);
        
        // Check if the match is valid before proceeding
        if (bestMatch && bestMatch.matchedUser) {
          setCurrentMatch(populateMatchedUser(bestMatch));
          setShowMatchModal(true);
          
          // Reload data after a short delay
          setTimeout(() => {
            loadMatchHistory();
            loadNotifications();
          }, 1000);
        } else {
          console.log('⚠️ Invalid match object received');
          window.showToast('❌ Failed to create match. Please try again.', 'error', TOAST_DURATIONS.ERROR);
        }
      } else {
        // No matches found
        console.log('⚠️  No matches found');
        window.showToast('No new matches found right now. Try again later!', 'info', TOAST_DURATIONS.INFO);
      }
    } catch (error) {
      console.error('❌ Failed to find matches:', error);
      window.showToast('❌ Failed to find matches. Please try again.', 'error', TOAST_DURATIONS.ERROR);
    } finally {
      console.log('🏁 Match finding process completed');
      setIsMatching(false);
    }
  }, [currentUser, populateMatchedUser, loadMatchHistory, loadNotifications]);


  return {
    isMatching,
    currentMatch,
    showMatchModal,
    setCurrentMatch,
    setShowMatchModal,
    findMatches,
    populateMatchedUser
  };
};
