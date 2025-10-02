import React from 'react';

const MatchModal = ({ match, onAccept, onReject, onClose, isVisible, currentUserId }) => {
  if (!isVisible || !match) return null;

  const { matchedUser, matchScore, matchReasons } = match;
  
  // Determine the current user's role in this match
  const isCurrentUser1 = match.user1Id === currentUserId;
  const currentUserDecision = isCurrentUser1 ? match.user1Decision : match.user2Decision;
  const otherUserDecision = isCurrentUser1 ? match.user2Decision : match.user1Decision;
  
  // Add safety checks for matchedUser
  if (!matchedUser) {
    console.error('MatchModal: matchedUser is undefined for match:', match);
    console.error('MatchModal: currentUserId:', currentUserId);
    console.error('MatchModal: match.user1Id:', match.user1Id);
    console.error('MatchModal: match.user2Id:', match.user2Id);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full mx-4 overflow-hidden shadow-2xl p-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Match Error</h2>
            <p className="text-gray-600 mb-4">Unable to load match details. Please try again.</p>
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full mx-4 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-6 text-center">
          <div className="text-6xl mb-2">💕</div>
          <h2 className="text-2xl font-bold">It's a Match!</h2>
          <p className="text-pink-100 mt-1">You have {matchScore}% compatibility</p>
        </div>

        {/* Match Info */}
        <div className="p-6">
          {/* Match Score */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              {matchScore}% Match
            </div>
          </div>

          {/* Matched User Profile */}
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl border-4 border-white shadow-lg">
              {matchedUser.avatar?.emoji || matchedUser.avatar_emoji || '👤'}
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">{matchedUser.name || 'Unknown User'}</h3>
            <p className="text-gray-600 mb-2">
              {matchedUser.age ? `${matchedUser.age} • ` : ''}{matchedUser.city || 'Unknown Location'}
            </p>
            <p className="text-sm text-gray-500 mb-4">{matchedUser.bio || 'No bio available'}</p>
            
            {/* Interests */}
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {matchedUser.interests && matchedUser.interests.length > 0 ? (
                <>
                  {matchedUser.interests.slice(0, 4).map((interest, index) => (
                    <span key={index} className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-medium">
                      {interest}
                    </span>
                  ))}
                  {matchedUser.interests.length > 4 && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      +{matchedUser.interests.length - 4} more
                    </span>
                  )}
                </>
              ) : (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  No interests listed
                </span>
              )}
            </div>
          </div>

          {/* Match Reasons */}
          {matchReasons && matchReasons.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Why you match:</h4>
              <div className="space-y-2">
                {matchReasons.map((reason, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-3"></span>
                    {reason}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Match Status */}
        <div className="px-6 mb-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Match Status:</h4>
            
            {/* Overall Match Status */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Match Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  match.status === 'mutual_match' ? 'bg-green-100 text-green-800' :
                  match.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  match.status === 'expired' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {match.status === 'mutual_match' ? '🎉 You both accepted!' :
                   match.status === 'rejected' ? '❌ Match was rejected' :
                   match.status === 'expired' ? '⏰ Match expired (24h)' :
                   currentUserDecision === 'pending' ? '⏳ Waiting for your decision' :
                   '⏳ Waiting for their decision'}
                </span>
              </div>
            </div>

            {/* Individual Decisions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Your decision:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  currentUserDecision === 'accepted' ? 'bg-green-100 text-green-800' :
                  currentUserDecision === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {currentUserDecision === 'pending' ? '⏳ Pending' : 
                   currentUserDecision === 'accepted' ? '✅ Accepted' : '❌ Rejected'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{matchedUser.name}'s decision:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  otherUserDecision === 'accepted' ? 'bg-green-100 text-green-800' :
                  otherUserDecision === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {otherUserDecision === 'pending' ? '⏳ Pending' : 
                   otherUserDecision === 'accepted' ? '✅ Accepted' : '❌ Rejected'}
                </span>
              </div>
            </div>

            {/* Expiration Warning */}
            {match.status === 'pending' && match.expiresAt && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center text-xs text-yellow-700">
                  <span className="mr-1">⏰</span>
                  <span>This match expires in {Math.ceil((new Date(match.expiresAt) - new Date()) / (1000 * 60 * 60))} hours</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-6">
          {match.status === 'mutual_match' ? (
            <div className="text-center">
              <div className="bg-green-100 text-green-800 py-3 px-4 rounded-xl font-semibold mb-2">
                🎉 Mutual Match! You both accepted each other!
              </div>
              <p className="text-sm text-gray-600">You can now start chatting!</p>
            </div>
          ) : match.status === 'rejected' ? (
            <div className="text-center">
              <div className="bg-red-100 text-red-800 py-3 px-4 rounded-xl font-semibold mb-2">
                ❌ Match Rejected
              </div>
              <p className="text-sm text-gray-600">Different decisions were made</p>
            </div>
          ) : match.status === 'expired' ? (
            <div className="text-center">
              <div className="bg-yellow-100 text-yellow-800 py-3 px-4 rounded-xl font-semibold mb-2">
                ⏰ Match Expired
              </div>
              <p className="text-sm text-gray-600">No decisions were made within 24 hours</p>
            </div>
          ) : currentUserDecision === 'pending' ? (
            <div className="flex space-x-3">
              <button
                onClick={onReject}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Pass
              </button>
              <button
                onClick={onAccept}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-600 transition-colors"
              >
                Accept
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="bg-gray-100 text-gray-600 py-3 px-4 rounded-xl font-semibold">
                {currentUserDecision === 'accepted' ? '✅ You accepted this match' : '❌ You rejected this match'}
              </div>
              {otherUserDecision === 'pending' && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-center text-sm text-blue-700">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                    <span>Waiting for {matchedUser.name} to decide...</span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={onClose}
            className="w-full mt-3 text-gray-500 text-sm hover:text-gray-700 transition-colors"
          >
            {match.status === 'pending' && currentUserDecision === 'pending' ? 'Maybe later' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchModal;
