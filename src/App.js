import React, { useState, useEffect } from 'react';
import ProfileForm from './components/ProfileForm';
import PreferencesForm from './components/PreferencesForm';
import TheRoom from './components/TheRoom';
import ChatModal from './components/ChatModal';
import Header from './components/Header';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabaseClient';

function App() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('room');
  const [me, setMe] = useState({ name: '', age: '', pronouns: '', city: '', bio: '', interests: [] });
  const [avatar, setAvatar] = useState({ type: '', image: null, emoji: '💕', initials: '' });
  const [lookingFor, setLookingFor] = useState({ genders: [], ageRange: [25, 35], interests: [], distance: 50, vibe: '', dealBreakers: [] });
  const [isOnline, setIsOnline] = useState(false);
  const [match, setMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isMatching, setIsMatching] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showBackOnProfile, setShowBackOnProfile] = useState(true);
  const [onboarding, setOnboarding] = useState(false);
  const [profileCompleteDb, setProfileCompleteDb] = useState(false);

  const isProfileComplete = () => {
    return me.name && me.age && me.pronouns && me.bio && me.interests.length > 0 &&
           avatar.type && (avatar.image || avatar.emoji || avatar.initials) &&
           lookingFor.genders.length > 0 && lookingFor.interests.length > 0 && lookingFor.vibe;
  };

  useEffect(() => {
    const ensureProfileThenRoute = async () => {
      if (!user) return;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, age, pronouns, bio')
          .eq('id', user.id)
          .maybeSingle();
        const fieldsOk = !!(profile && profile.name && profile.age && profile.pronouns && profile.bio);
        const { count } = await supabase
          .from('user_interests')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        const interestsOk = (count ?? 0) > 0;
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
  }, [user]);

  const goToStep = (step) => setCurrentView(step);
  const goToRoom = () => setCurrentView('room');

  const returnToRoomFromProfile = () => {
    setIsEditingProfile(false);
    setCurrentView('room');
  };

  const leaveChat = () => {
    setShowChat(false);
    setMatch(null);
    setMessages([]);
    setIsOnline(false);
  };

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
          <TheRoom
            me={me}
            avatar={avatar}
            isProfileComplete={isProfileComplete()}
            isOnline={isOnline}
            setIsOnline={setIsOnline}
            isMatching={isMatching}
            setIsMatching={setIsMatching}
            match={match}
            setMatch={setMatch}
            setMessages={setMessages}
            setShowChat={setShowChat}
            onEditProfile={() => { if (profileCompleteDb || isProfileComplete()) { setIsEditingProfile(true); setShowBackOnProfile(true); setCurrentView('profile'); } }}
            onEditPreferences={() => { if (profileCompleteDb || isProfileComplete()) { setCurrentView('preferences'); } }}
          />
        );
    }
  };

  const showHeader = false;

  return (
    <div className="min-h-screen bg-white">
      {showHeader && <Header currentView={currentView} />}      
      <div className="container mx-auto px-4 py-8">
        {renderCurrentView()}
      </div>

      {showChat && match && (
        <ChatModal
          match={match}
          messages={messages}
          setMessages={setMessages}
          onClose={() => setShowChat(false)}
          onLeaveChat={leaveChat}
        />
      )}
    </div>
  );
}

export default App; 