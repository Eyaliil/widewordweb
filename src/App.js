import React, { useState } from 'react';
import ProfileForm from './components/ProfileForm';
import AvatarForm from './components/AvatarForm';
import PreferencesForm from './components/PreferencesForm';
import TheRoom from './components/TheRoom';
import ChatModal from './components/ChatModal';

function App() {
  const [currentView, setCurrentView] = useState('room'); // 'room', 'profile', 'avatar', 'preferences'
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

  // Check if profile is complete
  const isProfileComplete = () => {
    return me.name && me.age && me.pronouns && me.bio && me.interests.length > 0 &&
           avatar.type && lookingFor.genders.length > 0 && lookingFor.interests.length > 0 && lookingFor.vibe;
  };

  // Navigation functions
  const goToStep = (step) => setCurrentView(step);
  const goToRoom = () => setCurrentView('room');

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
        return <ProfileForm me={me} setMe={setMe} onNext={() => goToStep('avatar')} onBack={goToRoom} />;
      case 'avatar':
        return <AvatarForm avatar={avatar} setAvatar={setAvatar} onNext={() => goToStep('preferences')} onBack={() => goToStep('profile')} />;
      case 'preferences':
        return <PreferencesForm me={me} avatar={avatar} lookingFor={lookingFor} setLookingFor={setLookingFor} onNext={goToRoom} onBack={() => goToStep('avatar')} />;
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
            onEditProfile={() => goToStep('profile')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-white">
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