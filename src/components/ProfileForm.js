import React, { useEffect, useState, useMemo } from 'react';
import { getInterests, getPronouns, getGenders } from '../services/lookupService';
import { isProfileValid } from '../utils/validation';
import { useAuth } from '../context/AuthContext';

const ProfileFormInternal = ({ me, setMe, avatar, setAvatar, onNext, onBack, showBack = true }) => {
  const { updateUserProfile } = useAuth();
  const [originalInterests, setOriginalInterests] = useState(me.interests || []);
  const [interestOptions, setInterestOptions] = useState([]);
  const [pronounOptions, setPronounOptions] = useState([]);
  const [genderOptions, setGenderOptions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [originalProfile, setOriginalProfile] = useState({ name: '', age: '', gender: '', pronouns: '', city: '', bio: '' });

  // Prefill form with existing profile from DB (once on mount) and load user_interests (about me)
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        // load lookup options
        const [interests, pronouns, genders] = await Promise.all([getInterests(), getPronouns(), getGenders()]);
        if (mounted) {
          setInterestOptions(interests);
          setPronounOptions(pronouns);
          setGenderOptions(genders);
        }
        // Data is already loaded from currentUser in App.js
        if (mounted) {
          setOriginalProfile({
            name: me.name || '',
            age: me.age || '',
            gender: me.gender || '',
            pronouns: me.pronouns || '',
            city: me.city || '',
            bio: me.bio || ''
          });
          setOriginalInterests(me.interests || []);
        }
      } catch (e) {
        if (mounted) setLoadError(e.message || 'Failed to load your profile');
      }
    };
    loadData();
    return () => { mounted = false; };
  }, [setMe]);

  const interestsDirty = useMemo(() => {
    const a = new Set(originalInterests);
    const b = new Set(me.interests || []);
    if (a.size !== b.size) return true;
    for (const v of a) if (!b.has(v)) return true;
    return false;
  }, [originalInterests, me.interests]);

  const profileDirty = useMemo(() => {
    return (
      (me.name || '') !== (originalProfile.name || '') ||
      (me.age || '') !== (originalProfile.age || '') ||
      (me.gender || '') !== (originalProfile.gender || '') ||
      (me.pronouns || '') !== (originalProfile.pronouns || '') ||
      (me.city || '') !== (originalProfile.city || '') ||
      (me.bio || '') !== (originalProfile.bio || '')
    );
  }, [me.name, me.age, me.gender, me.pronouns, me.city, me.bio, originalProfile]);

  const isDirty = profileDirty || interestsDirty;

  const saveMyInterests = async () => {
    // Save interests to database
    console.log('Saving interests:', me.interests);
    setOriginalInterests(me.interests || []);
    return Promise.resolve();
  };

  const handleNext = async () => {
    if (!isProfileValid(me)) {
      return;
    }

    setSaving(true);
    try {
      // Save profile data to database
      const profileData = {
        name: me.name,
        age: parseInt(me.age),
        city: me.city,
        bio: me.bio,
        avatar: avatar,
        interests: me.interests
      };

      const result = await updateUserProfile(profileData);
      
      if (result.success) {
        console.log('✅ Profile saved successfully');
        onNext();
      } else {
        console.error('❌ Failed to save profile:', result.error);
        setLoadError('Failed to save profile. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      setLoadError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatar({ type: 'image', image: ev.target.result, emoji: '', initials: '' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setAvatar({ type: 'emoji', image: null, emoji, initials: '' });
  };

  const handleInitialsChange = (initials) => {
    setAvatar({ type: 'emoji', image: null, emoji: '', initials: initials.toUpperCase().slice(0, 2) });
  };

  return (
    <div className="max-w-2xl mx-auto relative pt-12">
      <div className="absolute top-2 left-0">
        {showBack && (
          <button onClick={onBack} aria-label="Back" className="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
            <span className="text-xl">←</span>
          </button>
        )}
      </div>
      <div className="absolute top-2 right-0">
        <button
          onClick={handleNext}
          disabled={!isProfileValid(me) || saving || !isDirty}
          className={`${(!isProfileValid(me) || saving || !isDirty) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600'} px-6 py-2 font-semibold rounded-lg transition-all duration-200`}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Tell us about yourself</h1>
      {loadError && (
        <div className="mb-4 px-4 py-2 rounded bg-red-50 text-red-700 text-sm">{loadError}</div>
      )}
      
      <div className="space-y-6">
        {/* Avatar chooser merged here */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input type="file" accept="image/jpg,image/jpeg,image/png" onChange={handleImageUpload} className="hidden" id="image-upload" />
          <label htmlFor="image-upload" className="cursor-pointer">
            <div className="space-y-2">
              <div className="text-4xl">📷</div>
              <div className="text-sm text-gray-600">Upload a photo (JPG/PNG, 5MB)</div>
            </div>
          </label>
          {avatar?.type === 'image' && avatar?.image && (
            <div className="mt-4">
              <img src={avatar.image} alt="Preview" className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white shadow" />
            </div>
          )}
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">Or choose emoji/initials</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {['💕','😊','🌟','🎭','🎨','🎵','🏃','📚','✈️','🍳'].map(emoji => (
              <button
                key={emoji}
                onClick={() => handleEmojiSelect(emoji)}
                className={`w-10 h-10 text-xl rounded-full flex items-center justify-center ${
                  avatar?.type === 'emoji' && avatar?.emoji === emoji ? 'bg-pink-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <label className="block text-xs text-gray-600 mb-1">Or use initials</label>
            <input type="text" value={avatar?.initials || ''} onChange={(e) => handleInitialsChange(e.target.value)} maxLength={2} className="w-full px-3 py-2 border border-gray-300 rounded text-center text-xl font-bold" placeholder="AB" />
          </div>
          {(avatar?.type === 'emoji' && (avatar?.emoji || avatar?.initials)) && (
            <div className="mt-3 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full mx-auto flex items-center justify-center text-4xl border-4 border-white shadow">
                {avatar.initials || avatar.emoji}
              </div>
            </div>
          )}
        </div>

        {/* Profile fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
          <input type="text" value={me.name} onChange={(e) => setMe({...me, name: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" placeholder="Enter your name" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Age *</label>
          <input type="number" min="18" max="99" value={me.age} onChange={(e) => setMe({...me, age: parseInt(e.target.value) || ''})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" placeholder="18-99" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
          <select value={me.gender || ''} onChange={(e) => setMe({...me, gender: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
            <option value="">Select gender</option>
            {genderOptions.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Pronouns (optional)</label>
          <select value={me.pronouns || ''} onChange={(e) => setMe({...me, pronouns: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
            <option value="">Select pronouns</option>
            {pronounOptions.map(pronoun => (
              <option key={pronoun} value={pronoun}>{pronoun}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City (optional)</label>
          <input type="text" value={me.city} onChange={(e) => setMe({...me, city: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" placeholder="Enter your city" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bio * ({me.bio.length}/200)</label>
          <textarea value={me.bio} onChange={(e) => setMe({...me, bio: e.target.value})} maxLength={200} rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" placeholder="Tell us about yourself..." />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">My Interests *</label>
          <div className="flex flex-wrap gap-2">
            {interestOptions.map(interest => (
              <button
                key={interest}
                onClick={() => {
                  const newInterests = (me.interests || []).includes(interest)
                    ? (me.interests || []).filter(i => i !== interest)
                    : ([...(me.interests || []), interest]);
                  setMe({...me, interests: newInterests});
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  (me.interests || []).includes(interest)
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {interest}
              </button>
            ))}
            {interestOptions.length === 0 && (
              <span className="text-sm text-gray-500">No interests available. Seed the interests table.</span>
            )}
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default ProfileFormInternal; 