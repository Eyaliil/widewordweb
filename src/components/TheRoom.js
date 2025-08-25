import React, { useState, useEffect } from 'react';
import { MOCK_USERS } from '../data/mockUsers';
import StickMan from './StickMan';

const TheRoom = ({ me, avatar, isProfileComplete, isOnline, setIsOnline, isMatching, setIsMatching, match, setMatch, setMessages, setShowChat, onEditProfile }) => {
  const [users] = useState(MOCK_USERS.slice(0, 20));
  const [showProfileNotice, setShowProfileNotice] = useState(false);
  const [stickMenPositions, setStickMenPositions] = useState([]);

  // Generate stick men positions only once when component mounts
  useEffect(() => {
    const positions = [];
    const usedPositions = [];
    
    users.slice(0, 8).forEach((user, index) => {
      let attempts = 0;
      let x, y;
      
      // Try to find a non-overlapping position
      do {
        x = 100 + Math.random() * 800; // Random x between 100 and 900
        
        // Calculate the dome curve height at this x position
        const normalizedX = (x - 100) / 800; // 0 to 1
        const domeCurveY = 200 - (normalizedX * (1 - normalizedX) * 270); // Y position on the dome curve
        
        // Random y position between the dome curve and the bottom (200)
        const minY = domeCurveY - 50; // 50px below the dome curve
        const maxY = 180; // 20px above the bottom
        y = minY + Math.random() * (maxY - minY);
        
        attempts++;
      } while (attempts < 50 && usedPositions.some(pos => 
        Math.abs(pos.x - x) < 60 && Math.abs(pos.y - y) < 40
      ));
      
      // Add this position to used positions
      usedPositions.push({ x, y });
      positions.push({ x, y, user });
    });
    
    setStickMenPositions(positions);
  }, []); // Empty dependency array means this runs only once

  // Go online and find match
  const goOnline = () => {
    if (!isProfileComplete) {
      setShowProfileNotice(true);
      return;
    }
    
    setIsOnline(true);
    setIsMatching(true);
    
    // Simulate matching process
    setTimeout(() => {
      const myInterests = me.interests;
      const potentialMatches = MOCK_USERS.filter(user => 
        user.interests.some(interest => myInterests.includes(interest))
      );
      
      if (potentialMatches.length > 0) {
        const randomMatch = potentialMatches[Math.floor(Math.random() * potentialMatches.length)];
        setMatch(randomMatch);
        setMessages([
          { id: 1, sender: 'them', text: `Hey ${me.name}! I noticed we both like ${randomMatch.interests.find(i => myInterests.includes(i))}!`, timestamp: new Date() },
          { id: 2, sender: 'them', text: "How's your day going?", timestamp: new Date() }
        ]);
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