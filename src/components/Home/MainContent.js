import React from 'react';
import { RiTimeLine, RiHeart3Fill, RiChat3Line } from 'react-icons/ri';
import SkeletonCard from '../ui/SkeletonCard';

const MainContent = ({ 
  matchHistory, 
  currentUser, 
  isMatching, 
  hasActiveSentMatch, 
  findMatches,
  databaseUsers,
  populateMatchedUser,
  onAcceptMatch,
  onRejectMatch,
  onNavigateToChat,
  setCurrentMatch,
  setShowMatchModal
}) => {
  return (
    <div className="flex-1 overflow-y-auto bg-[#FBEEDA]">
      <div className="max-w-5xl mx-auto p-6 md:p-10">
        {/* Welcome Message */}
        {matchHistory.length > 0 && (
          <div className="mb-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-[#40002B] mb-2 text-center">Your Matches</h2>
              <p className="text-[#8B6E58] text-sm text-center">Manage and connect with your matches</p>
            </div>

            {/* Find More Button - At the top */}
            <div className="text-center mb-6">
              <button
                onClick={findMatches}
                disabled={isMatching || hasActiveSentMatch}
                className={`px-10 py-4 rounded-xl text-lg font-medium transition-all duration-250 shadow-md hover:shadow-lg ${
                  isMatching || hasActiveSentMatch
                    ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#7B002C] to-[#40002B] text-white hover:-translate-y-0.5'
                }`}
              >
                {isMatching ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing compatibility...</span>
                  </span>
                ) : hasActiveSentMatch ? (
                  <span className="flex items-center justify-center gap-3">
                    <RiTimeLine className="text-xl" />
                    <span>Waiting for response...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    <RiHeart3Fill className="text-xl" />
                    <span>Find More Matches</span>
                  </span>
                )}
              </button>
            </div>

            {/* Matches Stack - Single Column with Reduced Width */}
            <div className="max-w-2xl mx-auto space-y-4">
              {matchHistory.map((match, index) => {
                const user1Id = match.user1_id || match.user1Id;
                const user2Id = match.user2_id || match.user2Id;
                const matchedUserId = user1Id === currentUser?.id ? user2Id : user1Id;
                const matchedUser = match.matchedUser || databaseUsers?.find(u => u.id === matchedUserId);
                const matchedUserName = matchedUser ? matchedUser.name : `User ${matchedUserId ? matchedUserId.slice(0, 8) : 'Unknown'}...`;
                
                // Determine which user the current user is
                const isCurrentUser1 = user1Id === currentUser?.id;
                const currentUserDecision = isCurrentUser1 ? match.user1Decision : match.user2Decision;
                const otherUserDecision = isCurrentUser1 ? match.user2Decision : match.user1Decision;
                
                const getStatusBadge = (decision) => {
                  if (!decision || decision === 'pending' || decision === null || decision === undefined) {
                    return { text: 'Pending', color: 'bg-[#F9E6CA] text-[#7B002C]' };
                  }
                  if (decision === 'accepted') return { text: 'Accepted', color: 'bg-green-100 text-green-700' };
                  if (decision === 'rejected') return { text: 'Rejected', color: 'bg-red-100 text-red-700' };
                  return { text: 'Pending', color: 'bg-[#F9E6CA] text-[#7B002C]' };
                };
                
                const currentStatus = getStatusBadge(currentUserDecision);
                const otherStatus = getStatusBadge(otherUserDecision);
                
                return (
                  <div 
                    key={match.id}
                    className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-250 stagger-item cursor-pointer border border-[#F9E6CA] hover:-translate-y-1"
                    onClick={() => {
                      // Open match modal with full details
                      if (setCurrentMatch && setShowMatchModal) {
                        setCurrentMatch(match);
                        setShowMatchModal(true);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-[#7B002C] to-[#40002B] rounded-full flex items-center justify-center text-xl flex-shrink-0">
                          {matchedUser?.avatar?.emoji || matchedUser?.avatar_emoji || '👤'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#40002B] text-lg truncate">{matchedUserName}</p>
                          <p className="text-sm text-[#8B6E58]">{match.matchScore || match.score || 0}% match</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {/* Show Accept/Reject buttons if current user hasn't decided */}
                        {currentUserDecision === 'pending' || !currentUserDecision ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onAcceptMatch) {
                                  onAcceptMatch(match.id);
                                }
                              }}
                              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-all duration-250 text-sm font-medium"
                            >
                              Accept
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onRejectMatch) {
                                  onRejectMatch(match.id);
                                }
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-all duration-250 text-sm font-medium"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Match Status - Both sides */}
                            <div className="flex flex-col gap-1 text-right">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-[#8B6E58]">You:</span>
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${currentStatus.color}`}>
                                  {currentStatus.text}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-[#8B6E58]">Them:</span>
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${otherStatus.color}`}>
                                  {otherStatus.text}
                                </span>
                              </div>
                            </div>

                            {match.status === 'mutual_match' && onNavigateToChat && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigateToChat(match.id);
                                }}
                                className="bg-gradient-to-r from-[#7B002C] to-[#40002B] text-white py-2 px-4 rounded-lg hover:shadow-md transition-all duration-250 text-sm font-medium flex items-center gap-2"
                              >
                                <RiChat3Line />
                                <span>Chat</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State - Match Suggestions */}
        {matchHistory.length === 0 && (
          <div className="max-w-3xl mx-auto py-12 md:py-20">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#7B002C] to-[#40002B] rounded-full mb-6">
                <RiHeart3Fill className="text-4xl text-white" />
              </div>
              <h3 className="text-3xl font-semibold text-[#40002B] mb-3">
                Ready to find your match?
              </h3>
              <p className="text-[#8B6E58] text-lg max-w-xl mx-auto mb-2">
                Our algorithm analyzes compatibility across interests, lifestyle, and personality
              </p>
            </div>
            
            {/* Match Me Button */}
            <div className="text-center">
              <button
                onClick={findMatches}
                disabled={isMatching || hasActiveSentMatch}
                className={`px-10 py-4 rounded-xl text-lg font-medium transition-all duration-250 shadow-md hover:shadow-lg ${
                  isMatching || hasActiveSentMatch
                    ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#7B002C] to-[#40002B] text-white hover:-translate-y-0.5'
                }`}
              >
                {isMatching ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing compatibility...</span>
                  </span>
                ) : hasActiveSentMatch ? (
                  <span className="flex items-center justify-center gap-3">
                    <RiTimeLine className="text-xl" />
                    <span>Waiting for response...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    <RiHeart3Fill className="text-xl" />
                    <span>Find My Match</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Loading State - Skeleton Cards */}
        {isMatching && matchHistory.length === 0 && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center gap-3">
                <div className="w-8 h-8 border-3 border-[#F9E6CA] border-t-[#7B002C] rounded-full animate-spin"></div>
                <p className="text-[#40002B] text-lg font-medium">Finding your perfect matches...</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainContent;
