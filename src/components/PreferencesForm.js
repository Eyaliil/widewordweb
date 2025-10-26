import React, { useEffect, useMemo, useState } from 'react';
import { RiArrowLeftLine, RiCheckLine, RiHeart3Fill, RiUserLine, RiTeamLine, RiEmotionLine, RiCloseCircleLine } from 'react-icons/ri';
import { supabase } from '../lib/supabaseClient';
import { getInterests, getGenders, getRelationshipTypes, getVibes } from '../services/lookupService';
import { useAuth } from '../context/AuthContext';
 
 const PreferencesForm = ({ me, avatar, lookingFor, setLookingFor, onNext, onBack, onCancel, showCancel = false }) => {
   const { updateUserProfile } = useAuth();
   // Interests (searched)
   const [selectedInterests, setSelectedInterests] = useState([]);
   const [originalInterests, setOriginalInterests] = useState([]);
   const [interestOptions, setInterestOptions] = useState([]); // labels from DB
 
   // Profile-level searched prefs
   const [profilePrefs, setProfilePrefs] = useState({
     genders: [],
     ageMin: 25,
     ageMax: 35,
     distanceKm: 50,
     relationshipTypes: [],
     vibe: ''
   });
   const [originalProfile, setOriginalProfile] = useState(profilePrefs);
 
   const [genderOptions, setGenderOptions] = useState([]);
   const [relationshipOptions, setRelationshipOptions] = useState([]);
   const [vibeOptions, setVibeOptions] = useState([]);
   
 
   const [loading, setLoading] = useState(true);
   const [errorMsg, setErrorMsg] = useState('');
   const [saving, setSaving] = useState(false);
 
   useEffect(() => {
     let mounted = true;
     const loadData = async () => {
       try {
         const [interests, genders, relTypes, vibes] = await Promise.all([
           getInterests(),
           getGenders(),
           getRelationshipTypes(),
           getVibes()
         ]);
         if (mounted) {
           setInterestOptions(interests);
           setGenderOptions(genders);
           setRelationshipOptions(relTypes);
           setVibeOptions(vibes);
         }
 
        // Use default preferences
        if (mounted) {
          setSelectedInterests(['Music', 'Travel', 'Art']); // Default search interests
          setOriginalInterests(['Music', 'Travel', 'Art']);
          
          const loaded = {
            genders: ['Man', 'Woman'],
            ageMin: 25,
            ageMax: 35,
            distanceKm: 50,
            relationshipTypes: ['Casual Dating', 'Serious Relationship'],
            vibe: 'Fun'
          };
          setProfilePrefs(loaded);
          setOriginalProfile(loaded);
        }
       } catch (e) {
         console.error(e);
         setErrorMsg(e.message || 'Failed to load your preferences');
       } finally {
         if (mounted) setLoading(false);
       }
     };
     loadData();
     return () => { mounted = false; };
   }, []);
 
   const arraysEqual = (a, b) => {
     if (!Array.isArray(a) || !Array.isArray(b)) return false;
     if (a.length !== b.length) return false;
     const as = [...a].sort();
     const bs = [...b].sort();
     return as.every((v, i) => v === bs[i]);
   };
 
   const profileDirty = useMemo(() => {
     return !arraysEqual(profilePrefs.genders, originalProfile.genders)
       || profilePrefs.ageMin !== originalProfile.ageMin
       || profilePrefs.ageMax !== originalProfile.ageMax
       || profilePrefs.distanceKm !== originalProfile.distanceKm
       || !arraysEqual(profilePrefs.relationshipTypes, originalProfile.relationshipTypes)
       || profilePrefs.vibe !== originalProfile.vibe;
   }, [profilePrefs, originalProfile]);
 
   const interestsDirty = useMemo(() => {
     const a = new Set(originalInterests);
     const b = new Set(selectedInterests);
     if (a.size !== b.size) return true;
     for (const v of a) if (!b.has(v)) return true;
     return false;
   }, [originalInterests, selectedInterests]);
 
   const isDirty = profileDirty || interestsDirty;
 
   const toggleValue = (key, value) => {
     setProfilePrefs(prev => {
       const current = prev[key];
       if (!Array.isArray(current)) return prev;
       const exists = current.includes(value);
       const next = exists ? current.filter(v => v !== value) : [...current, value];
       return { ...prev, [key]: next };
     });
   };
 
  const saveInterests = async () => {
    // Save search interests to database
    console.log('Saving search interests:', selectedInterests);
    setOriginalInterests(selectedInterests);
    return Promise.resolve();
  };
 
  const saveProfilePrefs = async () => {
    // Save profile preferences to database
    console.log('Saving profile preferences:', profilePrefs);
    setOriginalProfile({ ...profilePrefs });
    return Promise.resolve();
  };
  
   const handleNext = async () => {
     setSaving(true);
     setErrorMsg('');
     try {
       // Save preferences to database
       const preferencesData = {
         searchInterests: selectedInterests,
         profilePrefs: profilePrefs
       };

       const result = await updateUserProfile(preferencesData);
       
       if (result.success) {
         console.log('✅ Preferences saved successfully');
         onNext();
       } else {
         setErrorMsg(result.error || 'Failed to save preferences');
       }
     } catch (e) {
       setErrorMsg(e.message || 'Failed to save preferences');
     } finally {
       setSaving(false);
     }
   };
 
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBEEDA] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#7B002C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-[#8B6E58]">Loading your preferences...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBEEDA] py-8">
      <div className="max-w-2xl mx-auto px-4 relative">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={onBack} aria-label="Back" className="px-3 py-2 rounded-lg text-[#8B6E58] hover:bg-[#F9E6CA] hover:text-[#40002B] transition-colors duration-200 flex items-center gap-2">
              <RiArrowLeftLine className="text-xl" />
              <span>Back</span>
            </button>
            {showCancel && onCancel && (
              <button onClick={onCancel} aria-label="Cancel" className="px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center gap-2">
                <RiCloseCircleLine className="text-xl" />
                <span>Cancel</span>
              </button>
            )}
          </div>
          <button
            onClick={async () => { await handleNext(); }}
            disabled={!isDirty || saving}
            className={`px-6 py-2 rounded-lg font-semibold transition-all duration-250 flex items-center gap-2 ${
              (!isDirty || saving)
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
          <h1 className="text-3xl font-semibold text-center text-[#40002B] mb-3">Who I'm looking for</h1>
          <p className="text-center text-[#8B6E58] mb-8">Tell us your preferences</p>
          {errorMsg && (
            <div className="mb-4 px-4 py-2 rounded-lg bg-red-50 text-red-700 text-sm border-l-4 border-[#BA0105]">{errorMsg}</div>
          )}
 
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#40002B] mb-2 flex items-center gap-2">
                <RiUserLine />
                <span>Genders</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {genderOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => toggleValue('genders', opt)}
                    className={`px-3 py-1 rounded-full text-sm transition-all duration-250 ${
                      profilePrefs.genders.includes(opt) 
                        ? 'bg-gradient-to-r from-[#7B002C] to-[#40002B] text-white shadow-md' 
                        : 'bg-[#F9E6CA] text-[#7B002C] hover:bg-[#FDF6EB]'
                    }`}
                  >{opt}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#40002B] mb-2">Age min</label>
                <input 
                  type="number" 
                  min="18" 
                  max="99" 
                  value={profilePrefs.ageMin} 
                  onChange={e => setProfilePrefs(p => ({ ...p, ageMin: parseInt(e.target.value)||18 }))} 
                  className="w-full px-3 py-2 border border-[#E8C99E] rounded-lg focus:ring-2 focus:ring-[#7B002C] focus:ring-opacity-20 focus:border-[#7B002C] transition-all duration-250" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#40002B] mb-2">Age max</label>
                <input 
                  type="number" 
                  min={profilePrefs.ageMin} 
                  max="99" 
                  value={profilePrefs.ageMax} 
                  onChange={e => setProfilePrefs(p => ({ ...p, ageMax: parseInt(e.target.value)||p.ageMin }))} 
                  className="w-full px-3 py-2 border border-[#E8C99E] rounded-lg focus:ring-2 focus:ring-[#7B002C] focus:ring-opacity-20 focus:border-[#7B002C] transition-all duration-250" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#40002B] mb-2">Max distance (km)</label>
              <input 
                type="number" 
                min="0" 
                value={profilePrefs.distanceKm} 
                onChange={e => setProfilePrefs(p => ({ ...p, distanceKm: Math.max(0, parseInt(e.target.value)||0) }))} 
                className="w-full px-3 py-2 border border-[#E8C99E] rounded-lg focus:ring-2 focus:ring-[#7B002C] focus:ring-opacity-20 focus:border-[#7B002C] transition-all duration-250" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#40002B] mb-2 flex items-center gap-2">
                <RiHeart3Fill />
                <span>Relationship type</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {relationshipOptions.map(opt => (
                  <button 
                    key={opt} 
                    onClick={() => toggleValue('relationshipTypes', opt)} 
                    className={`px-3 py-1 rounded-full text-sm transition-all duration-250 ${
                      profilePrefs.relationshipTypes.includes(opt) 
                        ? 'bg-gradient-to-r from-[#7B002C] to-[#40002B] text-white shadow-md' 
                        : 'bg-[#F9E6CA] text-[#7B002C] hover:bg-[#FDF6EB]'
                    }`}
                  >{opt}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#40002B] mb-2 flex items-center gap-2">
                <RiEmotionLine />
                <span>Vibe</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {vibeOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setProfilePrefs(p => ({ ...p, vibe: p.vibe === opt ? '' : opt }))}
                    className={`px-3 py-1 rounded-full text-sm transition-all duration-250 ${
                      profilePrefs.vibe === opt 
                        ? 'bg-gradient-to-r from-[#7B002C] to-[#40002B] text-white shadow-md' 
                        : 'bg-[#F9E6CA] text-[#7B002C] hover:bg-[#FDF6EB]'
                    }`}
                  >{opt}</button>
                ))}
                {vibeOptions.length === 0 && (
                  <span className="text-sm text-[#8B6E58]">No vibes available. Seed the vibes table.</span>
                )}
              </div>
            </div>
              
            <div>
              <label className="block text-sm font-medium text-[#40002B] mb-2 flex items-center gap-2">
                <RiTeamLine />
                <span>Interests *</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map(interest => (
                  <button
                    key={interest}
                    onClick={() => setSelectedInterests(prev => (prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]))}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-250 ${
                      selectedInterests.includes(interest)
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
 
 export default PreferencesForm; 