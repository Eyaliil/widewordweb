import React, { useState, useEffect } from 'react';
import { messagingService } from '../services/messagingService';

const ProfileViewer = ({ 
  match, 
  currentUser, 
  onClose, 
  onStartChat 
}) => {
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const { matchedUser, matchScore, matchReasons, detailedInsights, breakdown } = match;

  // Load messages when chat is opened
  useEffect(() => {
    if (showChat && match.id) {
      loadMessages();
    }
  }, [showChat, match.id]);

  const loadMessages = async () => {
    setIsLoadingMessages(true);
    try {
      const messagesData = await messagingService.getMessages(match.id, currentUser.id);
      setMessages(messagesData);
      
      // Mark messages as read
      await messagingService.markMessagesAsRead(match.id, currentUser.id);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
      const result = await messagingService.sendMessage(
        match.id,
        currentUser.id,
        matchedUser.id,
        newMessage.trim()
      );

      if (result.success) {
        setNewMessage('');
        await loadMessages(); // Reload messages
      } else {
        console.error('Failed to send message:', result.error);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!match || !matchedUser) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 overflow-hidden shadow-2xl p-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Match Not Found</h2>
            <p className="text-gray-600 mb-4">Unable to load match details.</p>
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
      <div className="bg-white rounded-2xl max-w-4xl w-full mx-4 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl">
                {matchedUser.avatar?.emoji || matchedUser.avatar_emoji || '👤'}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{matchedUser.name}</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-pink-100">{matchScore}% Match</span>
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="text-sm text-pink-100">Mutual Match!</span>
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

        <div className="flex h-96">
          {/* Profile Info Sidebar */}
          <div className="w-1/3 bg-gray-50 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">About {matchedUser.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age:</span>
                    <span className="font-medium">{matchedUser.age}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{matchedUser.city}</span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {matchedUser.bio && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Bio</h4>
                  <p className="text-sm text-gray-600">{matchedUser.bio}</p>
                </div>
              )}

              {/* Interests */}
              {matchedUser.interests && matchedUser.interests.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    {matchedUser.interests.map((interest, index) => (
                      <span key={index} className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Compatibility Breakdown */}
              {breakdown && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Compatibility</h4>
                  <div className="space-y-2">
                    {Object.entries(breakdown).map(([category, score]) => {
                      const categoryNames = {
                        interests: 'Interests',
                        age: 'Age',
                        gender: 'Gender',
                        location: 'Location',
                        bio: 'Bio',
                        lifestyle: 'Lifestyle',
                        personality: 'Personality',
                        chemistry: 'Chemistry'
                      };
                      const maxScores = {
                        interests: 35,
                        age: 25,
                        gender: 20,
                        location: 15,
                        bio: 10,
                        lifestyle: 10,
                        personality: 5,
                        chemistry: 5
                      };
                      const percentage = Math.round((score / maxScores[category]) * 100);
                      return (
                        <div key={category} className="text-xs">
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-600">{categoryNames[category]}</span>
                            <span className="font-medium">{percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-gradient-to-r from-pink-400 to-purple-500 rounded-full h-1 transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Messages</h3>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="text-sm text-gray-600">Online</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <div className="text-4xl mb-2">💬</div>
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs">Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.sender_id === currentUser.id
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender_id === currentUser.id ? 'text-pink-100' : 'text-gray-500'
                      }`}>
                        {formatMessageTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  disabled={isSendingMessage}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || isSendingMessage}
                  className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isSendingMessage ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Send'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileViewer;
