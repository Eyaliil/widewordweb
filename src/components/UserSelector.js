import React from 'react';
import { useAuth } from '../context/AuthContext';

const UserSelector = () => {
  const { currentUser, setCurrentUser, databaseUsers, loading, isUsingDatabaseUsers, loadDatabaseUsers } = useAuth();

  // Don't render if still loading or no users available
  if (loading) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-xs">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Choose Your Profile</h3>
        <div className="text-sm text-gray-500">Loading users...</div>
      </div>
    );
  }

  if (!databaseUsers || databaseUsers.length === 0) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-xs">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Choose Your Profile</h3>
        <div className="text-sm text-gray-500 mb-2">No users available</div>
        <div className="text-xs text-gray-400">
          <div>🔧 Database setup needed</div>
          <div className="mt-1">See DATABASE_SETUP_FIX.md</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">Switch Profile</h3>
        <button
          onClick={loadDatabaseUsers}
          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
          title="Refresh users from database"
        >
          🔄
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-3">Click any profile to test as that user</p>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {databaseUsers.map((user) => (
          <button
            key={user.id}
            onClick={() => setCurrentUser(user)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              currentUser?.id === user.id
                ? 'bg-pink-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">{user.avatar?.emoji || '👤'}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{user.name}</div>
                <div className="text-xs opacity-75 truncate">{user.age} • {user.city}</div>
                <div className="text-xs opacity-60 truncate">{user.gender}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Active: <span className="font-medium">{currentUser?.name || 'None'}</span>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Database users • Persistent • No auth required
        </div>
      </div>
    </div>
  );
};

export default UserSelector;
