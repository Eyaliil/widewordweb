import React, { useState } from 'react';
import Header from './components/Header';
import Step1 from './components/Step1';
import Step2 from './components/Step2';
import Step3 from './components/Step3';
import Step4 from './components/Step4';
import ChatModal from './components/ChatModal';

function App() {
  const [step, setStep] = useState(1);
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

  // Navigation functions
  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  // Leave chat
  const leaveChat = () => {
    setShowChat(false);
    setMatch(null);
    setMessages([]);
    setIsOnline(false);
  };

  // Render current step
  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return <Step1 me={me} setMe={setMe} onNext={nextStep} />;
      case 2:
        return <Step2 avatar={avatar} setAvatar={setAvatar} onNext={nextStep} onBack={prevStep} />;
      case 3:
        return <Step3 me={me} avatar={avatar} lookingFor={lookingFor} setLookingFor={setLookingFor} onNext={nextStep} onBack={prevStep} />;
      case 4:
        return <Step4 me={me} isOnline={isOnline} setIsOnline={setIsOnline} isMatching={isMatching} setIsMatching={setIsMatching} match={match} setMatch={setMatch} setMessages={setMessages} setShowChat={setShowChat} />;
      default:
        return <div>Step not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100">
      <Header step={step} />

      <div className="container mx-auto px-4 py-8">
        {renderCurrentStep()}
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