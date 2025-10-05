import React, { useState, useEffect } from 'react';
import ProfileForm from './components/ProfileForm';
import PreferencesForm from './components/PreferencesForm';
import Home from './components/Home';
import LoginForm from './components/LoginForm';
import { useAuth } from './context/AuthContext';

function App() {
  const { currentUser, isLoggedIn, logout } = useAuth();
  const [currentView, setCurrentView] = useState('login');
  const [me, setMe] = useState({ name: '', age: '', gender: '', pronouns: '', city: '', bio: '', interests: [] });
  const [avatar, setAvatar] = useState({ type: 'emoji', image: null, emoji: '👤', initials: '' });
  const [lookingFor, setLookingFor] = useState({ genders: [], ageRange: [25, 35], interests: [], distance: 50, vibe: '', dealBreakers: [] });
  const [isOnline, setIsOnline] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showBackOnProfile, setShowBackOnProfile] = useState(true);
  const [onboarding, setOnboarding] = useState(false);

  // Initialize user data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      console.log('🔄 Loading user data:', currentUser);
      
      setMe({
        name: currentUser.name || '',
        age: currentUser.age || '',
        gender: currentUser.gender || '',
        pronouns: currentUser.pronouns || '',
        city: currentUser.city || '',
        bio: currentUser.bio || '',
        interests: currentUser.interests || []
      });
      
      setAvatar(currentUser.avatar || { type: 'emoji', emoji: '👤', initials: '' });
      
      // Initialize default preferences
      setLookingFor({
        genders: ['Male', 'Female', 'Non-binary'],
        ageRange: [22, 35],
        interests: ['Music', 'Travel', 'Art', 'Nature'],
        distance: 50,
        vibe: 'Fun',
        dealBreakers: []
      });

      console.log('📊 Profile complete status:', currentUser.isProfileComplete);
      
      // Determine initial view based on profile completion
      if (!currentUser.isProfileComplete) {
        console.log('📝 Profile incomplete - showing profile form');
        setCurrentView('profile');
        setOnboarding(true);
      } else {
        console.log('✅ Profile complete - showing home');
        setCurrentView('room');
        setOnboarding(false);
      }
    } else {
      setCurrentView('login');
    }
  }, [currentUser]);

  const isProfileComplete = () => {
    // Use the database value if available, otherwise check local state
    if (currentUser && currentUser.isProfileComplete !== undefined) {
      return currentUser.isProfileComplete;
    }
    
    // Fallback to local state check
    return !!(
      me.name &&
      me.age &&
      me.city &&
      me.bio &&
      me.interests &&
      me.interests.length > 0
    );
  };

  const goToRoom = () => setCurrentView('room');

  const returnToRoomFromProfile = () => {
    setIsEditingProfile(false);
    setCurrentView('room');
  };

  const handleLogout = async () => {
    await logout();
    setCurrentView('login');
    setMe({ name: '', age: '', gender: '', pronouns: '', city: '', bio: '', interests: [] });
    setAvatar({ type: 'emoji', image: null, emoji: '👤', initials: '' });
    setLookingFor({ genders: [], ageRange: [25, 35], interests: [], distance: 50, vibe: '', dealBreakers: [] });
    setIsOnline(false);
    setIsEditingProfile(false);
    setOnboarding(false);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'login':
        return <LoginForm />;
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
            onNext={() => { 
              setOnboarding(false); 
              setCurrentView('room'); 
            }}
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
            onEditProfile={() => { 
              if (isProfileComplete()) { 
                setIsEditingProfile(true); 
                setShowBackOnProfile(true); 
                setCurrentView('profile'); 
              } 
            }}
            onEditPreferences={() => { 
              if (isProfileComplete()) { 
                setCurrentView('preferences'); 
              } 
            }}
            onLogout={handleLogout}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {renderCurrentView()}
      </div>
    </div>
  );
}

export default App; 