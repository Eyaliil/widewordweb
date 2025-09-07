import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const AuthPanel = () => {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const emailRef = useRef(null);

  const signInMagic = async (e) => {
    e?.preventDefault?.();
    if (!email) return;
    setSending(true);
    setStatus('Sending magic link...');
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setStatus(error.message);
      setSending(false);
    } else {
      setStatus('Check your email for the sign-in link.');
    }
  };

  const signInGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    } catch (e) {
      setStatus(e.message || 'Google sign-in not available.');
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setStatus('');
  };

  if (loading) return null;
  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 truncate max-w-[12rem]">{user.email}</span>
        <button onClick={signOut} className="px-3 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300">Sign out</button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={signInGoogle}
          className="w-full px-4 py-3 rounded-lg bg-black text-white font-medium hover:bg-gray-800"
        >
          Continue with Google
        </button>
        <div className="relative text-center text-xs text-gray-500 select-none">
          <span className="px-2 bg-white relative z-10">or</span>
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-gray-200" />
        </div>
        <form onSubmit={signInMagic} className="flex gap-2">
          <input
            ref={emailRef}
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          />
          <button
            type="submit"
            disabled={sending}
            className="px-4 py-3 rounded-lg bg-gray-900 text-white font-medium disabled:opacity-60"
          >
            {sending ? 'Sending...' : 'Send link'}
          </button>
        </form>
        {status && <div className="text-xs text-gray-600 mt-1">{status}</div>}
      </div>
    </div>
  );
};

export default AuthPanel; 