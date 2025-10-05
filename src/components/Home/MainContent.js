import React from 'react';

const MainContent = ({ 
  matchHistory, 
  currentUser, 
  isOnline, 
  isMatching, 
  hasActiveSentMatch, 
  findMatches 
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      {/* Welcome Message */}
      {matchHistory.length > 0 && (
        <div className="mb-10">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">💕</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Welcome back, {currentUser?.name}!</h3>
            <p className="text-gray-600 mb-6">You have {matchHistory.length} matches in your history. Check the left sidebar to see them all!</p>
          </div>
        </div>
      )}

      {/* Match Me Button - Always in center */}
      <div className="text-center py-16">
        <div className="text-6xl mb-4">💕</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Ready to find your perfect match?
        </h3>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Click the button below to discover compatible users who are online right now!
        </p>
        
        <button
          onClick={findMatches}
          disabled={!isOnline || isMatching || hasActiveSentMatch}
          className={`px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
            !isOnline || isMatching || hasActiveSentMatch
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {isMatching ? (
            <span className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Finding matches...</span>
            </span>
          ) : hasActiveSentMatch ? (
            <span className="flex items-center space-x-2">
              <span>⏳</span>
              <span>Waiting for response...</span>
            </span>
          ) : (
            <span className="flex items-center space-x-2">
              <span>💕</span>
              <span>Match Me</span>
            </span>
          )}
        </button>
        
        {!isOnline && (
          <p className="text-sm text-gray-500 mt-4">
            You need to be online to find matches
          </p>
        )}
      </div>
    </div>
  );
};

export default MainContent;
