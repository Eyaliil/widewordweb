import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import MessagingPanel from './MessagingPanel';
import { messagingService } from '../../services/messagingService';
import Skeleton from '../ui/Skeleton';

const ChatPage = ({ onBack, initialMatchId }) => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Load match info and create conversation if needed
  useEffect(() => {
    if (initialMatchId && currentUser?.id && !selectedConversation && !isLoadingConversations) {
      const loadMatchAndCreateConversation = async () => {
        try {
          // Ensure initialMatchId is a string
          const matchId = typeof initialMatchId === 'object' ? initialMatchId.matchId || initialMatchId.id : initialMatchId;
          console.log('🔍 Loading match with ID:', matchId);
          
          // Get the match details to find the other user
          const { data: match, error: matchError } = await supabase
            .from('matches')
            .select('user1_id, user2_id, status')
            .eq('id', matchId)
            .single();

          if (matchError || !match) {
            console.error('Failed to load match:', matchError);
            return;
          }

          // Only proceed if it's a mutual match
          if (match.status !== 'mutual_match') {
            console.log('Match is not mutual yet');
            return;
          }

          // Determine the other user
          const otherUserId = match.user1_id === currentUser.id ? match.user2_id : match.user1_id;
          
          // Get the other user's profile
          const { data: otherUser } = await supabase
            .from('profiles')
            .select('user_id, name, avatar_emoji')
            .eq('user_id', otherUserId)
            .single();

          if (otherUser) {
            // Check if conversation already exists in the loaded conversations
            const existingConversation = conversations.find(c => c.matchId === matchId);
            
            if (existingConversation) {
              // Use existing conversation
              setSelectedConversation(existingConversation);
            } else {
              // Create a new conversation object for matches without existing messages
              const newConversation = {
                matchId: matchId,
                otherUser: otherUser,
                lastMessage: null,
                unreadCount: 0
              };
              setSelectedConversation(newConversation);
            }
          }
        } catch (error) {
          console.error('Failed to load match and create conversation:', error);
        }
      };

      loadMatchAndCreateConversation();
    }
  }, [initialMatchId, currentUser, conversations, selectedConversation, isLoadingConversations]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!currentUser?.id) return;
    
    setIsLoadingConversations(true);
    try {
      const conversationsData = await messagingService.getConversations(currentUser.id);
      setConversations(conversationsData);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [currentUser]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => 
    conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d`;
    }
  };

  const truncateMessage = (message, maxLength = 50) => {
    if (!message) return 'No messages yet';
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  return (
    <div className="h-screen bg-[#FBEEDA] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-[#F9E6CA] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-[#F9E6CA] rounded-full transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-[#8B6E58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-semibold text-[#40002B]">Messages</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-6 h-6 text-[#8B6E58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-6 h-6 text-[#8B6E58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List - Left Sidebar */}
        <div className="w-80 bg-white border-r border-[#F9E6CA] flex flex-col">
          {/* Search Bar */}
          <div className="p-4 border-b border-[#F9E6CA]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#E8C99E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7B002C] focus:ring-opacity-20 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-[#8B6E58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingConversations ? (
              <div className="p-4 space-y-3">
                {/* Skeleton conversation items */}
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-3 p-4">
                    <Skeleton variant="avatar" width={48} height={48} />
                    <div className="flex-1 space-y-2">
                      <Skeleton height={16} width="40%" />
                      <Skeleton height={14} width="70%" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-[#8B6E58] p-6">
                <div className="w-16 h-16 bg-[#F9E6CA] rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-[#40002B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#40002B] mb-2">No conversations yet</h3>
                <p className="text-sm text-center">
                  {searchQuery ? 'No conversations match your search.' : 'Start matching to begin conversations!'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.matchId}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-4 hover:bg-[#F9E6CA] cursor-pointer transition-colors ${
                      selectedConversation?.matchId === conversation.matchId ? 'bg-[#FBEEDA] border-r-2 border-[#7B002C]' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 bg-[#F9E6CA] rounded-full flex items-center justify-center">
                          <span className="text-lg">
                            {conversation.otherUser.avatar_emoji || '👤'}
                          </span>
                        </div>
                        {/* Online indicator */}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#2D8532] border-2 border-white rounded-full"></div>
                      </div>

                      {/* Conversation Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-[#40002B] text-sm truncate">
                            {conversation.otherUser.name}
                          </h3>
                          {conversation.lastMessage && (
                            <span className="text-xs text-[#8B6E58]">
                              {formatLastMessageTime(conversation.lastMessage.created_at)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-[#8B6E58] truncate">
                            {conversation.lastMessage ? (
                              <span className={conversation.lastMessage.sender_id === currentUser.id ? 'text-[#8B6E58]' : ''}>
                                {conversation.lastMessage.sender_id === currentUser.id ? 'You: ' : ''}
                                {truncateMessage(conversation.lastMessage.message)}
                              </span>
                            ) : (
                              'No messages yet'
                            )}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-[#7B002C] text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area - Right Side */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <MessagingPanel
              selectedMatch={{
                id: selectedConversation.matchId,
                matchedUser: {
                  id: selectedConversation.otherUser.user_id,
                  name: selectedConversation.otherUser.name,
                  avatar_emoji: selectedConversation.otherUser.avatar_emoji
                }
              }}
              currentUser={currentUser}
              onClose={() => setSelectedConversation(null)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500 p-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a conversation</h3>
                <p className="text-sm text-gray-500">Choose a conversation from the list to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
