import React, { useState, useEffect, useRef } from 'react';
import { RiMessage3Line, RiCloseLine, RiSendPlaneFill, RiUserLine, RiCheckFill } from 'react-icons/ri';
import { messagingService } from '../../services/messagingService';

const MessagingPanel = ({ 
  selectedMatch, 
  currentUser, 
  onClose,
  onMessageSent
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
        
        // Notify parent to reload conversations list
        if (onMessageSent) {
          onMessageSent();
        }
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
      <div className="w-80 flex-shrink-0 bg-white border-l border-[#F9E6CA]">
        <div className="h-full flex items-center justify-center">
          <div className="text-center text-[#8B6E58] p-6">
            <div className="w-16 h-16 bg-[#F9E6CA] rounded-full flex items-center justify-center mx-auto mb-4">
              <RiMessage3Line className="w-8 h-8 text-[#40002B]" />
            </div>
            <h3 className="text-lg font-semibold text-[#40002B] mb-2">Your Messages</h3>
            <p className="text-sm text-[#8B6E58]">Select a match to start chatting</p>
          </div>
        </div>
      </div>
    );
  }

  const matchedUser = selectedMatch.matchedUser || selectedMatch;

  // Get avatar display
  const getAvatarDisplay = () => {
    if (matchedUser.avatar?.emoji) return <span className="text-lg">{matchedUser.avatar.emoji}</span>;
    if (matchedUser.avatar?.initials) return <span className="text-sm font-medium text-[#40002B]">{matchedUser.avatar.initials}</span>;
    if (matchedUser.avatar?.image) return <img src={matchedUser.avatar.image} alt={matchedUser.name} className="w-full h-full object-cover" />;
    if (matchedUser.avatar_emoji) return <span className="text-lg">{matchedUser.avatar_emoji}</span>;
    return <RiUserLine className="text-lg text-[#40002B]" />;
  };

  return (
    <div className="w-80 flex-shrink-0 bg-white border-l border-[#F9E6CA] flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-white border-b border-[#F9E6CA] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#F9E6CA] rounded-full flex items-center justify-center overflow-hidden">
              {getAvatarDisplay()}
            </div>
            <div>
              <h3 className="font-semibold text-[#40002B] text-sm">{matchedUser.name}</h3>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-[#2D8532] rounded-full"></div>
                <span className="text-xs text-[#8B6E58]">Active now</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F9E6CA] rounded-lg transition-colors duration-200"
          >
            <RiCloseLine className="w-5 h-5 text-[#8B6E58]" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-[#FBEEDA]">
        {isLoadingMessages ? (
          <div className="flex justify-center items-center h-full">
            <div className="flex items-center space-x-2 text-[#8B6E58]">
              <div className="w-4 h-4 border-2 border-[#F9E6CA] border-t-[#7B002C] rounded-full animate-spin"></div>
              <span className="text-sm">Loading messages...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#8B6E58] p-6">
            <div className="w-16 h-16 bg-[#F9E6CA] rounded-full flex items-center justify-center mb-4">
              <RiMessage3Line className="w-8 h-8 text-[#40002B]" />
            </div>
            <h3 className="text-lg font-semibold text-[#40002B] mb-2">No messages yet</h3>
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
                      <div className="w-8 h-8 bg-[#F9E6CA] rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {matchedUser.avatar?.emoji ? (
                          <span className="text-sm">{matchedUser.avatar.emoji}</span>
                        ) : matchedUser.avatar?.initials ? (
                          <span className="text-xs font-medium text-[#40002B]">{matchedUser.avatar.initials}</span>
                        ) : matchedUser.avatar?.image ? (
                          <img src={matchedUser.avatar.image} alt={matchedUser.name} className="w-full h-full object-cover" />
                        ) : matchedUser.avatar_emoji ? (
                          <span className="text-sm">{matchedUser.avatar_emoji}</span>
                        ) : (
                          <RiUserLine className="text-sm text-[#40002B]" />
                        )}
                      </div>
                    )}
                    {!isCurrentUser && !showAvatar && (
                      <div className="w-8 h-8 flex-shrink-0"></div>
                    )}
                    
                    <div className={`px-4 py-2.5 rounded-2xl ${
                      isCurrentUser 
                        ? 'bg-gradient-to-r from-[#7B002C] to-[#40002B] text-white shadow-md' 
                        : 'bg-white text-[#40002B] border border-[#F9E6CA]'
                    }`}>
                      <p className="text-sm leading-relaxed">{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        isCurrentUser ? 'text-white/70' : 'text-[#8B6E58]'
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

      {/* Message Input */}
      <div className="bg-white border-t border-[#F9E6CA] p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${matchedUser.name}...`}
              className="w-full px-4 py-3 border border-[#E8C99E] rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[#7B002C] focus:ring-opacity-20 focus:border-[#7B002C] text-sm transition-all duration-250"
              rows="1"
              style={{ minHeight: '44px', maxHeight: '120px' }}
              disabled={isSendingMessage}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSendingMessage}
            className={`p-3 rounded-full transition-all duration-250 flex-shrink-0 shadow-md ${
              isSendingMessage || !newMessage.trim()
                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#7B002C] to-[#40002B] text-white hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
            {isSendingMessage ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <RiSendPlaneFill className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessagingPanel;
