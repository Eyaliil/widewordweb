import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthPanel from './AuthPanel';
import { supabase } from '../lib/supabaseClient';
import { loadPublicProfiles } from '../services/profileService';
import { findMatchRPC, getCurrentUserId, pickRandomExcluding } from '../services/matchingService';

const Home = ({ me, avatar, isProfileComplete, isOnline, setIsOnline, isMatching, setIsMatching, match, setMatch, setMessages, setShowChat, onEditProfile, onEditPreferences }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [noMatch, setNoMatch] = useState(false);

  // Load users via RPC (public_profiles)
  useEffect(() => {
    let isCancelled = false;
    const load = async () => {
      try {
        const data = await loadPublicProfiles(20);
        if (!isCancelled) setUsers(data);
      } catch (e) {
        console.error('Failed to load users:', e);
      }
    };
    load();
    return () => { isCancelled = true; };
  }, []);

  const checkDbProfileComplete = async () => {
    if (isProfileComplete) return true;
    return false;
  };

  const goOnline = async () => {
    setNoMatch(false);
    if (!(await checkDbProfileComplete())) {
      return;
    }

    setIsOnline(true);
    setIsMatching(true);

    setTimeout(async () => {
      let found = false;
      try {
        const currentUserId = await getCurrentUserId();
        const candidate = await findMatchRPC();
        if (candidate && candidate.id && candidate.id !== currentUserId) {
          setMatch(candidate);
          setMessages([
            { id: 1, sender: 'them', text: `Hey ${me.name}!`, timestamp: new Date() },
            { id: 2, sender: 'them', text: "How's your day going?", timestamp: new Date() }
          ]);
          found = true;
        }
      } catch (err) {
        console.warn('RPC find_match failed; falling back:', err?.message || err);
      }

      if (!found) {
        const currentUserId = await getCurrentUserId();
        const fallback = pickRandomExcluding(users, currentUserId);
        if (fallback) {
          setMatch(fallback);
          setMessages([
            { id: 1, sender: 'them', text: `Hey ${me.name}!`, timestamp: new Date() },
            { id: 2, sender: 'them', text: "How's your day going?", timestamp: new Date() }
          ]);
          found = true;
        }
      }

      if (!found) setNoMatch(true);
      setIsMatching(false);
    }, Math.random() * 3000 + 5000);
  };

  return (
    <div className="max-w-6xl mx-auto min-h-screen overflow-hidden px-4">
      {/* Top navigation / status bar */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="py-4">
          <div className="flex flex-col items-end gap-2">
            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                <span className="hidden md:inline">Signed in as</span>
                <span className="font-medium truncate max-w-[10rem]">{user.email}</span>
                <button onClick={async () => { await supabase.auth.signOut(); }} className="ml-1 px-2 py-0.5 rounded bg-gray-200 hover:bg-gray-300">Sign out</button>
              </div>
            )}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <button onClick={onEditProfile} className="px-3 sm:px-4 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-800">Edit Profile</button>
                  <button onClick={onEditPreferences} className="px-3 sm:px-4 py-2 text-sm rounded-lg bg-gray-200 hover:bg-gray-300">Edit Preferences</button>
                </>
              ) : (
                <div className="sm:hidden">
                  <AuthPanel />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero section */}
      <section className="pt-10 pb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">The Future of Matchmaking ✨</h1>
        <p className="mt-3 text-gray-600 max-w-2xl mx-auto">Let the algorithm find who truly fits you.</p>
      </section>

      {/* Auth panel for logged-out users */}
      {!user && (
        <div className="mb-8 flex justify-center">
          <div className="w-full max-w-md">
            <AuthPanel />
          </div>
        </div>
      )}

      {/* Primary action and status */}
      <div className="text-center mb-10">
        {!isOnline ? (
          <>
            <button
              onClick={goOnline}
              className="px-8 py-4 font-semibold rounded-xl text-lg transition-all duration-200 shadow-lg bg-black text-white hover:bg-gray-800"
            >
              Go Online
            </button>
            {noMatch && (
              <div className="mt-4 text-sm text-gray-600">No match found right now. Please try again later.</div>
            )}
          </>
        ) : isMatching ? (
          <div className="inline-flex items-center space-x-3 px-6 py-3 bg-gray-100 text-gray-700 rounded-full">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
            <span className="font-medium">Matching...</span>
          </div>
        ) : match ? (
          <div className="space-x-2">
            <span className="inline-flex items-center space-x-3 px-6 py-3 bg-gray-100 text-gray-700 rounded-full">
              <span className="font-medium">Matched!</span>
            </span>
            <button onClick={() => setShowChat(true)} className="px-6 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200">Open Chat</button>
          </div>
        ) : (
          noMatch && (
            <div className="inline-flex items-center space-x-3 px-6 py-3 bg-gray-100 text-gray-700 rounded-full">
              <span className="font-medium">No match found right now. Please try again later.</span>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Home;
