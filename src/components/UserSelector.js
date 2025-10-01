import React from 'react';
import { useAuth } from '../context/AuthContext';

const UserSelector = () => {
  const { currentUser, setCurrentUser, fakeUsers } = useAuth();

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-xs">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Test User Selector</h3>
      <div className="space-y-2">
        {fakeUsers.map((user) => (
          <button
            key={user.id}
            onClick={() => setCurrentUser(user)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              currentUser.id === user.id
                ? 'bg-pink-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">{user.avatar.emoji}</span>
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-xs opacity-75">{user.age} • {user.city}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Current: <span className="font-medium">{currentUser.name}</span>
        </div>
      </div>
    </div>
  );
};

export default UserSelector;
