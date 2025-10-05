import React from 'react';

const OnlineUsersSidebar = ({ 
  onlineUsers, 
  currentUser, 
  loadOnlineStatus 
}) => {
  return (
    <div className="w-80 flex-shrink-0 bg-white border-l border-gray-200">
      <div className="h-full p-6 overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
          Online Users ({onlineUsers.length})
        </h3>
        
        {onlineUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">😴</div>
            <p className="text-sm">No users online</p>
          </div>
        ) : (
          <div className="space-y-3">
            {onlineUsers
              .sort((a, b) => {
                // Current user always appears first
                if (a.id === currentUser?.id) return -1;
                if (b.id === currentUser?.id) return 1;
                // Then sort others by last seen (most recent first)
                return new Date(b.lastSeen) - new Date(a.lastSeen);
              })
              .map(user => (
              <div 
                key={user.id}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  user.id === currentUser?.id 
                    ? 'bg-pink-50 border border-pink-200' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-lg">
                    👤
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${
                    user.id === currentUser?.id ? 'text-pink-700' : 'text-gray-800'
                  }`}>
                    {user.name}
                    {user.id === currentUser?.id && (
                      <span className="ml-2 text-xs text-pink-600 font-normal">(You)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last seen: {new Date(user.lastSeen).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={loadOnlineStatus}
            className="w-full text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnlineUsersSidebar;
