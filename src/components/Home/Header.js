import React from 'react';

const Header = ({ 
  currentUser, 
  onLogout,
  onEditProfile,
  onNavigateToChat
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
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{currentUser?.name || 'User'}</h1>
              </div>
              <button
                onClick={onEditProfile}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors flex items-center space-x-1 text-sm"
              >
                <span>✏️</span>
                <span>Edit</span>
              </button>
            </div>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center space-x-4">
            {/* Chat button */}
            <button
              onClick={onNavigateToChat}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <span>💬</span>
              <span>Messages</span>
            </button>
            
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
