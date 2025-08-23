import React, { useState } from 'react';

const ChatModal = ({ match, messages, setMessages, onClose, onLeaveChat }) => {
  const [newMessage, setNewMessage] = useState('');

  // Send message
  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: messages.length + 1,
        sender: 'me',
        text: newMessage.trim(),
        timestamp: new Date()
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  // Handle Enter key in chat
  const handleChatKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-96 flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center space-x-3 p-4 border-b border-gray-200">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-lg">
            {match.emojiAvatar}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">{match.name}</h3>
            <span className="text-sm text-green-600 font-medium">Matched!</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl ${
                  message.sender === 'me'
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === 'me' ? 'text-pink-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleChatKeyPress}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="px-4 py-2 bg-pink-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-600 transition-colors duration-200"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal; 