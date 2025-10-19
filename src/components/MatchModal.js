import React from 'react';

const MatchModal = ({ match, onAccept, onReject, onClose, isVisible, currentUserId, currentUser }) => {
  
  if (!isVisible || !match) return null;

  // Extract match data - handle both old and new match object structures
  const matchedUser = match.matchedUser || match; // If no matchedUser property, the match object itself contains user data
  const matchScore = match.matchScore || match.score || 0;
  const matchReasons = match.matchReasons || match.reasons || [];
  const status = match.status || 'pending';
  
  // Determine the current user's role in this match
  const isCurrentUser1 = match.user1_id === currentUserId;
  const currentUserDecision = isCurrentUser1 ? match.user1_decision : match.user2_decision;
  const otherUserDecision = isCurrentUser1 ? match.user2_decision : match.user1_decision;
  
  // Check if this is a mutual match
  const isMutualMatch = status === 'mutual_match' || 
    (currentUserDecision === 'accepted' && otherUserDecision === 'accepted');
  
  // Get match quality indicator
  const getMatchQuality = (score) => {
    if (score >= 80) return { label: 'Excellent Match!', color: 'text-green-600', bgColor: 'bg-green-100', icon: '🔥' };
    if (score >= 70) return { label: 'Great Match!', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: '💎' };
    if (score >= 60) return { label: 'Good Match', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: '✨' };
    if (score >= 50) return { label: 'Decent Match', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: '👍' };
    return { label: 'Potential Match', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: '🤔' };
  };

  const matchQuality = getMatchQuality(matchScore);
  
  // Add safety checks for matchedUser
  if (!matchedUser || !matchedUser.name) {
    console.error('MatchModal: matchedUser is invalid for match:', match);
    console.error('MatchModal: matchedUser:', matchedUser);
    console.error('MatchModal: currentUserId:', currentUserId);
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
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl">
                {matchedUser.avatar?.emoji || matchedUser.avatar_emoji || '👤'}
              </div>
              <div>
                <h2 className="text-xl font-bold">{matchedUser.name}</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-pink-100">{matchScore}% Match</span>
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="text-sm text-pink-100">{matchQuality.label}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-pink-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Basic Info */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>{matchedUser.age} years old</span>
              <span>{matchedUser.city || 'Location not specified'}</span>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">
              {matchedUser.bio || 'No bio available yet.'}
            </p>
          </div>

          {/* Match Reasons */}
          {matchReasons && matchReasons.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Why you match</h3>
              <div className="space-y-2">
                {matchReasons.slice(0, 3).map((reason, index) => (
                  <div key={index} className="flex items-center text-gray-600 text-sm">
                    <span className="w-1 h-1 bg-pink-400 rounded-full mr-3"></span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isMutualMatch ? (
            <div className="text-center">
              <div className="bg-green-100 text-green-800 py-3 px-4 rounded-xl font-semibold mb-3">
                🎉 Mutual Match! You both accepted each other!
              </div>
              <button
                onClick={onClose}
                className="w-full bg-gray-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          ) : currentUserDecision === 'accepted' ? (
            <div className="text-center">
              <div className="bg-blue-100 text-blue-800 py-3 px-4 rounded-xl font-semibold mb-3">
                ✅ You accepted this match! Waiting for their response...
              </div>
              <button
                onClick={onClose}
                className="w-full bg-gray-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          ) : currentUserDecision === 'rejected' ? (
            <div className="text-center">
              <div className="bg-red-100 text-red-800 py-3 px-4 rounded-xl font-semibold mb-3">
                ❌ You rejected this match
              </div>
              <button
                onClick={onClose}
                className="w-full bg-gray-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="flex space-x-3">
              <button
                onClick={() => onReject(match.id)}
                className="flex-1 bg-red-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-red-600 transition-colors"
              >
                ❌ Pass
              </button>
              <button
                onClick={() => onAccept(match.id)}
                className="flex-1 bg-green-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-green-600 transition-colors"
              >
                ✅ Like
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchModal;