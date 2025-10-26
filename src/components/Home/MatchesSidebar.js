import React from 'react';
import { RiChat3Line, RiHeart3Fill, RiUserLine, RiRefreshLine } from 'react-icons/ri';
import Skeleton from '../ui/Skeleton';

const MatchesSidebar = ({ 
  matchHistory, 
  currentUser, 
  databaseUsers, 
  populateMatchedUser, 
  setCurrentMatch, 
  setShowMatchModal,
  loadMatchHistory,
  loadNotifications,
  onViewProfile,
  onSelectForMessaging,
  onAcceptMatch,
  onRejectMatch,
  onNavigateToChat
}) => {
  // Don't render if no current user
  if (!currentUser) {
    return (
      <div className="w-80 flex-shrink-0 bg-white border-r border-[#F9E6CA]">
        <div className="h-full p-6 overflow-y-auto">
          <div className="text-center py-8 text-[#8B6E58]">
            <RiUserLine className="text-4xl mx-auto mb-2 text-[#40002B]" />
            <p className="text-sm">Please log in to view matches</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 flex-shrink-0 bg-white border-r border-[#F9E6CA]">
      <div className="h-full p-6 overflow-y-auto">
        <h3 className="text-lg font-semibold text-[#40002B] mb-4 flex items-center">
          <span className="w-3 h-3 bg-gradient-to-br from-[#7B002C] to-[#40002B] rounded-full mr-2"></span>
          All Matches ({matchHistory.length})
        </h3>
        
        {matchHistory.length === 0 ? (
          <div className="text-center py-8 text-[#8B6E58]">
            <RiHeart3Fill className="text-4xl mx-auto mb-2 text-[#40002B]" />
            <p className="text-sm">No matches yet</p>
            <p className="text-xs text-[#8B6E58] mt-2">Click "Match Me" to start!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {matchHistory
              .filter(match => match && match.id) // Filter out null/undefined matches
              .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt))
              .map(match => {
                // Handle both old and new field names
                const user1Id = match.user1_id || match.user1Id;
                const user2Id = match.user2_id || match.user2Id;
                const user1Decision = match.user1_decision || match.user1Decision;
                const user2Decision = match.user2_decision || match.user2Decision;
                
                const matchedUserId = user1Id === currentUser?.id ? user2Id : user1Id;
                const matchedUser = match.matchedUser || databaseUsers.find(u => u.id === matchedUserId);
                const matchedUserName = matchedUser ? matchedUser.name : `User ${matchedUserId ? matchedUserId.slice(0, 8) : 'Unknown'}...`;
                const matchedUserAvatar = matchedUser ? (matchedUser.avatar?.emoji || matchedUser.avatar_emoji || '👤') : '👤';
                
                const userDecision = user1Id === currentUser?.id ? user1Decision : user2Decision;
                const otherDecision = user1Id === currentUser?.id ? user2Decision : user1Decision;
                
                return (
                  <div 
                    key={match.id}
                    className={`p-3 rounded-lg transition-all duration-250 stagger-item ${
                      match.status === 'mutual_match' 
                        ? 'bg-green-50 border border-green-200 hover:bg-green-100 cursor-pointer' 
                        : match.status === 'rejected'
                          ? 'bg-red-50 border border-red-200 hover:bg-red-100'
                          : match.status === 'expired'
                            ? 'bg-neutral-50 border border-neutral-200 hover:bg-neutral-100'
                            : 'bg-[#F9E6CA] border border-[#E8C99E] hover:bg-[#FDF6EB]'
                    }`}
                    onClick={() => {
                      if (match.status === 'mutual_match') {
                        onViewProfile(match);
                      }
                    }}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#7B002C] to-[#40002B] rounded-full flex items-center justify-center text-sm">
                        {matchedUserAvatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#40002B] truncate">{matchedUserName}</p>
                        <p className="text-xs text-[#8B6E58]">{match.matchScore || match.score || 0}% match</p>
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
                                ? 'bg-neutral-100 text-neutral-700'
                                : 'bg-[#F9E6CA] text-[#7B002C]'
                        }`}>
                          {match.status === 'mutual_match' ? 'Matched' :
                           match.status === 'rejected' ? 'Rejected' :
                           match.status === 'expired' ? 'Expired' :
                           'Pending'}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-[#8B6E58]">
                          You: {userDecision === 'pending' ? 'Pending' : userDecision === 'accepted' ? 'Accepted' : 'Passed'}
                        </p>
                        <p className="text-[#8B6E58]">
                          Them: {otherDecision === 'pending' ? 'Pending' : otherDecision === 'accepted' ? 'Accepted' : 'Passed'}
                        </p>
                      </div>
                      
                      <p className="text-[#8B6E58] mt-2">
                        {new Date(match.created_at || match.createdAt).toLocaleDateString()}
                      </p>
                      
                      {/* Action Buttons */}
                      <div className="mt-3">
                        {/* Like/Pass buttons for pending matches */}
                        {userDecision === 'pending' && match.status === 'pending' && (
                          <div className="flex space-x-2 mb-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRejectMatch(match.id);
                              }}
                              className="flex-1 bg-white border-2 border-red-300 text-red-700 text-xs py-2 px-3 rounded-lg hover:bg-red-50 transition-all duration-250 font-medium"
                            >
                              Pass
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAcceptMatch(match.id);
                              }}
                              className="flex-1 bg-gradient-to-r from-[#7B002C] to-[#40002B] text-white text-xs py-2 px-3 rounded-lg hover:shadow-md transition-all duration-250 font-medium"
                            >
                              Accept
                            </button>
                          </div>
                        )}
                        
                        {/* Profile and Chat buttons */}
                        <div className="flex space-x-2">
                          {/* Show chat button for mutual matches */}
                          {match.status === 'mutual_match' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onNavigateToChat) {
                                  onNavigateToChat(match.id);
                                }
                              }}
                              className="flex-1 bg-gradient-to-r from-[#7B002C] to-[#40002B] text-white text-xs py-2 px-3 rounded-lg hover:shadow-md transition-all duration-250 font-medium flex items-center justify-center space-x-1"
                            >
                              <RiChat3Line className="text-sm" />
                              <span>Chat</span>
                            </button>
                          )}
                          
                          {/* Only show View Profile button for non-mutual matches */}
                          {match.status !== 'mutual_match' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewProfile(match);
                              }}
                              className="flex-1 bg-white border-2 border-[#40002B] text-[#40002B] text-xs py-2 px-3 rounded-lg hover:bg-[#F9E6CA] transition-all duration-250 font-medium flex items-center justify-center gap-1"
                            >
                              <RiUserLine className="text-sm" />
                              <span>View</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-[#F9E6CA]">
          <button
            onClick={() => {
              loadMatchHistory();
              loadNotifications();
            }}
            className="w-full text-sm text-[#8B6E58] hover:text-[#40002B] transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <RiRefreshLine className="text-base" />
            <span>Refresh Matches</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchesSidebar;
