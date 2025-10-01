import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getInterests, getGenders, getRelationshipTypes, getVibes } from '../services/lookupService';
 
 const PreferencesForm = ({ me, avatar, lookingFor, setLookingFor, onNext, onBack }) => {
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
 
        // Mock data loading for fake users - use default preferences
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
    // Mock function for fake users - just return success
    console.log('Mock: Saving search interests for fake user:', selectedInterests);
    setOriginalInterests(selectedInterests);
    return Promise.resolve();
  };
 
  const saveProfilePrefs = async () => {
    // Mock function for fake users - just return success
    console.log('Mock: Saving profile preferences for fake user:', profilePrefs);
    setOriginalProfile({ ...profilePrefs });
    return Promise.resolve();
  };
  
   const handleNext = async () => {
     setSaving(true);
     setErrorMsg('');
     try {
       if (interestsDirty) await saveInterests();
       if (profileDirty) await saveProfilePrefs();
       onNext();
     } catch (e) {
       setErrorMsg(e.message || 'Failed to save preferences');
     } finally {
       setSaving(false);
     }
   };
 
   if (loading) {
     return (
       <div className="max-w-2xl mx-auto">
         <div className="text-center text-gray-600">Loading your preferences...</div>
       </div>
     );
   }
 
  return (
     <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="py-3 flex items-center justify-between">
          <div>
            <button onClick={onBack} aria-label="Back" className="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
              <span className="text-xl">←</span>
            </button>
          </div>
          <div>
            <button
              onClick={async () => { await handleNext(); }}
              disabled={!isDirty || saving}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors duration-200 ${
                (!isDirty || saving)
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600'
              }`}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
       <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Who I'm looking for</h1>
       {errorMsg && (
         <div className="mb-4 px-4 py-2 rounded bg-red-50 text-red-700 text-sm">{errorMsg}</div>
       )}
 
       <div className="space-y-6">
          <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">Genders</label>
            <div className="flex flex-wrap gap-2">
             {genderOptions.map(opt => (
                <button
                 key={opt}
                 onClick={() => toggleValue('genders', opt)}
                 className={`px-3 py-1 rounded-full text-sm ${profilePrefs.genders.includes(opt) ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
               >{opt}</button>
              ))}
            </div>
          </div>
 
         <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Age min</label>
             <input type="number" min="18" max="99" value={profilePrefs.ageMin} onChange={e => setProfilePrefs(p => ({ ...p, ageMin: parseInt(e.target.value)||18 }))} className="w-full px-3 py-2 border rounded" />
           </div>
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Age max</label>
             <input type="number" min={profilePrefs.ageMin} max="99" value={profilePrefs.ageMax} onChange={e => setProfilePrefs(p => ({ ...p, ageMax: parseInt(e.target.value)||p.ageMin }))} className="w-full px-3 py-2 border rounded" />
            </div>
          </div>
 
          <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">Max distance (km)</label>
           <input type="number" min="0" value={profilePrefs.distanceKm} onChange={e => setProfilePrefs(p => ({ ...p, distanceKm: Math.max(0, parseInt(e.target.value)||0) }))} className="w-full px-3 py-2 border rounded" />
         </div>
 
         <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">Relationship type</label>
            <div className="flex flex-wrap gap-2">
             {relationshipOptions.map(opt => (
               <button key={opt} onClick={() => toggleValue('relationshipTypes', opt)} className={`px-3 py-1 rounded-full text-sm ${profilePrefs.relationshipTypes.includes(opt) ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{opt}</button>
              ))}
            </div>
          </div>
 
         <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Vibe</label>
          <div className="flex flex-wrap gap-2">
            {vibeOptions.map(opt => (
              <button
                key={opt}
                onClick={() => setProfilePrefs(p => ({ ...p, vibe: p.vibe === opt ? '' : opt }))}
                className={`px-3 py-1 rounded-full text-sm ${profilePrefs.vibe === opt ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >{opt}</button>
            ))}
            {vibeOptions.length === 0 && (
              <span className="text-sm text-gray-500">No vibes available. Seed the vibes table.</span>
            )}
          </div>
         </div>
          
         <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Interests *</label>
          <div className="flex flex-wrap gap-2">
            {interestOptions.map(interest => (
              <button
                key={interest}
                onClick={() => setSelectedInterests(prev => (prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]))}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedInterests.includes(interest)
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
 
 export default PreferencesForm; 