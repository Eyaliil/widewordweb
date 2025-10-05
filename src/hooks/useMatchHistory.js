import { useState, useEffect, useCallback } from 'react';
import { getMatchingService } from '../services/matchingService';

export const useMatchHistory = (currentUser) => {
  const [matchHistory, setMatchHistory] = useState([]);
  const [activeSentMatch, setActiveSentMatch] = useState(null);

  const loadMatchHistory = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      const matchingService = getMatchingService();
      const history = await matchingService.getMatchHistory(currentUser.id);
      console.log('📚 Loaded match history:', history);
      setMatchHistory(history);
    } catch (error) {
      console.error('Failed to load match history:', error);
    }
  }, [currentUser]);

  const loadActiveSentMatch = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      const matchingService = getMatchingService();
      const activeMatch = await matchingService.getActiveSentMatch(currentUser.id);
      console.log('🎯 Active sent match:', activeMatch);
      setActiveSentMatch(activeMatch);
    } catch (error) {
      console.error('Failed to load active sent match:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.id) {
      loadMatchHistory();
      loadActiveSentMatch();
    }
  }, [currentUser, loadMatchHistory, loadActiveSentMatch]);

  const hasActiveSentMatch = Boolean(activeSentMatch);

  return {
    matchHistory,
    activeSentMatch,
    hasActiveSentMatch,
    loadMatchHistory,
    loadActiveSentMatch
  };
};
