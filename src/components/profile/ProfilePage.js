import React from 'react';

const ProfilePage = ({ 
  match, 
  currentUser, 
  onBack
}) => {

  // Extract match data
  const matchedUser = match.matchedUser || match;
  const matchScore = match.matchScore || match.score || 0;
  const matchReasons = match.matchReasons || match.reasons || [];
  const detailedInsights = match.detailedInsights || match.detailed_insights || {};
  const breakdown = match.breakdown || match.compatibility_breakdown || {};
  const status = match.status || 'pending';

  // Check if this is a mutual match
  const isMutualMatch = status === 'mutual_match' || 
    (match.user1_decision === 'accepted' && match.user2_decision === 'accepted');

  const getMatchQuality = (score) => {
    if (score >= 80) return { label: 'Excellent Match!', color: 'text-green-600', bgColor: 'bg-green-100', icon: '🔥' };
    if (score >= 70) return { label: 'Great Match!', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: '💎' };
    if (score >= 60) return { label: 'Good Match', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: '✨' };
    if (score >= 50) return { label: 'Decent Match', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: '👍' };
    return { label: 'Potential Match', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: '🤔' };
  };

  const matchQuality = getMatchQuality(matchScore);

  if (!match || !matchedUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-sm w-full mx-4 overflow-hidden shadow-lg p-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Profile Not Found</h2>
            <p className="text-gray-600 mb-4">Unable to load profile details.</p>
            <button
              onClick={onBack}
              className="w-full bg-gray-500 text-white py-3 rounded-xl hover:bg-gray-600 transition-colors font-semibold"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span className="text-sm text-gray-600">Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Main Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
          {/* Profile Header */}
          <div className="relative">
            <div className="bg-gradient-to-br from-pink-400 via-red-400 to-orange-400 h-64 flex items-center justify-center">
              <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-6xl backdrop-blur-sm">
                {matchedUser.avatar?.emoji || matchedUser.avatar_emoji || '👤'}
              </div>
            </div>
            
            {/* Match Score Badge */}
            <div className="absolute top-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-full px-3 py-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{matchQuality.icon}</span>
                <span className="font-bold text-gray-800">{matchScore}%</span>
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{matchedUser.name}</h1>
                <div className="flex items-center space-x-2 text-gray-600">
                  <span>{matchedUser.age}</span>
                  <span>•</span>
                  <span>{matchedUser.city || 'Location not specified'}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">{matchedUser.gender || 'Not specified'}</div>
                {matchedUser.pronouns && (
                  <div className="text-sm text-gray-500">{matchedUser.pronouns}</div>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed">
                {matchedUser.bio || 'No bio available yet.'}
              </p>
            </div>

            {/* Interests */}
            {matchedUser.interests && matchedUser.interests.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {matchedUser.interests.slice(0, 6).map((interest, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {interest}
                    </span>
                  ))}
                  {matchedUser.interests.length > 6 && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm">
                      +{matchedUser.interests.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Match Reasons - Simplified */}
            {matchReasons && matchReasons.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Why you match</h3>
                <div className="space-y-2">
                  {matchReasons.slice(0, 3).map((reason, index) => (
                    <div key={index} className="flex items-center text-gray-600 text-sm">
                      <span className="w-1 h-1 bg-pink-400 rounded-full mr-3"></span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compatibility Card */}
        {breakdown && Object.keys(breakdown).length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Compatibility</h3>
              <div className="space-y-4">
                {Object.entries(breakdown).slice(0, 4).map(([category, score]) => {
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
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{categoryNames[category]}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-pink-400 to-red-400 rounded-full h-2 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-800 w-8">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Match Status Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Match Status</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isMutualMatch ? 'bg-green-100 text-green-800' :
                status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {isMutualMatch ? 'Mutual Match' : 
                 status === 'pending' ? 'Pending' : 
                 status}
              </span>
            </div>
            
            <div className="space-y-3">
              {match.created_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Matched</span>
                  <span className="text-gray-800">
                    {new Date(match.created_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Profile Complete</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  matchedUser.isProfileComplete ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {matchedUser.isProfileComplete ? 'Complete' : 'Incomplete'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;