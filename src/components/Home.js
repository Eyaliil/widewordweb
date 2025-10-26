import React, { useState, useEffect, useCallback } from 'react';
import { RiNotification3Line } from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import MatchModal from './matching/MatchModal';
import NotificationCenter from './ui/NotificationCenter';
import ToastManager from './ui/ToastManager';
import Header from './Home/Header';
import MainContent from './Home/MainContent';
import ProfileEditPage from './profile/ProfileEditPage';

import { useMatchHistory } from '../hooks/useMatchHistory';
import { useMatchActions } from '../hooks/useMatchActions';

const Home = ({ me, avatar, isProfileComplete, onEditProfile, onEditPreferences, onLogout, onNavigateToChat: onNavigateToChatProp }) => {
  // Auth context
  const { user, currentUser, databaseUsers, isUsingDatabaseUsers } = useAuth();
  
  // State management
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showProfileEditPage, setShowProfileEditPage] = useState(false);

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
      <div className="h-screen bg-[#FBEEDA] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#8B6E58] text-lg">Logging out...</p>
        </div>
      </div>
    );
  }

  // Show match modal as full page
  if (showMatchModal && currentMatch) {
    console.log('🔍 Home: Opening MatchModal with match:', currentMatch);
    return (
      <div>
        <ToastManager />
        <MatchModal
          match={currentMatch}
          onAccept={() => handleMatchDecision(currentMatch.id, 'accepted')}
          onReject={() => handleMatchDecision(currentMatch.id, 'rejected')}
          onClose={() => setShowMatchModal(false)}
          isVisible={showMatchModal}
          currentUserId={currentUser?.id}
          currentUser={currentUser}
        />
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



  return (
    <div className="h-screen bg-[#FBEEDA] flex flex-col">
      {/* Toast Manager */}
      <ToastManager />
      
      {/* Header */}
      <Header 
        currentUser={currentUser}
        onLogout={onLogout}
        onEditProfile={handleEditProfileClick}
        onNavigateToChat={onNavigateToChatProp}
      />

      {/* Main Content - Center Layout */}
      <div className="flex-1 overflow-hidden">
        <MainContent
          matchHistory={matchHistory.filter(match => match && match.id)}
          currentUser={currentUser}
          databaseUsers={databaseUsers}
          populateMatchedUser={populateMatchedUser}
          setCurrentMatch={setCurrentMatch}
          setShowMatchModal={setShowMatchModal}
          loadMatchHistory={loadMatchHistory}
          loadNotifications={loadNotifications}
          onAcceptMatch={handleAcceptMatch}
          onRejectMatch={handleRejectMatch}
          onNavigateToChat={onNavigateToChatProp}
          isMatching={isMatching}
          hasActiveSentMatch={hasActiveSentMatch}
          findMatches={findMatches}
        />
      </div>

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
        className="fixed bottom-6 right-6 bg-gradient-to-br from-[#7B002C] to-[#40002B] hover:from-[#40002B] hover:to-[#7B002C] text-white rounded-full p-4 shadow-lg transition-all duration-250 z-50"
      >
        <RiNotification3Line className="text-xl" />
        {notificationCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-[#BA0105] text-white text-xs font-medium rounded-full w-6 h-6 flex items-center justify-center">
            {notificationCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default Home;