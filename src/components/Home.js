import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import MatchModal from './MatchModal';
import NotificationCenter from './NotificationCenter';
import ToastManager from './ToastManager';
import Header from './Home/Header';
import MatchesSidebar from './Home/MatchesSidebar';
import MainContent from './Home/MainContent';
import ProfileEditPage from './ProfileEditPage';
import ProfilePage from './ProfilePage';
import { useMatchHistory } from '../hooks/useMatchHistory';
import { useMatchActions } from '../hooks/useMatchActions';

const Home = ({ me, avatar, isProfileComplete, onEditProfile, onEditPreferences, onLogout, onNavigateToChat }) => {
  // Auth context
  const { user, currentUser, databaseUsers, isUsingDatabaseUsers } = useAuth();
  
  // State management
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showProfileEditPage, setShowProfileEditPage] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

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

  // Custom hooks
  const { matchHistory, hasActiveSentMatch, loadMatchHistory, loadActiveSentMatch } = useMatchHistory(currentUser);
  const { 
    isMatching, 
    currentMatch, 
    showMatchModal, 
    setCurrentMatch, 
    setShowMatchModal, 
    findMatches, 
    populateMatchedUser 
  } = useMatchActions(currentUser, loadMatchHistory, loadNotifications);

  // Load notifications when user changes
  useEffect(() => {
    if (currentUser?.id) {
      loadNotifications();
    }
  }, [currentUser, loadNotifications]);


  // Profile edit handlers
  const handleEditProfileClick = useCallback(() => {
    setShowProfileEditPage(true);
  }, []);

  const handleEditProfileInfo = useCallback(() => {
    setShowProfileEditPage(false);
    onEditProfile();
  }, [onEditProfile]);

  const handleEditPreferences = useCallback(() => {
    setShowProfileEditPage(false);
    onEditPreferences();
  }, [onEditPreferences]);

  const handleBackFromEdit = useCallback(() => {
    setShowProfileEditPage(false);
  }, []);

  // Handle profile page navigation
  const handleViewProfile = useCallback((match) => {
    setSelectedMatch(match);
    setShowProfilePage(true);
  }, []);

  const handleBackFromProfile = useCallback(() => {
    setShowProfilePage(false);
    setSelectedMatch(null);
  }, []);


  // Handle match decisions
  const handleMatchDecision = useCallback(async (matchId, decision) => {
    try {
      const { getMatchingService } = await import('../services/matchingService');
      const matchingService = getMatchingService();
      
      await matchingService.respondToMatch(matchId, currentUser.id, decision);
      
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
  }, [currentUser, loadMatchHistory, loadNotifications, loadActiveSentMatch]);

  // Handle accept match
  const handleAcceptMatch = useCallback((matchId) => {
    handleMatchDecision(matchId, 'accepted');
  }, [handleMatchDecision]);

  // Handle reject match
  const handleRejectMatch = useCallback((matchId) => {
    handleMatchDecision(matchId, 'rejected');
  }, [handleMatchDecision]);

  // Don't render if no current user (during logout transition)
  if (!currentUser) {
    return (
      <div className="h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">👋</div>
          <p className="text-gray-600">Logging out...</p>
        </div>
      </div>
    );
  }

  // Show profile edit page if requested
  if (showProfileEditPage) {
    return (
      <div>
        <ToastManager />
        <ProfileEditPage
          currentUser={currentUser}
          onEditProfile={handleEditProfileInfo}
          onEditPreferences={handleEditPreferences}
          onBack={handleBackFromEdit}
        />
      </div>
    );
  }

  // Show profile page if requested
  if (showProfilePage && selectedMatch) {
    return (
      <div>
        <ToastManager />
        <ProfilePage
          match={selectedMatch}
          currentUser={currentUser}
          onBack={handleBackFromProfile}
        />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex flex-col">
      {/* Toast Manager */}
      <ToastManager />
      
      {/* Header */}
      <Header 
        currentUser={currentUser}
        onLogout={onLogout}
        onEditProfile={handleEditProfileClick}
        onNavigateToChat={onNavigateToChat}
      />

      {/* Main Content - Fullscreen Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Matches Sidebar - Left */}
        <MatchesSidebar
          matchHistory={matchHistory.filter(match => match && match.id)}
          currentUser={currentUser}
          databaseUsers={databaseUsers}
          populateMatchedUser={populateMatchedUser}
          setCurrentMatch={setCurrentMatch}
          setShowMatchModal={setShowMatchModal}
          loadMatchHistory={loadMatchHistory}
          loadNotifications={loadNotifications}
          onViewProfile={handleViewProfile}
          onAcceptMatch={handleAcceptMatch}
          onRejectMatch={handleRejectMatch}
        />

        {/* Main Content Area - Center */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <MainContent
            matchHistory={matchHistory}
            currentUser={currentUser}
            isMatching={isMatching}
            hasActiveSentMatch={hasActiveSentMatch}
            findMatches={findMatches}
          />
        </div>

      </div>

      {/* Match Modal */}
      {showMatchModal && (
        <>
          {console.log('🔍 Home: Opening MatchModal with match:', currentMatch)}
          <MatchModal
            match={currentMatch}
            onAccept={() => handleMatchDecision(currentMatch.id, 'accepted')}
            onReject={() => handleMatchDecision(currentMatch.id, 'rejected')}
            onClose={() => setShowMatchModal(false)}
            isVisible={showMatchModal}
            currentUserId={currentUser?.id}
            currentUser={currentUser}
          />
        </>
      )}

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notificationCount={notificationCount}
        onNotificationClick={() => {
          setShowNotifications(false);
          loadNotifications(); // Reload notifications count when closing
        }}
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