import React from 'react';

const Header = ({ currentView }) => {
  // Get current step number for progress
  const getCurrentStep = () => {
    switch (currentView) {
      case 'profile': return 1;
      case 'avatar': return 2;
      case 'preferences': return 3;
      case 'room': return 4;
      default: return 1;
    }
  };

  // Get view title
  const getViewTitle = () => {
    switch (currentView) {
      case 'profile': return 'About You';
      case 'avatar': return 'Choose Avatar';
      case 'preferences': return 'Looking For';
      case 'room': return 'The Room';
      default: return 'WideWordWeb';
    }
  };

  // Progress bar component
  const ProgressBar = () => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-300"
        style={{ width: `${(getCurrentStep() / 4) * 100}%` }}
      ></div>
    </div>
  );

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex justify-between items-center mb-6">
      {[
        { key: 'profile', label: 'About You', icon: '👤' },
        { key: 'avatar', label: 'Avatar', icon: '🖼️' },
        { key: 'preferences', label: 'Looking For', icon: '🔍' },
        { key: 'room', label: 'The Room', icon: '🏠' }
      ].map((step) => (
        <div key={step.key} className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            step.key === currentView
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' 
              : 'bg-gray-200 text-gray-500'
          }`}>
            {step.icon}
          </div>
          <div className="text-xs text-gray-500 mt-1 hidden sm:block">
            {step.label}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">WideWordWeb</h1>
          <div className="flex-1 max-w-md">
            <ProgressBar />
          </div>
          <div className="text-sm text-gray-600">
            {getViewTitle()}
          </div>
        </div>
        <StepIndicator />
      </div>
    </div>
  );
};

export default Header; 