import React from 'react';

const Header = ({ 
  currentUser, 
  isOnline, 
  setIsOnline, 
  onLogout,
  setOnline,
  setOffline 
}) => {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - User info */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-lg">
              👤
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{currentUser?.name || 'User'}</h1>
              <p className="text-sm text-gray-500">
                {isOnline ? '🟢 Online' : '🔴 Offline'}
              </p>
            </div>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center space-x-4">
            {/* Online/Offline toggle buttons */}
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <button
                  onClick={setOffline}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
                >
                  <span>🔴</span>
                  <span>Go Offline</span>
                </button>
              ) : (
                <button
                  onClick={setOnline}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                >
                  <span>🟢</span>
                  <span>Go Online</span>
                </button>
              )}
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
