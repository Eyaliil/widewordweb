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
    <div className="min-h-screen bg-[#FBEEDA] flex items-center justify-center p-4">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #40002B 1px, transparent 0)',
          backgroundSize: '48px 48px'
        }}></div>
      </div>
      
      <div className="relative bg-white rounded-2xl shadow-xl p-8 md:p-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#7B002C] to-[#40002B] rounded-full mb-6">
            <RiHeart3Line className="text-3xl text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-[#40002B] mb-3">WideWordWeb</h1>
          <p className="text-[#8B6E58] text-base">Find people who vibe like you.</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#40002B] mb-2.5">
              What's your name?
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3.5 border border-[#E8C99E] rounded-lg focus:ring-2 focus:ring-[#7B002C] focus:ring-opacity-20 focus:border-[#7B002C] transition-all duration-250 text-base bg-white"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-[#BA0105] rounded-lg p-4 flex items-start gap-3">
              <RiErrorWarningLine className="text-[#BA0105] text-xl flex-shrink-0 mt-0.5" />
              <p className="text-[#BA0105] text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className={`w-full py-3.5 px-4 rounded-lg font-medium transition-all duration-250 shadow-md flex items-center justify-center gap-2 ${
              loading || !name.trim()
                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#7B002C] to-[#40002B] text-white hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <RiLoginCircleLine className="text-xl" />
                <span>Start Matching</span>
              </>
            )}
          </button>
        </form>

        {/* Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#8B6E58]">
            No password needed. Authentic connections made simple.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
