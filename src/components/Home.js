import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
// AuthPanel removed - authentication skipped
import MatchModal from './MatchModal';
import NotificationCenter from './NotificationCenter';
// Authentication removed - no longer needed
import { loadPublicProfiles } from '../services/profileService';
import { getMatchingService } from '../services/matchingService';
import { userService } from '../services/userService';

const Home = ({ me, avatar, isProfileComplete, isOnline, setIsOnline, onEditProfile, onEditPreferences }) => {
  const { user, currentUser, isUsingFakeUsers } = useAuth();
  const matchingService = getMatchingService(isUsingFakeUsers);
  const [users, setUsers] = useState([]);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [matchHistory, setMatchHistory] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

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

  // Load match history and notifications when user changes
  useEffect(() => {
    if (currentUser) {
      loadMatchHistory();
      loadNotifications();
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
        setCurrentMatch(pendingMatch);
        setShowMatchModal(true);
        setIsMatching(false);
      } else if (result.newMatches && result.newMatches.length > 0) {
        // Show the new matches found
        console.log(`Found ${result.newMatches.length} new matches`);
        const bestMatch = result.newMatches[0];
        console.log('New match:', bestMatch);
        setCurrentMatch(bestMatch);
        setShowMatchModal(true);
        
        // Reload notifications to show the new match notification
        setTimeout(() => {
          loadNotifications();
        }, 1000);
        
        setIsMatching(false);
      } else {
        // No matches found
        console.log('No matches found');
        setIsMatching(false);
        // Show a brief message to the user
        setTimeout(() => {
          alert('No matches found at the moment. Keep checking back!');
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
        setCurrentMatch(result.match);
        
        // Check match status
        if (result.match.status === 'mutual_match') {
          alert('🎉 Mutual match! You both accepted each other!');
          setShowMatchModal(false);
          setCurrentMatch(null);
        } else if (result.match.status === 'rejected') {
          alert('❌ Match ended - different decisions were made');
          setShowMatchModal(false);
          setCurrentMatch(null);
        } else if (result.match.status === 'expired') {
          alert('⏰ Match has expired');
          setShowMatchModal(false);
          setCurrentMatch(null);
        } else {
          alert('✅ Your decision has been recorded! Waiting for the other person...');
        }
        
        // Reload match history and notifications
        await loadMatchHistory();
        await loadNotifications();
      } else {
        alert(`❌ Error: ${result.error}`);
        if (result.error === 'Match has expired' || result.error === 'Match is no longer active') {
          setShowMatchModal(false);
          setCurrentMatch(null);
        }
      }
    } catch (error) {
      console.error('Failed to accept match:', error);
      alert('❌ Failed to accept match. Please try again.');
    }
  };

  const handleRejectMatch = async () => {
    if (!currentMatch) return;
    
    try {
      const result = await matchingService.makeDecision(currentMatch.id, currentUser.id, 'rejected');
      
      if (result.success) {
        // Update the current match with the new decision
        setCurrentMatch(result.match);
        
        // Check match status
        if (result.match.status === 'mutual_match') {
          alert('🎉 Mutual match! You both accepted each other!');
          setShowMatchModal(false);
          setCurrentMatch(null);
        } else if (result.match.status === 'rejected') {
          alert('❌ Match ended - different decisions were made');
          setShowMatchModal(false);
          setCurrentMatch(null);
        } else if (result.match.status === 'expired') {
          alert('⏰ Match has expired');
          setShowMatchModal(false);
          setCurrentMatch(null);
        } else {
          alert('✅ Your decision has been recorded!');
        }
        
        // Reload match history and notifications
        await loadMatchHistory();
        await loadNotifications();
      } else {
        alert(`❌ Error: ${result.error}`);
        if (result.error === 'Match has expired' || result.error === 'Match is no longer active') {
          setShowMatchModal(false);
          setCurrentMatch(null);
        }
      }
    } catch (error) {
      console.error('Failed to reject match:', error);
      alert('❌ Failed to reject match. Please try again.');
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
      setCurrentMatch(match);
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
      </section>

      {/* Auth panel removed - authentication skipped */}

      {/* Primary action and status */}
      <div className="text-center mb-10">
        {!isOnline ? (
          <button
            onClick={goOnline}
            className="px-8 py-4 font-semibold rounded-xl text-lg transition-all duration-200 shadow-lg bg-black text-white hover:bg-gray-800"
          >
            Go Online
          </button>
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
      {matchHistory.length > 0 && (
        <div className="mb-10">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Your Match History</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matchHistory.slice(0, 6).map((match, index) => {
              // Get the matched user's info
              const matchedUserId = match.user1Id === currentUser.id ? match.user2Id : match.user1Id;
              const matchedUser = users.find(u => u.id === matchedUserId);
              const matchedUserName = matchedUser ? matchedUser.name : 'Unknown User';
              const matchedUserAvatar = matchedUser ? matchedUser.avatar.emoji : '👤';
              
              // Check if user can still respond to this match
              const userDecision = match.user1Id === currentUser.id ? match.user1Decision : match.user2Decision;
              const canRespond = match.status === 'pending' && userDecision === 'pending';
              
              return (
                <div 
                  key={index} 
                  className={`bg-white rounded-lg p-4 shadow-md border transition-all duration-200 ${
                    canRespond 
                      ? 'cursor-pointer hover:shadow-lg hover:border-pink-300 border-2 border-dashed border-pink-200' 
                      : 'cursor-default'
                  }`}
                  onClick={() => canRespond && handleMatchHistoryClick(match)}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-lg">
                      {matchedUserAvatar}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{matchedUserName}</h4>
                      <p className="text-sm text-gray-500">{match.matchScore}% compatibility</p>
                    </div>
                    {canRespond && (
                      <div className="ml-auto">
                        <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-medium animate-pulse">
                          ⏳ Respond
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-600">
                    <p>Status: {match.user1Decision} / {match.user2Decision}</p>
                    <p>Date: {new Date(match.createdAt).toLocaleDateString()}</p>
                    {match.matchReasons && match.matchReasons.length > 0 && (
                      <p className="mt-1 text-gray-500">
                        {match.matchReasons[0]}
                      </p>
                    )}
                    {canRespond && (
                      <p className="mt-2 text-pink-600 font-medium">
                        Click to respond to this match
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Match Modal */}
      <MatchModal
        match={currentMatch}
        onAccept={handleAcceptMatch}
        onReject={handleRejectMatch}
        onClose={handleCloseMatchModal}
        isVisible={showMatchModal}
      />

      {/* Notification Center */}
      <NotificationCenter
        isVisible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
};

export default Home;
