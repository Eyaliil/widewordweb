import React, { useState } from 'react';
import ProfileForm from './components/ProfileForm';
import PreferencesForm from './components/PreferencesForm';
import TheRoom from './components/TheRoom';
import ChatModal from './components/ChatModal';
import Header from './components/Header';

function App() {
  const [currentView, setCurrentView] = useState('room'); // 'room', 'profile', 'preferences'
  const [me, setMe] = useState({
    name: '',
    age: '',
    pronouns: '',
    city: '',
    bio: '',
    interests: []
  });
  const [avatar, setAvatar] = useState({
    type: '',
    image: null,
    emoji: '💕',
    initials: ''
  });
  const [lookingFor, setLookingFor] = useState({
    genders: [],
    ageRange: [25, 35],
    interests: [],
    distance: 50,
    vibe: '',
    dealBreakers: []
  });
  const [isOnline, setIsOnline] = useState(false);
  const [match, setMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isMatching, setIsMatching] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Check if profile is complete
  const isProfileComplete = () => {
    return me.name && me.age && me.pronouns && me.bio && me.interests.length > 0 &&
           avatar.type && (avatar.image || avatar.emoji || avatar.initials) &&
           lookingFor.genders.length > 0 && lookingFor.interests.length > 0 && lookingFor.vibe;
  };

  // Navigation helpers
  const goToStep = (step) => setCurrentView(step);
  const goToRoom = () => setCurrentView('room');

  const returnToRoomFromProfile = () => {
    setIsEditingProfile(false);
    setCurrentView('room');
  };

  // Leave chat
  const leaveChat = () => {
    setShowChat(false);
    setMatch(null);
    setMessages([]);
    setIsOnline(false);
  };

  // Render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'profile':
        // Saving or back returns to room; header visibility is controlled by isEditingProfile
        return <ProfileForm me={me} setMe={setMe} avatar={avatar} setAvatar={setAvatar} onNext={returnToRoomFromProfile} onBack={returnToRoomFromProfile} />;
      case 'preferences':
        return <PreferencesForm me={me} avatar={avatar} lookingFor={lookingFor} setLookingFor={setLookingFor} onNext={goToRoom} onBack={() => goToStep('profile')} />;
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
            onEditProfile={() => { setIsEditingProfile(isProfileComplete()); setCurrentView('profile'); }}
            onEditPreferences={() => goToStep('preferences')}
          />
        );
    }
  };

  const showHeader = currentView !== 'room' && !(currentView === 'profile' && isEditingProfile);

  return (
    <div className="min-h-screen bg-white">
      {/* Show header when first-time filling; hide in profile edit mode */}
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