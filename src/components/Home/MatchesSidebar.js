import React from 'react';

const MatchesSidebar = ({ 
  matchHistory, 
  currentUser, 
  databaseUsers, 
  populateMatchedUser, 
  setCurrentMatch, 
  setShowMatchModal,
  loadMatchHistory,
  loadNotifications 
}) => {
  return (
    <div className="w-80 flex-shrink-0 bg-white border-r border-gray-200">
      <div className="h-full p-6 overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span className="w-3 h-3 bg-pink-500 rounded-full mr-2"></span>
          All Matches ({matchHistory.length})
        </h3>
        
        {matchHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">💕</div>
            <p className="text-sm">No matches yet</p>
            <p className="text-xs text-gray-400 mt-2">Click "Match Me" to start!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {matchHistory
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map(match => {
                const matchedUserId = match.user1Id === currentUser.id ? match.user2Id : match.user1Id;
                const matchedUser = match.matchedUser || databaseUsers.find(u => u.id === matchedUserId);
                const matchedUserName = matchedUser ? matchedUser.name : `User ${matchedUserId.slice(0, 8)}...`;
                const matchedUserAvatar = matchedUser ? (matchedUser.avatar?.emoji || matchedUser.avatar_emoji || '👤') : '👤';
                
                const userDecision = match.user1Id === currentUser.id ? match.user1Decision : match.user2Decision;
                const otherDecision = match.user1Id === currentUser.id ? match.user2Decision : match.user1Decision;
                
                return (
                  <div 
                    key={match.id}
                    className={`p-3 rounded-lg transition-colors cursor-pointer ${
                      match.status === 'mutual_match' 
                        ? 'bg-green-50 border border-green-200 hover:bg-green-100' 
                        : match.status === 'rejected'
                          ? 'bg-red-50 border border-red-200 hover:bg-red-100'
                          : match.status === 'expired'
                            ? 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                            : 'bg-blue-50 border border-blue-200 hover:bg-blue-100'
                    }`}
                    onClick={() => {
                      setCurrentMatch(populateMatchedUser(match));
                      setShowMatchModal(true);
                    }}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-sm">
                        {matchedUserAvatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{matchedUserName}</p>
                        <p className="text-xs text-gray-500">{match.matchScore}% match</p>
                      </div>
                    </div>
                    
                    <div className="text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          match.status === 'mutual_match' 
                            ? 'bg-green-100 text-green-700' 
                            : match.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : match.status === 'expired'
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-blue-100 text-blue-700'
                        }`}>
                          {match.status === 'mutual_match' ? '✅ Matched' :
                           match.status === 'rejected' ? '❌ Rejected' :
                           match.status === 'expired' ? '⏰ Expired' :
                           '⏳ Pending'}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-gray-600">
                          You: {userDecision === 'pending' ? '⏳' : userDecision === 'accepted' ? '✅' : '❌'}
                        </p>
                        <p className="text-gray-600">
                          Them: {otherDecision === 'pending' ? '⏳' : otherDecision === 'accepted' ? '✅' : '❌'}
                        </p>
                      </div>
                      
                      <p className="text-gray-500 mt-2">
                        {new Date(match.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              loadMatchHistory();
              loadNotifications();
            }}
            className="w-full text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            🔄 Refresh Matches
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchesSidebar;
