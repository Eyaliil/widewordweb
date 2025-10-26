import React from 'react';
import { RiCloseLine, RiCheckLine, RiCloseCircleLine, RiHeartFill, RiHeart3Fill, RiSparklingLine, RiUserLine, RiMapPinLine, RiNumbersLine } from 'react-icons/ri';

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
    if (score >= 80) return { label: 'Excellent Match', color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
    if (score >= 70) return { label: 'Great Match', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
    if (score >= 60) return { label: 'Good Match', color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' };
    if (score >= 50) return { label: 'Decent Match', color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
    return { label: 'Potential Match', color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' };
  };

  const matchQuality = getMatchQuality(matchScore);
  
  // Add safety checks for matchedUser
  if (!matchedUser || !matchedUser.name) {
    console.error('MatchModal: matchedUser is invalid for match:', match);
    console.error('MatchModal: matchedUser:', matchedUser);
    console.error('MatchModal: currentUserId:', currentUserId);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl max-w-md w-full mx-4 overflow-hidden shadow-2xl p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-[#40002B] mb-4">Match Error</h2>
            <p className="text-[#8B6E58] mb-4">Unable to load match details. Please try again.</p>
            <button
              onClick={onClose}
              className="bg-[#7B002C] text-white px-4 py-2 rounded-lg hover:bg-[#40002B] transition-colors duration-250"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full mx-4 overflow-hidden shadow-2xl modal-enter">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#7B002C] to-[#40002B] text-white p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4 flex-1">
              {/* Avatar */}
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center overflow-hidden backdrop-blur-sm border-2 border-white border-opacity-30">
                {matchedUser.avatar?.emoji ? (
                  <span className="text-3xl">{matchedUser.avatar.emoji}</span>
                ) : matchedUser.avatar?.initials ? (
                  <span className="text-xl font-medium text-[#40002B]">{matchedUser.avatar.initials}</span>
                ) : matchedUser.avatar?.image ? (
                  <img src={matchedUser.avatar.image} alt={matchedUser.name} className="w-full h-full object-cover" />
                ) : (
                  <RiUserLine className="text-3xl" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold mb-1">{matchedUser.name}</h2>
                <div className="flex items-center space-x-3 text-sm">
                  <span className="flex items-center gap-1.5 bg-white bg-opacity-20 rounded-full px-3 py-1 backdrop-blur-sm">
                    <RiHeartFill className="text-sm" />
                    <span className="font-medium">{matchScore}% Match</span>
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="text-white hover:text-white/80 transition-colors duration-200 p-2 hover:bg-white/10 rounded-lg"
              title="Close"
            >
              <RiCloseLine className="text-2xl" />
            </button>
          </div>

          {/* Match Quality Badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${matchQuality.bgColor} ${matchQuality.borderColor} border ${matchQuality.color}`}>
            <RiSparklingLine className="text-base" />
            <span>{matchQuality.label}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Basic Info */}
          <div className="mb-6">
            <div className="flex items-center gap-4 text-sm text-[#8B6E58] mb-4">
              <div className="flex items-center gap-1.5">
                <RiNumbersLine className="text-base" />
                <span>{matchedUser.age} years old</span>
              </div>
              {matchedUser.city && (
                <div className="flex items-center gap-1.5">
                  <RiMapPinLine className="text-base" />
                  <span>{matchedUser.city}</span>
                </div>
              )}
            </div>
            <div className="bg-[#FBEEDA] rounded-xl p-4">
              <p className="text-[#40002B] text-sm leading-relaxed">
                {matchedUser.bio || 'No bio available yet.'}
              </p>
            </div>
          </div>

          {/* Match Reasons / Shared Interests */}
          {matchReasons && matchReasons.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[#40002B] mb-3 flex items-center gap-2">
                <RiSparklingLine />
                <span>Why you match</span>
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {matchReasons.slice(0, 3).map((reason, index) => (
                  <div key={index} className="flex items-center text-[#7B002C] text-sm bg-[#F9E6CA] px-3 py-2 rounded-lg">
                    <span className="w-1.5 h-1.5 bg-[#7B002C] rounded-full mr-3 flex-shrink-0"></span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isMutualMatch ? (
            <div className="space-y-3">
              <div className="bg-green-50 border-2 border-green-200 text-green-800 py-3 px-4 rounded-xl text-center font-medium">
                <div className="flex items-center justify-center gap-2">
                  <RiHeart3Fill className="text-xl" />
                  <span>Mutual Match! You both accepted each other!</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full bg-[#7B002C] text-white py-3 px-4 rounded-xl font-medium hover:bg-[#40002B] transition-colors duration-250"
              >
                Close
              </button>
            </div>
          ) : currentUserDecision === 'accepted' ? (
            <div className="space-y-3">
              <div className="bg-blue-50 border-2 border-blue-200 text-blue-800 py-3 px-4 rounded-xl text-center font-medium">
                <div className="flex items-center justify-center gap-2">
                  <RiCheckLine className="text-xl" />
                  <span>Waiting for their response...</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full bg-[#7B002C] text-white py-3 px-4 rounded-xl font-medium hover:bg-[#40002B] transition-colors duration-250"
              >
                Close
              </button>
            </div>
          ) : currentUserDecision === 'rejected' ? (
            <div className="space-y-3">
              <div className="bg-red-50 border-2 border-red-200 text-red-800 py-3 px-4 rounded-xl text-center font-medium">
                <div className="flex items-center justify-center gap-2">
                  <RiCloseCircleLine className="text-xl" />
                  <span>You rejected this match</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full bg-[#7B002C] text-white py-3 px-4 rounded-xl font-medium hover:bg-[#40002B] transition-colors duration-250"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => onReject(match.id)}
                className="flex-1 bg-white border-2 border-red-300 text-red-700 py-3 px-4 rounded-xl font-medium hover:bg-red-50 transition-colors duration-250 flex items-center justify-center gap-2"
              >
                <RiCloseCircleLine className="text-xl" />
                <span>Pass</span>
              </button>
              <button
                onClick={() => onAccept(match.id)}
                className="flex-1 bg-gradient-to-r from-[#7B002C] to-[#40002B] text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all duration-250 flex items-center justify-center gap-2"
              >
                <RiHeartFill className="text-xl" />
                <span>Accept</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchModal;