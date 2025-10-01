import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { currentMatchingService } from '../services/matchingService';
import { fakeUsers } from '../data/fakeUsers';

const NotificationCenter = ({ isVisible, onClose }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (currentUser && isVisible) {
      loadNotifications();
    }
  }, [currentUser, isVisible]);

  const loadNotifications = () => {
    const userNotifications = currentMatchingService.getNotifications(currentUser.id);
    setNotifications(userNotifications);
    setUnreadCount(userNotifications.length);
  };

  const clearNotifications = () => {
    currentMatchingService.clearNotifications(currentUser.id);
    setNotifications([]);
    setUnreadCount(0);
  };

  const getMatchedUserName = (matchedUserId) => {
    const matchedUser = fakeUsers.find(user => user.id === matchedUserId);
    return matchedUser ? matchedUser.name : 'Unknown User';
  };

  const getMatchedUserAvatar = (matchedUserId) => {
    const matchedUser = fakeUsers.find(user => user.id === matchedUserId);
    return matchedUser ? matchedUser.avatar.emoji : '👤';
  };

  if (!isVisible) return null;

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
              onClick={onClose}
              className="text-white hover:text-pink-200 transition-colors"
            >
              <span className="text-xl">×</span>
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="text-4xl mb-2">🔔</div>
              <p>No notifications yet</p>
              <p className="text-sm">You'll see match notifications here</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {notifications.map((notification, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-xl">
                      {getMatchedUserAvatar(notification.matchedUserId)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">
                        New Match! 💕
                      </h4>
                      <p className="text-sm text-gray-600">
                        You matched with <span className="font-medium">{getMatchedUserName(notification.matchedUserId)}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {notification.matchScore}% compatibility • {new Date(notification.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <button
              onClick={clearNotifications}
              className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Clear All Notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
