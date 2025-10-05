import { useState, useCallback } from 'react';
import { getMatchingService } from '../services/matchingService';

const TOAST_DURATIONS = {
  SUCCESS: 5000,
  ERROR: 4000,
  WARNING: 3000,
  INFO: 3000
};

export const useMatchActions = (currentUser, isOnline, loadMatchHistory, loadNotifications) => {
  const [isMatching, setIsMatching] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [showMatchModal, setShowMatchModal] = useState(false);

  const populateMatchedUser = useCallback((match) => {
    // Helper function to populate matched user data for the modal
    return {
      id: match.matchedUser?.id || match.user2Id,
      name: match.matchedUser?.name || 'Unknown User',
      age: match.matchedUser?.age || 25,
      city: match.matchedUser?.city || 'Unknown',
      bio: match.matchedUser?.bio || 'No bio available',
      avatar_type: match.matchedUser?.avatar_type || 'emoji',
      avatar_emoji: match.matchedUser?.avatar_emoji || '👤',
      matchScore: match.matchScore,
      matchReasons: match.matchReasons || ['Great compatibility!']
    };
  }, []);

  const findMatches = useCallback(async () => {
    console.log('🎯 Match Me button clicked!');
    console.log('🔍 Current user:', currentUser);
    console.log('🔍 Is online:', isOnline);
    
    if (!currentUser?.id || !isOnline) {
      console.log('❌ Cannot find matches - user not online or no user ID');
      return;
    }
    
    console.log('✅ Starting match finding process...');
    setIsMatching(true);
    
    try {
      const matchingService = getMatchingService();
      
      // Check if user already has an active sent match
      console.log('🔍 Checking for active sent matches...');
      const hasActiveMatch = await matchingService.hasActiveSentMatch(currentUser.id);
      console.log('✅ Active match check result:', hasActiveMatch);
      
      if (hasActiveMatch) {
        console.log('⚠️ User already has an active match');
        window.showToast(
          '⚠️ You already have a pending match. Wait for a response or it to expire before matching again.',
          'warning',
          TOAST_DURATIONS.WARNING
        );
        setIsMatching(false);
        return;
      }
      
      // Check if there are any pending matches waiting for this user's decision
      console.log('🔍 Checking for pending matches...');
      const pendingMatches = await matchingService.getPendingMatches(currentUser.id);
      console.log('✅ Pending matches result:', pendingMatches);
      
      if (pendingMatches.length > 0) {
        console.log(`✅ User ${currentUser.id} has ${pendingMatches.length} pending matches waiting for decision`);
        const bestMatch = pendingMatches[0];
        setCurrentMatch(populateMatchedUser(bestMatch));
        setShowMatchModal(true);
        setIsMatching(false);
        return;
      }
      
      // Find new matches and create them in the database
      console.log('🔍 Finding new matches...');
      const newMatches = await matchingService.findMatches(currentUser.id);
      console.log('✅ New matches result:', newMatches);
      
      if (newMatches.length > 0) {
        console.log(`Found ${newMatches.length} new matches`);
        const bestMatch = newMatches[0];
        console.log('New match:', bestMatch);
        setCurrentMatch(populateMatchedUser(bestMatch));
        setShowMatchModal(true);
        
        // Reload data after a short delay
        setTimeout(() => {
          loadMatchHistory();
          loadNotifications();
        }, 1000);
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
  }, [currentUser, isOnline, populateMatchedUser, loadMatchHistory, loadNotifications]);

  const goOnline = useCallback(async () => {
    if (!currentUser?.id) return;
    
    setIsMatching(true);
    
    try {
      const matchingService = getMatchingService();
      await matchingService.goOnline(currentUser.id);
      await loadMatchHistory();
      window.showToast('🟢 You are now online and looking for matches!', 'success', TOAST_DURATIONS.SUCCESS);
    } catch (error) {
      console.error('Failed to go online:', error);
      window.showToast('❌ Failed to go online. Please try again.', 'error', TOAST_DURATIONS.ERROR);
    } finally {
      setIsMatching(false);
    }
  }, [currentUser, loadMatchHistory]);

  return {
    isMatching,
    currentMatch,
    showMatchModal,
    setCurrentMatch,
    setShowMatchModal,
    findMatches,
    goOnline,
    populateMatchedUser
  };
};
