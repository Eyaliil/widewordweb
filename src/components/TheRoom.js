import React, { useState, useEffect, useRef } from 'react';
import { MOCK_USERS } from '../data/mockUsers';   // globe radius
const AVATAR_OFFSET = 26;   // how far avatars sit above surface
const CAMERA_D = 800;       // perspective distance

const TheRoom = ({ me, avatar, isProfileComplete, isOnline, setIsOnline, isMatching, setIsMatching, match, setMatch, setMessages, setShowChat, onEditProfile }) => {
  const canvasRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [rotation, setRotation] = useState({ x: 0, y: 180 }); // Start rotated 180° to flip the sphere
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // Initialize users with 3D positions on the sphere surface (not just top)
  useEffect(() => {
    const updateUsers = () => {
      const sphereUsers = MOCK_USERS.slice(0, 20).map((user, index) => {
        // Distribute users evenly across the entire sphere surface
        // Use Fibonacci spiral for even distribution
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        const radius = Math.min(window.innerWidth, window.innerHeight) * 0.35;
        
        // Calculate position on the entire sphere surface
        const t = index / 20;
        const inclination = Math.acos(1 - 2 * t); // 0 to π (entire sphere)
        const azimuth = index * goldenAngle;
        
        // Position on the sphere surface
        const x = radius * Math.cos(azimuth) * Math.sin(inclination);
        const y = radius * Math.sin(azimuth) * Math.sin(inclination);
        const z = radius * Math.cos(inclination);
        
        return {
          ...user,
          position: { x, y, z },
          originalPosition: { x, y, z } // Store original for rotation calculations
        };
      });
      setUsers(sphereUsers);
    };

    updateUsers();
    
    // Handle window resize
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
      updateUsers();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle mouse events for rotation
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;
    
    setRotation(prev => ({
      x: Math.max(-45, Math.min(45, prev.x + deltaY * 0.5)),
      y: prev.y + deltaX * 0.5
    }));
    
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle touch events for mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setLastMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    
    const deltaX = e.touches[0].clientX - lastMousePos.x;
    const deltaY = e.touches[0].clientY - lastMousePos.y;
    
    setRotation(prev => ({
      x: Math.max(-45, Math.min(45, prev.x + deltaY * 0.5)),
      y: prev.y + deltaX * 0.5
    }));
    
    setLastMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Calculate lighting for a 3D point on the sphere
  const calculateLighting = (x, y, z, lightX, lightY, lightZ) => {
    // Normalize the point on the sphere
    const length = Math.sqrt(x * x + y * y + z * z);
    if (length === 0) return 0.5;
    
    const nx = x / length;
    const ny = y / length;
    const nz = z / length;
    
    // Calculate dot product with light direction
    const dotProduct = nx * lightX + ny * lightY + nz * lightZ;
    
    // Ambient + diffuse lighting
    const ambient = 0.3;
    const diffuse = Math.max(0, dotProduct) * 0.7;
    
    return Math.min(1, Math.max(0, ambient + diffuse));
  };

  // Render 3D scene with lighting
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the 3D sphere with lighting
    const sphereRadius = Math.min(centerX, centerY) * 0.7;
    const sphereY = centerY;
    
    // Light source position (top-right, slightly above)
    const lightX = 0.5;
    const lightY = -0.3;
    const lightZ = 0.8;
    
    // Draw filled sphere with 3D lighting effect
    const segments = 60; // Number of segments for smooth sphere
    const rings = 30;    // Number of rings for smooth sphere
    
    // Create radial gradient for the sphere
    const gradient = ctx.createRadialGradient(
      centerX, sphereY, 0,
      centerX, sphereY, sphereRadius
    );
    gradient.addColorStop(0, 'rgba(240, 240, 240, 0.9)'); // Light center
    gradient.addColorStop(0.7, 'rgba(200, 200, 200, 0.8)'); // Medium
    gradient.addColorStop(1, 'rgba(160, 160, 160, 0.7)'); // Darker edges
    
    // Draw the main sphere fill
    ctx.beginPath();
    ctx.arc(centerX, sphereY, sphereRadius, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Add subtle shading for 3D effect
    for (let ring = 0; ring < rings; ring++) {
      const phi = (ring / (rings - 1)) * Math.PI; // 0 to π
      const y = sphereRadius * Math.cos(phi);
      const ringRadius = sphereRadius * Math.sin(phi);
      
      for (let seg = 0; seg < segments; seg++) {
        const theta = (seg / segments) * 2 * Math.PI; // 0 to 2π
        const x = ringRadius * Math.cos(theta);
        const z = ringRadius * Math.sin(theta);
        
        // Apply rotation to get 3D position
        const cosX = Math.cos(rotation.x * Math.PI / 180);
        const sinX = Math.sin(rotation.x * Math.PI / 180);
        const cosY = Math.cos(rotation.y * Math.PI / 180);
        const sinY = Math.sin(rotation.y * Math.PI / 180);
        
        let rx = x;
        let ry = y;
        let rz = z;
        
        // Rotate around Y axis
        let tempX = rx * cosY - rz * sinY;
        let tempZ = rx * sinY + rz * cosY;
        rx = tempX;
        rz = tempZ;
        
        // Rotate around X axis
        let tempY = ry * cosX - rz * sinX;
        let tempZ2 = ry * sinX + rz * cosX;
        ry = tempY;
        rz = tempZ2;
        
        // Project to 2D
        const scale = CAMERA_D / (CAMERA_D + rz);
        const screenX = centerX + rx * scale;
        const screenY = sphereY + ry * scale;
        
        // Only draw shading if visible (in front)
        if (rz > -sphereRadius) {
          // Calculate lighting for this point
          const lighting = calculateLighting(x, y, z, lightX, lightY, lightZ);
          
          // Add subtle shading dots for depth
          const alpha = 0.1 + lighting * 0.2; // Subtle shading
          
          // Draw small shading dots
          ctx.beginPath();
          ctx.arc(screenX, screenY, 1.5, 0, 2 * Math.PI);
          ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
          ctx.fill();
        }
      }
    }
    
    // Draw sphere outline
    ctx.beginPath();
    ctx.arc(centerX, sphereY, sphereRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw center point for reference
    ctx.beginPath();
    ctx.arc(centerX, sphereY, 5, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fill();

    // Apply rotation to avatars - they stay attached to their sphere surface points
    const updatedUsers = users.map(user => {
      const cosX = Math.cos(rotation.x * Math.PI / 180);
      const sinX = Math.sin(rotation.x * Math.PI / 180);
      const cosY = Math.cos(rotation.y * Math.PI / 180);
      const sinY = Math.sin(rotation.y * Math.PI / 180);

      // Start with original position (fixed point on sphere surface)
      let x = user.originalPosition.x;
      let y = user.originalPosition.y;
      let z = user.originalPosition.z;

      // Apply rotation - avatars rotate with the sphere
      let tempX = x * cosY - z * sinY;
      let tempZ = x * sinY + z * cosY;
      x = tempX;
      z = tempZ;

      let tempY = y * cosX - z * sinX;
      let tempZ2 = y * sinX + z * cosX;
      y = tempY;
      z = tempZ2;

      return {
        ...user,
        position: { x, y, z }
      };
    });

    // Sort users by Z position for proper layering
    const sortedUsers = [...updatedUsers].sort((a, b) => a.position.z - b.position.z);

    // Draw each user avatar
    sortedUsers.forEach(user => {
      // Use rotated position (avatars stay attached to sphere surface)
      const x = user.position.x;
      const y = user.position.y;
      const z = user.position.z;

      // Project 3D to 2D
      const scale = CAMERA_D / (CAMERA_D + z);
      const screenX = centerX + x * scale;
      const screenY = centerY + y * scale;
      const avatarSize = Math.max(20, 40 * scale); // Slightly smaller avatars

      // Only draw if avatar is visible (in front of camera AND on back side of sphere)
      if (z > -sphereRadius && z < 0) {
        // Draw avatar background
        ctx.beginPath();
        ctx.arc(screenX, screenY, avatarSize, 0, 2 * Math.PI);
        ctx.fillStyle = match && match.id === user.id ? '#000000' : '#333333';
        ctx.fill();
        ctx.strokeStyle = match && match.id === user.id ? '#000000' : '#666666';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw emoji/avatar
        ctx.font = `${avatarSize * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.fillText(user.emojiAvatar, screenX, screenY);

        // Draw name if close enough and avatar is visible
        if (scale > 0.3 && z > 0) {
          ctx.font = '12px Arial';
          ctx.fillStyle = '#000000';
          ctx.fillText(user.name, screenX, screenY - avatarSize - 10);
        }

        // Draw match indicator
        if (match && match.id === user.id) {
          ctx.beginPath();
          ctx.arc(screenX, screenY - avatarSize - 15, 8, 0, 2 * Math.PI);
          ctx.fillStyle = '#000000';
          ctx.fill();
          ctx.font = '10px Arial';
          ctx.fillStyle = 'white';
          ctx.fillText('♥', screenX, screenY - avatarSize - 15);
        }
      }
    });

  }, [users, rotation, match]);

  // Go online and find match
  const goOnline = () => {
    if (!isProfileComplete) {
      alert('Please complete your profile first!');
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
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-center text-black mb-8">The Room</h1>
      
      {/* Profile Status */}
      {!isProfileComplete && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 text-center">
          <div className="text-gray-700 mb-4">
            <div className="text-4xl mb-2">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Profile Incomplete</h2>
            <p className="text-gray-600">You need to complete your profile before you can match with others.</p>
          </div>
          <button
            onClick={onEditProfile}
            className="px-6 py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition-colors duration-200"
          >
            Complete Profile
          </button>
        </div>
      )}

      {/* Profile Summary */}
      {isProfileComplete && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Your Profile</h2>
          <div className="flex items-center justify-center space-x-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-800 rounded-full mx-auto flex items-center justify-center text-3xl border-2 border-white shadow-lg mb-3">
                {avatar.type === 'image' && avatar.image ? (
                  <img src={avatar.image} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  avatar.initials || avatar.emoji
                )}
              </div>
              <p className="font-medium text-gray-800">{me.name}</p>
              <p className="text-sm text-gray-500">{me.age} • {me.pronouns}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">{me.bio}</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {me.interests.slice(0, 3).map(interest => (
                  <span key={interest} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    {interest}
                  </span>
                ))}
                {me.interests.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{me.interests.length - 3} more
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onEditProfile}
              className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors duration-200"
            >
              Edit Profile
            </button>
          </div>
        </div>
      )}
      
      {/* 3D Globe Canvas */}
      <div className="relative w-full h-screen flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={window.innerWidth}
          height={window.innerHeight}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ 
            touchAction: 'none',
            width: '100vw',
            height: '100vh',
            display: 'block'
          }}
        />
      </div>
      
      {/* Online Status */}
      {!isOnline ? (
        <div className="text-center mb-8">
          <button
            onClick={goOnline}
            disabled={!isProfileComplete}
            className={`px-8 py-4 font-semibold rounded-lg text-lg transition-all duration-200 shadow-lg ${
              isProfileComplete
                ? 'bg-black text-white hover:bg-gray-800'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isProfileComplete ? 'Go Online' : 'Complete Profile to Go Online'}
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
    </div>
  );
};

export default TheRoom; 