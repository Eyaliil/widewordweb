import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
// AuthPanel removed - authentication skipped
import MatchModal from './MatchModal';
import NotificationCenter from './NotificationCenter';
import ToastManager from './ToastManager';
// Authentication removed - no longer needed
import { loadPublicProfiles } from '../services/profileService';
import { getMatchingService } from '../services/matchingService';
import { userService } from '../services/userService';

const Home = ({ me, avatar, isProfileComplete, isOnline, setIsOnline, onEditProfile, onEditPreferences }) => {
  const { user, currentUser, databaseUsers, isUsingFakeUsers, isUsingDatabaseUsers } = useAuth();
  const matchingService = getMatchingService(isUsingFakeUsers, isUsingDatabaseUsers);
  
  // Debug logging for service selection
  useEffect(() => {
    console.log('🔧 Matching service debug:', {
      isUsingFakeUsers,
      isUsingDatabaseUsers,
      serviceType: isUsingDatabaseUsers ? 'SupabaseMatchingService (Persistent)' : 'MockMatchingService (Memory only)',
      currentUser: currentUser?.name
    });
  }, [isUsingFakeUsers, isUsingDatabaseUsers, currentUser]);
  const [users, setUsers] = useState([]);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [matchHistory, setMatchHistory] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [activeSentMatch, setActiveSentMatch] = useState(null);

  // Load database users
  useEffect(() => {
    let isCancelled = false;
    const load = async () => {
      try {
        const data = await userService.getAllUsers();
        if (!isCancelled) setUsers(data);
      } catch (e) {
        console.error('Failed to load users:', e);
      }
    };
    load();
    return () => { isCancelled = true; };
  }, []);

  // Profile completion check removed for testing

  // Load active sent match
  const loadActiveSentMatch = async () => {
    if (!currentUser) return;
    
    try {
      const sentMatch = await matchingService.getActiveSentMatch(currentUser.id);
      setActiveSentMatch(sentMatch);
    } catch (error) {
      console.error('Failed to load active sent match:', error);
      setActiveSentMatch(null);
    }
  };

  // Organize matches by type for display
  const organizeMatches = () => {
    if (!matchHistory.length) return { sentMatches: [], receivedMatches: [], rejectedByMe: [], rejectedByThem: [] };

    const sentMatches = [];
    const receivedMatches = [];
    const rejectedByMe = [];
    const rejectedByThem = [];

    matchHistory.forEach(match => {
      const isUser1 = match.user1Id === currentUser.id;
      const userDecision = isUser1 ? match.user1Decision : match.user2Decision;
      const otherUserDecision = isUser1 ? match.user2Decision : match.user1Decision;
      const isPending = match.status === 'pending';
      const isRejected = match.status === 'rejected';
      const isMutualMatch = match.status === 'mutual_match';
      const isExpired = match.status === 'expired';

      if (isPending || isMutualMatch) {
        // Active matches - organize by who initiated vs who received
        if (isUser1) {
          // Current user is user1 (the one who sent the match)
          sentMatches.push(match);
        } else {
          // Current user is user2 (the one who received the match)
          receivedMatches.push(match);
        }
      } else if (isRejected || isExpired) {
        // Rejected matches - organize by who made the rejection
        if (userDecision === 'rejected') {
          // Current user made the rejection
          rejectedByMe.push(match);
        } else if (otherUserDecision === 'rejected' || isExpired) {
          // Other user made the rejection or match expired
          rejectedByThem.push(match);
        }
      }
    });

    return { sentMatches, receivedMatches, rejectedByMe, rejectedByThem };
  };

  // Render a match card
  const renderMatchCard = (match, showActions = true) => {
    const matchedUserId = match.user1Id === currentUser.id ? match.user2Id : match.user1Id;
    const matchedUser = match.matchedUser || users.find(u => u.id === matchedUserId);
    const matchedUserName = matchedUser ? matchedUser.name : `User ${matchedUserId.slice(0, 8)}...`;
    const matchedUserAvatar = matchedUser ? (matchedUser.avatar?.emoji || matchedUser.avatar_emoji || '👤') : '👤';
    
    
    
    // Check if user can still respond to this match
    const userDecision = match.user1Id === currentUser.id ? match.user1Decision : match.user2Decision;
    const canRespond = match.status === 'pending' && userDecision === 'pending';
    
    // Determine if this is a sent match or received match
    const isSentMatch = match.user1Id === currentUser.id;
    const isReceivedMatch = match.user2Id === currentUser.id;
    
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
            // For non-pending matches, show match details or allow viewing
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
  };

  // Helper function to ensure matchedUser is populated
  const populateMatchedUser = (match) => {
    if (match.matchedUser) {
      return match; // Already has matchedUser
    }
    
    // Determine the matched user ID
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
    
    // Find the matched user in the databaseUsers array (from AuthContext)
    const matchedUser = databaseUsers.find(u => u.id === matchedUserId);
    
    if (matchedUser) {
      console.log('✅ Found matchedUser:', matchedUser);
      return { ...match, matchedUser };
    } else {
      console.log('❌ MatchedUser not found, creating fallback');
      // Create a fallback matchedUser
      const fallbackMatchedUser = {
        id: matchedUserId,
        name: `User ${matchedUserId.slice(0, 8)}...`,
        avatar: { emoji: '👤' }
      };
      return { ...match, matchedUser: fallbackMatchedUser };
    }
  };

  // Load match history and notifications when user changes
  useEffect(() => {
    if (currentUser) {
      loadMatchHistory();
      loadNotifications();
      loadActiveSentMatch();
    }
  }, [currentUser]);

  // Check for new notifications periodically when online
  useEffect(() => {
    if (isOnline && currentUser) {
      const interval = setInterval(() => {
        loadNotifications();
      }, 2000); // Check every 2 seconds

      return () => clearInterval(interval);
    }
  }, [isOnline, currentUser]);

  const loadMatchHistory = async () => {
    try {
      const history = await matchingService.getMatchHistory(currentUser.id);
      setMatchHistory(history);
    } catch (error) {
      console.error('Failed to load match history:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const notifications = await matchingService.getNotifications(currentUser.id);
      setNotificationCount(notifications.length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const goOnline = async () => {
    // Skip profile completion check for testing
    setIsOnline(true);
    setIsMatching(true);
    
    try {
      // Go online in the matching service
      const result = await matchingService.goOnline(currentUser.id);
      
      // Check if there's an error (like already having an active sent match)
      if (!result.success) {
        window.showToast(result.error, 'warning', 4000);
        setIsOnline(false);
        setIsMatching(false);
        return;
      }
      
      // Check if there are pending matches waiting for decision
      if (result.hasPendingMatches && result.pendingMatches.length > 0) {
        console.log(`Found ${result.pendingMatches.length} pending matches`);
        // Show the first pending match
        const pendingMatch = result.pendingMatches[0];
        console.log('Pending match:', pendingMatch);
        console.log('Match decisions:', {
          user1Decision: pendingMatch.user1Decision,
          user2Decision: pendingMatch.user2Decision,
          status: pendingMatch.status
        });
        setCurrentMatch(populateMatchedUser(pendingMatch));
        setShowMatchModal(true);
        setIsMatching(false);
      } else if (result.newMatches && result.newMatches.length > 0) {
        // Show the new matches found
        console.log(`Found ${result.newMatches.length} new matches`);
        const bestMatch = result.newMatches[0];
        console.log('New match:', bestMatch);
        console.log('Available databaseUsers:', databaseUsers);
        console.log('Current user:', currentUser);
        setCurrentMatch(populateMatchedUser(bestMatch));
        setShowMatchModal(true);
        
        // Reload notifications to show the new match notification
        setTimeout(() => {
          loadMatchHistory();
          loadNotifications();
          loadActiveSentMatch();
        }, 1000);
        
        setIsMatching(false);
      } else {
        // No matches found
        console.log('No matches found');
        setIsMatching(false);
        // Show a brief message to the user
        setTimeout(() => {
          window.showToast('No matches found at the moment. Keep checking back!', 'info', 4000);
        }, 500);
      }
      
    } catch (error) {
      console.error('Failed to go online:', error);
      setIsMatching(false);
    }
  };

  const goOffline = async () => {
    setIsOnline(false);
    setIsMatching(false);
    setShowMatchModal(false);
    setCurrentMatch(null);
    
    try {
      await matchingService.goOffline(currentUser.id);
    } catch (error) {
      console.error('Failed to go offline:', error);
    }
  };

  const handleAcceptMatch = async () => {
    if (!currentMatch) return;
    
    try {
      const result = await matchingService.makeDecision(currentMatch.id, currentUser.id, 'accepted');
      
      if (result.success) {
        // Update the current match with the new decision
        setCurrentMatch(populateMatchedUser(result.match));
        
        // Check match status
        if (result.match.status === 'mutual_match') {
          window.showToast('🎉 Mutual match! You both accepted each other!', 'success', 5000);
          setShowMatchModal(false);
          setCurrentMatch(null);
        } else if (result.match.status === 'rejected') {
          window.showToast('❌ Match ended - different decisions were made', 'warning', 4000);
          setShowMatchModal(false);
          setCurrentMatch(null);
        } else if (result.match.status === 'expired') {
          window.showToast('⏰ Match has expired', 'warning', 3000);
          setShowMatchModal(false);
          setCurrentMatch(null);
        } else {
          window.showToast('✅ Your decision has been recorded! Waiting for the other person...', 'success', 4000);
        }
        
        // Reload match history and notifications
        await loadMatchHistory();
        await loadNotifications();
        await loadActiveSentMatch();
      } else {
        window.showToast(`❌ Error: ${result.error}`, 'error', 4000);
        if (result.error === 'Match has expired' || result.error === 'Match is no longer active') {
          setShowMatchModal(false);
          setCurrentMatch(null);
        }
      }
    } catch (error) {
      console.error('Failed to accept match:', error);
      window.showToast('❌ Failed to accept match. Please try again.', 'error', 4000);
    }
  };

  const handleRejectMatch = async () => {
    if (!currentMatch) return;
    
    try {
      const result = await matchingService.makeDecision(currentMatch.id, currentUser.id, 'rejected');
      
      if (result.success) {
        // Update the current match with the new decision
        setCurrentMatch(populateMatchedUser(result.match));
        
        // Check match status
        if (result.match.status === 'mutual_match') {
          window.showToast('🎉 Mutual match! You both accepted each other!', 'success', 5000);
          setShowMatchModal(false);
          setCurrentMatch(null);
        } else if (result.match.status === 'rejected') {
          window.showToast('❌ Match ended - different decisions were made', 'warning', 4000);
          setShowMatchModal(false);
          setCurrentMatch(null);
        } else if (result.match.status === 'expired') {
          window.showToast('⏰ Match has expired', 'warning', 3000);
          setShowMatchModal(false);
          setCurrentMatch(null);
        } else {
          window.showToast('✅ Your decision has been recorded!', 'success', 3000);
        }
        
        // Reload match history and notifications
        await loadMatchHistory();
        await loadNotifications();
        await loadActiveSentMatch();
      } else {
        window.showToast(`❌ Error: ${result.error}`, 'error', 4000);
        if (result.error === 'Match has expired' || result.error === 'Match is no longer active') {
          setShowMatchModal(false);
          setCurrentMatch(null);
        }
      }
    } catch (error) {
      console.error('Failed to reject match:', error);
      window.showToast('❌ Failed to reject match. Please try again.', 'error', 4000);
    }
  };

  const handleCloseMatchModal = () => {
    setShowMatchModal(false);
    setCurrentMatch(null);
  };

  const handleMatchHistoryClick = async (match) => {
    // Check if this match is still pending and user hasn't decided yet
    const userDecision = match.user1Id === currentUser.id ? match.user1Decision : match.user2Decision;
    
    if (match.status === 'pending' && userDecision === 'pending') {
      // User can still respond to this match
      console.log('Opening match for decision:', match);
      setCurrentMatch(populateMatchedUser(match));
      setShowMatchModal(true);
    } else {
      // Match is completed or user already decided
      console.log('Match is completed or user already decided');
    }
  };

  return (
    <div className="max-w-6xl mx-auto min-h-screen overflow-hidden px-4">
      {/* Top navigation / status bar */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="py-4">
          <div className="flex flex-col items-end gap-2">
            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                <span className="hidden md:inline">Welcome</span>
                <span className="font-medium truncate max-w-[10rem]">{user.user_metadata?.name || 'User'}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowNotifications(true)}
                className="relative px-3 py-2 text-sm rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                🔔 Notifications
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>
              <button onClick={onEditProfile} className="px-3 sm:px-4 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-800">Edit Profile</button>
              <button onClick={onEditPreferences} className="px-3 sm:px-4 py-2 text-sm rounded-lg bg-gray-200 hover:bg-gray-300">Edit Preferences</button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero section */}
      <section className="pt-10 pb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">The Future of Matchmaking ✨</h1>
        <p className="mt-3 text-gray-600 max-w-2xl mx-auto">Let the algorithm find who truly fits you.</p>
        <p className="mt-2 text-sm text-gray-500">Use the profile selector (top right) to test different users</p>
        <p className="mt-1 text-xs text-gray-400">
          {isUsingDatabaseUsers ? '✅ Matches are saved to database and persist across reloads' : '⚠️ Matches are stored in memory only and will be lost on reload'}
        </p>
      </section>

      {/* Auth panel removed - authentication skipped */}

      {/* Primary action and status */}
      <div className="text-center mb-10">
        {!isOnline ? (
          <div className="space-y-3">
            {activeSentMatch && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-lg">
                    {activeSentMatch.matchedUser?.avatar?.emoji || '👤'}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900">Active Match Pending</h4>
                    <p className="text-sm text-blue-700">
                      Waiting for {activeSentMatch.matchedUser?.name || 'Unknown'} to respond
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Sent {new Date(activeSentMatch.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={goOnline}
              disabled={!!activeSentMatch}
              className={`px-8 py-4 font-semibold rounded-xl text-lg transition-all duration-200 shadow-lg ${
                activeSentMatch 
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {activeSentMatch ? 'Match Pending...' : 'Match Me'}
            </button>
            {activeSentMatch && (
              <p className="text-xs text-gray-500 text-center">
                You already have an active match. Wait for a response or cancel your current match.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {isMatching ? (
              <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
                <span className="text-lg font-medium text-gray-700">Finding your perfect match...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-lg font-medium text-gray-700">Online and looking for matches</span>
                </div>
                <button
                  onClick={goOffline}
                  className="px-6 py-2 text-sm font-medium rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                >
                  Go Offline
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Match History */}
      {matchHistory.length > 0 && (() => {
        const { sentMatches, receivedMatches, rejectedByMe, rejectedByThem } = organizeMatches();
        
        return (
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
        );
      })()}

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
      />

      {/* Toast Notifications */}
      <ToastManager />
    </div>
  );
};

export default Home;
