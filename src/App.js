import React, { useState, useEffect } from 'react';
import ProfileForm from './components/ProfileForm';
import PreferencesForm from './components/PreferencesForm';
import Home from './components/Home';
import UserSelector from './components/UserSelector';
// Chat removed
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabaseClient';

function App() {
  const { user, currentUser, setCurrentUser } = useAuth();
  const [currentView, setCurrentView] = useState('room');
  const [me, setMe] = useState({ name: '', age: '', gender: '', pronouns: '', city: '', bio: '', interests: [] });
  const [avatar, setAvatar] = useState({ type: '', image: null, emoji: '💕', initials: '' });
  const [lookingFor, setLookingFor] = useState({ genders: [], ageRange: [25, 35], interests: [], distance: 50, vibe: '', dealBreakers: [] });
  const [isOnline, setIsOnline] = useState(false);
  // Matching and chat removed
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showBackOnProfile, setShowBackOnProfile] = useState(true);
  const [onboarding, setOnboarding] = useState(false);
  const [profileCompleteDb, setProfileCompleteDb] = useState(false);

  // Initialize user data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setMe({
        name: currentUser.name,
        age: currentUser.age,
        gender: currentUser.gender,
        pronouns: currentUser.pronouns,
        city: currentUser.city,
        bio: currentUser.bio,
        interests: currentUser.interests
      });
      setAvatar(currentUser.avatar);
      
      // Initialize default preferences for testing
      setLookingFor({
        genders: ['Man', 'Woman', 'Non-binary'],
        ageRange: [22, 35],
        interests: ['Music', 'Travel', 'Art', 'Nature'],
        distance: 50,
        vibe: 'Fun',
        dealBreakers: []
      });
    }
  }, [currentUser]);

  const isProfileComplete = () => {
    // For testing purposes, only require basic profile completion
    const complete = me.name && me.age && me.gender && me.bio && me.interests.length > 0 &&
           avatar.type && (avatar.image || avatar.emoji || avatar.initials);
    
    // Debug logging
    console.log('Profile completion check:', {
      name: me.name,
      age: me.age,
      gender: me.gender,
      bio: me.bio,
      interests: me.interests,
      avatar: avatar,
      complete: complete
    });
    
    return complete;
  };

  useEffect(() => {
    const ensureProfileThenRoute = async () => {
      if (!user) return;
      try {
        // For fake users, check if profile is complete based on currentUser data
        const fieldsOk = !!(currentUser && currentUser.name && currentUser.age && currentUser.gender && currentUser.bio);
        const interestsOk = currentUser && currentUser.interests && currentUser.interests.length > 0;
        const complete = fieldsOk && interestsOk;
        setProfileCompleteDb(!!complete);
        if (!complete) {
          setOnboarding(true);
          setIsEditingProfile(false);
          setShowBackOnProfile(false);
          setCurrentView('profile');
        }
      } catch (_) {}
    };
    ensureProfileThenRoute();
  }, [user, currentUser]);


  const goToRoom = () => setCurrentView('room');

  const returnToRoomFromProfile = () => {
    setIsEditingProfile(false);
    setCurrentView('room');
  };

  // leaveChat removed

  const renderCurrentView = () => {
    switch (currentView) {
      case 'profile':
        return (
          <ProfileForm
            me={me}
            setMe={setMe}
            avatar={avatar}
            setAvatar={setAvatar}
            onNext={onboarding ? () => setCurrentView('preferences') : returnToRoomFromProfile}
            onBack={returnToRoomFromProfile}
            showBack={!onboarding && showBackOnProfile}
          />
        );
      case 'preferences':
        return (
          <PreferencesForm
            me={me}
            avatar={avatar}
            lookingFor={lookingFor}
            setLookingFor={setLookingFor}
            onNext={() => { setOnboarding(false); setProfileCompleteDb(true); goToRoom(); }}
            onBack={goToRoom}
          />
        );
      case 'room':
      default:
        return (
          <Home
            me={me}
            avatar={avatar}
            isProfileComplete={isProfileComplete()}
            isOnline={isOnline}
            setIsOnline={setIsOnline}
            onEditProfile={() => { if (profileCompleteDb || isProfileComplete()) { setIsEditingProfile(true); setShowBackOnProfile(true); setCurrentView('profile'); } }}
            onEditPreferences={() => { if (profileCompleteDb || isProfileComplete()) { setCurrentView('preferences'); } }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <UserSelector />
      <div className="container mx-auto px-4 py-8">
        {renderCurrentView()}
      </div>

      {/* Chat removed */}
    </div>
  );
}

export default App; 