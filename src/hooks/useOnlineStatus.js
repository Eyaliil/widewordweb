import { useState, useEffect, useCallback } from 'react';
import { userService } from '../services/userService';

export const useOnlineStatus = (currentUser) => {
  const [isOnline, setIsOnline] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const loadOnlineStatus = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      const onlineUsersData = await userService.getOnlineUsers();
      const isUserOnline = onlineUsersData.some(user => user.id === currentUser.id && user.isOnline);
      console.log(`🔍 Current user ${currentUser.name} online status:`, isUserOnline);
      console.log(`👥 Online users:`, onlineUsersData);
      setIsOnline(isUserOnline);
      setOnlineUsers(onlineUsersData);
    } catch (error) {
      console.error('Failed to load online status:', error);
    }
  }, [currentUser]);

  // Load online status when user changes
  useEffect(() => {
    loadOnlineStatus();
  }, [loadOnlineStatus]);

  // Refresh online status periodically
  useEffect(() => {
    if (!currentUser?.id) return;
    
    const interval = setInterval(loadOnlineStatus, 5000); // Every 5 seconds
    return () => clearInterval(interval);
  }, [currentUser, loadOnlineStatus]);

  const setOnline = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      await userService.setUserOnline(currentUser.id);
      await loadOnlineStatus();
      window.showToast('🟢 You are now online!', 'success', 3000);
    } catch (error) {
      console.error('Failed to go online:', error);
      window.showToast('❌ Failed to go online. Please try again.', 'error', 4000);
    }
  }, [currentUser, loadOnlineStatus]);

  const setOffline = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      await userService.setUserOffline(currentUser.id);
      await loadOnlineStatus();
      window.showToast('🔴 You are now offline!', 'info', 3000);
    } catch (error) {
      console.error('Failed to go offline:', error);
      window.showToast('❌ Failed to go offline. Please try again.', 'error', 4000);
    }
  }, [currentUser, loadOnlineStatus]);

  return {
    isOnline,
    onlineUsers,
    loadOnlineStatus,
    setOnline,
    setOffline
  };
};
