import React, { useState, useEffect } from 'react';
import ProfileForm from './components/profile/ProfileForm';
import PreferencesForm from './components/PreferencesForm';
import Home from './components/Home';
import ChatPage from './components/messaging/ChatPage';
import LoginForm from './components/auth/LoginForm';
import { useAuth } from './context/AuthContext';

function App() {
  const { currentUser, logout } = useAuth();
  const [currentView, setCurrentView] = useState('login');
  const [me, setMe] = useState({ name: '', age: '', gender: '', pronouns: '', city: '', bio: '', interests: [], userImages: [] });
  const [avatar, setAvatar] = useState({ type: 'emoji', image: null, emoji: '👤', initials: '' });
  const [lookingFor, setLookingFor] = useState({ genders: [], ageRange: [25, 35], interests: [], distance: 50, vibe: '', dealBreakers: [] });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showBackOnProfile, setShowBackOnProfile] = useState(true);
  const [onboarding, setOnboarding] = useState(false);
  const [chatTargetMatchId, setChatTargetMatchId] = useState(null);

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
        interests: currentUser.interests || [],
        userImages: currentUser.userImages || []
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
      // Only auto-navigate on first load when currentView is 'login'
      if (currentView === 'login') {
        if (!currentUser.isProfileComplete) {
          console.log('📝 Profile incomplete - showing profile form');
          setCurrentView('profile');
          setOnboarding(true);
        } else {
          console.log('✅ Profile complete - showing home');
          setCurrentView('room');
        }
      }
      // If already in profile or preferences during onboarding, don't change
      // This prevents useEffect from overriding user navigation
    } else {
      setCurrentView('login');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setMe({ name: '', age: '', gender: '', pronouns: '', city: '', bio: '', interests: [], userImages: [] });
    setAvatar({ type: 'emoji', image: null, emoji: '👤', initials: '' });
    setLookingFor({ genders: [], ageRange: [25, 35], interests: [], distance: 50, vibe: '', dealBreakers: [] });
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
            onNext={() => {
              if (onboarding) {
                console.log('🚀 Moving to preferences form');
                setCurrentView('preferences');
              } else {
                returnToRoomFromProfile();
              }
            }}
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
      case 'chat':
        return (
          <ChatPage
            onBack={() => {
              setCurrentView('room');
              setChatTargetMatchId(null);
            }}
            initialMatchId={chatTargetMatchId}
          />
        );
      case 'room':
      default:
        return (
          <Home
            me={me}
            avatar={avatar}
            isProfileComplete={isProfileComplete()}
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
            onNavigateToChat={(matchId) => {
              setChatTargetMatchId(matchId || null);
              setCurrentView('chat');
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {currentView === 'chat' ? (
        renderCurrentView()
      ) : (
        <div className="container mx-auto px-4 py-8">
          {renderCurrentView()}
        </div>
      )}
    </div>
  );
}

export default App; 