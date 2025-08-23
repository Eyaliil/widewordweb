import React from 'react';

const Header = ({ step }) => {
  // Progress bar component
  const ProgressBar = () => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-300"
        style={{ width: `${(step / 5) * 100}%` }}
      ></div>
    </div>
  );

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex justify-between items-center mb-6">
      {[1, 2, 3, 4, 5].map((stepNum) => (
        <div key={stepNum} className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            stepNum <= step 
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' 
              : 'bg-gray-200 text-gray-500'
          }`}>
            {stepNum}
          </div>
          <div className="text-xs text-gray-500 mt-1 hidden sm:block">
            {stepNum === 1 && 'About You'}
            {stepNum === 2 && 'Avatar'}
            {stepNum === 3 && 'Looking For'}
            {stepNum === 4 && 'The Room'}
            {stepNum === 5 && 'Chat'}
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
            Step {step} of 5
          </div>
        </div>
        <StepIndicator />
      </div>
    </div>
  );
};

export default Header; 