import React, { useEffect, useState, useMemo } from 'react';
import { RiArrowLeftLine, RiCheckLine, RiCloseCircleLine, RiAddCircleLine } from 'react-icons/ri';
import { getInterests, getPronouns, getGenders } from '../../services/lookupService';
import { isProfileValid } from '../../utils/validation';
import { useAuth } from '../../context/AuthContext';

const ProfileFormInternal = ({ me, setMe, avatar, setAvatar, onNext, onBack, showBack = true, onCancel, showCancel = false }) => {
  const { updateUserProfile } = useAuth();
  const [originalInterests, setOriginalInterests] = useState(me.interests || []);
  const [interestOptions, setInterestOptions] = useState([]);
  const [pronounOptions, setPronounOptions] = useState([]);
  const [genderOptions, setGenderOptions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [originalProfile, setOriginalProfile] = useState({ name: '', age: '', gender: '', pronouns: '', city: '', bio: '' });
  const [userImages, setUserImages] = useState([]); // Array of up to 3 image URLs
  const [originalUserImages, setOriginalUserImages] = useState([]); // Original images to track changes
  const [originalAvatar, setOriginalAvatar] = useState({ type: 'emoji', image: null, emoji: '👤', initials: '' }); // Original avatar to track changes

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
          // Load existing user images if any
          setUserImages(me.userImages || []);
          setOriginalUserImages(me.userImages || []);
          // Load original avatar
          setOriginalAvatar(avatar || { type: 'emoji', image: null, emoji: '👤', initials: '' });
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

  const imagesDirty = useMemo(() => {
    if (userImages.length !== originalUserImages.length) return true;
    return userImages.some((img, index) => img !== originalUserImages[index]);
  }, [userImages, originalUserImages]);

  const avatarDirty = useMemo(() => {
    if (avatar.type !== originalAvatar.type) return true;
    if (avatar.image !== originalAvatar.image) return true;
    if (avatar.emoji !== originalAvatar.emoji) return true;
    if (avatar.initials !== originalAvatar.initials) return true;
    return false;
  }, [avatar, originalAvatar]);

  const isDirty = profileDirty || interestsDirty || imagesDirty || avatarDirty;

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

    // Require at least one photo
    if (userImages.length === 0) {
      setLoadError('Please upload at least one photo.');
      return;
    }

    setSaving(true);
    try {
      // Save profile data to database
      const profileData = {
        name: me.name,
        age: parseInt(me.age),
        gender: me.gender,
        pronouns: me.pronouns,
        city: me.city,
        bio: me.bio,
        avatar: avatar,
        interests: me.interests,
        userImages: userImages // Add user images array
      };

      const result = await updateUserProfile(profileData);
      
      if (result.success) {
        console.log('✅ Profile saved successfully');
        // Update original images to match current state
        setOriginalUserImages([...userImages]);
        // Update original avatar to match current state
        setOriginalAvatar({ ...avatar });
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

  const handleImageUpload = (e, index) => {
    const files = Array.from(e.target.files);
    const newImages = [...userImages];
    
    files.forEach((file) => {
      if (file && file.size <= 5 * 1024 * 1024 && newImages.length < 3) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const newImage = ev.target.result;
          if (newImages.length < 3) {
            if (index !== undefined && index < newImages.length) {
              // Replace existing image
              newImages[index] = newImage;
            } else {
              // Add new image
              newImages.push(newImage);
            }
            setUserImages([...newImages]);
            
            // Set first image as avatar
            if (newImages.length > 0) {
              setAvatar({ type: 'image', image: newImages[0], emoji: '', initials: '' });
            }
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleRemoveImage = (index) => {
    const newImages = userImages.filter((_, i) => i !== index);
    setUserImages(newImages);
    
    // Update avatar to first remaining image
    if (newImages.length > 0) {
      setAvatar({ type: 'image', image: newImages[0], emoji: '', initials: '' });
    } else {
      setAvatar({ type: 'emoji', image: null, emoji: '👤', initials: '' });
    }
  };



  return (
    <div className="min-h-screen bg-[#FBEEDA] py-8">
      <div className="max-w-2xl mx-auto px-4 relative">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {showBack && (
              <button onClick={onBack} aria-label="Back" className="px-3 py-2 rounded-lg text-[#8B6E58] hover:bg-[#F9E6CA] hover:text-[#40002B] transition-colors duration-200 flex items-center gap-2">
                <RiArrowLeftLine className="text-xl" />
                <span>Back</span>
              </button>
            )}
            {showCancel && onCancel && (
              <button onClick={onCancel} aria-label="Cancel" className="px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center gap-2">
                <RiCloseCircleLine className="text-xl" />
                <span>Cancel</span>
              </button>
            )}
          </div>
          <button
            onClick={handleNext}
            disabled={!isProfileValid(me) || saving || !isDirty || userImages.length === 0}
            className={`px-6 py-2 font-semibold rounded-lg transition-all duration-250 flex items-center gap-2 ${
              (!isProfileValid(me) || saving || !isDirty || userImages.length === 0) 
                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-[#7B002C] to-[#40002B] text-white hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <RiCheckLine className="text-lg" />
                <span>Save</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-semibold text-center text-[#40002B] mb-3">Tell us about yourself</h1>
          <p className="text-center text-[#8B6E58] mb-8">Let's create your profile</p>
          {loadError && (
            <div className="mb-4 px-4 py-2 rounded-lg bg-red-50 text-red-700 text-sm border-l-4 border-[#BA0105]">{loadError}</div>
          )}
          <div className="space-y-6">
            {/* Photos Section - Up to 3 images */}
            <div>
              <label className="block text-sm font-medium text-[#40002B] mb-3">
                Your Photos <span className="text-[#8B6E58] font-normal">(Add up to 3 - First one is your profile picture)</span>
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="relative">
                    {userImages[index] ? (
                      <div className="relative group">
                        <img 
                          src={userImages[index]} 
                          alt={`Photo ${index + 1}`}
                          className="w-full h-40 object-cover rounded-xl border-2 border-[#F9E6CA] shadow-md"
                        />
                        {index === 0 && (
                          <div className="absolute top-2 left-2 bg-gradient-to-r from-[#7B002C] to-[#40002B] text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                            Profile Pic
                          </div>
                        )}
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                          aria-label="Remove photo"
                        >
                          <RiCloseCircleLine className="text-xl" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-[#E8C99E] rounded-xl cursor-pointer hover:border-[#7B002C] hover:bg-[#FDF6EB] transition-all duration-200 bg-[#FBEEDA] group">
                        <input
                          type="file"
                          accept="image/jpg,image/jpeg,image/png"
                          onChange={(e) => handleImageUpload(e, index)}
                          className="hidden"
                        />
                        <RiAddCircleLine className="text-3xl text-[#8B6E58] group-hover:text-[#7B002C] transition-colors" />
                        <span className="text-xs text-[#8B6E58] group-hover:text-[#7B002C] font-medium mt-2">Add Photo</span>
                      </label>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-[#FBEEDA] rounded-lg border border-[#F9E6CA]">
                <p className="text-xs text-[#8B6E58] text-center">
                  📸 Upload 1-3 photos of yourself. Your first photo will be your main profile picture.
                </p>
              </div>
            </div>



            {/* Profile fields */}
            <div>
              <label className="block text-sm font-medium text-[#40002B] mb-2">Name *</label>
              <input type="text" value={me.name} onChange={(e) => setMe({...me, name: e.target.value})} className="w-full px-4 py-3 border border-[#E8C99E] rounded-lg focus:ring-2 focus:ring-[#7B002C] focus:ring-opacity-20 focus:border-[#7B002C] transition-all duration-250" placeholder="Enter your name" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#40002B] mb-2">Age *</label>
              <input type="number" min="18" max="99" value={me.age} onChange={(e) => setMe({...me, age: parseInt(e.target.value) || ''})} className="w-full px-4 py-3 border border-[#E8C99E] rounded-lg focus:ring-2 focus:ring-[#7B002C] focus:ring-opacity-20 focus:border-[#7B002C] transition-all duration-250" placeholder="18-99" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#40002B] mb-2">Gender *</label>
              <select value={me.gender || ''} onChange={(e) => setMe({...me, gender: e.target.value})} className="w-full px-4 py-3 border border-[#E8C99E] rounded-lg focus:ring-2 focus:ring-[#7B002C] focus:ring-opacity-20 focus:border-[#7B002C] transition-all duration-250">
                <option value="">Select gender</option>
                {genderOptions.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#40002B] mb-2">Pronouns (optional)</label>
              <select value={me.pronouns || ''} onChange={(e) => setMe({...me, pronouns: e.target.value})} className="w-full px-4 py-3 border border-[#E8C99E] rounded-lg focus:ring-2 focus:ring-[#7B002C] focus:ring-opacity-20 focus:border-[#7B002C] transition-all duration-250">
                <option value="">Select pronouns</option>
                {pronounOptions.map(pronoun => (
                  <option key={pronoun} value={pronoun}>{pronoun}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#40002B] mb-2">City (optional)</label>
              <input type="text" value={me.city} onChange={(e) => setMe({...me, city: e.target.value})} className="w-full px-4 py-3 border border-[#E8C99E] rounded-lg focus:ring-2 focus:ring-[#7B002C] focus:ring-opacity-20 focus:border-[#7B002C] transition-all duration-250" placeholder="Enter your city" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#40002B] mb-2">Bio * ({me.bio.length}/200)</label>
              <textarea value={me.bio} onChange={(e) => setMe({...me, bio: e.target.value})} maxLength={200} rows={4} className="w-full px-4 py-3 border border-[#E8C99E] rounded-lg focus:ring-2 focus:ring-[#7B002C] focus:ring-opacity-20 focus:border-[#7B002C] transition-all duration-250 resize-none" placeholder="Tell us about yourself..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#40002B] mb-2">My Interests *</label>
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
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-250 ${
                      (me.interests || []).includes(interest)
                        ? 'bg-gradient-to-r from-[#7B002C] to-[#40002B] text-white shadow-md'
                        : 'bg-[#F9E6CA] text-[#7B002C] hover:bg-[#FDF6EB]'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
                {interestOptions.length === 0 && (
                  <span className="text-sm text-[#8B6E58]">No interests available. Seed the interests table.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileFormInternal; 