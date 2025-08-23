import React from 'react';
import { MOCK_USERS } from '../data/mockUsers';

const Step4 = ({ me, avatar, isProfileComplete, isOnline, setIsOnline, isMatching, setIsMatching, match, setMatch, setMessages, setShowChat, onEditProfile }) => {
  // Go online and find match
  const goOnline = () => {
    if (!isProfileComplete) {
      alert('Please complete your profile first!');
      return;
    }
    
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
      
      {/* Profile Status */}
      {!isProfileComplete && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8 text-center">
          <div className="text-yellow-600 mb-4">
            <div className="text-4xl mb-2">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Profile Incomplete</h2>
            <p className="text-yellow-700">You need to complete your profile before you can match with others.</p>
          </div>
          <button
            onClick={onEditProfile}
            className="px-6 py-3 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-colors duration-200"
          >
            Complete Profile
          </button>
        </div>
      )}

      {/* Profile Summary */}
      {isProfileComplete && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Your Profile</h2>
          <div className="flex items-center justify-center space-x-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full mx-auto flex items-center justify-center text-3xl border-2 border-white shadow-lg mb-3">
                {avatar.type === 'image' && avatar.image ? (
                  <img src={avatar.image} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  avatar.initials || avatar.emoji
                )}
              </div>
              <p className="font-medium text-gray-800">{me.name}</p>
              <p className="text-sm text-gray-500">{me.age} • {me.pronouns}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">{me.bio}</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {me.interests.slice(0, 3).map(interest => (
                  <span key={interest} className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full">
                    {interest}
                  </span>
                ))}
                {me.interests.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{me.interests.length - 3} more
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onEditProfile}
              className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
              Edit Profile
            </button>
          </div>
        </div>
      )}
      
      {/* Online Status */}
      {!isOnline ? (
        <div className="text-center mb-8">
          <button
            onClick={goOnline}
            disabled={!isProfileComplete}
            className={`px-8 py-4 font-semibold rounded-lg text-lg transition-all duration-200 shadow-lg ${
              isProfileComplete
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isProfileComplete ? 'Go Online' : 'Complete Profile to Go Online'}
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
        <p className="text-sm mt-2">Complete your profile to start matching!</p>
      </div>
    </div>
  );
};

export default Step4; 