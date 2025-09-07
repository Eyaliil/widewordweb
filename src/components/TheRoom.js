import React, { useState, useEffect } from 'react';
import StickMan from './StickMan';
import { useAuth } from '../context/AuthContext';
import AuthPanel from './AuthPanel';
import { supabase } from '../lib/supabaseClient';
import { loadPublicProfiles } from '../services/profileService';
import { findMatchRPC, getCurrentUserId, pickRandomExcluding } from '../services/matchingService';
import { generateStickmanPositions } from '../utils/stickmanLayout';

const TheRoom = ({ me, avatar, isProfileComplete, isOnline, setIsOnline, isMatching, setIsMatching, match, setMatch, setMessages, setShowChat, onEditProfile, onEditPreferences }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [showProfileNotice, setShowProfileNotice] = useState(false);
  const [stickMenPositions, setStickMenPositions] = useState([]);
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

  // Generate stick men positions only once after users load
  useEffect(() => {
    if (!users || users.length === 0) return;
    setStickMenPositions(prev => generateStickmanPositions(users, prev));
  }, [users]);

  // Check DB for profile completeness (minimal: rely on local flag to avoid coupling here)
  const checkDbProfileComplete = async () => {
    if (isProfileComplete) return true;
    // Could query DB here; keeping simple and relying on local for now
    return false;
  };

  const goOnline = async () => {
    setNoMatch(false);
    if (!(await checkDbProfileComplete())) {
      setShowProfileNotice(true);
      return;
    }

    setShowProfileNotice(false);
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
    <div className="max-w-6xl mx-auto h-screen overflow-hidden">
      <h1 className="text-4xl font-bold text-center text-black mb-8">The Room</h1>
      {!user && (
        <div className="mb-6 flex justify-center">
          <AuthPanel />
        </div>
      )}
      {user && (
        <div className="mb-6 flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
            <span>Signed in as</span>
            <span className="font-medium truncate max-w-[14rem]">{user.email}</span>
            <button
              onClick={async () => { await supabase.auth.signOut(); }}
              className="ml-2 px-2 py-0.5 rounded bg-gray-200 hover:bg-gray-300 text-xs"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
      {!isOnline ? (
        <div className="text-center mb-8">
          <button
            onClick={goOnline}
            className="px-8 py-4 font-semibold rounded-lg text-lg transition-all duration-200 shadow-lg bg-black text-white hover:bg-gray-800"
          >
            Go Online
          </button>
          {user && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <button onClick={onEditProfile} className="px-4 py-2 text-sm rounded-lg bg-gray-200 hover:bg-gray-300">Edit Profile</button>
              <button onClick={onEditPreferences} className="px-4 py-2 text-sm rounded-lg bg-gray-200 hover:bg-gray-300">Edit Preferences</button>
            </div>
          )}
        </div>
      ) : isMatching ? (
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 px-6 py-3 bg-gray-100 text-gray-700 rounded-full">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
            <span className="font-medium">Matching...</span>
          </div>
        </div>
      ) : match ? (
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 px-6 py-3 bg-gray-100 text-gray-700 rounded-full">
            <span className="font-medium">Matched!</span>
          </div>
          <button onClick={() => setShowChat(true)} className="ml-4 px-6 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200">Open Chat</button>
        </div>
      ) : noMatch ? (
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 px-6 py-3 bg-gray-100 text-gray-700 rounded-full">
            <span className="font-medium">No match found right now. Please try again later.</span>
          </div>
        </div>
      ) : null}

      {/* Dome at bottom */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center">
        <svg width="100%" height="200" viewBox="0 0 1000 200" className="pointer-events-none">
          <path d="M 0 200 Q 500 -70 1000 200 L 1000 200 L 0 200 Z" fill="rgba(240, 240, 240, 0.3)" stroke="none" />
          <path d="M 0 200 Q 500 -70 1000 200" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" />
          {stickMenPositions.map((pos, index) => {
            const stickMan = new StickMan(pos.x, pos.y, 1.0, pos.user.name);
            return stickMan.render();
          })}
        </svg>
      </div>
    </div>
  );
};

export default TheRoom; 