import React from 'react';

const MainContent = ({ 
  matchHistory, 
  currentUser, 
  isMatching, 
  hasActiveSentMatch, 
  findMatches
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      {/* Welcome Message */}
      {matchHistory.length > 0 && (
        <div className="mb-10">

        </div>
      )}


      {/* Match Me Button - Always in center */}
      <div className="text-center py-16">
        <div className="text-6xl mb-4">💕</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Ready to find your perfect match?
        </h3>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Our advanced algorithm analyzes compatibility across interests, lifestyle, personality, and more to find you the best possible matches!
        </p>
        
        <div className="mb-6">
          <div className="flex justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <span className="mr-1">🎯</span>
              <span>Smart Matching</span>
            </div>
            <div className="flex items-center">
              <span className="mr-1">📊</span>
              <span>Detailed Analysis</span>
            </div>
            <div className="flex items-center">
              <span className="mr-1">💎</span>
              <span>Quality Matches</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={findMatches}
          disabled={isMatching || hasActiveSentMatch}
          className={`px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
            isMatching || hasActiveSentMatch
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {isMatching ? (
            <span className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Analyzing compatibility...</span>
            </span>
          ) : hasActiveSentMatch ? (
            <span className="flex items-center space-x-2">
              <span>⏳</span>
              <span>Waiting for response...</span>
            </span>
          ) : (
            <span className="flex items-center space-x-2">
              <span>💕</span>
              <span>Find My Match</span>
            </span>
          )}
        </button>
        
        
      </div>
    </div>
  );
};

export default MainContent;
