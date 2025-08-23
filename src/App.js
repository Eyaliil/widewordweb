import React, { useState } from 'react';
import Header from './components/Header';
import Step1 from './components/Step1';
import Step2 from './components/Step2';
import Step3 from './components/Step3';
import Step4 from './components/Step4';
import ChatModal from './components/ChatModal';

function App() {
  const [currentView, setCurrentView] = useState('room'); // 'room', 'step1', 'step2', 'step3'
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
      case 'step1':
        return <Step1 me={me} setMe={setMe} onNext={() => goToStep('step2')} onBack={goToRoom} />;
      case 'step2':
        return <Step2 avatar={avatar} setAvatar={setAvatar} onNext={() => goToStep('step3')} onBack={() => goToStep('step1')} />;
      case 'step3':
        return <Step3 me={me} avatar={avatar} lookingFor={lookingFor} setLookingFor={setLookingFor} onNext={goToRoom} onBack={() => goToStep('step2')} />;
      case 'room':
      default:
        return (
          <Step4 
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
            onEditProfile={() => goToStep('step1')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100">
      <Header currentView={currentView} />

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