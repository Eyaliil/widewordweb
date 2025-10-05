import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import MatchModal from './MatchModal';
import NotificationCenter from './NotificationCenter';
import ToastManager from './ToastManager';
import Header from './Home/Header';
import MatchesSidebar from './Home/MatchesSidebar';
import OnlineUsersSidebar from './Home/OnlineUsersSidebar';
import MainContent from './Home/MainContent';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useMatchHistory } from '../hooks/useMatchHistory';
import { useMatchActions } from '../hooks/useMatchActions';

const Home = ({ me, avatar, isProfileComplete, isOnline, setIsOnline, onEditProfile, onEditPreferences, onLogout }) => {
  // Auth context
  const { user, currentUser, databaseUsers, isUsingDatabaseUsers } = useAuth();
  
  // Custom hooks
  const { isOnline: onlineStatus, onlineUsers, setOnline, setOffline } = useOnlineStatus(currentUser);
  const { matchHistory, hasActiveSentMatch, loadMatchHistory, loadActiveSentMatch } = useMatchHistory(currentUser);
  const { 
    isMatching, 
    currentMatch, 
    showMatchModal, 
    setCurrentMatch, 
    setShowMatchModal, 
    findMatches, 
    goOnline, 
    populateMatchedUser 
  } = useMatchActions(currentUser, onlineStatus, loadMatchHistory, loadNotifications);

  // State management
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      const { getMatchingService } = await import('../services/matchingService');
      const matchingService = getMatchingService();
      const notifications = await matchingService.getNotifications(currentUser.id);
      setNotificationCount(notifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, [currentUser]);

  // Load notifications when user changes
  useEffect(() => {
    if (currentUser?.id) {
      loadNotifications();
    }
  }, [currentUser, loadNotifications]);

  // Update parent component's isOnline state
  useEffect(() => {
    setIsOnline(onlineStatus);
  }, [onlineStatus, setIsOnline]);

  // Handle match decisions
  const handleMatchDecision = useCallback(async (matchId, decision) => {
    try {
      const { getMatchingService } = await import('../services/matchingService');
      const matchingService = getMatchingService();
      
      await matchingService.respondToMatch(matchId, decision);
      
      // Reload data
      await loadMatchHistory();
      await loadNotifications();
      await loadActiveSentMatch();
      
      // Show appropriate message
      if (decision === 'accepted') {
        window.showToast('🎉 Match accepted! Check your matches.', 'success', 5000);
      } else {
        window.showToast('Match declined.', 'info', 3000);
      }
      
      setShowMatchModal(false);
    } catch (error) {
      console.error('Failed to respond to match:', error);
      window.showToast('❌ Failed to respond to match. Please try again.', 'error', 4000);
    }
  }, [loadMatchHistory, loadNotifications, loadActiveSentMatch]);

  return (
    <div className="h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex flex-col">
      {/* Toast Manager */}
      <ToastManager />
      
      {/* Header */}
      <Header 
        currentUser={currentUser}
        isOnline={onlineStatus}
        setIsOnline={setIsOnline}
        onLogout={onLogout}
        setOnline={setOnline}
        setOffline={setOffline}
      />

      {/* Main Content - Fullscreen Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Matches Sidebar - Left */}
        <MatchesSidebar
          matchHistory={matchHistory}
          currentUser={currentUser}
          databaseUsers={databaseUsers}
          populateMatchedUser={populateMatchedUser}
          setCurrentMatch={setCurrentMatch}
          setShowMatchModal={setShowMatchModal}
          loadMatchHistory={loadMatchHistory}
          loadNotifications={loadNotifications}
        />

        {/* Main Content Area - Center */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <MainContent
            matchHistory={matchHistory}
            currentUser={currentUser}
            isOnline={onlineStatus}
            isMatching={isMatching}
            hasActiveSentMatch={hasActiveSentMatch}
            findMatches={findMatches}
          />
        </div>

        {/* Online Users Sidebar - Right */}
        <OnlineUsersSidebar
          onlineUsers={onlineUsers}
          currentUser={currentUser}
          loadOnlineStatus={setOnline} // This will trigger a refresh
        />
      </div>

      {/* Match Modal */}
      {showMatchModal && (
        <>
          {console.log('🔍 Home: Opening MatchModal with match:', currentMatch)}
          <MatchModal
            match={currentMatch}
            onAccept={() => handleMatchDecision(currentMatch.id, 'accepted')}
            onDecline={() => handleMatchDecision(currentMatch.id, 'rejected')}
            onClose={() => setShowMatchModal(false)}
          />
        </>
      )}

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notificationCount={notificationCount}
        onNotificationClick={() => setShowNotifications(false)}
      />

      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(true)}
        className="fixed bottom-6 right-6 bg-pink-500 hover:bg-pink-600 text-white rounded-full p-4 shadow-lg transition-colors z-50"
      >
        <span className="text-xl">🔔</span>
        {notificationCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {notificationCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default Home;