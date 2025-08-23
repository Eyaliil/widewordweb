import React, { useState, useEffect } from 'react';

// Mock users data
const MOCK_USERS = [
  { id: 1, name: "Alex", emojiAvatar: "👩", interests: ["Travel", "Photography"], age: 28 },
  { id: 2, name: "Jordan", emojiAvatar: "👨", interests: ["Music", "Cooking"], age: 31 },
  { id: 3, name: "Sam", emojiAvatar: "💁", interests: ["Gaming", "Art"], age: 25 },
  { id: 4, name: "Taylor", emojiAvatar: "🙋", interests: ["Fitness", "Reading"], age: 29 },
  { id: 5, name: "Casey", emojiAvatar: "👸", interests: ["Travel", "Music"], age: 27 },
  { id: 6, name: "Riley", emojiAvatar: "🤴", interests: ["Cooking", "Fitness"], age: 30 },
  { id: 7, name: "Quinn", emojiAvatar: "💃", interests: ["Dance", "Photography"], age: 26 },
  { id: 8, name: "Avery", emojiAvatar: "🕺", interests: ["Gaming", "Travel"], age: 32 },
  { id: 9, name: "Morgan", emojiAvatar: "👯", interests: ["Art", "Music"], age: 24 },
  { id: 10, name: "Parker", emojiAvatar: "👫", interests: ["Fitness", "Cooking"], age: 29 },
  { id: 11, name: "Drew", emojiAvatar: "👬", interests: ["Reading", "Gaming"], age: 31 },
  { id: 12, name: "Blake", emojiAvatar: "👭", interests: ["Photography", "Travel"], age: 27 },
  { id: 13, name: "Emery", emojiAvatar: "👤", interests: ["Music", "Art"], age: 28 },
  { id: 14, name: "Rowan", emojiAvatar: "👩", interests: ["Cooking", "Fitness"], age: 30 },
  { id: 15, name: "Sage", emojiAvatar: "👨", interests: ["Gaming", "Reading"], age: 26 },
  { id: 16, name: "River", emojiAvatar: "💁", interests: ["Travel", "Photography"], age: 29 },
  { id: 17, name: "Skyler", emojiAvatar: "🙋", interests: ["Art", "Music"], age: 31 },
  { id: 18, name: "Finley", emojiAvatar: "👸", interests: ["Fitness", "Cooking"], age: 25 },
  { id: 19, name: "Hayden", emojiAvatar: "🤴", interests: ["Reading", "Gaming"], age: 28 },
  { id: 20, name: "Reese", emojiAvatar: "💃", interests: ["Photography", "Travel"], age: 30 }
];

// Available interests
const INTERESTS = ["Travel", "Photography", "Music", "Cooking", "Gaming", "Art", "Fitness", "Reading", "Dance"];

// Pronouns options
const PRONOUNS = ["She/Her", "He/Him", "They/Them", "She/They", "He/They", "Any/All"];

// Gender options
const GENDERS = ["Women", "Men", "Non-binary", "All genders"];

// Vibe options
const VIBES = ["Casual", "Serious", "Unsure"];

// Deal-breakers
const DEAL_BREAKERS = ["Smoking", "Drinking", "Politics", "Religion", "Kids", "Pets", "Long distance"];

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
    type: '', // 'image' or 'emoji'
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
  const [newMessage, setNewMessage] = useState('');

  // Load state from localStorage on mount
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('datingAppState');
    if (raw) {
      const parsed = JSON.parse(raw);
      setStep(parsed.step ?? 1);
      setMe(parsed.me ?? me);
      setAvatar(parsed.avatar ?? avatar);
      setLookingFor(parsed.lookingFor ?? lookingFor);
      setIsOnline(parsed.isOnline ?? false);
      setMatch(parsed.match ?? null);
      setMessages((parsed.messages ?? []).map(m => ({...m, timestamp: new Date(m.timestamp)})));
    }
    setLoaded(true);
  }, []);
  
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('datingAppState', JSON.stringify({
      step, me, avatar, lookingFor, isOnline, match,
      messages: messages.map(m => ({...m, timestamp: m.timestamp?.valueOf?.() ?? Date.now()})),
    }));
  }, [loaded, step, me, avatar, lookingFor, isOnline, match, messages]);
  
  // Validation functions
  const isStep1Valid = () => {
    return me.name.trim() && 
           me.age >= 18 && me.age <= 99 && 
           me.pronouns && 
           me.bio.trim() && me.bio.length <= 200 && 
           me.interests.length > 0;
  };

  const isStep2Valid = () => {
    return avatar.type && ((avatar.type === 'image' && avatar.image) || (avatar.type === 'emoji' && avatar.emoji));
  };

  const isStep3Valid = () => {
    return lookingFor.genders.length > 0 && 
           lookingFor.interests.length > 0 && 
           lookingFor.vibe;
  };

  // Handle file upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) { // 5MB limit
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatar({
          type: 'image',
          image: e.target.result,
          emoji: '',
          initials: ''
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setAvatar({
      type: 'emoji',
      image: null,
      emoji,
      initials: ''
    });
  };

  // Handle initials input
  const handleInitialsChange = (initials) => {
    setAvatar({
      type: 'emoji',
      image: null,
      emoji: '',
      initials: initials.toUpperCase().slice(0, 2)
    });
  };

  // Go online and find match
  const goOnline = () => {
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
    }, Math.random() * 3000 + 5000); // 5-8 seconds
  };

  // Send message
  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: messages.length + 1,
        sender: 'me',
        text: newMessage.trim(),
        timestamp: new Date()
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  // Handle Enter key in chat
  const handleChatKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // Leave chat
  const leaveChat = () => {
    setShowChat(false);
    setMatch(null);
    setMessages([]);
    setIsOnline(false);
  };

  // Progress bar component
  const ProgressBar = () => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-300"
        style={{ width: `${(step / 5) * 100}%` }}
      ></div>
    </div>
  );

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex justify-between items-center mb-6">
      {[1, 2, 3, 4, 5].map((stepNum) => (
        <div key={stepNum} className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            stepNum <= step 
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' 
              : 'bg-gray-200 text-gray-500'
          }`}>
            {stepNum}
          </div>
          <div className="text-xs text-gray-500 mt-1 hidden sm:block">
            {stepNum === 1 && 'About You'}
            {stepNum === 2 && 'Avatar'}
            {stepNum === 3 && 'Looking For'}
            {stepNum === 4 && 'The Room'}
            {stepNum === 5 && 'Chat'}
          </div>
        </div>
      ))}
    </div>
  );

  // Step 1: About You
  const renderStep1 = () => (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Tell us about yourself</h1>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
          <input
            type="text"
            value={me.name}
            onChange={(e) => setMe({...me, name: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Age *</label>
          <input
            type="number"
            min="18"
            max="99"
            value={me.age}
            onChange={(e) => setMe({...me, age: parseInt(e.target.value) || ''})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="18-99"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Pronouns *</label>
          <select
            value={me.pronouns}
            onChange={(e) => setMe({...me, pronouns: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="">Select pronouns</option>
            {PRONOUNS.map(pronoun => (
              <option key={pronoun} value={pronoun}>{pronoun}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City (optional)</label>
          <input
            type="text"
            value={me.city}
            onChange={(e) => setMe({...me, city: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="Enter your city"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio * ({me.bio.length}/200)
          </label>
          <textarea
            value={me.bio}
            onChange={(e) => setMe({...me, bio: e.target.value})}
            maxLength={200}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="Tell us about yourself..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Interests *</label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map(interest => (
              <button
                key={interest}
                onClick={() => {
                  const newInterests = me.interests.includes(interest)
                    ? me.interests.filter(i => i !== interest)
                    : [...me.interests, interest];
                  setMe({...me, interests: newInterests});
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  me.interests.includes(interest)
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={() => setStep(2)}
          disabled={!isStep1Valid()}
          className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-pink-600 hover:to-purple-600 transition-all duration-200"
        >
          Next
        </button>
      </div>
    </div>
  );

  // Step 2: Avatar
  const renderStep2 = () => (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Choose your avatar</h1>
      
      <div className="space-y-8">
        {/* Image Upload Option */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            accept="image/jpg,image/jpeg,image/png"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <div className="space-y-4">
              <div className="text-4xl">📷</div>
              <div>
                <p className="text-lg font-medium text-gray-700">Upload a photo</p>
                <p className="text-sm text-gray-500">JPG or PNG, max 5MB</p>
              </div>
            </div>
          </label>
          
          {avatar.type === 'image' && avatar.image && (
            <div className="mt-4">
              <img 
                src={avatar.image} 
                alt="Preview" 
                className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white shadow-lg"
              />
            </div>
          )}
        </div>

        {/* Emoji/Initials Option */}
        <div className="border-2 border-gray-300 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4 text-center">Or choose emoji/initials</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Emoji</label>
              <div className="flex flex-wrap gap-2">
                {['💕', '😊', '🌟', '🎭', '🎨', '🎵', '🏃', '📚', '✈️', '🍳'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiSelect(emoji)}
                    className={`w-12 h-12 text-2xl rounded-full flex items-center justify-center transition-colors ${
                      avatar.type === 'emoji' && avatar.emoji === emoji
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Or use initials</label>
              <input
                type="text"
                value={avatar.initials}
                onChange={(e) => handleInitialsChange(e.target.value)}
                maxLength={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-center text-2xl font-bold"
                placeholder="AB"
              />
            </div>
          </div>

          {(avatar.type === 'emoji' && (avatar.emoji || avatar.initials)) && (
            <div className="mt-4 text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full mx-auto flex items-center justify-center text-6xl border-4 border-white shadow-lg">
                {avatar.initials || avatar.emoji}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={() => setStep(1)}
          className="px-8 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors duration-200"
        >
          Back
        </button>
        <button
          onClick={() => setStep(3)}
          disabled={!isStep2Valid()}
          className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-pink-600 hover:to-purple-600 transition-all duration-200"
        >
          Next
        </button>
      </div>
    </div>
  );

  // Step 3: Who you're looking for
  const renderStep3 = () => (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Who are you looking for?</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred genders *</label>
            <div className="flex flex-wrap gap-2">
              {GENDERS.map(gender => (
                <button
                  key={gender}
                  onClick={() => {
                    const newGenders = lookingFor.genders.includes(gender)
                      ? lookingFor.genders.filter(g => g !== gender)
                      : [...lookingFor.genders, gender];
                    setLookingFor({...lookingFor, genders: newGenders});
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    lookingFor.genders.includes(gender)
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age range: {lookingFor.ageRange[0]} - {lookingFor.ageRange[1]}
            </label>
            <div className="flex gap-4 items-center">
              <input
                type="range"
                min="18"
                max="99"
                value={lookingFor.ageRange[0]}
                onChange={(e) => setLookingFor({
                  ...lookingFor, 
                  ageRange: [parseInt(e.target.value), lookingFor.ageRange[1]]
                })}
                className="flex-1"
              />
              <span className="text-gray-500">to</span>
              <input
                type="range"
                min="18"
                max="99"
                value={lookingFor.ageRange[1]}
                onChange={(e) => setLookingFor({
                  ...lookingFor, 
                  ageRange: [lookingFor.ageRange[0], parseInt(e.target.value)]
                })}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Interests *</label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(interest => (
                <button
                  key={interest}
                  onClick={() => {
                    const newInterests = lookingFor.interests.includes(interest)
                      ? lookingFor.interests.filter(i => i !== interest)
                      : [...lookingFor.interests, interest];
                    setLookingFor({...lookingFor, interests: newInterests});
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    lookingFor.interests.includes(interest)
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum distance: {lookingFor.distance}km
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={lookingFor.distance}
              onChange={(e) => setLookingFor({...lookingFor, distance: parseInt(e.target.value)})}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vibe *</label>
            <div className="flex gap-2">
              {VIBES.map(vibe => (
                <button
                  key={vibe}
                  onClick={() => setLookingFor({...lookingFor, vibe})}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                    lookingFor.vibe === vibe
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {vibe}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Deal-breakers</label>
            <div className="flex flex-wrap gap-2">
              {DEAL_BREAKERS.map(dealBreaker => (
                <button
                  key={dealBreaker}
                  onClick={() => {
                    const newDealBreakers = lookingFor.dealBreakers.includes(dealBreaker)
                      ? lookingFor.dealBreakers.filter(d => d !== dealBreaker)
                      : [...lookingFor.dealBreakers, dealBreaker];
                    setLookingFor({...lookingFor, dealBreakers: newDealBreakers});
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    lookingFor.dealBreakers.includes(dealBreaker)
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {dealBreaker}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Card (md+) */}
        <div className="hidden md:block">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 sticky top-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">About You</h3>
            
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full mx-auto flex items-center justify-center text-3xl border-2 border-white shadow-lg">
                  {avatar.type === 'image' && avatar.image ? (
                    <img src={avatar.image} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    avatar.initials || avatar.emoji
                  )}
                </div>
                <p className="font-medium text-gray-800 mt-2">{me.name}</p>
                <p className="text-sm text-gray-500">{me.age} • {me.pronouns}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">{me.bio}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Interests:</p>
                <div className="flex flex-wrap gap-1">
                  {me.interests.map(interest => (
                    <span key={interest} className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={() => setStep(2)}
          className="px-8 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors duration-200"
        >
          Back
        </button>
        <button
          onClick={() => setStep(4)}
          disabled={!isStep3Valid()}
          className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-pink-600 hover:to-purple-600 transition-all duration-200"
        >
          Finish
        </button>
      </div>
    </div>
  );

  // Step 4: The Room
  const renderStep4 = () => (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">The Room</h1>
      
      {!isOnline ? (
        <div className="text-center mb-8">
          <button
            onClick={goOnline}
            className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg text-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-200 shadow-lg"
          >
            Go Online
          </button>
        </div>
      ) : isMatching ? (
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 px-6 py-3 bg-pink-100 text-pink-700 rounded-full">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-500"></div>
            <span className="font-medium">Matching...</span>
          </div>
        </div>
      ) : match ? (
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 px-6 py-3 bg-green-100 text-green-700 rounded-full">
            <span className="font-medium">Matched!</span>
          </div>
          <button
            onClick={() => setShowChat(true)}
            className="ml-4 px-6 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors duration-200"
          >
            Open Chat
          </button>
        </div>
      ) : null}
      
      {/* Grid of users */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {MOCK_USERS.slice(0, 20).map((user) => (
          <div
            key={user.id}
            className={`bg-white rounded-2xl shadow-lg p-4 border-2 transition-all duration-200 cursor-pointer ${
              match && match.id === user.id 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 hover:border-pink-300 hover:shadow-xl'
            }`}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto flex items-center justify-center text-2xl mb-3 border-2 border-white shadow-lg">
                {user.emojiAvatar}
              </div>
              <h3 className="font-medium text-gray-800 text-sm mb-1">{user.name}</h3>
              <p className="text-xs text-gray-500 mb-2">{user.age}</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {user.interests.slice(0, 2).map(interest => (
                  <span key={interest} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {interest}
                  </span>
                ))}
              </div>
              {match && match.id === user.id && (
                <div className="mt-2">
                  <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-medium">
                    Matched!
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 text-center text-gray-600">
        <p className="text-lg">Scroll to discover more people in The Room</p>
        <p className="text-sm mt-2">Tap on avatars to learn more about them</p>
      </div>
    </div>
  );

  // Step 5: Chat
  const renderChat = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-96 flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center space-x-3 p-4 border-b border-gray-200">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-lg">
            {match.emojiAvatar}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">{match.name}</h3>
            <span className="text-sm text-green-600 font-medium">Matched!</span>
          </div>
          <button
            onClick={leaveChat}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl ${
                  message.sender === 'me'
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === 'me' ? 'text-pink-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleChatKeyPress}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="px-4 py-2 bg-pink-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-600 transition-colors duration-200"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-800">WideWordWeb</h1>
            <div className="flex-1 max-w-md">
              <ProgressBar />
            </div>
            <div className="text-sm text-gray-600">
              Step {step} of 5
            </div>
          </div>
          <StepIndicator />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>

      {/* Chat Modal */}
      {showChat && match && renderChat()}
    </div>
  );
}

export default App; 