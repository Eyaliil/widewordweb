import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import MatchModal from './MatchModal';
import NotificationCenter from './NotificationCenter';
import ToastManager from './ToastManager';
import { loadPublicProfiles } from '../services/profileService';
import { getMatchingService } from '../services/matchingService';
import { userService } from '../services/userService';

// Constants
const MATCH_EXPIRY_HOURS = 24;
const TOAST_DURATIONS = {
  SUCCESS: 5000,
  ERROR: 4000,
  WARNING: 3000,
  INFO: 3000
};

const Home = ({ me, avatar, isProfileComplete, isOnline, setIsOnline, onEditProfile, onEditPreferences, onLogout }) => {
  // Auth context
  const { user, currentUser, databaseUsers, isUsingDatabaseUsers } = useAuth();
  
  // Matching service
  const matchingService = getMatchingService();
  
  // State management
  const [users, setUsers] = useState([]);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [matchHistory, setMatchHistory] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [activeSentMatch, setActiveSentMatch] = useState(null);

  // Load online status when user changes
  const loadOnlineStatus = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      const onlineUsers = await userService.getOnlineUsers();
      const isUserOnline = onlineUsers.some(user => user.id === currentUser.id && user.isOnline);
      console.log(`🔍 Current user ${currentUser.name} online status:`, isUserOnline);
      setIsOnline(isUserOnline);
    } catch (error) {
      console.error('Failed to load online status:', error);
    }
  }, [currentUser]);

  // Helper Functions
  /**
   * Ensures matchedUser data is populated for a match object
   * @param {Object} match - Match object
   * @returns {Object} Match object with populated matchedUser
   */
  const populateMatchedUser = useCallback((match) => {
    if (match.matchedUser) {
      return match;
    }
    
    const matchedUserId = match.user1Id === currentUser.id ? match.user2Id : match.user1Id;
    
    // Debug logging
    console.log('🔍 populateMatchedUser debug:', {
      matchId: match.id,
      currentUserId: currentUser.id,
      matchedUserId,
      databaseUsersCount: databaseUsers.length,
      databaseUsersIds: databaseUsers.map(u => u.id),
      databaseUsersNames: databaseUsers.map(u => u.name)
    });
    
    const matchedUser = databaseUsers.find(u => u.id === matchedUserId);
    
    if (matchedUser) {
      console.log('✅ Found matchedUser:', matchedUser);
      return { ...match, matchedUser };
    } else {
      console.log('❌ MatchedUser not found, creating fallback');
      const fallbackMatchedUser = {
        id: matchedUserId,
        name: `User ${matchedUserId.slice(0, 8)}...`,
        avatar: { emoji: '👤' }
      };
      return { ...match, matchedUser: fallbackMatchedUser };
    }
  }, [currentUser, databaseUsers]);

  /**
   * Organizes matches into categories (sent, received, rejected)
   * @returns {Object} Organized match categories
   */
  const organizeMatches = useCallback(() => {
    const sentMatches = [];
    const receivedMatches = [];
    const mutualMatches = [];
    const rejectedByMe = [];
    const rejectedByThem = [];

    matchHistory.forEach(match => {
      const isCurrentUserSender = match.user1Id === currentUser.id;
      
      if (match.status === 'pending') {
        if (isCurrentUserSender) {
          sentMatches.push(match);
        } else {
          receivedMatches.push(match);
        }
      } else if (match.status === 'mutual_match') {
        // Both users accepted - this is a successful match
        mutualMatches.push(match);
      } else if (match.status === 'rejected' || match.status === 'expired') {
        const userDecision = isCurrentUserSender ? match.user1Decision : match.user2Decision;
        const otherUserDecision = isCurrentUserSender ? match.user2Decision : match.user1Decision;
        
        if (userDecision === 'rejected') {
          rejectedByMe.push(match);
        } else if (otherUserDecision === 'rejected') {
          rejectedByThem.push(match);
        }
      }
    });

    return { sentMatches, receivedMatches, mutualMatches, rejectedByMe, rejectedByThem };
  }, [matchHistory, currentUser]);

  // Data Loading Functions
  /**
   * Loads all available users from the service
   */
  const loadUsers = useCallback(async () => {
    let isCancelled = false;
    try {
      const data = await userService.getAllUsers();
      if (!isCancelled) setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
    return () => { isCancelled = true; };
  }, []);

  /**
   * Loads match history for the current user
   */
  const loadMatchHistory = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      const history = await matchingService.getMatchHistory(currentUser.id);
      setMatchHistory(history);
    } catch (error) {
      console.error('Failed to load match history:', error);
    }
  }, [currentUser, matchingService]);

  /**
   * Loads notifications for the current user
   */
  const loadNotifications = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      const notifications = await matchingService.getNotifications(currentUser.id);
      setNotificationCount(notifications.length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, [currentUser, matchingService]);

  /**
   * Loads active sent match for the current user
   */
  const loadActiveSentMatch = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      const activeMatch = await matchingService.getActiveSentMatch(currentUser.id);
      setActiveSentMatch(activeMatch);
    } catch (error) {
      console.error('Failed to load active sent match:', error);
    }
  }, [currentUser, matchingService]);

  // Match Actions
  /**
   * Handles going online and finding matches
   */
  const goOnline = useCallback(async () => {
    if (!currentUser?.id) return;
    
    setIsMatching(true);
    
    try {
      const result = await matchingService.goOnline(currentUser.id);
      
      if (result.success) {
        if (result.activeSentMatch) {
          // User already has a pending sent match
          window.showToast(
            '⚠️ You already have a pending match. Wait for a response or it to expire before matching again.',
            'warning',
            TOAST_DURATIONS.WARNING
          );
          setCurrentMatch(populateMatchedUser(result.activeSentMatch));
          setShowMatchModal(true);
        } else if (result.newMatches && result.newMatches.length > 0) {
          // Show new matches found
          console.log(`Found ${result.newMatches.length} new matches`);
          const bestMatch = result.newMatches[0];
          console.log('New match:', bestMatch);
          console.log('Available databaseUsers:', databaseUsers);
          console.log('Current user:', currentUser);
          setCurrentMatch(populateMatchedUser(bestMatch));
          setShowMatchModal(true);
          
          // Reload data after a short delay
          setTimeout(() => {
            loadMatchHistory();
            loadNotifications();
            loadActiveSentMatch();
          }, 1000);
        } else {
          // No matches found
          window.showToast('No new matches found right now. Try again later!', 'info', TOAST_DURATIONS.INFO);
        }
        setIsOnline(true);
        // Refresh online status from database
        await loadOnlineStatus();
      } else {
        window.showToast(`❌ Error: ${result.error}`, 'error', TOAST_DURATIONS.ERROR);
      }
    } catch (error) {
      console.error('Failed to go online:', error);
      window.showToast('❌ Failed to go online. Please try again.', 'error', TOAST_DURATIONS.ERROR);
    } finally {
      setIsMatching(false);
    }
  }, [currentUser, matchingService, populateMatchedUser, databaseUsers, loadMatchHistory, loadNotifications, loadActiveSentMatch]);

  /**
   * Handles going offline
   */
  const goOffline = useCallback(async () => {
    setIsOnline(false);
    setIsMatching(false);
    setShowMatchModal(false);
    setCurrentMatch(null);
    
    try {
      await matchingService.goOffline(currentUser.id);
      // Refresh online status from database
      await loadOnlineStatus();
    } catch (error) {
      console.error('Failed to go offline:', error);
    }
  }, [currentUser, matchingService]);

  /**
   * Handles accepting a match
   */
  const handleAcceptMatch = useCallback(async () => {
    if (!currentMatch?.id || !currentUser?.id) return;
    
    try {
      const result = await matchingService.makeDecision(currentMatch.id, currentUser.id, 'accepted');
      
      if (result.success) {
        setCurrentMatch(populateMatchedUser(result.match));
        
        // Handle different match outcomes
        if (result.match.status === 'mutual_match') {
          window.showToast('🎉 Mutual match! You both accepted each other!', 'success', TOAST_DURATIONS.SUCCESS);
          setShowMatchModal(false);
          setCurrentMatch(null);
        } else if (result.match.status === 'rejected') {
          window.showToast('❌ Match ended - different decisions were made', 'warning', TOAST_DURATIONS.WARNING);
          setShowMatchModal(false);
          setCurrentMatch(null);
        } else if (result.match.status === 'expired') {
          window.showToast('⏰ Match has expired', 'warning', TOAST_DURATIONS.WARNING);
          setShowMatchModal(false);
          setCurrentMatch(null);
        } else {
          window.showToast('✅ Your decision has been recorded! Waiting for the other person...', 'success', TOAST_DURATIONS.SUCCESS);
        }
        
        // Reload data
        await loadMatchHistory();
        await loadNotifications();
        await loadActiveSentMatch();
      } else {
        window.showToast(`❌ Error: ${result.error}`, 'error', TOAST_DURATIONS.ERROR);
        if (result.error === 'Match has expired' || result.error === 'Match is no longer active') {
          setShowMatchModal(false);
          setCurrentMatch(null);
        }
      }
    } catch (error) {
      console.error('Failed to accept match:', error);
      window.showToast('❌ Failed to accept match. Please try again.', 'error', TOAST_DURATIONS.ERROR);
    }
  }, [currentMatch, currentUser, matchingService, populateMatchedUser, loadMatchHistory, loadNotifications, loadActiveSentMatch]);

  /**
   * Handles rejecting a match
   */
  const handleRejectMatch = useCallback(async () => {
    if (!currentMatch?.id || !currentUser?.id) return;
    
    try {
      const result = await matchingService.makeDecision(currentMatch.id, currentUser.id, 'rejected');
      
      if (result.success) {
        setCurrentMatch(populateMatchedUser(result.match));
        
        // Handle different match outcomes
        if (result.match.status === 'mutual_match') {
          window.showToast('🎉 Mutual match! You both accepted each other!', 'success', TOAST_DURATIONS.SUCCESS);
          setShowMatchModal(false);
          setCurrentMatch(null);
        } else if (result.match.status === 'rejected') {
          window.showToast('❌ Match ended - different decisions were made', 'warning', TOAST_DURATIONS.WARNING);
          setShowMatchModal(false);
          setCurrentMatch(null);
        } else if (result.match.status === 'expired') {
          window.showToast('⏰ Match has expired', 'warning', TOAST_DURATIONS.WARNING);
          setShowMatchModal(false);
          setCurrentMatch(null);
        } else {
          window.showToast('✅ Your decision has been recorded!', 'success', TOAST_DURATIONS.INFO);
        }
        
        // Reload data
        await loadMatchHistory();
        await loadNotifications();
        await loadActiveSentMatch();
      } else {
        window.showToast(`❌ Error: ${result.error}`, 'error', TOAST_DURATIONS.ERROR);
        if (result.error === 'Match has expired' || result.error === 'Match is no longer active') {
          setShowMatchModal(false);
          setCurrentMatch(null);
        }
      }
    } catch (error) {
      console.error('Failed to reject match:', error);
      window.showToast('❌ Failed to reject match. Please try again.', 'error', TOAST_DURATIONS.ERROR);
    }
  }, [currentMatch, currentUser, matchingService, populateMatchedUser, loadMatchHistory, loadNotifications, loadActiveSentMatch]);

  /**
   * Handles closing the match modal
   */
  const handleCloseMatchModal = useCallback(() => {
    setShowMatchModal(false);
    setCurrentMatch(null);
  }, []);

  /**
   * Handles clicking on a match in history
   */
  const handleMatchHistoryClick = useCallback(async (match) => {
    const userDecision = match.user1Id === currentUser.id ? match.user1Decision : match.user2Decision;
    
    if (match.status === 'pending' && userDecision === 'pending') {
      console.log('Opening match for decision:', match);
      setCurrentMatch(populateMatchedUser(match));
      setShowMatchModal(true);
    } else {
      console.log('Match is completed or user already decided');
    }
  }, [currentUser, populateMatchedUser]);

  // UI Helper Functions
  /**
   * Renders a match card
   * @param {Object} match - Match object
   * @param {boolean} showActions - Whether to show action buttons
   * @returns {JSX.Element} Match card component
   */
  const renderMatchCard = useCallback((match, showActions = true) => {
    const matchedUserId = match.user1Id === currentUser.id ? match.user2Id : match.user1Id;
    const matchedUser = match.matchedUser || users.find(u => u.id === matchedUserId);
    const matchedUserName = matchedUser ? matchedUser.name : `User ${matchedUserId.slice(0, 8)}...`;
    const matchedUserAvatar = matchedUser ? (matchedUser.avatar?.emoji || matchedUser.avatar_emoji || '👤') : '👤';
    
    const userDecision = match.user1Id === currentUser.id ? match.user1Decision : match.user2Decision;
    const canRespond = match.status === 'pending' && userDecision === 'pending';
    const isSentMatch = match.user1Id === currentUser.id;
    
    return (
      <div 
        key={match.id}
        className={`bg-white rounded-lg p-4 shadow-md border transition-all duration-200 ${
          canRespond && showActions
            ? 'cursor-pointer hover:shadow-lg hover:border-pink-300 border-2 border-dashed border-pink-200' 
            : 'cursor-pointer hover:shadow-lg hover:border-gray-300'
        }`}
        onClick={() => {
          if (canRespond && showActions) {
            handleMatchHistoryClick(match);
          } else {
            setCurrentMatch(populateMatchedUser(match));
            setShowMatchModal(true);
          }
        }}
      >
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-lg">
            {matchedUserAvatar}
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-800">{matchedUserName}</h4>
            <p className="text-sm text-gray-500">{match.matchScore}% compatibility</p>
          </div>
          
          {/* Status indicators */}
          {canRespond && showActions && (
            <div className="ml-auto">
              <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-medium animate-pulse">
                ⏳ Respond
              </span>
            </div>
          )}
          {!canRespond && match.status === 'mutual_match' && (
            <div className="ml-auto">
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                ✅ Matched
              </span>
            </div>
          )}
          {!canRespond && match.status === 'rejected' && (
            <div className="ml-auto">
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                ❌ Rejected
              </span>
            </div>
          )}
          {!canRespond && match.status === 'expired' && (
            <div className="ml-auto">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                ⏰ Expired
              </span>
            </div>
          )}
          {!canRespond && match.status === 'pending' && userDecision !== 'pending' && (
            <div className="ml-auto">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                ⏳ Waiting
              </span>
            </div>
          )}
        </div>
        
        <div className="text-xs text-gray-600">
          <div className="mb-2">
            <p className="font-medium text-gray-700">Match Status:</p>
            <p className="text-gray-600">
              {match.status === 'mutual_match' ? '🎉 You both accepted each other!' :
               match.status === 'rejected' ? '❌ Match was rejected' :
               match.status === 'expired' ? '⏰ Match expired (24h timeout)' :
               userDecision === 'pending' ? '⏳ Waiting for your decision' :
               '⏳ Waiting for their decision'}
            </p>
          </div>
          <div className="space-y-1">
            <p>Your decision: {userDecision === 'pending' ? '⏳ Pending' : userDecision === 'accepted' ? '✅ Accepted' : '❌ Rejected'}</p>
            <p>Their decision: {(isSentMatch ? match.user2Decision : match.user1Decision) === 'pending' ? '⏳ Pending' : (isSentMatch ? match.user2Decision : match.user1Decision) === 'accepted' ? '✅ Accepted' : '❌ Rejected'}</p>
          </div>
          <p className="mt-2 text-gray-500">Date: {new Date(match.createdAt).toLocaleDateString()}</p>
          {match.matchReasons && match.matchReasons.length > 0 && (
            <p className="mt-1 text-gray-500">
              {match.matchReasons[0]}
            </p>
          )}
          {canRespond && showActions && (
            <p className="mt-2 text-pink-600 font-medium">
              Click to respond to this match
            </p>
          )}
          {!canRespond && (
            <p className="mt-2 text-gray-600 font-medium">
              Click to view match details
            </p>
          )}
        </div>
      </div>
    );
  }, [currentUser, users, handleMatchHistoryClick, populateMatchedUser]);

  // Effects
  useEffect(() => {
    console.log('🔧 Matching service debug:', {
      isUsingDatabaseUsers,
      serviceType: 'SupabaseMatchingService (Persistent)',
      currentUser: currentUser?.name
    });
  }, [isUsingDatabaseUsers, currentUser]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (currentUser) {
      loadOnlineStatus(); // Load online status when user changes
      loadMatchHistory();
      loadNotifications();
      loadActiveSentMatch();
    }
  }, [currentUser, loadMatchHistory, loadNotifications, loadActiveSentMatch]);

  useEffect(() => {
    if (isOnline && currentUser) {
      const interval = setInterval(() => {
        loadNotifications();
        loadOnlineStatus(); // Refresh online status periodically
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isOnline, currentUser, loadNotifications]);

  // Render
  const { sentMatches, receivedMatches, mutualMatches, rejectedByMe, rejectedByThem } = organizeMatches();
  const hasActiveSentMatch = activeSentMatch !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <ToastManager />
      
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-2xl">
                {currentUser?.avatar?.emoji || '👤'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{currentUser?.name || 'User'}</h1>
                <p className="text-gray-600">
                  {isOnline ? '🟢 Online' : '🔴 Offline'} • {matchHistory.length} matches
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                🔔
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>
              
              <button
                onClick={onLogout}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
              >
                Logout
              </button>
              
              {!isOnline ? (
                <button
                  onClick={goOnline}
                  disabled={isMatching || hasActiveSentMatch}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    isMatching || hasActiveSentMatch
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  }`}
                >
                  {isMatching ? 'Finding Matches...' : hasActiveSentMatch ? 'Match Pending...' : 'Match Me'}
                </button>
              ) : (
                <button
                  onClick={goOffline}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                >
                  Go Offline
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Sent Match Status */}
      {hasActiveSentMatch && (
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                ⏳
              </div>
              <div>
                <h3 className="font-medium text-blue-800">Match Pending</h3>
                <p className="text-sm text-blue-600">
                  You have an active match with {activeSentMatch.matchedUser?.name || 'someone'}. 
                  Waiting for their response...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Match History */}
        {matchHistory.length > 0 && (
          <div className="mb-10">
            <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Your Match History</h3>
            
            {/* Active Matches Section */}
            {(sentMatches.length > 0 || receivedMatches.length > 0) && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-700 mb-4 text-center">Active Matches</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Sent Matches - Left Column */}
                  <div>
                    <h5 className="text-md font-medium text-gray-600 mb-3 flex items-center">
                      <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                      Sent Matches ({sentMatches.length})
                    </h5>
                    <div className="space-y-3">
                      {sentMatches.map(match => renderMatchCard(match, true))}
                      {sentMatches.length === 0 && (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                          <p className="text-sm">No sent matches yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Received Matches - Right Column */}
                  <div>
                    <h5 className="text-md font-medium text-gray-600 mb-3 flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      Received Matches ({receivedMatches.length})
                    </h5>
                    <div className="space-y-3">
                      {receivedMatches.map(match => renderMatchCard(match, true))}
                      {receivedMatches.length === 0 && (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                          <p className="text-sm">No received matches yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Mutual Matches Section */}
            {mutualMatches.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-700 mb-4 text-center">🎉 Successful Matches</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mutualMatches.map(match => renderMatchCard(match, false))}
                </div>
              </div>
            )}
            
            {/* Rejected Matches Section */}
            {(rejectedByMe.length > 0 || rejectedByThem.length > 0) && (
              <div>
                <h4 className="text-lg font-semibold text-gray-700 mb-4 text-center">Rejected Matches</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Rejected by Me - Left Column */}
                  <div>
                    <h5 className="text-md font-medium text-gray-600 mb-3 flex items-center">
                      <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                      Rejected by You ({rejectedByMe.length})
                    </h5>
                    <div className="space-y-3">
                      {rejectedByMe.map(match => renderMatchCard(match, true))}
                      {rejectedByMe.length === 0 && (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                          <p className="text-sm">No rejected matches</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Rejected by Them - Right Column */}
                  <div>
                    <h5 className="text-md font-medium text-gray-600 mb-3 flex items-center">
                      <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                      Rejected by Them ({rejectedByThem.length})
                    </h5>
                    <div className="space-y-3">
                      {rejectedByThem.map(match => renderMatchCard(match, true))}
                      {rejectedByThem.length === 0 && (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                          <p className="text-sm">No rejected matches</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {matchHistory.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💕</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No matches yet</h3>
            <p className="text-gray-600 mb-6">Click "Match Me" to start finding compatible people!</p>
            {!isOnline && (
              <button
                onClick={goOnline}
                disabled={isMatching || hasActiveSentMatch}
                className={`px-8 py-3 rounded-lg font-medium transition-all ${
                  isMatching || hasActiveSentMatch
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                }`}
              >
                {isMatching ? 'Finding Matches...' : hasActiveSentMatch ? 'Match Pending...' : 'Match Me'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Match Modal */}
      {showMatchModal && (
        <>
          {console.log('🔍 Home: Opening MatchModal with match:', currentMatch)}
          {console.log('🔍 Home: currentUser:', currentUser)}
          <MatchModal
            match={currentMatch}
            onAccept={handleAcceptMatch}
            onReject={handleRejectMatch}
            onClose={handleCloseMatchModal}
            isVisible={showMatchModal}
            currentUserId={currentUser?.id}
          />
        </>
      )}

      {/* Notification Center */}
      <NotificationCenter
        isVisible={showNotifications}
        onClose={() => setShowNotifications(false)}
        currentUserId={currentUser?.id}
        matchingService={matchingService}
      />
    </div>
  );
};

export default Home;