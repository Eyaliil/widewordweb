import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const AuthPanel = () => {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  const signIn = async (e) => {
    e.preventDefault();
    setStatus('Sending magic link...');
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setStatus(error.message);
    } else {
      setStatus('Check your email for the sign-in link.');
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setStatus('');
  };

  if (loading) return null;

  return (
    <div className="flex items-center gap-3">
      {user ? (
        <>
          <span className="text-sm text-gray-600 truncate max-w-[12rem]">{user.email}</span>
          <button
            onClick={signOut}
            className="px-3 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300"
          >
            Sign out
          </button>
        </>
      ) : (
        <form onSubmit={signIn} className="flex items-center gap-2">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          />
          <button
            type="submit"
            className="px-3 py-1 text-sm rounded bg-gray-800 text-white hover:bg-gray-900"
          >
            Sign in
          </button>
          {status && <span className="text-xs text-gray-500">{status}</span>}
        </form>
      )}
    </div>
  );
};

export default AuthPanel; 