import React, { useState, useEffect } from 'react';

const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300); // Animation duration
  };

  if (!isVisible) return null;

  const getToastStyles = () => {
    const baseStyles = "fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out";
    
    if (isLeaving) {
      return `${baseStyles} translate-x-full opacity-0`;
    }

    const typeStyles = {
      success: "bg-green-500 text-white",
      error: "bg-red-500 text-white", 
      info: "bg-blue-500 text-white",
      warning: "bg-yellow-500 text-black"
    };

    return `${baseStyles} translate-x-0 opacity-100 ${typeStyles[type]}`;
  };

  const getIcon = () => {
    const icons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      warning: '⚠️'
    };
    return icons[type] || icons.success;
  };

  return (
    <div className={getToastStyles()}>
      <div className="flex items-center space-x-3">
        <span className="text-xl">{getIcon()}</span>
        <span className="font-medium">{message}</span>
        <button
          onClick={handleClose}
          className="ml-2 text-white/80 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default Toast;
