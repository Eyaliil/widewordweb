import React from 'react';

const MatchInsights = ({ match }) => {
  if (!match || !match.detailedInsights) return null;

  const { detailedInsights, breakdown } = match;

  const getInsightIcon = (category) => {
    const icons = {
      interests: '🎯',
      age: '🎂',
      gender: '👥',
      location: '📍',
      bio: '📝',
      lifestyle: '🏃‍♀️',
      personality: '💭'
    };
    return icons[category] || '✨';
  };

  const getInsightColor = (category) => {
    const colors = {
      interests: 'from-pink-400 to-pink-600',
      age: 'from-blue-400 to-blue-600',
      gender: 'from-purple-400 to-purple-600',
      location: 'from-green-400 to-green-600',
      bio: 'from-yellow-400 to-yellow-600',
      lifestyle: 'from-indigo-400 to-indigo-600',
      personality: 'from-teal-400 to-teal-600'
    };
    return colors[category] || 'from-gray-400 to-gray-600';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
        <span className="mr-2">🔍</span>
        Match Analysis
      </h3>
      
      <div className="space-y-4">
        {Object.entries(detailedInsights).map(([category, insight]) => {
          if (!insight.details || insight.details.length === 0) return null;
          
          const categoryScore = breakdown?.[category] || 0;
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
          const percentage = Math.round((categoryScore / maxScores[category]) * 100);
          
          return (
            <div key={category} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <span className="text-lg mr-2">{getInsightIcon(category)}</span>
                  <span className="font-semibold text-gray-700 capitalize">{category}</span>
                </div>
                <div className="text-sm font-bold text-gray-600">{percentage}%</div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div 
                  className={`bg-gradient-to-r ${getInsightColor(category)} rounded-full h-2 transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              
              <div className="space-y-1">
                {insight.details.map((detail, index) => (
                  <div key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="w-1 h-1 bg-gray-400 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
        <div className="flex items-center justify-center">
          <span className="text-sm text-gray-600">
            💡 <strong>Tip:</strong> The higher the compatibility score, the more likely you are to have a great connection!
          </span>
        </div>
      </div>
    </div>
  );
};

export default MatchInsights;
