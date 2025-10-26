import React, { useState, useEffect } from 'react';
import { RiCloseLine, RiNotification3Line, RiBellLine, RiHeart3Fill } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';

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
      const { getMatchingService } = await import('../../services/matchingService');
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
      const { getMatchingService } = await import('../../services/matchingService');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full mx-4 overflow-hidden shadow-2xl modal-enter">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#7B002C] to-[#40002B] text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Notifications</h2>
              <p className="text-white/80 text-sm">Your match updates</p>
            </div>
            <button
              onClick={() => {
                onClose();
                onNotificationClick?.(); // Update notification count when closing
              }}
              className="text-white hover:text-white/80 transition-colors duration-200 p-2 hover:bg-white/10 rounded-lg"
            >
              <RiCloseLine className="text-2xl" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 text-center text-[#8B6E58]">
              <div className="w-6 h-6 border-2 border-[#F9E6CA] border-t-[#7B002C] rounded-full animate-spin mx-auto mb-2"></div>
              <p>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-[#8B6E58]">
              <RiBellLine className="text-5xl mx-auto mb-3 text-[#40002B]" />
              <p className="font-medium text-[#40002B]">No notifications yet</p>
              <p className="text-sm">You'll see match notifications here</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`rounded-lg p-4 border cursor-pointer transition-all duration-250 hover:-translate-y-0.5 ${
                    notification.is_read ? 'bg-[#F9E6CA]' : 'bg-[#FBEEDA] border-[#7B002C]'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#7B002C] to-[#40002B] rounded-full flex items-center justify-center">
                      {notification.type === 'new_match' ? (
                        <RiHeart3Fill className="text-2xl text-white" />
                      ) : (
                        <RiNotification3Line className="text-2xl text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-[#40002B]">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-[#8B6E58]">
                        {notification.message}
                      </p>
                      <p className="text-xs text-[#8B6E58] mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="text-right">
                        <div className="w-3 h-3 bg-[#7B002C] rounded-full"></div>
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
          <div className="p-4 border-t border-[#F9E6CA] bg-[#F9E6CA]">
            <button
              onClick={async () => {
                try {
                  const { getMatchingService } = await import('../../services/matchingService');
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
              className="w-full py-2 px-4 bg-gradient-to-r from-[#7B002C] to-[#40002B] text-white rounded-lg hover:shadow-md transition-all duration-250 text-sm font-medium"
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
