import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { RiHeart3Line, RiLoginCircleLine, RiErrorWarningLine } from 'react-icons/ri';

const LoginForm = () => {
  const { loginWithName, loading } = useAuth();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    const result = await loginWithName(name.trim());
    
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBEEDA] flex flex-col items-center justify-center p-4">
      {/* Header with Logo */}
      <div className="text-center mb-12 w-full max-w-md px-4">
        {/* Logo with fade-in animation */}
        <div className="fade-in-up-initial fade-in-up mb-6">
          <img 
            src="/logo/Matchy_logo.svg" 
            alt="Matchy Logo" 
            className="h-32 mx-auto object-contain"
            onError={(e) => {
              // Try PNG fallback
              e.target.src = '/logo/Matchy_logo.png';
              e.target.onerror = () => {
                // Fallback to gradient icon if both logo files not found
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'inline-flex';
              };
            }}
          />
          <div className="hidden inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-[#7B002C] to-[#40002B] rounded-full">
            <RiHeart3Line className="text-5xl text-white" />
          </div>
        </div>
        
        {/* App Name "Matchy me" with special styling */}
        <div className="fade-in-up-initial fade-in-up logo-delay-1">
          <h1 className="text-5xl font-bold text-gray-900 inline-block">
            Matchy{' '}
            <span className="text-3xl text-[#BA0105] italic font-normal">me</span>
          </h1>
        </div>
      </div>

      {/* Login Form */}
      <div className="w-full max-w-md px-4">
        <form onSubmit={handleSubmit} className="space-y-6 fade-in-up-initial fade-in-up logo-delay-2">
          <div>
            <label htmlFor="name" className="block text-base font-normal text-gray-900 mb-3">
              What's your name?
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:ring-opacity-20 focus:border-gray-400 transition-all duration-250 text-base bg-white text-gray-900 placeholder-gray-400"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3">
              <RiErrorWarningLine className="text-red-600 text-xl flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className={`w-full py-3.5 px-4 rounded-lg font-medium transition-all duration-250 shadow-sm flex items-center justify-center gap-2 ${
              loading || !name.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 shadow-md'
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>→</span>
                <span>Start Matching</span>
              </>
            )}
          </button>

          {/* Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 leading-relaxed">
              No password needed.<br />
              Authentic connections made simple.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
