import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import StickMan from './StickMan';

const TheRoom = ({ me, avatar, isProfileComplete, isOnline, setIsOnline, isMatching, setIsMatching, match, setMatch, setMessages, setShowChat, onEditProfile, onEditPreferences }) => {
  const [users, setUsers] = useState([]);
  const [showProfileNotice, setShowProfileNotice] = useState(false);
  const [stickMenPositions, setStickMenPositions] = useState([]);
  const [noMatch, setNoMatch] = useState(false);

  // Load users from Supabase (profiles table)
  useEffect(() => {
    let isCancelled = false;
    const loadUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, age, pronouns, bio')
        .limit(20);
      if (error) {
        console.error('Failed to load users:', error);
        return;
      }
      if (!isCancelled) setUsers(data || []);
    };
    loadUsers();
    return () => { isCancelled = true; };
  }, []);

  // Generate stick men positions only once after users load
  useEffect(() => {
    if (!users || users.length === 0) return;
    if (stickMenPositions.length > 0) return; // keep first assigned positions
    const positions = [];
    const usedPositions = [];
    users.slice(0, 8).forEach((user) => {
      let attempts = 0;
      let x, y;
      do {
        x = 100 + Math.random() * 800;
        const normalizedX = (x - 100) / 800;
        const domeCurveY = 200 - (normalizedX * (1 - normalizedX) * 270);
        const minY = domeCurveY - 50;
        const maxY = 180;
        y = minY + Math.random() * (maxY - minY);
        attempts++;
      } while (attempts < 50 && usedPositions.some(pos => Math.abs(pos.x - x) < 60 && Math.abs(pos.y - y) < 40));
      usedPositions.push({ x, y });
      positions.push({ x, y, user });
    });
    setStickMenPositions(positions);
  }, [users, stickMenPositions.length]);

  // Check DB for profile completeness
  const checkDbProfileComplete = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return false;
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('id, name, age, pronouns, bio')
        .eq('id', userId)
        .maybeSingle();
      if (pErr) return false;
      const fieldsOk = !!(profile && profile.name && profile.age && profile.pronouns && profile.bio);
      const { count, error: iErr } = await supabase
        .from('user_interests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (iErr) return false;
      const interestsOk = (count ?? 0) > 0;
      return fieldsOk && interestsOk;
    } catch {
      return false;
    }
  };

  // Go online and find match
  const goOnline = async () => {
    setNoMatch(false);
    // If local flag says incomplete, double-check DB before prompting
    if (!isProfileComplete) {
      const dbComplete = await checkDbProfileComplete();
      if (!dbComplete) {
        setShowProfileNotice(true);
        return;
      }
    }

    setShowProfileNotice(false);
    setIsOnline(true);
    setIsMatching(true);
    
    // Matching process (RPC with fallback)
    setTimeout(async () => {
      let found = false;
      try {
        // Current user id to exclude from results
        const { data: userData } = await supabase.auth.getUser();
        const currentUserId = userData?.user?.id || null;

        // Call secure RPC to find a match
        const { data: rpcData, error: rpcError } = await supabase.rpc('find_match');
        if (rpcError) throw rpcError;
        const candidate = Array.isArray(rpcData) ? rpcData[0] : rpcData;
        if (candidate && candidate.id && candidate.id !== currentUserId) {
          setMatch(candidate);
          setMessages([
            { id: 1, sender: 'them', text: `Hey ${me.name}!`, timestamp: new Date() },
            { id: 2, sender: 'them', text: "How's your day going?", timestamp: new Date() }
          ]);
          found = true;
        }
      } catch (err) {
        console.warn('RPC find_match failed or returned self; falling back:', err?.message || err);
      }

      if (!found) {
        // Fallback: random from loaded users if RPC unavailable/empty
        try {
          const { data: userData } = await supabase.auth.getUser();
          const currentUserId = userData?.user?.id || null;
          const pool = (users && users.length ? users : []).filter(u => u.id !== currentUserId);
          if (pool.length > 0) {
            const randomMatch = pool[Math.floor(Math.random() * pool.length)];
            setMatch(randomMatch);
            setMessages([
              { id: 1, sender: 'them', text: `Hey ${me.name}!`, timestamp: new Date() },
              { id: 2, sender: 'them', text: "How's your day going?", timestamp: new Date() }
            ]);
            found = true;
          }
        } catch (_) {
          // ignore
        }
      }

      if (!found) {
        setNoMatch(true);
      }
      setIsMatching(false);
    }, Math.random() * 3000 + 5000);
  };

  return (
    <div className="max-w-6xl mx-auto h-screen overflow-hidden">
      <h1 className="text-4xl font-bold text-center text-black mb-8">The Room</h1>
      
      {/* Online Status - Between profile and globe */}
      {!isOnline ? (
        <div className="text-center mb-8">
          <button
            onClick={goOnline}
            className="px-8 py-4 font-semibold rounded-lg text-lg transition-all duration-200 shadow-lg bg-black text-white hover:bg-gray-800"
          >
            Go Online
          </button>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={onEditProfile}
              className="px-4 py-2 text-sm rounded-lg bg-gray-200 hover:bg-gray-300"
            >
              Edit Profile
            </button>
            <button
              onClick={onEditPreferences}
              className="px-4 py-2 text-sm rounded-lg bg-gray-200 hover:bg-gray-300"
            >
              Edit Preferences
            </button>
          </div>
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
          <button
            onClick={() => setShowChat(true)}
            className="ml-4 px-6 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200"
          >
            Open Chat
          </button>
        </div>
      ) : noMatch ? (
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 px-6 py-3 bg-gray-100 text-gray-700 rounded-full">
            <span className="font-medium">No match found right now. Please try again later.</span>
          </div>
        </div>
      ) : null}
      
      {/* Profile Incomplete Notice - Only shown when Go Online is clicked */}
      {!isProfileComplete && showProfileNotice && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 text-center">
          <div className="text-gray-700 mb-4">
            <div className="text-4xl mb-2">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Profile Incomplete</h2>
            <p className="text-gray-600">You need to complete your profile before you can match with others.</p>
          </div>
          <button
            onClick={onEditProfile}
            className="px-6 py-2 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition-colors duration-200"
          >
            Complete Profile
          </button>
        </div>
      )}

      {/* Dome at bottom */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center">
        <svg width="100%" height="200" viewBox="0 0 1000 200" className="pointer-events-none">
          {/* Dome surface fill - the area inside the dome */}
          <path
            d="M 0 200 Q 500 -70 1000 200 L 1000 200 L 0 200 Z"
            fill="rgba(240, 240, 240, 0.3)"
            stroke="none"
          />
          
          {/* Dome outline */}
          <path
            d="M 0 200 Q 500 -70 1000 200"
            fill="none"
            stroke="black"
            strokeWidth="3"
            strokeLinecap="round"
          />
          
          {/* Stick men using stored positions */}
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