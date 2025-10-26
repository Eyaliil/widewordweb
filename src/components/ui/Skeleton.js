import React from 'react';

/**
 * Skeleton Loading Component
 * Displays animated placeholder content while data loads
 */
const Skeleton = ({ 
  variant = 'text', // 'text' | 'circular' | 'rectangular' | 'avatar'
  width, 
  height, 
  className = '',
  lines = 1 
}) => {
  const baseClass = 'animate-pulse bg-gradient-to-r from-[#F9E6CA] to-[#FDF6EB] rounded';
  
  if (variant === 'circular') {
    return (
      <div 
        className={`${baseClass} rounded-full ${className}`}
        style={{ width: width || height, height: width || height }}
      />
    );
  }
  
  if (variant === 'rectangular') {
    return (
      <div 
        className={`${baseClass} ${className}`}
        style={{ width, height }}
      />
    );
  }
  
  if (variant === 'avatar') {
    return (
      <div 
        className={`${baseClass} rounded-full ${className}`}
        style={{ width: width || 40, height: height || 40 }}
      />
    );
  }
  
  // Text variant
  if (lines === 1) {
    return (
      <div 
        className={`${baseClass} ${className}`}
        style={{ width: width || '100%', height: height || 16 }}
      />
    );
  }
  
  // Multiple lines
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <div 
          key={index}
          className={`${baseClass} ${className}`}
          style={{ 
            width: index === lines - 1 ? width || '60%' : '100%', 
            height: height || 16 
          }}
        />
      ))}
    </div>
  );
};

export default Skeleton;

