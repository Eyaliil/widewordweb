import React, { useState, useEffect, useRef } from 'react';
import { messagingService } from '../services/messagingService';

const MessagingPanel = ({ 
  selectedMatch, 
  currentUser, 
  onClose 
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const messagesEndRef = useRef(null);

  // Load messages when a match is selected
  useEffect(() => {
    if (selectedMatch && selectedMatch.id) {
      loadMessages();
      setupRealTimeSubscription();
    }

    // Cleanup subscription when component unmounts or match changes
    return () => {
      if (subscription) {
        messagingService.unsubscribeFromMessages(subscription);
        setSubscription(null);
      }
    };
  }, [selectedMatch]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    setIsLoadingMessages(true);
    try {
      const messagesData = await messagingService.getMessages(selectedMatch.id, currentUser.id);
      setMessages(messagesData);
      
      // Mark messages as read
      await messagingService.markMessagesAsRead(selectedMatch.id, currentUser.id);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const setupRealTimeSubscription = () => {
    if (subscription) {
      messagingService.unsubscribeFromMessages(subscription);
    }

    const newSubscription = messagingService.subscribeToMessages(
      selectedMatch.id,
      currentUser.id,
      (newMessage, eventType = 'insert') => {
        if (eventType === 'insert') {
          // Check if this message already exists (avoid duplicates)
          setMessages(prevMessages => {
            const messageExists = prevMessages.some(msg => msg.id === newMessage.id);
            if (messageExists) {
              console.log('📨 Message already exists, skipping duplicate');
              return prevMessages;
            }
            
            console.log('📨 Adding new message to UI:', newMessage);
            return [...prevMessages, newMessage];
          });
          
          // Mark as read if it's for the current user
          if (newMessage.receiver_id === currentUser.id) {
            messagingService.markMessagesAsRead(selectedMatch.id, currentUser.id);
          }
        } else if (eventType === 'update') {
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === newMessage.id ? newMessage : msg
            )
          );
        }
      }
    );

    setSubscription(newSubscription);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isSendingMessage) return;

    const messageText = newMessage.trim();
    const matchedUser = selectedMatch.matchedUser || selectedMatch;
    
    setIsSendingMessage(true);
    
    // Optimistically add the message to the UI immediately
    const optimisticMessage = {
      id: `temp-${Date.now()}`, // Temporary ID
      match_id: selectedMatch.id,
      sender_id: currentUser.id,
      receiver_id: matchedUser.id,
      message: messageText,
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setMessages(prevMessages => [...prevMessages, optimisticMessage]);
    setNewMessage('');
    
    try {
      const result = await messagingService.sendMessage(
        selectedMatch.id,
        currentUser.id,
        matchedUser.id,
        messageText
      );

      if (result.success) {
        // Replace the optimistic message with the real one
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === optimisticMessage.id ? result.message : msg
          )
        );
        
        console.log('✅ Message sent successfully');
      } else {
        console.error('Failed to send message:', result.error);
        
        // Remove the optimistic message on failure
        setMessages(prevMessages => 
          prevMessages.filter(msg => msg.id !== optimisticMessage.id)
        );
        
        // Restore the message text
        setNewMessage(messageText);
        
        // Show error to user
        window.showToast?.(`Failed to send message: ${result.error}`, 'error', 4000);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Remove the optimistic message on failure
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg.id !== optimisticMessage.id)
      );
      
      // Restore the message text
      setNewMessage(messageText);
      
      window.showToast?.('Failed to send message. Please try again.', 'error', 4000);
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

  if (!selectedMatch) {
    return (
      <div className="w-80 flex-shrink-0 bg-white border-l border-gray-200">
        <div className="h-full flex items-center justify-center">
          <div className="text-center text-gray-500 p-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Your Messages</h3>
            <p className="text-sm text-gray-500">Select a match to start chatting</p>
          </div>
        </div>
      </div>
    );
  }

  const matchedUser = selectedMatch.matchedUser || selectedMatch;

  return (
    <div className="w-80 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Chat Header - Facebook Style */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              {matchedUser.avatar?.emoji || matchedUser.avatar_emoji || '👤'}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{matchedUser.name}</h3>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-xs text-gray-500">Active now</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 00-15 0v5h5l-5 5-5-5h5v-5a7.5 7.5 0 0115 0v5z" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area - Facebook Style */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {isLoadingMessages ? (
          <div className="flex justify-center items-center h-full">
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="text-sm">Loading messages...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No messages yet</h3>
            <p className="text-sm text-center">Start the conversation with {matchedUser.name}!</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((message, index) => {
              const isCurrentUser = message.sender_id === currentUser.id;
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const showAvatar = !prevMessage || prevMessage.sender_id !== message.sender_id;
              
              return (
                <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-xs ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
                    {!isCurrentUser && showAvatar && (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">{matchedUser.avatar?.emoji || matchedUser.avatar_emoji || '👤'}</span>
                      </div>
                    )}
                    {!isCurrentUser && !showAvatar && (
                      <div className="w-8 h-8 flex-shrink-0"></div>
                    )}
                    
                    <div className={`px-3 py-2 rounded-2xl ${
                      isCurrentUser 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}>
                      <p className="text-sm leading-relaxed">{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatMessageTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input - Facebook Style */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${matchedUser.name}...`}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              rows="1"
              style={{ minHeight: '44px', maxHeight: '120px' }}
              disabled={isSendingMessage}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSendingMessage}
            className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {isSendingMessage ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessagingPanel;
