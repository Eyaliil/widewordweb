import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const NotificationCenter = ({ isOpen, onClose, notificationCount, onNotificationClick }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser && isOpen) {
      loadNotifications();
    }
  }, [currentUser, isOpen]);

  const loadNotifications = async () => {
    if (!currentUser?.id) return;
    
    setIsLoading(true);
    try {
      const { getMatchingService } = await import('../services/matchingService');
      const matchingService = getMatchingService();
      const notificationsData = await matchingService.getNotifications(currentUser.id);
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const { getMatchingService } = await import('../services/matchingService');
      const matchingService = getMatchingService();
      await matchingService.markNotificationAsRead(notificationId);
      
      // Update local state to reflect the change (notification stays in list)
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );
      
      // Don't call onNotificationClick here to avoid reloading
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full mx-4 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Notifications</h2>
              <p className="text-pink-100 text-sm">Your match updates</p>
            </div>
            <button
              onClick={() => {
                onClose();
                onNotificationClick?.(); // Update notification count when closing
              }}
              className="text-white hover:text-pink-200 transition-colors"
            >
              <span className="text-xl">×</span>
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 text-center text-gray-500">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-pink-500 rounded-full animate-spin mx-auto mb-2"></div>
              <p>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="text-4xl mb-2">🔔</div>
              <p>No notifications yet</p>
              <p className="text-sm">You'll see match notifications here</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`rounded-lg p-4 border cursor-pointer transition-colors ${
                    notification.is_read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-xl">
                      {notification.type === 'new_match' ? '💕' : '🔔'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="text-right">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.filter(n => !n.is_read).length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <button
              onClick={async () => {
                try {
                  const { getMatchingService } = await import('../services/matchingService');
                  const matchingService = getMatchingService();
                  await matchingService.clearNotifications(currentUser.id);
                  
                  // Update local state to mark all as read (notifications stay in list)
                  setNotifications(prevNotifications => 
                    prevNotifications.map(notification => 
                      ({ ...notification, is_read: true })
                    )
                  );
                  
                  onNotificationClick?.();
                } catch (error) {
                  console.error('Failed to mark all as read:', error);
                }
              }}
              className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              Mark All as Read
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
