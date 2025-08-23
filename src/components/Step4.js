import React from 'react';
import { MOCK_USERS } from '../data/mockUsers';

const Step4 = ({ me, isOnline, setIsOnline, isMatching, setIsMatching, match, setMatch, setMessages, setShowChat }) => {
  // Go online and find match
  const goOnline = () => {
    setIsOnline(true);
    setIsMatching(true);
    
    // Simulate matching process
    setTimeout(() => {
      const myInterests = me.interests;
      const potentialMatches = MOCK_USERS.filter(user => 
        user.interests.some(interest => myInterests.includes(interest))
      );
      
      if (potentialMatches.length > 0) {
        const randomMatch = potentialMatches[Math.floor(Math.random() * potentialMatches.length)];
        setMatch(randomMatch);
        setMessages([
          { id: 1, sender: 'them', text: `Hey ${me.name}! I noticed we both like ${randomMatch.interests.find(i => myInterests.includes(i))}!`, timestamp: new Date() },
          { id: 2, sender: 'them', text: "How's your day going?", timestamp: new Date() }
        ]);
      }
      setIsMatching(false);
    }, Math.random() * 3000 + 5000); // 5-8 seconds
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">The Room</h1>
      
      {!isOnline ? (
        <div className="text-center mb-8">
          <button
            onClick={goOnline}
            className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg text-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-200 shadow-lg"
          >
            Go Online
          </button>
        </div>
      ) : isMatching ? (
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 px-6 py-3 bg-pink-100 text-pink-700 rounded-full">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-500"></div>
            <span className="font-medium">Matching...</span>
          </div>
        </div>
      ) : match ? (
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 px-6 py-3 bg-green-100 text-green-700 rounded-full">
            <span className="font-medium">Matched!</span>
          </div>
          <button
            onClick={() => setShowChat(true)}
            className="ml-4 px-6 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors duration-200"
          >
            Open Chat
          </button>
        </div>
      ) : null}
      
      {/* Grid of users */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {MOCK_USERS.slice(0, 20).map((user) => (
          <div
            key={user.id}
            className={`bg-white rounded-2xl shadow-lg p-4 border-2 transition-all duration-200 cursor-pointer ${
              match && match.id === user.id 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 hover:border-pink-300 hover:shadow-xl'
            }`}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto flex items-center justify-center text-2xl mb-3 border-2 border-white shadow-lg">
                {user.emojiAvatar}
              </div>
              <h3 className="font-medium text-gray-800 text-sm mb-1">{user.name}</h3>
              <p className="text-xs text-gray-500 mb-2">{user.age}</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {user.interests.slice(0, 2).map(interest => (
                  <span key={interest} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {interest}
                  </span>
                ))}
              </div>
              {match && match.id === user.id && (
                <div className="mt-2">
                  <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-medium">
                    Matched!
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 text-center text-gray-600">
        <p className="text-lg">Scroll to discover more people in The Room</p>
        <p className="text-sm mt-2">Tap on avatars to learn more about them</p>
      </div>
    </div>
  );
};

export default Step4; 